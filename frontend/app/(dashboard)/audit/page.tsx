"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditLog, ApprovalRequest, Agent } from "@/lib/types";
import { CheckCircle, XCircle, Clock, ScrollText, Bell } from "lucide-react";

export default function AuditPage() {
  const [companyId, setCompanyId] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tab, setTab] = useState<"logs" | "approvals">("approvals");
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null);

  useEffect(() => {
    const cid = localStorage.getItem("ceo_agent_company") || "";
    setCompanyId(cid);
    if (cid) load(cid);
  }, []);

  const load = async (cid: string) => {
    const [logList, approvalList, agentList] = await Promise.all([
      api.audit.logs(cid) as Promise<AuditLog[]>,
      api.audit.approvals(cid) as Promise<ApprovalRequest[]>,
      api.agents.list(cid) as Promise<Agent[]>,
    ]);
    setLogs(logList);
    setApprovals(approvalList);
    setAgents(agentList);
    setLoading(false);
  };

  const decide = async (approvalId: string, approved: boolean, note?: string) => {
    setDeciding(approvalId);
    await api.audit.decide(companyId, approvalId, { approved, note });
    load(companyId);
    setDeciding(null);
  };

  const pending = approvals.filter((a) => a.status === "pending");

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit & Approvals</h1>
        <p className="text-slate-400 text-sm mt-1">Full transparency into every agent action</p>
      </div>

      {pending.length > 0 && tab !== "approvals" && (
        <div
          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 cursor-pointer"
          onClick={() => setTab("approvals")}
        >
          <Bell className="w-5 h-5 text-amber-400" />
          <p className="text-amber-300 text-sm font-medium">
            {pending.length} approval{pending.length > 1 ? "s" : ""} waiting for your decision
          </p>
        </div>
      )}

      <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 w-fit">
        {(["approvals", "logs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {t === "approvals" ? <Bell className="w-3.5 h-3.5" /> : <ScrollText className="w-3.5 h-3.5" />}
            {t === "approvals" ? `Approvals${pending.length ? ` (${pending.length})` : ""}` : "Activity Log"}
          </button>
        ))}
      </div>

      {tab === "approvals" && (
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No approval requests yet.</div>
          ) : (
            approvals.map((approval) => {
              const agent = agents.find((a) => a.id === approval.agent_id);
              return (
                <div key={approval.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            approval.status === "pending"
                              ? "bg-amber-500/15 text-amber-400"
                              : approval.status === "approved"
                              ? "bg-green-500/15 text-green-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {approval.status}
                        </span>
                        <span className="text-xs text-slate-500">{agent?.name ?? "Unknown Agent"}</span>
                      </div>
                      <h3 className="font-semibold text-white mt-2">{approval.title}</h3>
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">
                      {new Date(approval.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{approval.description}</p>

                  {approval.status === "pending" && (
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => decide(approval.id, true)}
                        disabled={deciding === approval.id}
                        className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => decide(approval.id, false)}
                        disabled={deciding === approval.id}
                        className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  {approval.status !== "pending" && approval.decision_note && (
                    <p className="text-xs text-slate-500 italic">Note: {approval.decision_note}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No activity logged yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs">
                  <th className="text-left px-5 py-3">Agent</th>
                  <th className="text-left px-5 py-3">Action</th>
                  <th className="text-left px-5 py-3">Details</th>
                  <th className="text-right px-5 py-3">Tokens</th>
                  <th className="text-right px-5 py-3">Cost</th>
                  <th className="text-right px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const agent = agents.find((a) => a.id === log.agent_id);
                  return (
                    <tr key={log.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? "" : "bg-slate-900/50"}`}>
                      <td className="px-5 py-3 text-slate-300">{agent?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {log.action.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 max-w-xs truncate">{log.details ?? "—"}</td>
                      <td className="px-5 py-3 text-right text-slate-400">{log.tokens_used.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-slate-400">${Number(log.cost_usd).toFixed(6)}</td>
                      <td className="px-5 py-3 text-right text-slate-500 text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
