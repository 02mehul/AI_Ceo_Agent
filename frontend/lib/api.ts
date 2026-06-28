const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ceo_agent_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      request("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) }, false),
    login: (data: { email: string; password: string }) =>
      request("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) }, false),
    me: () => request("/api/v1/auth/me"),
  },

  company: {
    list: () => request("/api/v1/company"),
    get: (id: string) => request(`/api/v1/company/${id}`),
    create: (data: object) => request("/api/v1/company", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: object) =>
      request(`/api/v1/company/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  agents: {
    list: (companyId: string) => request(`/api/v1/agents/${companyId}`),
    get: (companyId: string, agentId: string) => request(`/api/v1/agents/${companyId}/${agentId}`),
    create: (companyId: string, data: object) =>
      request(`/api/v1/agents/${companyId}`, { method: "POST", body: JSON.stringify(data) }),
    update: (companyId: string, agentId: string, data: object) =>
      request(`/api/v1/agents/${companyId}/${agentId}`, { method: "PATCH", body: JSON.stringify(data) }),
    pause: (companyId: string, agentId: string) =>
      request(`/api/v1/agents/${companyId}/${agentId}/pause`, { method: "POST" }),
    resume: (companyId: string, agentId: string) =>
      request(`/api/v1/agents/${companyId}/${agentId}/resume`, { method: "POST" }),
    terminate: (companyId: string, agentId: string) =>
      request(`/api/v1/agents/${companyId}/${agentId}`, { method: "DELETE" }),
  },

  projects: {
    list: (companyId: string) => request(`/api/v1/projects/${companyId}`),
    create: (companyId: string, data: object) =>
      request(`/api/v1/projects/${companyId}`, { method: "POST", body: JSON.stringify(data) }),
    update: (companyId: string, projectId: string, data: object) =>
      request(`/api/v1/projects/${companyId}/${projectId}`, { method: "PATCH", body: JSON.stringify(data) }),
    goals: {
      list: (companyId: string, projectId: string) =>
        request(`/api/v1/projects/${companyId}/${projectId}/goals`),
      create: (companyId: string, projectId: string, data: object) =>
        request(`/api/v1/projects/${companyId}/${projectId}/goals`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (companyId: string, projectId: string, goalId: string, data: object) =>
        request(`/api/v1/projects/${companyId}/${projectId}/goals/${goalId}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },
  },

  tasks: {
    list: (companyId: string, params?: { agent_id?: string; status?: string }) => {
      const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
      return request(`/api/v1/tasks/${companyId}${qs}`);
    },
    get: (companyId: string, taskId: string) => request(`/api/v1/tasks/${companyId}/${taskId}`),
    create: (companyId: string, data: object) =>
      request(`/api/v1/tasks/${companyId}`, { method: "POST", body: JSON.stringify(data) }),
    update: (companyId: string, taskId: string, data: object) =>
      request(`/api/v1/tasks/${companyId}/${taskId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (companyId: string, taskId: string) =>
      request(`/api/v1/tasks/${companyId}/${taskId}`, { method: "DELETE" }),
  },

  audit: {
    logs: (companyId: string) => request(`/api/v1/audit/${companyId}/logs`),
    approvals: (companyId: string) => request(`/api/v1/audit/${companyId}/approvals`),
    decide: (companyId: string, approvalId: string, data: { approved: boolean; note?: string }) =>
      request(`/api/v1/audit/${companyId}/approvals/${approvalId}/decide`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

};
