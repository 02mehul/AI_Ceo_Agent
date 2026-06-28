import json
from decimal import Decimal
from typing import AsyncGenerator
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.config import get_settings
from ..models.agent import Agent, AgentStatus
from ..models.company import Company
from ..models.task import Task, TaskStatus
from ..models.audit import AuditLog
from .prompts import build_system_prompt
from .tools import TOOL_DEFINITIONS, execute_tool

settings = get_settings()

# Groq Llama 3.3 70B pricing per million tokens
_INPUT_COST_PER_M = Decimal("0.59")
_OUTPUT_COST_PER_M = Decimal("0.79")
_MAX_ITERATIONS = 12


async def run_agent(
    agent_id: str,
    task_id: str,
    db: AsyncSession,
) -> AsyncGenerator[dict, None]:
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        yield {"type": "error", "message": "Agent not found"}
        return

    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        yield {"type": "error", "message": "Task not found"}
        return

    if agent.status == AgentStatus.TERMINATED:
        yield {"type": "error", "message": "Agent is terminated"}
        return

    if agent.status == AgentStatus.PAUSED:
        yield {"type": "error", "message": "Agent is paused. Resume it before running."}
        return

    budget = agent.budget_monthly or Decimal("0")
    if budget > 0 and (agent.budget_used or Decimal("0")) >= budget:
        agent.status = AgentStatus.PAUSED
        await db.commit()
        yield {"type": "error", "message": f"Budget exhausted (${float(budget):.2f}/mo). Agent paused. Increase the budget to continue."}
        return

    result = await db.execute(select(Company).where(Company.id == agent.company_id))
    company = result.scalar_one_or_none()

    system_prompt = build_system_prompt(
        role=agent.role,
        company_name=company.name if company else "the company",
        mission=company.mission if company else "",
        goal=agent.goal,
        custom_instructions=agent.custom_instructions or "",
        industry=company.industry or "" if company else "",
        stage=company.stage or "" if company else "",
        company_goals=company.goals or [] if company else [],
        tools_used=company.tools or [] if company else [],
    )

    agent.status = AgentStatus.RUNNING
    task.status = TaskStatus.IN_PROGRESS
    await db.commit()

    yield {"type": "status", "message": f"{agent.name} is starting: {task.title}"}

    if not settings.GROQ_API_KEY:
        agent.status = AgentStatus.ACTIVE
        await db.commit()
        yield {"type": "error", "message": "GROQ_API_KEY is not configured. Add it to your .env file."}
        return

    groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": (
                f"**Task:** {task.title}\n\n"
                f"**Description:** {task.description or 'Complete this task with your best judgment.'}\n\n"
                "Work through this systematically. Use write_output for any documents or deliverables. "
                "Call complete_task when you are fully done."
            ),
        },
    ]

    total_input_tokens = 0
    total_output_tokens = 0
    output_accumulator: list[str] = []

    for iteration in range(1, _MAX_ITERATIONS + 1):
        yield {"type": "thinking", "iteration": iteration}

        try:
            response = await groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto",
                max_tokens=4096,
                temperature=0.6,
            )
        except Exception as exc:
            agent.status = AgentStatus.ACTIVE
            await db.commit()
            yield {"type": "error", "message": f"Groq API error: {str(exc)}"}
            return

        choice = response.choices[0]
        usage = response.usage
        total_input_tokens += usage.prompt_tokens
        total_output_tokens += usage.completion_tokens

        assistant_msg = choice.message
        tool_calls_payload = None
        if assistant_msg.tool_calls:
            tool_calls_payload = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in assistant_msg.tool_calls
            ]

        messages.append({
            "role": "assistant",
            "content": assistant_msg.content or "",
            **({"tool_calls": tool_calls_payload} if tool_calls_payload else {}),
        })

        if assistant_msg.content:
            yield {"type": "response", "message": assistant_msg.content}

        if choice.finish_reason == "stop" or not assistant_msg.tool_calls:
            break

        for tool_call in assistant_msg.tool_calls:
            tool_name = tool_call.function.name
            try:
                tool_args = json.loads(tool_call.function.arguments)
            except (json.JSONDecodeError, ValueError):
                tool_args = {}

            yield {"type": "tool_call", "tool": tool_name, "args": tool_args}

            tool_result = await execute_tool(
                tool_name, tool_args, agent, task_id, db, output_accumulator
            )

            yield {"type": "tool_result", "tool": tool_name, "result": tool_result}

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": tool_result,
            })

            if tool_name == "complete_task":
                break

        else:
            continue
        break

    cost = (
        Decimal(str(total_input_tokens)) / Decimal("1000000") * _INPUT_COST_PER_M
        + Decimal(str(total_output_tokens)) / Decimal("1000000") * _OUTPUT_COST_PER_M
    )

    log = AuditLog(
        action="agent_execution",
        details=f"Task: {task.title}",
        tokens_used=total_input_tokens + total_output_tokens,
        cost_usd=cost,
        agent_id=agent.id,
        metadata_json={"task_id": task_id, "iterations": iteration},
    )
    db.add(log)

    agent.budget_used = (agent.budget_used or Decimal("0")) + cost
    agent.status = AgentStatus.ACTIVE
    await db.commit()

    yield {
        "type": "complete",
        "message": "Execution complete",
        "tokens_used": total_input_tokens + total_output_tokens,
        "cost_usd": float(cost),
    }
