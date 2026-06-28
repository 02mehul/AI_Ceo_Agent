"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Company, Agent, Task, AuditLog, ApprovalRequest } from "@/lib/types";
import { Users, CheckSquare, AlertCircle, TrendingUp, DollarSign, Clock, Bell } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const companies = await api.company.list() as Company[];
        if (!companies.length) {
          router.push("/dashboard/company");
          return;
        }
        const c = companies[0];
        setCompany(c);
        localStorage.setItem("ceo_agent_company", c.id);

        const [agentList, taskList, logList, approvalList] = await Promise.all([
          api.agents.list(c.id) as Promise<Agent[]>,
          api.tasks.list(c.id) as Promise<Task[]>,
          api.audit.logs(c.id) as Promise<AuditLog[]>,
          api.audit.approvals(c.id) as Promise<ApprovalRequest[]>,
        ]);

        setAgents(agentList);
        setTasks(taskList);
        setLogs(logList);
        setApprovals(approvalList);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  const totalCost = logs.reduce((sum, l) => sum + Number(l.cost_usd), 0);
  const totalTokens = logs.reduce((sum, l) => sum + l.tokens_used, 0);
  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const activeTasks = tasks.filter((t) => t.status === "in_progress").length;
  const activeAgents = agents.filter((a) => a.status === "active" || a.status === "running").length;

  const roleColors: Record<string, string> = {
    ceo: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    marketing: "bg-pink-500/15 text-pink-400 border-pink-500/20",
    content: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    sales: "bg-green-500/15 text-green-400 border-green-500/20",
    ops: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    custom: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  };

  const statusDot: Record<string, string> = {
    active: "bg-green-400",
    running: "bg-blue-400 animate-pulse",
    paused: "bg-yellow-400",
    terminated: "bg-red-400",
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{company?.name}</h1>
        <p className="text-slate-400 mt-1 text-sm max-w-2xl">{company?.mission}</p>
      </div>

      {pendingApprovals.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-medium text-sm">
              {pendingApprovals.length} approval{pendingApprovals.length > 1 ? "s" : ""} waiting for your decision
            </p>
            <button
              onClick={() => router.push("/dashboard/audit")}
              className="text-amber-400 text-sm underline mt-1"
            >
              Review now
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Agents", value: activeAgents, icon: Users, color: "text-blue-400" },
          { label: "Tasks Done", value: doneTasks, icon: CheckSquare, color: "text-green-400" },
          { label: "In Progress", value: activeTasks, icon: Clock, color: "text-orange-400" },
          { label: "Total Spend", value: `$${totalCost.toFixed(4)}`, icon: DollarSign, color: "text-purple-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Agent Team</h2>
            <button
              onClick={() => router.push("/dashboard/agents")}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Manage
            </button>
          </div>
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No agents yet.</p>
              <button
                onClick={() => router.push("/dashboard/agents")}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                Hire your first agent
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => {
                const budget = Number(agent.budget_monthly);
                const used = Number(agent.budget_used);
                const pct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;

                return (
                  <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[agent.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white text-sm truncate">{agent.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${roleColors[agent.role]}`}>
                          {agent.role}
                        </span>
                      </div>
                      {budget > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct > 80 ? "bg-red-500" : "bg-blue-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{pct.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Activity</h2>
            <button
              onClick={() => router.push("/dashboard/audit")}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Full log
            </button>
          </div>
          {logs.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No activity yet. Run an agent to get started.</p>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 8).map((log) => {
                const agent = agents.find((a) => a.id === log.agent_id);
                return (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-300">{agent?.name ?? "Agent"}</span>
                      <span className="text-slate-500"> · {log.action.replace("_", " ")}</span>
                      {log.details && (
                        <p className="text-slate-500 truncate text-xs mt-0.5">{log.details}</p>
                      )}
                    </div>
                    <span className="text-slate-600 text-xs shrink-0">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-white">Usage Stats</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-400">Total API Calls</p>
            <p className="text-xl font-bold text-white mt-1">{logs.length}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Tokens Used</p>
            <p className="text-xl font-bold text-white mt-1">{totalTokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Cost (USD)</p>
            <p className="text-xl font-bold text-white mt-1">${totalCost.toFixed(6)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
