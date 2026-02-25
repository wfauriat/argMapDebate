import type { ArgumentGraph } from "@/types/graph";
import { importGraph } from "./serialization";

export async function loadExampleMap(name: string): Promise<ArgumentGraph> {
  const response = await fetch(`/example-maps/${name}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch example map: ${response.statusText}`);
  }
  const json = await response.text();
  return importGraph(json);
}
