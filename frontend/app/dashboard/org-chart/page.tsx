"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";

const roleColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  ceo: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300", badge: "bg-purple-500/20 text-purple-400" },
  marketing: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-300", badge: "bg-pink-500/20 text-pink-400" },
  content: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-300", badge: "bg-orange-500/20 text-orange-400" },
  sales: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-300", badge: "bg-green-500/20 text-green-400" },
  ops: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-300", badge: "bg-blue-500/20 text-blue-400" },
  custom: { bg: "bg-slate-800", border: "border-slate-700", text: "text-slate-300", badge: "bg-slate-700 text-slate-400" },
};

const statusDot: Record<string, string> = {
  active: "bg-green-400",
  running: "bg-blue-400 animate-pulse",
  paused: "bg-yellow-400",
  terminated: "bg-red-400",
};

function AgentCard({ agent }: { agent: Agent }) {
  const c = roleColors[agent.role] || roleColors.custom;
  const budget = Number(agent.budget_monthly);
  const used = Number(agent.budget_used);
  const pct = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4 w-52 shrink-0`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[agent.status]}`} />
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${c.badge}`}>
          {agent.role.toUpperCase()}
        </span>
      </div>
      <p className={`font-semibold text-sm ${c.text}`}>{agent.name}</p>
      <p className="text-slate-500 text-xs mt-1 line-clamp-2">{agent.goal}</p>
      {budget > 0 && (
        <div className="mt-3">
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct > 80 ? "bg-red-500" : "bg-current opacity-60"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1">${used.toFixed(4)} / ${budget}/mo</p>
        </div>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cid = localStorage.getItem("ceo_agent_company");
    if (!cid) { router.push("/dashboard/company"); return; }
    (async () => {
      try {
        const list = await api.agents.list(cid) as Agent[];
        setAgents(list);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-slate-400">Loading...</div></div>;
  }

  const ceoAgents = agents.filter((a) => a.role === "ceo");
  const reports = agents.filter((a) => a.role !== "ceo");

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Org Chart</h1>

      {agents.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 text-sm">No agents yet. Hire agents to see the org chart.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0">
          {/* Board */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-6 py-3 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest">Board</p>
            <p className="text-white font-semibold mt-0.5">You</p>
          </div>

          {ceoAgents.length > 0 && (
            <>
              <div className="w-px h-8 bg-slate-700" />
              <div className="flex gap-4 flex-wrap justify-center">
                {ceoAgents.map((a) => <AgentCard key={a.id} agent={a} />)}
              </div>
            </>
          )}

          {reports.length > 0 && (
            <>
              <div className="w-px h-8 bg-slate-700" />
              <div className="flex gap-4 flex-wrap justify-center">
                {reports.map((a) => <AgentCard key={a.id} agent={a} />)}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-6 flex-wrap">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
        {[
          { dot: "bg-green-400", label: "Active" },
          { dot: "bg-blue-400 animate-pulse", label: "Running" },
          { dot: "bg-yellow-400", label: "Paused" },
          { dot: "bg-red-400", label: "Terminated" },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
