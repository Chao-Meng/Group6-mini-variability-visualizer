import * as d3 from "d3";
export default function buildGraphHierarchy(model) {
  const featureById = {};
  model.features.forEach(
    (feature) => (featureById[feature.id] = { ...feature, children: [] })
  );
  model.features.forEach((feature) => {
    if (feature.parent && featureById[feature.parent]) {
      featureById[feature.parent].children.push(featureById[feature.id]);
    }
  });
  const rootFeature = model.features.find((feature) => !feature.parent);
  return rootFeature ? d3.hierarchy(featureById[rootFeature.id]) : null;
}
