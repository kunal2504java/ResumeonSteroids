import type {
  RewriteRequest,
  TailorRequest,
  TailorResponse,
  Resume,
} from "@resumeai/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export const apiClient = {
  ai: {
    rewrite: (body: RewriteRequest, token: string) =>
      apiFetch<{ text: string }>("/api/ai/rewrite", {
        method: "POST",
        body: JSON.stringify(body),
        token,
      }),
    tailor: (body: TailorRequest & { resume: Resume }, token: string) =>
      apiFetch<TailorResponse>("/api/ai/tailor", {
        method: "POST",
        body: JSON.stringify(body),
        token,
      }),
    importGithub: (username: string, token: string) =>
      apiFetch("/api/ai/import/github", {
        method: "POST",
        body: JSON.stringify({ username }),
        token,
      }),
    importLeetcode: (username: string, token: string) =>
      apiFetch("/api/ai/import/leetcode", {
        method: "POST",
        body: JSON.stringify({ username }),
        token,
      }),
    importCodeforces: (handle: string, token: string) =>
      apiFetch("/api/ai/import/codeforces", {
        method: "POST",
        body: JSON.stringify({ handle }),
        token,
      }),
  },
  resume: {
    list: (token: string) => apiFetch<Resume[]>("/api/resume", { token }),
    get: (id: string, token: string) =>
      apiFetch<Resume>(`/api/resume/${id}`, { token }),
    create: (data: Partial<Resume>, token: string) =>
      apiFetch<Resume>("/api/resume", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, data: Partial<Resume>, token: string) =>
      apiFetch<Resume>(`/api/resume/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, token: string) =>
      apiFetch<{ success: boolean }>(`/api/resume/${id}`, {
        method: "DELETE",
        token,
      }),
  },
  export: {
    pdf: (id: string, token: string) =>
      apiFetch<{ url: string }>(`/api/export/pdf/${id}`, { token }),
  },
};

/**
 * Stream AI rewrite responses from the API.
 * Use this instead of apiClient.ai.rewrite for streaming support.
 */
export async function streamRewrite(
  body: RewriteRequest,
  token: string,
  onChunk: (text: string) => void
) {
  const res = await fetch(`${API_URL}/api/ai/rewrite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error ?? `HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
