"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Agent, Task, AgentRole } from "@/lib/types";
import AgentTerminal from "@/components/agents/agent-terminal";
import { Plus, Play, Pause, RotateCcw, Trash2, X, ChevronDown } from "lucide-react";

const ROLES: AgentRole[] = ["ceo", "marketing", "content", "sales", "ops", "custom"];

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

export default function AgentsPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [terminalAgent, setTerminalAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({
    name: "", role: "ceo" as AgentRole, goal: "", budget_monthly: "", custom_instructions: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const cid = localStorage.getItem("ceo_agent_company");
    if (!cid) { router.push("/dashboard/company"); return; }
    setCompanyId(cid);
    load(cid);
  }, [router]);

  const load = async (cid: string) => {
    try {
      const [agentList, taskList] = await Promise.all([
        api.agents.list(cid) as Promise<Agent[]>,
        api.tasks.list(cid) as Promise<Task[]>,
      ]);
      setAgents(agentList);
      setTasks(taskList);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...form,
        budget_monthly: form.budget_monthly ? parseFloat(form.budget_monthly) : 0,
        custom_instructions: form.custom_instructions || null,
      };
      await api.agents.create(companyId, payload);
      setShowCreate(false);
      setForm({ name: "", role: "ceo", goal: "", budget_monthly: "", custom_instructions: "" });
      await load(companyId);
    } finally {
      setCreating(false);
    }
  };

  const handlePause = async (agent: Agent) => {
    await api.agents.pause(companyId, agent.id);
    await load(companyId);
  };

  const handleResume = async (agent: Agent) => {
    await api.agents.resume(companyId, agent.id);
    await load(companyId);
  };

  const handleTerminate = async (agent: Agent) => {
    if (!confirm(`Terminate ${agent.name}? This cannot be undone.`)) return;
    await api.agents.terminate(companyId, agent.id);
    await load(companyId);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-slate-400">Loading...</div></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Agent Team</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Hire Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 mb-4">No agents yet. Hire your first AI employee.</p>
          <button onClick={() => setShowCreate(true)} className="text-blue-400 hover:text-blue-300 text-sm">
            + Hire Agent
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => {
            const budget = Number(agent.budget_monthly);
            const used = Number(agent.budget_used);
            const pct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
            const agentTasks = tasks.filter((t) => t.agent_id === agent.id);

            return (
              <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${statusDot[agent.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-white">{agent.name}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${roleColors[agent.role]}`}>
                          {agent.role.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">{agent.status}</span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">{agent.goal}</p>
                      {agent.custom_instructions && (
                        <p className="text-slate-600 text-xs mt-1 italic line-clamp-1">{agent.custom_instructions}</p>
                      )}
                      {budget > 0 && (
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-48">
                            <div
                              className={`h-full rounded-full ${pct > 80 ? "bg-red-500" : "bg-blue-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">${used.toFixed(4)} / ${budget}/mo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {agent.status !== "terminated" && (
                      <button
                        onClick={() => setTerminalAgent(agent)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Run
                      </button>
                    )}
                    {agent.status === "active" && (
                      <button onClick={() => handlePause(agent)} className="p-1.5 text-slate-400 hover:text-yellow-400 transition-colors" title="Pause">
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {agent.status === "paused" && (
                      <button onClick={() => handleResume(agent)} className="p-1.5 text-slate-400 hover:text-green-400 transition-colors" title="Resume">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    {agent.status !== "terminated" && (
                      <button onClick={() => handleTerminate(agent)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Terminate">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {agentTasks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 mb-2">{agentTasks.length} task{agentTasks.length !== 1 ? "s" : ""}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {agentTasks.slice(0, 5).map((t) => (
                        <span key={t.id} className={`text-xs px-2 py-0.5 rounded-full border ${
                          t.status === "done" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                          t.status === "in_progress" ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse" :
                          t.status === "blocked" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          "bg-slate-800 text-slate-400 border-slate-700"
                        }`}>
                          {t.title}
                        </span>
                      ))}
                      {agentTasks.length > 5 && <span className="text-xs text-slate-600">+{agentTasks.length - 5} more</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="font-semibold text-white">Hire New Agent</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Alex CEO"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Role *</label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as AgentRole })}
                    className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Goal *</label>
                <textarea
                  required
                  rows={3}
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Drive company strategy and coordinate the team..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Monthly Budget (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.budget_monthly}
                  onChange={(e) => setForm({ ...form, budget_monthly: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="10.00 (leave blank for unlimited)"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Custom Instructions</label>
                <textarea
                  rows={2}
                  value={form.custom_instructions}
                  onChange={(e) => setForm({ ...form, custom_instructions: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Always respond in bullet points. Focus on ROI..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  {creating ? "Hiring..." : "Hire Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {terminalAgent && (
        <AgentTerminal
          agent={terminalAgent}
          companyId={companyId}
          tasks={tasks.filter((t) => t.agent_id === terminalAgent.id && t.status !== "done")}
          allTasks={tasks}
          onClose={() => { setTerminalAgent(null); load(companyId); }}
        />
      )}
    </div>
  );
}
