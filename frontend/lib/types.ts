export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Company {
  id: string;
  name: string;
  mission: string;
  industry: string | null;
  stage: string | null;
  goals: string[];
  tools: string[];
}

export type AgentRole = "ceo" | "marketing" | "content" | "sales" | "ops" | "custom";
export type AgentStatus = "active" | "paused" | "running" | "terminated";

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  goal: string;
  budget_monthly: number;
  budget_used: number;
  status: AgentStatus;
  custom_instructions: string | null;
  company_id: string;
  created_at: string;
}

export type ProjectStatus = "active" | "completed" | "on_hold" | "archived";
export type GoalStatus = "todo" | "in_progress" | "completed" | "blocked";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  company_id: string;
  created_at: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  project_id: string;
  agent_id: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  output: string | null;
  agent_id: string | null;
  goal_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  tokens_used: number;
  cost_usd: number;
  agent_id: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  decision_note: string | null;
  agent_id: string;
  created_at: string;
}

export interface ExecutionEvent {
  type: "status" | "thinking" | "response" | "tool_call" | "tool_result" | "complete" | "error";
  message?: string;
  iteration?: number;
  tool?: string;
  args?: Record<string, unknown>;
  result?: string;
  tokens_used?: number;
  cost_usd?: number;
}
