import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  runInference,
  loadInferenceSettings,
  saveInferenceSettings,
  type InferenceSettings,
} from "@/lib/inferenceApi";
import type { InferencePayload } from "@/types/inference";

// -------------------------------------------------------------------------- //
//  Helpers
// -------------------------------------------------------------------------- //

function makePayload(overrides?: Partial<InferencePayload>): InferencePayload {
  return {
    nodes: [
      { id: "n1", nodeType: "FactualClaim" as never, label: "Test", credence: 0.7 },
    ],
    edges: [],
    ...overrides,
  };
}

const DEFAULT_SETTINGS: InferenceSettings = {
  backendUrl: "http://localhost:8000",
};

// -------------------------------------------------------------------------- //
//  localStorage stubbing (node env doesn't have localStorage)
// -------------------------------------------------------------------------- //

let storage: Record<string, string> = {};

beforeEach(() => {
  storage = {};
  const localStorageStub = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
  };
  vi.stubGlobal("localStorage", localStorageStub);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// -------------------------------------------------------------------------- //
//  Settings persistence
// -------------------------------------------------------------------------- //

describe("loadInferenceSettings", () => {
  it("returns defaults when nothing stored", () => {
    const settings = loadInferenceSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("loads saved settings from localStorage", () => {
    storage["inference-settings"] = JSON.stringify({
      backendUrl: "http://example.com:9000",
    });
    const settings = loadInferenceSettings();
    expect(settings.backendUrl).toBe("http://example.com:9000");
  });

  it("falls back to defaults on invalid JSON", () => {
    storage["inference-settings"] = "not-json";
    const settings = loadInferenceSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("fills missing fields with defaults", () => {
    storage["inference-settings"] = JSON.stringify({});
    const settings = loadInferenceSettings();
    expect(settings.backendUrl).toBe("http://localhost:8000");
  });
});

describe("saveInferenceSettings", () => {
  it("persists to localStorage", () => {
    saveInferenceSettings({ backendUrl: "http://custom:5000" });
    const stored = JSON.parse(storage["inference-settings"]);
    expect(stored.backendUrl).toBe("http://custom:5000");
  });

  it("round-trips through load", () => {
    const settings: InferenceSettings = { backendUrl: "http://my-server:4000" };
    saveInferenceSettings(settings);
    expect(loadInferenceSettings()).toEqual(settings);
  });
});

// -------------------------------------------------------------------------- //
//  runInference — fetch behavior
// -------------------------------------------------------------------------- //

describe("runInference", () => {
  it("sends POST to /infer with JSON body", async () => {
    const mockResponse = {
      result: { nodes: [{ id: "n1", posterior: 0.75 }] },
      warnings: [],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const payload = makePayload();
    const result = await runInference(payload, DEFAULT_SETTINGS);

    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://localhost:8000/infer");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual(payload);
    expect(result).toEqual(mockResponse);
  });

  it("strips trailing slashes from backendUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: { nodes: [] }, warnings: [] }),
      }),
    );

    await runInference(makePayload(), { backendUrl: "http://localhost:8000///" });
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://localhost:8000/infer");
  });

  it("passes abort signal to fetch", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: { nodes: [] }, warnings: [] }),
      }),
    );

    await runInference(makePayload(), DEFAULT_SETTINGS, controller.signal);
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.signal).toBe(controller.signal);
  });

  it("returns warnings from response", async () => {
    const mockResponse = {
      result: { nodes: [] },
      warnings: ["Cycle detected: removed edge 'e1'"],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await runInference(makePayload({ nodes: [], edges: [] }), DEFAULT_SETTINGS);
    expect(result.warnings).toEqual(["Cycle detected: removed edge 'e1'"]);
  });

  // ----------------------------------------------------------------------- //
  //  Error handling
  // ----------------------------------------------------------------------- //

  it("throws helpful message on network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    await expect(runInference(makePayload(), DEFAULT_SETTINGS)).rejects.toThrow(
      /Could not reach inference backend/,
    );
    await expect(runInference(makePayload(), DEFAULT_SETTINGS)).rejects.toThrow(
      /make sure the backend is running/i,
    );
  });

  it("re-throws AbortError without wrapping", async () => {
    const abortError = new DOMException("The operation was aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(runInference(makePayload(), DEFAULT_SETTINGS)).rejects.toThrow(abortError);
  });

  it("throws on non-ok response with detail from body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ detail: "Invalid node type" }),
      }),
    );

    await expect(runInference(makePayload(), DEFAULT_SETTINGS)).rejects.toThrow(
      "Invalid node type",
    );
  });

  it("throws generic message when body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("not json")),
      }),
    );

    await expect(runInference(makePayload(), DEFAULT_SETTINGS)).rejects.toThrow(
      /Inference API error 500/,
    );
  });
});
