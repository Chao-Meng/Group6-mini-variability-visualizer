import { useApp } from "../state/store";

// List all features from the model
export default function FeatureList() {
  const { model } = useApp();
  if (!model) return null;
  return (
    <ul>
      {model.features.map(f => (
        <li key={f.id}>{f.label} ({f.id}) {f.parent ? `← ${f.parent}` : ""}</li>
      ))}
    </ul>
  );
}
