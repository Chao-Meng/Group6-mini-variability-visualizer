export function validateModel(json) {
  if (!json.root) throw new Error("Missing root");
  if (!Array.isArray(json.features)) throw new Error("features must be array");
// Feature validity check

  const featureIds = new Set(json.features.map(f => f.id));
  const errors = [];

  // Constraint validity check
  if (Array.isArray(json.constraints)) {
    for (const c of json.constraints) {
      if (!["requires", "excludes"].includes(c.type)) {
        errors.push(`Invalid constraint type: ${c.type}`);
      }
      if (!featureIds.has(c.a) || !featureIds.has(c.b)) {
        errors.push(`Constraint refers to missing feature: ${c.a} or ${c.b}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Calculates the associations that need to be highlighted when a feature is selected:
 * - requires: requires highlighting the dependency chain from a->b
 * - excludes: requires highlighting the conflicting relationship between a and b
 */
export function getRelationsFor(featureId, constraints) {
  const reqs = [];
  const excls = [];
  for (const c of (constraints || [])) {
    if (c.type === "requires" && c.a === featureId) reqs.push(c.b);
    if (c.type === "excludes" && (c.a === featureId || c.b === featureId)) {
      excls.push(c.a === featureId ? c.b : c.a);
    }
  }
  return { requires: reqs, excludes: excls };
}
