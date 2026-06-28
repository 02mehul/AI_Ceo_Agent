"use client";
import { useState, useRef, useEffect } from "react";
import type { Agent, Task, ExecutionEvent } from "@/lib/types";
import { streamAgentExecution } from "@/lib/stream";
import { api } from "@/lib/api";
import { X, ChevronRight, Loader2, CheckCircle, AlertCircle, Wrench, GitBranch, Users } from "lucide-react";

interface Props {
  agent: Agent;
  companyId: string;
  tasks: Task[];
  allTasks: Task[];
  onClose: () => void;
}

export default function AgentTerminal({ agent, companyId, tasks, allTasks, onClose }: Props) {
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id || "");
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<"select" | "create">(tasks.length > 0 ? "select" : "create");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const createAndRun = async () => {
    const task = await api.tasks.create(companyId, {
      title: newTask.title,
      description: newTask.description,
      agent_id: agent.id,
      priority: "high",
    }) as Task;
    run(task.id);
  };

  const run = async (taskId: string) => {
    setEvents([]);
    setRunning(true);
    setDone(false);

    await streamAgentExecution(
      companyId,
      agent.id,
      taskId,
      (event) => setEvents((prev) => [...prev, event]),
      () => { setRunning(false); setDone(true); },
      (err) => {
        setEvents((prev) => [...prev, { type: "error", message: err }]);
        setRunning(false);
      }
    );
  };

  const handleRun = () => {
    if (mode === "create") {
      if (!newTask.title.trim()) return;
      createAndRun();
    } else {
      if (!selectedTaskId) return;
      run(selectedTaskId);
    }
  };

  const roleColors: Record<string, string> = {
    ceo: "text-purple-400", marketing: "text-pink-400", content: "text-orange-400",
    sales: "text-green-400", ops: "text-blue-400", custom: "text-slate-400",
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="font-semibold text-white">{agent.name}</h2>
            <p className={`text-xs mt-0.5 ${roleColors[agent.role]}`}>{agent.role.toUpperCase()} · {agent.status}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!running && !done && (
          <div className="p-6 space-y-4 border-b border-slate-800">
            {tasks.length > 0 && (
              <div className="flex rounded-lg bg-slate-800 p-1">
                {(["select", "create"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      mode === m ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m === "select" ? "Existing Task" : "New Task"}
                  </button>
                ))}
              </div>
            )}

            {mode === "select" ? (
              <div>
                <label className="block text-xs text-slate-400 mb-2">Select task to run</label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Task Title</label>
                  <input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="What should this agent accomplish?"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Description (optional)</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Additional context, constraints, or requirements..."
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleRun}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              Run Agent
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono text-sm bg-slate-950/50">
          {events.length === 0 && !running && (
            <p className="text-slate-600 text-center text-xs">Agent output will appear here...</p>
          )}

          {events.map((event, i) => {
            if (event.type === "status") {
              return (
                <div key={i} className="flex items-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {event.message}
                </div>
              );
            }
            if (event.type === "thinking") {
              return (
                <div key={i} className="text-slate-600 text-xs">
                  › Iteration {event.iteration}...
                </div>
              );
            }
            if (event.type === "response") {
              return (
                <div key={i} className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {event.message}
                </div>
              );
            }
            if (event.type === "tool_call") {
              const isDelegation = event.tool === "delegate_to_agent";
              const isStatus = event.tool === "get_team_status";
              const colorClass = isDelegation
                ? "text-purple-400 bg-purple-500/5 border-purple-500/10"
                : isStatus
                ? "text-teal-400 bg-teal-500/5 border-teal-500/10"
                : "text-blue-400 bg-blue-500/5 border-blue-500/10";
              const Icon = isDelegation ? GitBranch : isStatus ? Users : Wrench;
              return (
                <div key={i} className={`flex items-start gap-2 text-xs border rounded-lg px-3 py-2 ${colorClass}`}>
                  <Icon className="w-3 h-3 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold">
                      {isDelegation
                        ? `Delegating to ${(event.args as Record<string,string>)?.role ?? ""} agent`
                        : isStatus
                        ? "Checking team status"
                        : event.tool}
                    </span>
                    {event.args && !isDelegation && !isStatus && (
                      <pre className="text-blue-300/70 text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(event.args, null, 2)}
                      </pre>
                    )}
                    {isDelegation && event.args && (
                      <p className="opacity-70 mt-0.5">
                        {(event.args as Record<string,string>).task_title}
                      </p>
                    )}
                  </div>
                </div>
              );
            }
            if (event.type === "tool_result") {
              const isDelegation = event.tool === "delegate_to_agent";
              return (
                <div key={i} className={`text-xs pl-5 ${isDelegation ? "text-purple-400/80" : "text-green-400/70"}`}>
                  {isDelegation ? "↳ " : "✓ "}{event.result}
                </div>
              );
            }
            if (event.type === "complete") {
              return (
                <div key={i} className="flex items-center gap-2 text-green-400 text-xs border-t border-slate-800 pt-3 mt-3">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Done · {event.tokens_used?.toLocaleString()} tokens · ${event.cost_usd?.toFixed(6)}</span>
                </div>
              );
            }
            if (event.type === "error") {
              return (
                <div key={i} className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {event.message}
                </div>
              );
            }
            return null;
          })}

          {running && (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              Agent is working...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {done && (
          <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
