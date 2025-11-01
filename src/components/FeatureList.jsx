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
import { ChevronLeft } from "lucide-react";

export default function FeatureList() {
  const { model, searchHits, setHighlights, setSearchHits } = useApp();
  if (!model) return null;

  const handleDoubleClick = (featureId) => {
    // Reset search to this feature
    setHighlights?.([featureId]);
    setSearchHits?.([]); // optional – clears previous search hits
  };

  return (
    <div className="w-full max-w-[900px] mx-auto my-4 rounded-lg border border-gray-700/30 bg-gray-900/30 backdrop-blur-sm text-gray-100 shadow-md p-4">
      <h2 className="text-lg font-semibold mb-3 border-b border-gray-700/40 pb-2">
        Feature Hierarchy
      </h2>

      <ul className="space-y-2 text-sm font-medium">
        {model.features.map((f) => {
          const hit = searchHits?.includes(f.id);
          return (
            <li
              key={f.id}
              onDoubleClick={() => handleDoubleClick(f.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 cursor-pointer select-none
                ${
                  hit
                    ? "bg-blue-500/10 border border-blue-400/40"
                    : "hover:bg-gray-800/60"
                }
              `}
            >
              <div className="flex items-center gap-2 truncate">
                {/* Dot marker for feature type */}
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    f.type === "mandatory"
                      ? "bg-green-500"
                      : f.type === "optional"
                      ? "bg-blue-400"
                      : "bg-gray-500"
                  }`}
                ></span>

                {/* Feature name and ID */}
                <span
                  className={`truncate ${
                    hit ? "text-blue-300 font-semibold" : "text-gray-200"
                  }`}
                  title={f.label}
                >
                  {f.label}{" "}
                  <span className="text-gray-400 text-xs font-mono">
                    ({f.id})
                  </span>
                </span>
              </div>

              {/* Parent reference */}
              {f.parent && (
                <div className="flex items-center gap-1 text-gray-400 text-xs font-mono">
                  <ChevronLeft size={12} />
                  {f.parent}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {searchHits?.length > 0 && (
        <p className="mt-3 text-xs text-blue-300/80 font-mono">
          {searchHits.length} feature
          {searchHits.length > 1 ? "s" : ""} matched your search.
        </p>
      )}
    </div>
  );
}
