"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Task, Agent } from "@/lib/types";
import { Plus, Clock, CheckCircle, AlertCircle, Circle, X, FileText } from "lucide-react";

const COLUMNS = [
  { status: "todo", label: "To Do", icon: Circle, color: "text-slate-400" },
  { status: "in_progress", label: "In Progress", icon: Clock, color: "text-blue-400" },
  { status: "done", label: "Done", icon: CheckCircle, color: "text-green-400" },
  { status: "blocked", label: "Blocked", icon: AlertCircle, color: "text-red-400" },
] as const;

const priorityColors: Record<string, string> = {
  low: "text-slate-500",
  medium: "text-blue-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

export default function TasksPage() {
  const [companyId, setCompanyId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", agent_id: "" });
  const [loading, setLoading] = useState(true);
  const [outputTask, setOutputTask] = useState<Task | null>(null);

  useEffect(() => {
    const cid = localStorage.getItem("ceo_agent_company") || "";
    setCompanyId(cid);
    if (cid) load(cid);
  }, []);

  const load = async (cid: string) => {
    const [taskList, agentList] = await Promise.all([
      api.tasks.list(cid) as Promise<Task[]>,
      api.agents.list(cid) as Promise<Agent[]>,
    ]);
    setTasks(taskList);
    setAgents(agentList);
    setLoading(false);
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.tasks.create(companyId, {
      ...form,
      agent_id: form.agent_id || undefined,
    });
    setShowForm(false);
    setForm({ title: "", description: "", priority: "medium", agent_id: "" });
    load(companyId);
  };

  const updateStatus = async (taskId: string, status: string) => {
    await api.tasks.update(companyId, taskId, { status });
    load(companyId);
  };

  const deleteTask = async (taskId: string) => {
    await api.tasks.delete(companyId, taskId);
    load(companyId);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board</h1>
          <p className="text-slate-400 text-sm mt-1">{tasks.length} tasks across {agents.length} agents</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <form onSubmit={createTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1.5">Task Title</label>
              <input
                required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="What needs to be done?"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {["low", "medium", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Assign to Agent</label>
              <select
                value={form.agent_id}
                onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium">Create Task</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(({ status, label, icon: Icon, color }) => {
          const col = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-4 h-4 ${color}`} />
                <h3 className="text-sm font-medium text-white">{label}</h3>
                <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{col.length}</span>
              </div>
              <div className="space-y-2">
                {col.map((task) => {
                  const agent = agents.find((a) => a.id === task.agent_id);
                  return (
                    <div key={task.id} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-medium leading-tight">{task.title}</p>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs transition-all shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                      {agent && (
                        <p className="text-xs text-slate-500 mt-1.5">{agent.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className={`text-xs ${priorityColors[task.priority]}`}>{task.priority}</span>
                        {task.output && (
                          <button
                            onClick={() => setOutputTask(task)}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            title="View agent output"
                          >
                            <FileText className="w-3 h-3" />
                            Output
                          </button>
                        )}
                        <select
                          value={task.status}
                          onChange={(e) => updateStatus(task.id, e.target.value)}
                          className="ml-auto text-xs bg-slate-700 border-none rounded px-1.5 py-0.5 text-slate-300 focus:outline-none cursor-pointer"
                        >
                          {["todo", "in_progress", "done", "blocked"].map((s) => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
                {col.length === 0 && (
                  <p className="text-slate-600 text-xs text-center py-4">Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {outputTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <div>
                <h2 className="font-semibold text-white">{outputTask.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agent output · {agents.find((a) => a.id === outputTask.agent_id)?.name ?? "Unassigned"}
                </p>
              </div>
              <button onClick={() => setOutputTask(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {outputTask.output}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
