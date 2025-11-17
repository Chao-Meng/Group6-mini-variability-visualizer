export function validateModel(json) {
  const errors = [];

  if (!json || typeof json !== "object") {
    errors.push("Invalid JSON object");
    return { ok: false, errors };
  }

  if (!json.root) errors.push("Missing root");
  if (!Array.isArray(json.features)) errors.push("features must be array");

  if (Array.isArray(json.features)) {
    const ids = new Set();
    for (const f of json.features) {
      if (!f?.id) errors.push("Feature missing id");
      if (f?.id) {
        if (ids.has(f.id)) errors.push(`Duplicate feature id: ${f.id}`);
        ids.add(f.id);
      }
      if (f?.parent && !json.features.some((x) => x.id === f.parent)) {
        errors.push(`Parent not found for ${f.id}: ${f.parent}`);
      }
    }
    if (!ids.has(json.root)) {
      errors.push(`Root '${json.root}' not found in features`);
    }
  }

  if (Array.isArray(json.constraints)) {
    const featureIds = new Set((json.features || []).map((f) => f.id));
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

export function getRelationsFor(featureId, constraints) {
  const requires = [];
  const excludes = [];

  for (const c of constraints || []) {
    if (c?.type === "requires" && c.a === featureId) {
      requires.push(c.b);
    }
    if (c?.type === "excludes" && (c.a === featureId || c.b === featureId)) {
      excludes.push(c.a === featureId ? c.b : c.a);
    }
  }

  return { requires, excludes };
}
