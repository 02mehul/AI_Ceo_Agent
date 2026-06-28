import type { ExecutionEvent } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ceo_agent_token");
}

export async function streamAgentExecution(
  companyId: string,
  agentId: string,
  taskId: string,
  onEvent: (event: ExecutionEvent) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1/execute/${companyId}/${agentId}/${taskId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    onError("Failed to connect to backend");
    return;
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => res.statusText);
    onError(text);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") {
        onDone();
        return;
      }
      try {
        const event = JSON.parse(payload) as ExecutionEvent;
        onEvent(event);
      } catch {
        // malformed line, skip
      }
    }
  }

  onDone();
}
