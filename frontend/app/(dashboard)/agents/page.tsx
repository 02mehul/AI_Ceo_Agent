"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Agent, Task } from "@/lib/types";
import { Plus, Play, Pause, Trash2, Zap } from "lucide-react";
import AgentTerminal from "@/components/agents/agent-terminal";

const ROLE_OPTIONS = ["ceo", "marketing", "content", "sales", "ops", "custom"] as const;

const roleLabels: Record<string, string> = {
  ceo: "CEO", marketing: "Marketing", content: "Content",
  sales: "Sales", ops: "Operations", custom: "Custom",
};

const roleColors: Record<string, string> = {
  ceo: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  marketing: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  content: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  sales: "bg-green-500/15 text-green-400 border-green-500/20",
  ops: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  custom: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

const statusDot: Record<string, string> = {
  active: "bg-green-400", running: "bg-blue-400 animate-pulse",
  paused: "bg-yellow-400", terminated: "bg-red-400",
};

export default function AgentsPage() {
  const [companyId, setCompanyId] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [runModal, setRunModal] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", role: "ceo" as const, goal: "", budget_monthly: "0", custom_instructions: "",
  });

  useEffect(() => {
    const cid = localStorage.getItem("ceo_agent_company") || "";
    setCompanyId(cid);
    if (cid) load(cid);
  }, []);

  const load = async (cid: string) => {
    const [agentList, taskList] = await Promise.all([
      api.agents.list(cid) as Promise<Agent[]>,
      api.tasks.list(cid) as Promise<Task[]>,
    ]);
    setAgents(agentList);
    setTasks(taskList);
    setLoading(false);
  };

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.agents.create(companyId, {
      ...form,
      budget_monthly: parseFloat(form.budget_monthly) || 0,
    });
    setShowForm(false);
    setForm({ name: "", role: "ceo", goal: "", budget_monthly: "0", custom_instructions: "" });
    load(companyId);
  };

  const togglePause = async (agent: Agent) => {
    if (agent.status === "paused") await api.agents.resume(companyId, agent.id);
    else await api.agents.pause(companyId, agent.id);
    load(companyId);
  };

  const terminate = async (agent: Agent) => {
    if (!confirm(`Terminate ${agent.name}? This cannot be undone.`)) return;
    await api.agents.terminate(companyId, agent.id);
    load(companyId);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Team</h1>
          <p className="text-slate-400 text-sm mt-1">Hire and manage your AI workforce</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Hire Agent
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-5">New Agent</h2>
          <form onSubmit={createAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Agent Name</label>
              <input
                required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Alex (Marketing)"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1.5">Goal</label>
              <textarea
                required value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="e.g. Grow Instagram to 50K followers by end of Q3 2026 through Reels strategy"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Monthly Budget (USD)</label>
              <input
                type="number" step="0.01" min="0" value={form.budget_monthly}
                onChange={(e) => setForm({ ...form, budget_monthly: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {form.role === "custom" && (
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1.5">Custom Instructions</label>
                <textarea
                  value={form.custom_instructions}
                  onChange={(e) => setForm({ ...form, custom_instructions: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Describe this agent's specific responsibilities and behavior..."
                />
              </div>
            )}
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button
                type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Hire Agent
              </button>
            </div>
          </form>
        </div>
      )}

      {agents.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p>No agents yet. Hire your first AI team member above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const budget = Number(agent.budget_monthly);
            const used = Number(agent.budget_used);
            const pct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
            const agentTasks = tasks.filter((t) => t.agent_id === agent.id);
            const done = agentTasks.filter((t) => t.status === "done").length;

            return (
              <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot[agent.status]}`} />
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${roleColors[agent.role]}`}>
                    {roleLabels[agent.role]}
                  </span>
                </div>

                <p className="text-sm text-slate-400 line-clamp-2">{agent.goal}</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <p className="text-slate-500">Tasks done</p>
                    <p className="text-white font-semibold mt-0.5">{done} / {agentTasks.length}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <p className="text-slate-500">Spend</p>
                    <p className="text-white font-semibold mt-0.5">${used.toFixed(4)}</p>
                  </div>
                </div>

                {budget > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Budget</span>
                      <span>{pct.toFixed(0)}% of ${budget}/mo</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct > 80 ? "bg-red-500" : "bg-blue-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setRunModal(agent)}
                    disabled={agent.status === "terminated" || agent.status === "paused"}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-blue-400 text-xs px-3 py-2 rounded-lg transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Run Task
                  </button>
                  {agent.status !== "terminated" && (
                    <button
                      onClick={() => togglePause(agent)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title={agent.status === "paused" ? "Resume" : "Pause"}
                    >
                      {agent.status === "paused" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => terminate(agent)}
                    disabled={agent.status === "terminated"}
                    className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 rounded-lg transition-colors"
                    title="Terminate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {runModal && (
        <AgentTerminal
          agent={runModal}
          companyId={companyId}
          tasks={tasks.filter((t) => t.agent_id === runModal.id && t.status !== "done")}
          allTasks={tasks}
          onClose={() => { setRunModal(null); load(companyId); }}
        />
      )}
    </div>
  );
}
