import { describe, test, expect } from "vitest";
import buildFeatureHierarchy from "../buildFeatureHierarchy";

/**
 * Helper to simplify tree snapshots by extracting only IDs and children.
 * Prevents infinite recursion and avoids comparing full objects.
 */
function flattenHierarchy(featureNodes) {
  return featureNodes.map((node) => ({
    id: node.id,
    children: flattenHierarchy(node.children || []),
  }));
}

describe("buildFeatureHierarchy(): Hierarchical tree builder", () => {
  test("returns an empty array when input is empty", () => {
    const hierarchy = buildFeatureHierarchy([]);
    expect(hierarchy).toEqual([]);
  });

  test("creates a single root when only one feature has no parent", () => {
    const featureList = [{ id: "Root", label: "Root Feature" }];
    const hierarchy = buildFeatureHierarchy(featureList);
    expect(flattenHierarchy(hierarchy)).toEqual([{ id: "Root", children: [] }]);
  });

  test("places direct children under their correct parent", () => {
    const featureList = [
      { id: "Root", label: "Root" },
      { id: "ChildA", label: "Child A", parent: "Root" },
      { id: "ChildB", label: "Child B", parent: "Root" },
    ];
    const result = flattenHierarchy(buildFeatureHierarchy(featureList));
    expect(result).toEqual([
      {
        id: "Root",
        children: [
          { id: "ChildA", children: [] },
          { id: "ChildB", children: [] },
        ],
      },
    ]);
  });

  test("supports multiple nested levels (grandchild, great-grandchild)", () => {
    const featureList = [
      { id: "Root", label: "Root" },
      { id: "Child", label: "Child", parent: "Root" },
      { id: "Grandchild", label: "Grandchild", parent: "Child" },
      { id: "GreatGrandchild", label: "Great", parent: "Grandchild" },
    ];
    const result = flattenHierarchy(buildFeatureHierarchy(featureList));
    expect(result).toEqual([
      {
        id: "Root",
        children: [
          {
            id: "Child",
            children: [
              {
                id: "Grandchild",
                children: [{ id: "GreatGrandchild", children: [] }],
              },
            ],
          },
        ],
      },
    ]);
  });

  test("ignores invalid parent references", () => {
    const featureList = [
      { id: "Root", label: "Root" },
      { id: "Orphan", label: "Orphan", parent: "Nonexistent" },
    ];
    const result = flattenHierarchy(buildFeatureHierarchy(featureList));
    expect(result).toEqual([
      { id: "Root", children: [] },
      { id: "Orphan", children: [] },
    ]);
  });

  test("handles unordered input where children appear before parents", () => {
    const featureList = [
      { id: "Child", label: "Child", parent: "Parent" },
      { id: "Parent", label: "Parent" },
    ];
    const result = flattenHierarchy(buildFeatureHierarchy(featureList));
    expect(result).toEqual([
      { id: "Parent", children: [{ id: "Child", children: [] }] },
    ]);
  });

  test("handles multiple independent trees (multiple roots)", () => {
    const featureList = [
      { id: "RootA", label: "A" },
      { id: "RootB", label: "B" },
      { id: "ChildA", label: "Child", parent: "RootA" },
    ];
    const result = flattenHierarchy(buildFeatureHierarchy(featureList));
    expect(result).toEqual([
      { id: "RootA", children: [{ id: "ChildA", children: [] }] },
      { id: "RootB", children: [] },
    ]);
  });

  test("handles duplicate feature IDs gracefully (later entries overwrite earlier ones)", () => {
    const featureList = [
      { id: "Root", label: "First Root" },
      { id: "Root", label: "Duplicate Root" }, // overwrite
      { id: "Child", label: "Child", parent: "Root" },
    ];
    const result = flattenHierarchy(buildFeatureHierarchy(featureList));
    expect(result).toEqual([
      { id: "Root", children: [{ id: "Child", children: [] }] },
    ]);
  });

  test("handles malformed entries and features missing IDs", () => {
    const featureList = [
      { id: "Root", label: "Root" },
      { label: "Missing ID" },
      null,
      undefined,
      {},
    ].filter(Boolean);
    const result = flattenHierarchy(buildFeatureHierarchy(featureList));
    expect(result).toEqual([{ id: "Root", children: [] }]);
  });

  test("breaks circular references safely (A↔B)", () => {
    const featureList = [
      { id: "A", parent: "B" },
      { id: "B", parent: "A" },
    ];
    const result = flattenHierarchy(buildFeatureHierarchy(featureList));
    // Both become roots with no children (cycle broken)
    expect(result).toEqual([
      { id: "A", children: [] },
      { id: "B", children: [] },
    ]);
  });

  test("preserves input order for independent roots", () => {
    const featureList = [{ id: "Alpha" }, { id: "Beta" }, { id: "Gamma" }];
    const result = flattenHierarchy(buildFeatureHierarchy(featureList));
    expect(result.map((n) => n.id)).toEqual(["Alpha", "Beta", "Gamma"]);
  });
});
