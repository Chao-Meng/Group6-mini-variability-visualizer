
export default function buildFeatureHierarchy(featureArray) {
  if (!Array.isArray(featureArray) || featureArray.length === 0) return [];

  const validFeatures = featureArray.filter(
    (feature) =>
      feature && typeof feature.id === "string" && feature.id.trim().length > 0
  );

  const featureMap = {};
  for (const feature of validFeatures) {
    featureMap[feature.id] = { ...feature, children: [] };
  }

  const uniqueFeatures = Object.values(featureMap);

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

  const visited = new Set();
  const cyclicNodes = new Set();

  function detectCycle(node, path = new Set()) {
    if (path.has(node.id)) {
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

  for (const nodeId of cyclicNodes) {
    const node = featureMap[nodeId];
    if (node) node.children = [];
  }

  const rootNodes = [];
  for (const node of uniqueFeatures) {
    const parentId = node.parent;
    const hasParent = parentId && featureMap[parentId];
    const isCyclic = cyclicNodes.has(node.id);
    if (!hasParent || parentId === node.id || isCyclic) {
      rootNodes.push(node);
    }
  }

  const rootIds = new Set(rootNodes.map((n) => n.id));
  const orderedRoots = uniqueFeatures.filter((f) => rootIds.has(f.id));

  return orderedRoots;
}
