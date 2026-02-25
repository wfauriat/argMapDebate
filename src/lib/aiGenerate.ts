import { importGraph } from "@/lib/serialization";
import type { ArgumentGraph } from "@/types/graph";

export interface AIProviderSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = "ai-generate-settings";

const DEFAULT_SETTINGS: AIProviderSettings = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o",
};

export function loadSettings(): AIProviderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      baseUrl: parsed.baseUrl ?? DEFAULT_SETTINGS.baseUrl,
      apiKey: parsed.apiKey ?? DEFAULT_SETTINGS.apiKey,
      model: parsed.model ?? DEFAULT_SETTINGS.model,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AIProviderSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
}

function buildSystemPrompt(): string {
  return `You are an argument mapping assistant. You generate structured argument maps as JSON.

Node types and their required fields:
1. FactualClaim — { nodeType: "FactualClaim", label: string, notes: string, status: "Unsupported", sources: string[] }
2. CausalClaim — { nodeType: "CausalClaim", label: string, notes: string, status: "Unsupported", mechanism: string, sources: string[] }
3. Value — { nodeType: "Value", label: string, notes: string, status: "Unsupported", domain: string }
4. Assumption — { nodeType: "Assumption", label: string, notes: string, status: "Unsupported", isExplicit: boolean }
5. Evidence — { nodeType: "Evidence", label: string, notes: string, status: "Unsupported", sourceType: "study"|"statistic"|"testimony"|"observation"|"other", citation: string, url: string }
6. Policy — { nodeType: "Policy", label: string, notes: string, status: "Unsupported", scope: string }

Edge types and their required fields:
1. Supports — { edgeType: "Supports", notes: string }
2. Undermines — { edgeType: "Undermines", notes: string }
3. DependsOn — { edgeType: "DependsOn", notes: string }
4. Contradicts — { edgeType: "Contradicts", notes: string }

Output format — a single JSON object:
{
  "title": "Short title",
  "description": "Brief description of the debate",
  "nodes": [
    { "id": "n1", "type": "<nodeType>", "position": { "x": 0, "y": 0 }, "data": { <node fields> } }
  ],
  "edges": [
    { "id": "e1", "source": "<node id>", "target": "<node id>", "type": "<edgeType>", "data": { <edge fields> } }
  ]
}

Guidelines:
- Generate 8–15 nodes with a mix of different node types.
- Create balanced arguments: include both supporting and opposing positions.
- All node positions must be { "x": 0, "y": 0 } (layout is computed automatically).
- All node statuses must be "Unsupported" (statuses are recomputed from edges automatically).
- Use unique IDs like "n1", "n2", ... for nodes and "e1", "e2", ... for edges.
- The "type" field on each node must match the nodeType in data (e.g. type: "FactualClaim").
- The "type" field on each edge must match the edgeType in data (e.g. type: "Supports").
- Respond ONLY with the JSON object, no additional text.`;
}

export async function generateArgumentMap(
  topic: string,
  settings: AIProviderSettings,
  signal?: AbortSignal,
): Promise<ArgumentGraph> {
  const baseUrl = settings.baseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (settings.apiKey) {
    headers["Authorization"] = `Bearer ${settings.apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          {
            role: "user",
            content: `Generate an argument map about the following topic:\n\n${topic}`,
          },
        ],
        temperature: 0.7,
      }),
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new Error(`Network error: could not reach ${baseUrl}. Check your base URL and connection.`);
  }

  if (!response.ok) {
    let message = `API error ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error?.message) {
        message = body.error.message;
      }
    } catch {
      // body wasn't JSON, use generic message
    }
    throw new Error(message);
  }

  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("Empty response from AI model");
  }

  const jsonStr = stripCodeFences(content.trim());

  let graph: ArgumentGraph;
  try {
    graph = importGraph(jsonStr);
  } catch (err: unknown) {
    throw new Error(`Failed to parse AI response: ${(err as Error).message}`);
  }

  return graph;
}
