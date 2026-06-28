"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AuditLog, ApprovalRequest, Agent } from "@/lib/types";
import { ScrollText, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AuditPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"logs" | "approvals">("approvals");
  const [deciding, setDeciding] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const cid = localStorage.getItem("ceo_agent_company");
    if (!cid) { router.push("/dashboard/company"); return; }
    setCompanyId(cid);
    load(cid);
  }, [router]);

  const load = async (cid: string) => {
    try {
      const [logList, approvalList, agentList] = await Promise.all([
        api.audit.logs(cid) as Promise<AuditLog[]>,
        api.audit.approvals(cid) as Promise<ApprovalRequest[]>,
        api.agents.list(cid) as Promise<Agent[]>,
      ]);
      setLogs(logList);
      setApprovals(approvalList);
      setAgents(agentList);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const decide = async (approvalId: string, approved: boolean) => {
    setDeciding(approvalId);
    try {
      await api.audit.decide(companyId, approvalId, { approved, note: note || undefined });
      setNote("");
      await load(companyId);
    } finally {
      setDeciding(null);
    }
  };

  const pending = approvals.filter((a) => a.status === "pending");

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-slate-400">Loading...</div></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="w-6 h-6 text-slate-400" />
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        {pending.length > 0 && (
          <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
            {pending.length} pending
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {(["approvals", "logs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {t === "approvals" ? `Approvals${pending.length ? ` (${pending.length})` : ""}` : "Activity Log"}
          </button>
        ))}
      </div>

      {tab === "approvals" && (
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
              <p className="text-slate-400 text-sm">No approval requests yet.</p>
            </div>
          ) : (
            approvals.map((approval) => {
              const agent = agents.find((a) => a.id === approval.agent_id);
              const isPending = approval.status === "pending";
              return (
                <div key={approval.id} className={`bg-slate-900 border rounded-xl p-6 ${
                  isPending ? "border-amber-500/30" : "border-slate-800"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {approval.status === "pending" && <Clock className="w-4 h-4 text-amber-400" />}
                        {approval.status === "approved" && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {approval.status === "rejected" && <XCircle className="w-4 h-4 text-red-400" />}
                        <h3 className="font-medium text-white">{approval.title}</h3>
                        {agent && <span className="text-xs text-slate-500">· {agent.name}</span>}
                      </div>
                      <p className="text-slate-400 text-sm">{approval.description}</p>
                      {approval.decision_note && (
                        <p className="text-slate-500 text-xs mt-2 italic">Note: {approval.decision_note}</p>
                      )}
                      <p className="text-slate-600 text-xs mt-2">{new Date(approval.created_at).toLocaleString()}</p>
                    </div>
                    {isPending && (
                      <div className="flex flex-col gap-2 shrink-0 min-w-40">
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                          placeholder="Optional note..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => decide(approval.id, true)}
                            disabled={deciding === approval.id}
                            className="flex-1 flex items-center justify-center gap-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => decide(approval.id, false)}
                            disabled={deciding === approval.id}
                            className="flex-1 flex items-center justify-center gap-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-sm">No activity logged yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {logs.map((log) => {
                const agent = agents.find((a) => a.id === log.agent_id);
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">{agent?.name ?? "Unknown Agent"}</span>
                        <span className="text-slate-500 text-xs">{log.action.replace(/_/g, " ")}</span>
                      </div>
                      {log.details && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate">{log.details}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 text-xs text-slate-500">
                      <p>{log.tokens_used.toLocaleString()} tokens</p>
                      <p>${Number(log.cost_usd).toFixed(6)}</p>
                      <p className="mt-1">{new Date(log.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
