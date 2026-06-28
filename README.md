# CEO Agent — AI-Powered Business Operations Platform

Run your business on autopilot. CEO Agent gives you a full AI team — CEO, Marketing, Content, Sales, and Operations — that works under your direction, reports to you, and never asks for a salary.

![Stack](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![Stack](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi) ![Stack](https://img.shields.io/badge/Groq-Llama_3.3_70B-orange) ![Stack](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## What It Does

You are the board. Your AI agents run the day-to-day.

- **Hire agents** into real roles — CEO, Marketing, Content, Sales, Operations, or Custom
- **Run tasks** and watch agents think and execute in a live terminal
- **CEO delegates** — the CEO agent can assign work to other agents and synthesize their output
- **Approve decisions** — agents escalate major decisions to you before acting
- **Track everything** — full audit log of every action, token used, and dollar spent
- **Budget guardrails** — agents auto-pause when their monthly budget is exhausted
- **Org chart** — visual hierarchy of your AI team

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, Tailwind CSS, TypeScript |
| Backend | FastAPI, SQLAlchemy (async), Python 3.12 |
| AI | Groq API — Llama 3.3 70B Versatile |
| Database | PostgreSQL 16 |
| Streaming | Server-Sent Events (SSE) |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Infrastructure | Docker + Docker Compose |

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A free [Groq API key](https://console.groq.com)

### 1. Clone and configure

```bash
git clone https://github.com/02mehul/AI_Ceo_Agent.git
cd AI_Ceo_Agent
cp .env.example .env
```

Open `.env` and fill in:

```env
SECRET_KEY=your-long-random-secret        # python -c "import secrets; print(secrets.token_hex(32))"
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 2. Start everything

```bash
docker compose up --build
```

That's it. Three containers start automatically:
- PostgreSQL on port `5432`
- FastAPI backend on port `8000`
- Next.js frontend on port `3000`

### 3. Open the app

Go to **http://localhost:3000** → Create Account → Set up your company → Hire your first agent.

---

## Project Structure

```
CEO_Agent/
├── backend/
│   ├── app/
│   │   ├── agents/          # Executor, tools, role prompts
│   │   ├── api/v1/          # REST endpoints (auth, agents, tasks, projects, audit, execute)
│   │   ├── core/            # Config, database, security, dependencies
│   │   ├── models/          # SQLAlchemy models
│   │   └── schemas/         # Pydantic schemas
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/    # Login + register
│   │   └── (dashboard)/     # Dashboard, agents, tasks, projects, audit, org-chart, company
│   ├── components/
│   │   ├── agents/          # Agent terminal (live streaming)
│   │   └── layout/          # Sidebar
│   └── lib/                 # API client, SSE stream, TypeScript types
├── docker-compose.yml
└── .env.example
```

---

## Agent Roles

| Role | Responsibilities |
|---|---|
| **CEO** | Strategy, coordination, delegation to other agents |
| **Marketing** | Growth strategy, content calendar, social media |
| **Content** | Captions, scripts, emails, blog posts |
| **Sales** | Lead research, outreach messages, proposals |
| **Operations** | SOPs, workflow documentation, process automation |
| **Custom** | Any role you define with custom instructions |

---

## Agent Tools

Every agent has access to:

| Tool | What it does |
|---|---|
| `write_output` | Produces a document, report, SOP, email draft, or strategy |
| `create_task` | Breaks the work into sub-tasks |
| `complete_task` | Marks the task done with a summary |
| `request_approval` | Escalates a decision to you before proceeding |
| `log_update` | Writes a progress note to the audit trail |

CEO agents additionally get:

| Tool | What it does |
|---|---|
| `get_team_status` | Checks what every agent is currently working on |
| `delegate_to_agent` | Assigns a task to another agent and gets their output back |

---

## Key Features

**Live streaming terminal**
Watch your agent think step-by-step — each tool call, response, and result appears in real time.

**CEO orchestration**
The CEO agent checks team status, delegates tasks to specialist agents, and synthesizes their outputs into a final report — all in a single run.

**Approval flow**
Agents use `request_approval` before major decisions. You see pending approvals on the dashboard and can approve or reject with a note.

**Budget tracking**
Each agent has a monthly USD budget. Spend is tracked per API call (Groq token cost). Agents auto-pause when the budget is exhausted.

**Full audit log**
Every agent action, token count, and cost is recorded. Nothing is hidden.

**Org chart**
Visual hierarchy of your AI team — Board → CEO → specialists — with live status dots and budget bars.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_DB` | Database name | `ceo_agent` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `SECRET_KEY` | JWT signing key | — (required) |
| `GROQ_API_KEY` | Groq API key | — (required) |
| `GROQ_MODEL` | Model to use | `llama-3.3-70b-versatile` |
| `NEXT_PUBLIC_API_URL` | Backend URL for the frontend | `http://localhost:8000` |

---

## API

The backend exposes a REST API at `http://localhost:8000`. Interactive docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## License

MIT
