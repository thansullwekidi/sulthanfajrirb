import {
  isEnvelope,
  type ApiResponse
} from "@/contracts/api-envelope";

function transportFailure<T>(path: string, detail: string): ApiResponse<T> {
  return {
    ok: false,
    status: 500,
    data: null,
    error: {
      code: "TRANSPORT_ERROR",
      message: `Permintaan ke ${path} gagal: ${detail}`
    },
    timestamp: new Date().toISOString(),
    requestId: "req_local_transport",
    invalidatedTags: []
  };
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(init.headers ?? {})
      }
    });

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      return transportFailure<T>(
        path,
        `respons bukan JSON (HTTP ${response.status}).`
      );
    }

    if (!isEnvelope(parsed)) {
      return transportFailure<T>(path, "amplop respons tidak dikenali.");
    }

    return parsed as ApiResponse<T>;
  } catch (error) {
    return transportFailure<T>(
      path,
      error instanceof Error ? error.message : "jaringan tidak tersedia."
    );
  }
}

export function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(path, { method: "DELETE" });
}
