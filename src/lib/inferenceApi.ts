import type { InferencePayload, InferenceResult } from "@/types/inference";

export interface InferenceSettings {
  backendUrl: string;
}

const STORAGE_KEY = "inference-settings";

const DEFAULT_SETTINGS: InferenceSettings = {
  backendUrl: "http://localhost:8000",
};

export function loadInferenceSettings(): InferenceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      backendUrl: parsed.backendUrl ?? DEFAULT_SETTINGS.backendUrl,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveInferenceSettings(settings: InferenceSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export interface InferenceApiResult {
  result: InferenceResult;
  warnings: string[];
}

export async function runInference(
  payload: InferencePayload,
  settings: InferenceSettings,
  signal?: AbortSignal,
): Promise<InferenceApiResult> {
  const baseUrl = settings.backendUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/infer`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new Error(
      `Could not reach inference backend at ${baseUrl}. Make sure the backend is running (cd backend && uvicorn app.main:app --port 8000).`,
    );
  }

  if (!response.ok) {
    let message = `Inference API error ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) {
        message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // body wasn't JSON
    }
    throw new Error(message);
  }

  return response.json();
}
