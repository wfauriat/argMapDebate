import type { ArgumentGraph } from "@/types/graph";
import { importGraph } from "./serialization";

export const EXAMPLE_MAPS = [
  { id: "carbon-tax", label: "Carbon Tax" },
  { id: "raising-taxes", label: "Raising Taxes" },
  { id: "public-spending-cuts", label: "Public Spending Cuts" },
  { id: "mixed-vs-private-economy", label: "Mixed vs Private Economy" },
] as const;

export async function loadExampleMap(name: string): Promise<ArgumentGraph> {
  const response = await fetch(`/example-maps/${name}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch example map: ${response.statusText}`);
  }
  const json = await response.text();
  return importGraph(json);
}
