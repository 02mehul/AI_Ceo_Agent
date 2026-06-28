"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Task, Agent } from "@/lib/types";
import { CheckSquare, Clock, AlertCircle, FileText, X, Trash2 } from "lucide-react";

const statusColor: Record<string, string> = {
  done: "bg-green-500/10 text-green-400 border-green-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  blocked: "bg-red-500/10 text-red-400 border-red-500/20",
  todo: "bg-slate-800 text-slate-400 border-slate-700",
};

const priorityColor: Record<string, string> = {
  urgent: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-slate-400",
};

const statusIcon: Record<string, React.ReactNode> = {
  done: <CheckSquare className="w-3.5 h-3.5" />,
  in_progress: <Clock className="w-3.5 h-3.5 animate-pulse" />,
  blocked: <AlertCircle className="w-3.5 h-3.5" />,
  todo: <Clock className="w-3.5 h-3.5" />,
};

export default function TasksPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [outputTask, setOutputTask] = useState<Task | null>(null);

  useEffect(() => {
    const cid = localStorage.getItem("ceo_agent_company");
    if (!cid) { router.push("/dashboard/company"); return; }
    setCompanyId(cid);
    load(cid);
  }, [router]);

  const load = async (cid: string) => {
    try {
      const [taskList, agentList] = await Promise.all([
        api.tasks.list(cid) as Promise<Task[]>,
        api.agents.list(cid) as Promise<Agent[]>,
      ]);
      setTasks(taskList);
      setAgents(agentList);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    await api.tasks.delete(companyId, task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-slate-400">Loading...</div></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
        <div className="flex gap-2">
          {["all", "todo", "in_progress", "done", "blocked"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 text-sm">No tasks found. Run an agent to create tasks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const agent = agents.find((a) => a.id === task.agent_id);
            return (
              <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${statusColor[task.status]}`}>
                        {statusIcon[task.status]}
                        {task.status.replace("_", " ")}
                      </span>
                      <span className={`text-xs font-medium ${priorityColor[task.priority]}`}>
                        {task.priority}
                      </span>
                      {agent && (
                        <span className="text-xs text-slate-500">· {agent.name}</span>
                      )}
                    </div>
                    <h3 className="font-medium text-white mt-2">{task.title}</h3>
                    {task.description && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <p className="text-slate-600 text-xs mt-2">
                      {new Date(task.created_at).toLocaleDateString()} {new Date(task.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.output && (
                      <button
                        onClick={() => setOutputTask(task)}
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Output
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(task)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {outputTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h2 className="font-semibold text-white">{outputTask.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Task Output</p>
              </div>
              <button onClick={() => setOutputTask(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {outputTask.output}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
