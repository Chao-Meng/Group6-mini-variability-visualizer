/**
 * Builds a hierarchical feature tree from a flat list of features.
 * Handles invalid parents, duplicates, missing IDs, and circular references.
 */

export default function buildFeatureHierarchy(featureArray) {
  if (!Array.isArray(featureArray) || featureArray.length === 0) return [];

  // Step 1: Filter valid entries
  const validFeatures = featureArray.filter(
    (feature) =>
      feature && typeof feature.id === "string" && feature.id.trim().length > 0
  );

  // Step 2: Map ID → node (later duplicates overwrite earlier)
  const featureMap = {};
  for (const feature of validFeatures) {
    featureMap[feature.id] = { ...feature, children: [] };
  }

  // Step 3: Unique feature list
  const uniqueFeatures = Object.values(featureMap);

  // Step 4: Build parent–child links safely
  for (const node of uniqueFeatures) {
    const parentId = node.parent;
    if (
      typeof parentId === "string" &&
      parentId !== node.id &&
      featureMap[parentId]
    ) {
      featureMap[parentId].children.push(node);
    }
  }

  // Step 5: Detect cycles and record all involved nodes
  const visited = new Set();
  const cyclicNodes = new Set();

  function detectCycle(node, path = new Set()) {
    if (path.has(node.id)) {
      // mark all nodes in this path as cyclic
      for (const id of path) cyclicNodes.add(id);
      return;
    }
    if (visited.has(node.id)) return;
    visited.add(node.id);
    path.add(node.id);

    for (const child of node.children) {
      detectCycle(child, new Set(path));
    }
  }

  for (const node of uniqueFeatures) detectCycle(node, new Set());

  // Step 6: Break the cycles physically (to avoid infinite recursion)
  for (const nodeId of cyclicNodes) {
    const node = featureMap[nodeId];
    if (node) node.children = [];
  }

  // Step 7: Collect roots (no valid parent or part of a cycle)
  const rootNodes = [];
  for (const node of uniqueFeatures) {
    const parentId = node.parent;
    const hasParent = parentId && featureMap[parentId];
    const isCyclic = cyclicNodes.has(node.id);
    if (!hasParent || parentId === node.id || isCyclic) {
      rootNodes.push(node);
    }
  }

  // Step 8: Preserve input order for roots
  const rootIds = new Set(rootNodes.map((n) => n.id));
  const orderedRoots = uniqueFeatures.filter((f) => rootIds.has(f.id));

  return orderedRoots;
}
