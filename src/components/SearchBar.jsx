import { useMemo, useEffect, useState } from "react";
import { useApp } from "../state/store";
import { searchFeatures } from "../core/search";
import { Search, XCircle } from "lucide-react";

export default function ControlBar() {
  const { model, setSearchHits, query, setQuery } = useApp();
  const [resultCount, setResultCount] = useState(null);

  const features = useMemo(() => model?.features || [], [model]);

  // Live search updates
  useEffect(() => {
    if (!query?.trim()) {
      setSearchHits([]);
      setResultCount(null);
      return;
    }
    const hits = searchFeatures(features, query);
    setSearchHits(hits);
    setResultCount(hits.length);
  }, [query, features, setSearchHits]);

  // Keyboard shortcut Shift + S
  useEffect(() => {
    const input = document.getElementById("feature-search-input");
    const handleKey = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        input?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto mt-2 mb-3 px-4">
      <div className="relative flex items-center">
        {/* Search icon */}
        <Search
          size={18}
          className="absolute left-4 text-gray-500 pointer-events-none"
        />

        {/* Search input */}
        <input
          id="feature-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search features..."
          className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-900/70 border border-gray-700 text-gray-200 placeholder-gray-500 
                     focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500
                     hover:border-gray-600 transition-all"
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 text-gray-500 hover:text-red-400 transition"
            title="Clear search"
          >
            <XCircle size={18} />
          </button>
        )}

        {/* Overlay feedback (positioned absolutely, no layout shift) */}
        {resultCount !== null && (
          <div className="absolute left-3 -bottom-7 text-xs font-mono text-gray-400 select-none">
            {resultCount > 0 ? (
              <span className="text-green-400">
                {resultCount} feature{resultCount === 1 ? "" : "s"} found
              </span>
            ) : (
              <span className="text-red-400">No features match your query</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
