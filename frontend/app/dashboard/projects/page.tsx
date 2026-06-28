"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Project, Goal, Agent } from "@/lib/types";
import { FolderKanban, Plus, ChevronDown, ChevronRight, X } from "lucide-react";

const projectStatusColor: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  on_hold: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  archived: "bg-slate-800 text-slate-500 border-slate-700",
};

const goalStatusColor: Record<string, string> = {
  completed: "text-green-400",
  in_progress: "text-blue-400",
  blocked: "text-red-400",
  todo: "text-slate-500",
};

export default function ProjectsPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Record<string, Goal[]>>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showGoalFor, setShowGoalFor] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", status: "active" });
  const [goalForm, setGoalForm] = useState({ title: "", description: "", agent_id: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const cid = localStorage.getItem("ceo_agent_company");
    if (!cid) { router.push("/dashboard/company"); return; }
    setCompanyId(cid);
    load(cid);
  }, [router]);

  const load = async (cid: string) => {
    try {
      const [projectList, agentList] = await Promise.all([
        api.projects.list(cid) as Promise<Project[]>,
        api.agents.list(cid) as Promise<Agent[]>,
      ]);
      setProjects(projectList);
      setAgents(agentList);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (project: Project) => {
    const next = new Set(expanded);
    if (next.has(project.id)) {
      next.delete(project.id);
    } else {
      next.add(project.id);
      if (!goals[project.id]) {
        const g = await api.projects.goals.list(companyId, project.id) as Goal[];
        setGoals((prev) => ({ ...prev, [project.id]: g }));
      }
    }
    setExpanded(next);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.projects.create(companyId, form);
      setShowCreate(false);
      setForm({ name: "", description: "", status: "active" });
      await load(companyId);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.projects.goals.create(companyId, projectId, {
        ...goalForm,
        agent_id: goalForm.agent_id || null,
      });
      const g = await api.projects.goals.list(companyId, projectId) as Goal[];
      setGoals((prev) => ({ ...prev, [projectId]: g }));
      setShowGoalFor(null);
      setGoalForm({ title: "", description: "", agent_id: "" });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-slate-400">Loading...</div></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">Projects</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 text-sm">No projects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleExpand(project)}
                className="w-full flex items-center gap-3 p-5 text-left hover:bg-slate-800/30 transition-colors"
              >
                {expanded.has(project.id) ? (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium text-white">{project.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${projectStatusColor[project.status]}`}>
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-slate-400 text-sm mt-0.5 truncate">{project.description}</p>
                  )}
                </div>
                <span className="text-slate-600 text-xs shrink-0">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </button>

              {expanded.has(project.id) && (
                <div className="border-t border-slate-800 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-300">Goals</h3>
                    <button
                      onClick={() => setShowGoalFor(project.id)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Goal
                    </button>
                  </div>
                  {(goals[project.id] || []).length === 0 ? (
                    <p className="text-slate-600 text-sm">No goals yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(goals[project.id] || []).map((goal) => {
                        const agent = agents.find((a) => a.id === goal.agent_id);
                        return (
                          <div key={goal.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              goal.status === "completed" ? "bg-green-400" :
                              goal.status === "in_progress" ? "bg-blue-400" :
                              goal.status === "blocked" ? "bg-red-400" : "bg-slate-600"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white">{goal.title}</p>
                              {goal.description && <p className="text-xs text-slate-500 truncate">{goal.description}</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {agent && <span className="text-xs text-slate-500">{agent.name}</span>}
                              <span className={`text-xs ${goalStatusColor[goal.status]}`}>{goal.status.replace("_", " ")}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showGoalFor === project.id && (
                    <form onSubmit={(e) => handleCreateGoal(e, project.id)} className="bg-slate-800 rounded-xl p-4 space-y-3 mt-3">
                      <input
                        required
                        value={goalForm.title}
                        onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Goal title..."
                      />
                      <input
                        value={goalForm.description}
                        onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Description (optional)"
                      />
                      <select
                        value={goalForm.agent_id}
                        onChange={(e) => setGoalForm({ ...goalForm, agent_id: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="">No agent assigned</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowGoalFor(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors">
                          Cancel
                        </button>
                        <button type="submit" disabled={creating} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                          {creating ? "Adding..." : "Add Goal"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="font-semibold text-white">New Project</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Project Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Q4 Growth Campaign"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="What is this project about?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
