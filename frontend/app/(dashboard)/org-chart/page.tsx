"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";

const roleColors: Record<string, string> = {
  ceo: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  marketing: "border-pink-500/40 bg-pink-500/10 text-pink-300",
  content: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  sales: "border-green-500/40 bg-green-500/10 text-green-300",
  ops: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  custom: "border-slate-500/40 bg-slate-500/10 text-slate-300",
};

const roleLabels: Record<string, string> = {
  ceo: "CEO", marketing: "Marketing", content: "Content",
  sales: "Sales", ops: "Operations", custom: "Custom",
};

const statusDot: Record<string, string> = {
  active: "bg-green-400",
  running: "bg-blue-400 animate-pulse",
  paused: "bg-yellow-400",
  terminated: "bg-red-400",
};

function AgentCard({ agent }: { agent: Agent }) {
  const budget = Number(agent.budget_monthly);
  const used = Number(agent.budget_used);
  const pct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;

  return (
    <div className={`border rounded-xl p-4 w-52 ${roleColors[agent.role]}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[agent.status]}`} />
        <span className="font-semibold text-white text-sm truncate">{agent.name}</span>
      </div>
      <span className="text-xs px-2 py-0.5 rounded bg-white/10">{roleLabels[agent.role]}</span>
      <p className="text-xs mt-2 opacity-70 line-clamp-2">{agent.goal}</p>
      {budget > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs opacity-60 mb-1">
            <span>Budget</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct > 80 ? "bg-red-400" : "bg-white/40"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
      <div className="mt-2 text-xs opacity-50 capitalize">{agent.status}</div>
    </div>
  );
}

export default function OrgChartPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cid = localStorage.getItem("ceo_agent_company") || "";
      if (!cid) { router.push("/dashboard/company"); return; }
      const list = await api.agents.list(cid) as Agent[];
      setAgents(list);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  const ceoAgents = agents.filter((a) => a.role === "ceo");
  const otherAgents = agents.filter((a) => a.role !== "ceo");
  const roleOrder = ["marketing", "content", "sales", "ops", "custom"];
  const sorted = [...otherAgents].sort(
    (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
  );

  if (agents.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Org Chart</h1>
        <p className="text-slate-400 text-sm mb-8">Your AI team structure</p>
        <div className="text-center py-20 text-slate-500">
          No agents yet.{" "}
          <button onClick={() => router.push("/dashboard/agents")} className="text-blue-400 hover:text-blue-300 underline">
            Hire your first agent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Org Chart</h1>
        <p className="text-slate-400 text-sm mt-1">Your AI team structure — {agents.length} agent{agents.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-col items-center gap-0 overflow-x-auto pb-4">
        {/* Board label */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-6 py-3 text-sm font-semibold text-slate-300">
          You (The Board)
        </div>

        {/* Connector down to CEO */}
        {ceoAgents.length > 0 && (
          <div className="w-px h-8 bg-slate-700" />
        )}

        {/* CEO tier */}
        {ceoAgents.length > 0 && (
          <div className="flex gap-6 justify-center">
            {ceoAgents.map((a) => <AgentCard key={a.id} agent={a} />)}
          </div>
        )}

        {/* Connector down to team */}
        {sorted.length > 0 && (
          <>
            <div className="w-px h-8 bg-slate-700" />
            {sorted.length > 1 && (
              <div
                className="h-px bg-slate-700"
                style={{ width: `${sorted.length * 224}px`, maxWidth: "90vw" }}
              />
            )}
          </>
        )}

        {/* Drop lines + team agents */}
        {sorted.length > 0 && (
          <div className="flex gap-6 justify-center">
            {sorted.map((agent) => (
              <div key={agent.id} className="flex flex-col items-center">
                <div className="w-px h-8 bg-slate-700" />
                <AgentCard agent={agent} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center pt-2">
        {Object.entries(statusDot).map(([status, dot]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className={`w-2 h-2 rounded-full ${dot.replace(" animate-pulse", "")}`} />
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}
