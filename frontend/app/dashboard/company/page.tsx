"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Company } from "@/lib/types";
import { Building2, Plus, X } from "lucide-react";

const STAGES = ["idea", "pre-seed", "seed", "series-a", "growth", "enterprise"];
const INDUSTRIES = ["SaaS", "E-commerce", "Fintech", "Healthtech", "Edtech", "Media", "Logistics", "Other"];

export default function CompanyPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", mission: "", industry: "", stage: "", goals: [] as string[], tools: [] as string[],
  });
  const [goalInput, setGoalInput] = useState("");
  const [toolInput, setToolInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const companies = await api.company.list() as Company[];
        if (companies.length) {
          const c = companies[0];
          setCompany(c);
          setForm({
            name: c.name,
            mission: c.mission,
            industry: c.industry || "",
            stage: c.stage || "",
            goals: c.goals || [],
            tools: c.tools || [],
          });
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (company) {
        await api.company.update(company.id, form);
      } else {
        const c = await api.company.create(form) as Company;
        localStorage.setItem("ceo_agent_company", c.id);
        router.push("/dashboard");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const addGoal = () => {
    const g = goalInput.trim();
    if (g && !form.goals.includes(g)) setForm({ ...form, goals: [...form.goals, g] });
    setGoalInput("");
  };

  const addTool = () => {
    const t = toolInput.trim();
    if (t && !form.tools.includes(t)) setForm({ ...form, tools: [...form.tools, t] });
    setToolInput("");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-slate-400">Loading...</div></div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Building2 className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">{company ? "Company Settings" : "Set Up Your Company"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Company Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Mission Statement *</label>
            <textarea
              required
              rows={3}
              value={form.mission}
              onChange={(e) => setForm({ ...form, mission: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
              placeholder="We exist to..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Industry</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select...</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select...</option>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Company Goals</label>
            <div className="flex gap-2 mb-2">
              <input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGoal(); } }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Reach $1M ARR in Q4..."
              />
              <button type="button" onClick={addGoal} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.goals.map((g) => (
                <span key={g} className="flex items-center gap-1 text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                  {g}
                  <button type="button" onClick={() => setForm({ ...form, goals: form.goals.filter((x) => x !== g) })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Tools & Software</label>
            <div className="flex gap-2 mb-2">
              <input
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTool(); } }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Slack, Notion, Shopify..."
              />
              <button type="button" onClick={addTool} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tools.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                  {t}
                  <button type="button" onClick={() => setForm({ ...form, tools: form.tools.filter((x) => x !== t) })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {saving ? "Saving..." : saved ? "Saved!" : company ? "Save Changes" : "Create Company"}
        </button>
      </form>
    </div>
  );
}
