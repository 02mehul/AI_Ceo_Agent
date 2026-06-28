import json
from typing import Any
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.task import Task, TaskStatus, TaskPriority
from ..models.audit import AuditLog, ApprovalRequest
from ..models.agent import Agent, AgentRole, AgentStatus

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a new sub-task and assign it to yourself",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Clear, action-oriented task title"},
                    "description": {"type": "string", "description": "What needs to be done and why"},
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                        "description": "Task priority",
                    },
                    "goal_id": {"type": "string", "description": "Optional goal ID to link this task to"},
                },
                "required": ["title", "description"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_output",
            "description": "Write a document, report, SOP, content piece, email draft, or any deliverable",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Document title"},
                    "content": {
                        "type": "string",
                        "description": "Full content — write this as if it's the final deliverable, ready to use",
                    },
                    "doc_type": {
                        "type": "string",
                        "enum": ["report", "sop", "content", "email", "proposal", "strategy", "analysis", "other"],
                    },
                },
                "required": ["title", "content", "doc_type"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "Mark the current task as done. Call this when you have finished all work.",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "Executive summary of what was accomplished and the key outputs",
                    },
                },
                "required": ["summary"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "request_approval",
            "description": "Escalate a decision to the board (human) before proceeding. Use for major decisions, budget allocation, or anything with significant consequences.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Short title of the decision needed"},
                    "description": {
                        "type": "string",
                        "description": "Full context: what decision is needed, why, what the options are, and your recommendation",
                    },
                },
                "required": ["title", "description"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "log_update",
            "description": "Log a progress update or status note visible in the audit trail",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "The update message"},
                },
                "required": ["message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_team_status",
            "description": "Get the current status of all agents on your team and their recent tasks. Use this before delegating to understand who is available and what they are working on.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delegate_to_agent",
            "description": "Delegate a task to another agent on your team. The agent will execute the task immediately and return their output to you. Only available to the CEO agent.",
            "parameters": {
                "type": "object",
                "properties": {
                    "role": {
                        "type": "string",
                        "enum": ["marketing", "content", "sales", "ops", "custom"],
                        "description": "The role of the agent to delegate to",
                    },
                    "task_title": {
                        "type": "string",
                        "description": "Clear, action-oriented title for the task",
                    },
                    "task_description": {
                        "type": "string",
                        "description": "Detailed instructions for the agent — be specific about what you need and why",
                    },
                },
                "required": ["role", "task_title", "task_description"],
            },
        },
    },
]


async def execute_tool(
    tool_name: str,
    tool_args: dict[str, Any],
    agent: Agent,
    task_id: str,
    db: AsyncSession,
    output_accumulator: list[str],
) -> str:
    if tool_name == "create_task":
        new_task = Task(
            title=tool_args["title"],
            description=tool_args.get("description"),
            priority=tool_args.get("priority", "medium"),
            agent_id=agent.id,
            goal_id=tool_args.get("goal_id"),
            status=TaskStatus.TODO,
        )
        db.add(new_task)
        await db.commit()
        return f"Task created: '{tool_args['title']}' (ID: {new_task.id})"

    elif tool_name == "write_output":
        formatted = f"## {tool_args['title']}\n*Type: {tool_args['doc_type']}*\n\n{tool_args['content']}"
        output_accumulator.append(formatted)

        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if task:
            existing = task.output or ""
            task.output = (existing + "\n\n---\n\n" + formatted).strip()
            await db.commit()
        return f"Output written: '{tool_args['title']}'"

    elif tool_name == "complete_task":
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if task:
            task.status = TaskStatus.DONE
            task.completed_at = datetime.now(timezone.utc)
            summary_block = f"\n\n---\n**Completion Summary**\n{tool_args['summary']}"
            task.output = (task.output or "") + summary_block
            await db.commit()
        return "Task marked as complete."

    elif tool_name == "request_approval":
        approval = ApprovalRequest(
            title=tool_args["title"],
            description=tool_args["description"],
            agent_id=agent.id,
            status="pending",
        )
        db.add(approval)
        await db.commit()
        return f"Approval request submitted: '{tool_args['title']}'. The board has been notified."

    elif tool_name == "log_update":
        log = AuditLog(
            action="agent_update",
            details=tool_args["message"],
            agent_id=agent.id,
            tokens_used=0,
            cost_usd=Decimal("0"),
        )
        db.add(log)
        await db.commit()
        return "Update logged."

    elif tool_name == "get_team_status":
        result = await db.execute(
            select(Agent).where(Agent.company_id == agent.company_id)
        )
        all_agents = result.scalars().all()

        lines = []
        for a in all_agents:
            task_result = await db.execute(
                select(Task)
                .where(Task.agent_id == a.id)
                .order_by(Task.created_at.desc())
                .limit(3)
            )
            recent = task_result.scalars().all()
            task_summary = (
                ", ".join(f'"{t.title}" [{t.status}]' for t in recent)
                if recent else "no tasks yet"
            )
            lines.append(f"- {a.name} ({a.role.value}) [{a.status.value}]: {task_summary}")

        return "Current team status:\n" + "\n".join(lines)

    elif tool_name == "delegate_to_agent":
        if agent.role != AgentRole.CEO:
            return "Only the CEO agent can delegate tasks to other agents."

        role_str = tool_args["role"]
        if role_str == "ceo":
            return "Cannot delegate to another CEO agent."

        try:
            target_role = AgentRole(role_str)
        except ValueError:
            return f"Unknown role: {role_str}"

        result = await db.execute(
            select(Agent).where(
                Agent.company_id == agent.company_id,
                Agent.role == target_role,
                Agent.status.in_([AgentStatus.ACTIVE, AgentStatus.RUNNING]),
            )
        )
        target = result.scalars().first()
        if not target:
            return (
                f"No active {role_str} agent found. "
                "Hire one from the dashboard before delegating."
            )

        new_task = Task(
            title=tool_args["task_title"],
            description=tool_args["task_description"],
            priority=TaskPriority.HIGH,
            agent_id=target.id,
            status=TaskStatus.TODO,
        )
        db.add(new_task)
        await db.commit()
        await db.refresh(new_task)

        # Run the sub-agent to completion (lazy import avoids circular dependency)
        from .executor import run_agent  # noqa: PLC0415

        async for event in run_agent(target.id, new_task.id, db):
            if event["type"] == "error":
                return f"{target.name} encountered an error: {event['message']}"

        await db.refresh(new_task)
        output = new_task.output or "Task completed — no written output produced."
        # Trim very long outputs so the CEO's context window stays healthy
        if len(output) > 3000:
            output = output[:3000] + "\n\n[...output truncated — view full result in Tasks]"

        return (
            f"{target.name} ({role_str}) completed the task.\n\n"
            f"--- Output ---\n{output}"
        )

    return f"Unknown tool: {tool_name}"
