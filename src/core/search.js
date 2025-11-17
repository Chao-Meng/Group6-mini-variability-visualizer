export function searchFeatures(features, keyword) {
  const q = (keyword || "").trim().toLowerCase();
  if (!q) return [];
  return features
    .filter((f) => (f.label || f.id).toLowerCase().includes(q))
    .map((f) => f.id);
}

export function pathToRoot(targetId, parentMap) {
  if (!targetId || !(parentMap instanceof Map)) return [];

  const allIds = new Set([...parentMap.keys(), ...parentMap.values()]);
  if (!allIds.has(targetId)) return [];

  const path = [];
  let cur = targetId;
  while (cur && parentMap.has(cur)) {
    path.push(cur);
    cur = parentMap.get(cur);
  }
  if (cur) path.push(cur);
  return path.reverse();
}
