"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Project, Goal, Agent } from "@/lib/types";
import { Plus, FolderOpen, Target } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  completed: "bg-blue-500/15 text-blue-400",
  on_hold: "bg-yellow-500/15 text-yellow-400",
  archived: "bg-slate-500/15 text-slate-400",
};

const goalStatusColors: Record<string, string> = {
  todo: "bg-slate-500/15 text-slate-400",
  in_progress: "bg-blue-500/15 text-blue-400",
  completed: "bg-green-500/15 text-green-400",
  blocked: "bg-red-500/15 text-red-400",
};

export default function ProjectsPage() {
  const [companyId, setCompanyId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Record<string, Goal[]>>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [goalForm, setGoalForm] = useState<{ projectId: string; title: string; description: string; agent_id: string } | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cid = localStorage.getItem("ceo_agent_company") || "";
    setCompanyId(cid);
    if (cid) load(cid);
  }, []);

  const load = async (cid: string) => {
    const [projectList, agentList] = await Promise.all([
      api.projects.list(cid) as Promise<Project[]>,
      api.agents.list(cid) as Promise<Agent[]>,
    ]);
    setProjects(projectList);
    setAgents(agentList);
    setLoading(false);
  };

  const loadGoals = async (projectId: string) => {
    if (goals[projectId]) return;
    const goalList = await api.projects.goals.list(companyId, projectId) as Goal[];
    setGoals((prev) => ({ ...prev, [projectId]: goalList }));
  };

  const toggleProject = async (projectId: string) => {
    if (expanded !== projectId) {
      await loadGoals(projectId);
      setExpanded(projectId);
    } else {
      setExpanded(null);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.projects.create(companyId, form);
    setShowForm(false);
    setForm({ name: "", description: "" });
    load(companyId);
  };

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm) return;
    await api.projects.goals.create(companyId, goalForm.projectId, {
      title: goalForm.title,
      description: goalForm.description,
      agent_id: goalForm.agent_id || undefined,
    });
    const goalList = await api.projects.goals.list(companyId, goalForm.projectId) as Goal[];
    setGoals((prev) => ({ ...prev, [goalForm.projectId]: goalList }));
    setGoalForm(null);
  };

  const updateGoalStatus = async (projectId: string, goalId: string, status: string) => {
    await api.projects.goals.update(companyId, projectId, goalId, { status });
    const goalList = await api.projects.goals.list(companyId, projectId) as Goal[];
    setGoals((prev) => ({ ...prev, [projectId]: goalList }));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">Organise work into projects and goals</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <form onSubmit={createProject} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Project Name</label>
              <input
                required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Instagram Growth — Q3 2026"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium">Create</button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 text-slate-500">No projects yet. Create one to get started.</div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleProject(project.id)}
              >
                <FolderOpen className={`w-5 h-5 shrink-0 ${expanded === project.id ? "text-blue-400" : "text-slate-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{project.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[project.status]}`}>
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-slate-400 mt-0.5 truncate">{project.description}</p>
                  )}
                </div>
                <span className="text-slate-600 text-sm">{expanded === project.id ? "▲" : "▼"}</span>
              </button>

              {expanded === project.id && (
                <div className="border-t border-slate-800 p-5 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Goals
                    </p>
                    <button
                      onClick={() => setGoalForm({ projectId: project.id, title: "", description: "", agent_id: "" })}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Goal
                    </button>
                  </div>

                  {goalForm?.projectId === project.id && (
                    <form onSubmit={createGoal} className="bg-slate-800 rounded-lg p-4 space-y-3">
                      <input
                        required value={goalForm.title}
                        onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Goal title"
                      />
                      <div className="flex gap-2">
                        <select
                          value={goalForm.agent_id}
                          onChange={(e) => setGoalForm({ ...goalForm, agent_id: e.target.value })}
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="">No agent</option>
                          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setGoalForm(null)} className="px-3 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">Add</button>
                      </div>
                    </form>
                  )}

                  {(goals[project.id] || []).length === 0 ? (
                    <p className="text-slate-600 text-sm text-center py-4">No goals yet. Add one above.</p>
                  ) : (
                    (goals[project.id] || []).map((goal) => {
                      const agent = agents.find((a) => a.id === goal.agent_id);
                      return (
                        <div key={goal.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">{goal.title}</p>
                            {agent && <p className="text-xs text-slate-500 mt-0.5">{agent.name}</p>}
                          </div>
                          <select
                            value={goal.status}
                            onChange={(e) => updateGoalStatus(project.id, goal.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded border-0 focus:outline-none cursor-pointer ${goalStatusColors[goal.status]}`}
                            style={{ background: "transparent" }}
                          >
                            {["todo", "in_progress", "completed", "blocked"].map((s) => (
                              <option key={s} value={s} className="bg-slate-800 text-white">{s.replace("_", " ")}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
