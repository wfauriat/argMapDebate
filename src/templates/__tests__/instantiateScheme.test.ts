import { describe, it, expect } from "vitest";
import { instantiateScheme } from "@/templates/instantiateScheme";
import { ARGUMENTATION_SCHEMES } from "@/templates/argumentSchemes";

describe("instantiateScheme", () => {
  for (const scheme of ARGUMENTATION_SCHEMES) {
    describe(`scheme: ${scheme.name}`, () => {
      it("instantiates without error", () => {
        expect(() => instantiateScheme(scheme)).not.toThrow();
      });

      it("has correct node and edge counts matching template", () => {
        const graph = instantiateScheme(scheme);
        expect(graph.nodes).toHaveLength(scheme.nodes.length);
        expect(graph.edges).toHaveLength(scheme.edges.length);
      });

      it("all IDs are unique and differ from template localIds", () => {
        const graph = instantiateScheme(scheme);
        const nodeIds = graph.nodes.map((n) => n.id);
        const edgeIds = graph.edges.map((e) => e.id);
        const allIds = [...nodeIds, ...edgeIds];

        // All unique
        expect(new Set(allIds).size).toBe(allIds.length);

        // None match template localIds
        const localIds = scheme.nodes.map((n) => n.localId);
        for (const id of nodeIds) {
          expect(localIds).not.toContain(id);
        }
      });

      it("edge source/target reference real nodes", () => {
        const graph = instantiateScheme(scheme);
        const nodeIds = new Set(graph.nodes.map((n) => n.id));
        for (const edge of graph.edges) {
          expect(nodeIds.has(edge.source)).toBe(true);
          expect(nodeIds.has(edge.target)).toBe(true);
        }
      });

      it("title matches scheme name", () => {
        const graph = instantiateScheme(scheme);
        expect(graph.title).toBe(scheme.name);
      });
    });
  }
});
