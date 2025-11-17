import { describe, test, expect, beforeEach } from "vitest";
import buildGraphHierarchy from "../buildGraphHierarchy";

describe("buildGraphHierarchy", () => {
  let model;

  beforeEach(() => {
    model = {
      features: [
        { id: "root" },
        { id: "a", parent: "root" },
        { id: "b", parent: "root" },
        { id: "c", parent: "a" },
      ],
    };
  });

  test("creates a valid d3.hierarchy tree with correct structure", () => {
    const hierarchy = buildGraphHierarchy(model);
    expect(hierarchy).not.toBeNull();
    expect(hierarchy.data.id).toBe("root");

    const children = hierarchy.children.map((d) => d.data.id);
    expect(children).toContain("a");
    expect(children).toContain("b");

    const nodeA = hierarchy.children.find((n) => n.data.id === "a");
    expect(nodeA.children[0].data.id).toBe("c");
  });

  test("returns null when no root feature exists", () => {
    const noRootModel = {
      features: [
        { id: "a", parent: "x" },
        { id: "b", parent: "y" },
      ],
    };
    const hierarchy = buildGraphHierarchy(noRootModel);
    expect(hierarchy).toBeNull();
  });

  test("ignores invalid parent references safely", () => {
    const invalidModel = {
      features: [
        { id: "root" },
        { id: "child1", parent: "root" },
        { id: "child2", parent: "nonexistent" },
      ],
    };
    const hierarchy = buildGraphHierarchy(invalidModel);
    expect(hierarchy).not.toBeNull();
    expect(hierarchy.children.map((n) => n.data.id)).toContain("child1");
    expect(hierarchy.children.map((n) => n.data.id)).not.toContain("child2");
  });

  test("returns null when features array is empty", () => {
    const emptyModel = { features: [] };
    const result = buildGraphHierarchy(emptyModel);
    expect(result).toBeNull();
  });

  test("handles multiple roots by picking the first without a parent", () => {
    const multiRootModel = {
      features: [{ id: "r1" }, { id: "r2" }, { id: "a", parent: "r1" }],
    };
    const hierarchy = buildGraphHierarchy(multiRootModel);
    expect(hierarchy.data.id).toBe("r1");
    expect(hierarchy.children[0].data.id).toBe("a");
  });

  test("produces correct descendant count in complex tree", () => {
    const hierarchy = buildGraphHierarchy(model);
    const allNodes = hierarchy.descendants();

    expect(allNodes.map((d) => d.data.id)).toEqual(["root", "a", "b", "c"]);

    expect(allNodes.length).toBe(4);
    const unique = new Set(allNodes.map((n) => n.data.id));
    expect(unique.size).toBe(4);
  });
});
