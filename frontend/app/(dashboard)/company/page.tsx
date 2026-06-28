"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Company } from "@/lib/types";
import { Building2, Plus, X } from "lucide-react";

const STAGES = ["Pre-revenue", "Early Revenue", "Growing", "Scaling", "Profitable", "Enterprise"];
const INDUSTRIES = ["SaaS", "E-commerce", "Agency", "Content / Creator", "Consulting", "FinTech", "HealthTech", "EdTech", "Other"];

export default function CompanyPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({
    name: "", mission: "", industry: "", stage: "",
    goals: [] as string[], tools: [] as string[],
  });
  const [goalInput, setGoalInput] = useState("");
  const [toolInput, setToolInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const companies = await api.company.list() as Company[];
      if (companies.length) {
        const c = companies[0];
        setCompany(c);
        setForm({
          name: c.name, mission: c.mission,
          industry: c.industry || "", stage: c.stage || "",
          goals: c.goals || [], tools: c.tools || [],
        });
        localStorage.setItem("ceo_agent_company", c.id);
      }
      setLoading(false);
    })();
  }, []);

  const addGoal = () => {
    if (goalInput.trim()) {
      setForm({ ...form, goals: [...form.goals, goalInput.trim()] });
      setGoalInput("");
    }
  };

  const removeGoal = (i: number) => {
    setForm({ ...form, goals: form.goals.filter((_, idx) => idx !== i) });
  };

  const addTool = () => {
    if (toolInput.trim()) {
      setForm({ ...form, tools: [...form.tools, toolInput.trim()] });
      setToolInput("");
    }
  };

  const removeTool = (i: number) => {
    setForm({ ...form, tools: form.tools.filter((_, idx) => idx !== i) });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (company) {
        await api.company.update(company.id, form);
      } else {
        const created = await api.company.create(form) as Company;
        localStorage.setItem("ceo_agent_company", created.id);
        setCompany(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (!company) router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Company Profile</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {company ? "Update your company details" : "Set up your company to get started"}
          </p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Basics</h2>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Company Name</label>
            <input
              required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. Acme AI"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Mission Statement</label>
            <textarea
              required value={form.mission}
              onChange={(e) => setForm({ ...form, mission: e.target.value })}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="e.g. Help 10,000 Indian entrepreneurs automate their business operations using AI by end of 2026."
            />
            <p className="text-xs text-slate-600 mt-1">Be specific — your agents will use this as their north star.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Industry</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select stage</option>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Monthly Goals</h2>
          <p className="text-xs text-slate-500">What are the 3–5 most important things your company needs to accomplish right now?</p>
          <div className="space-y-2">
            {form.goals.map((goal, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-2.5">
                <span className="flex-1 text-sm text-white">{goal}</span>
                <button type="button" onClick={() => removeGoal(i)} className="text-slate-500 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. Close 10 new clients this month"
            />
            <button
              type="button" onClick={addGoal}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Tools You Use</h2>
          <p className="text-xs text-slate-500">List the tools your business runs on. Agents will reference these.</p>
          <div className="flex flex-wrap gap-2">
            {form.tools.map((tool, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full">
                {tool}
                <button type="button" onClick={() => removeTool(i)} className="text-slate-500 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTool())}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. Gmail, Notion, Slack, Shopify"
            />
            <button
              type="button" onClick={addTool}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
        >
          {saving ? "Saving..." : saved ? "Saved!" : company ? "Save Changes" : "Create Company"}
        </button>
      </form>
    </div>
  );
}
