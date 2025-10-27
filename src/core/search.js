/**
 * Simple case-insensitive search, returning a list of matching feature IDs
 */
export function searchFeatures(features, keyword) {
  const q = (keyword || "").trim().toLowerCase();
  if (!q) return [];
  return features
    .filter(f => (f.label || f.id).toLowerCase().includes(q))
    .map(f => f.id);
}

/**
 * Calculate the path from the root to the target node, used to expand the tree or highlight the path
 */
export function pathToRoot(targetId, parentMap) {
  const path = [];
  let cur = targetId;
  while (cur && parentMap.has(cur)) {
    path.push(cur);
    cur = parentMap.get(cur);
  }
  if (cur) path.push(cur); // root
  return path.reverse();
}
