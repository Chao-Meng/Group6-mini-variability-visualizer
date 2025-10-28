// import { useApp } from "../state/store";

// // List all features from the model
// export default function FeatureList() {
//   const { model } = useApp();
//   if (!model) return null;
//   return (
//     <ul>
//       {model.features.map(f => (
//         <li key={f.id}>{f.label} ({f.id}) {f.parent ? `← ${f.parent}` : ""}</li>
//       ))}
//     </ul>
//   );
// }
import { useApp } from "../state/store";

export default function FeatureList() {
  const { model, searchHits } = useApp();   // get searchHits
  if (!model) return null;

  return (
    <ul>
      {model.features.map(f => {
        const hit = searchHits?.includes(f.id);       // check if this feature is a search hit 
        return (
          <li key={f.id} className={hit ? "hit" : ""}>
            {f.label} ({f.id}) {f.parent ? `← ${f.parent}` : ""}
          </li>
        );
      })}
    </ul>
  );
}
