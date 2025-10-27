/**
 * @typedef {Object} Feature
 * @property {string} id
 * @property {string} label
 * @property {"mandatory"|"optional"} [type]
 * @property {string} [parent]
 */

/**
 * @typedef {Object} Constraint
 * @property {"requires"|"excludes"} type
 * @property {string} a
 * @property {string} b
 */

/**
 *  created the tree by features:return {nodes, edges, childrenMap, parentMap}
 * 
 */
export function buildGraph(features) {
  const nodes = features.map(f => ({ id: f.id, label: f.label, type: f.type || "optional" }));
  const edges = features
    .filter(f => f.parent)
    .map(f => ({ from: f.parent, to: f.id }));

  const childrenMap = new Map();
  const parentMap = new Map();
  for (const f of features) {
    if (f.parent) parentMap.set(f.id, f.parent);
    if (!childrenMap.has(f.parent || "ROOT")) childrenMap.set(f.parent || "ROOT", []);
    childrenMap.get(f.parent || "ROOT").push(f.id);
  }
  return { nodes, edges, childrenMap, parentMap };
}
