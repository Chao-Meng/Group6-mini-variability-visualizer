import { describe, test, expect } from "vitest";
import buildFeatureHierarchy from "../../core/buildFeatureHierarchy";

/**
 * Utility for deep extraction of hierarchy as plain objects for easier verification.
 * It prevents noise from recursive references in snapshots.
 */
type FeatureNode = { id: string; children?: FeatureNode[] };

function extractHierarchy(featureNodes: FeatureNode[]): { id: string; children: any[] }[] {
  return featureNodes.map((node) => ({
    id: node.id,
    children: extractHierarchy(node.children || []),
  }));
}

describe("buildFeatureHierarchy(): feature tree construction", () => {
  test("returns an empty array when input is empty", () => {
    const hierarchy = buildFeatureHierarchy([]);
    expect(hierarchy).toEqual([]);
  });

  test("creates a single root node when only one feature has no parent", () => {
    const singleFeatureList = [{ id: "Root", label: "Root Feature" }];
    const hierarchy = buildFeatureHierarchy(singleFeatureList);

    expect(hierarchy.length).toBe(1);
    expect(hierarchy[0].id).toBe("Root");
    expect(hierarchy[0].children).toEqual([]);
  });

  test("places direct children under their correct parent", () => {
    const featureList = [
      { id: "Root", label: "Root" },
      { id: "ChildA", label: "Child A", parent: "Root" },
      { id: "ChildB", label: "Child B", parent: "Root" },
    ];

    const hierarchy = buildFeatureHierarchy(featureList);
    const simplified = extractHierarchy(hierarchy);

    expect(simplified).toEqual([
      {
        id: "Root",
        children: [
          { id: "ChildA", children: [] },
          { id: "ChildB", children: [] },
        ],
      },
    ]);
  });

  test("supports multi-level nesting (grandchildren and deeper levels)", () => {
    const featureList = [
      { id: "Root", label: "Root" },
      { id: "ChildA", label: "Child A", parent: "Root" },
      { id: "GrandchildA1", label: "Grandchild", parent: "ChildA" },
      {
        id: "GreatGrandchild",
        label: "Great Grandchild",
        parent: "GrandchildA1",
      },
    ];

    const hierarchy = buildFeatureHierarchy(featureList);
    const simplified = extractHierarchy(hierarchy);

    expect(simplified).toEqual([
      {
        id: "Root",
        children: [
          {
            id: "ChildA",
            children: [
              {
                id: "GrandchildA1",
                children: [{ id: "GreatGrandchild", children: [] }],
              },
            ],
          },
        ],
      },
    ]);
  });

  test("ignores parent references that do not exist", () => {
    const featureList = [
      { id: "Root", label: "Root" },
      { id: "OrphanChild", label: "Orphan", parent: "NonexistentParent" },
    ];

    const hierarchy = buildFeatureHierarchy(featureList);
    const simplified = extractHierarchy(hierarchy);

    // The orphan should not appear as a child, only as a root.
    expect(simplified).toEqual([
      { id: "Root", children: [] },
      { id: "OrphanChild", children: [] },
    ]);
  });

  test("handles unordered input where children appear before their parents", () => {
    const featureList = [
      { id: "Child", label: "Child", parent: "Parent" },
      { id: "Parent", label: "Parent" },
    ];

    const hierarchy = buildFeatureHierarchy(featureList);
    const simplified = extractHierarchy(hierarchy);

    expect(simplified).toEqual([
      {
        id: "Parent",
        children: [{ id: "Child", children: [] }],
      },
    ]);
  });

  test("builds multiple independent trees when several roots exist", () => {
    const featureList = [
      { id: "RootA", label: "Root A" },
      { id: "RootB", label: "Root B" },
      { id: "ChildA1", label: "Child A1", parent: "RootA" },
    ];

    const hierarchy = buildFeatureHierarchy(featureList);
    const simplified = extractHierarchy(hierarchy);

    expect(simplified).toEqual([
      { id: "RootA", children: [{ id: "ChildA1", children: [] }] },
      { id: "RootB", children: [] },
    ]);
  });

  test("handles duplicate feature IDs gracefully (later entries overwrite earlier ones)", () => {
    const featureList = [
      { id: "Root", label: "First Root" },
      { id: "Root", label: "Duplicate Root" }, // duplicate id
      { id: "Child", label: "Child", parent: "Root" },
    ];

    const hierarchy = buildFeatureHierarchy(featureList);
    const simplified = extractHierarchy(hierarchy);

    // The duplicate overwrote the first, so there should be one tree
    expect(simplified).toEqual([
      { id: "Root", children: [{ id: "Child", children: [] }] },
    ]);
  });

  test("gracefully handles features missing ID or malformed entries", () => {
    const featureList = [
      { id: "Root", label: "Root" },
      { label: "Missing ID" }, // should be ignored
      null,
      undefined,
      {},
    ];

    const hierarchy = buildFeatureHierarchy(featureList.filter(Boolean));
    const simplified = extractHierarchy(hierarchy);

    expect(simplified).toEqual([{ id: "Root", children: [] }]);
  });

  test("avoids infinite loops in circular parent relationships", () => {
    const featureList = [
      { id: "A", label: "A", parent: "B" },
      { id: "B", label: "B", parent: "A" },
    ];

    // This won't crash because buildFeatureHierarchy does not recurse
    const hierarchy = buildFeatureHierarchy(featureList);
    const simplified = extractHierarchy(hierarchy);

    // Both should remain root nodes since their parents can't be resolved
    expect(simplified).toEqual([
      { id: "A", children: [] },
      { id: "B", children: [] },
    ]);
  });

  test("retains the original order of root nodes from input list", () => {
    const featureList = [
      { id: "Alpha", label: "A" },
      { id: "Beta", label: "B" },
      { id: "Gamma", label: "C" },
    ];

    const hierarchy = buildFeatureHierarchy(featureList);
    const simplified = extractHierarchy(hierarchy);

    expect(simplified.map((node) => node.id)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });
});
