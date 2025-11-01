import { useMemo } from "react";
import { useApp } from "../state/store";
import { searchFeatures } from "../core/search";

// Control bar with search input
export default function ControlBar() {
  const { model, setSearchHits, query, setQuery } = useApp();

  const features = useMemo(() => model?.features || [], [model]);
  // Handle search submission
  function onSearch(e) {
    e.preventDefault();
    const hits = searchFeatures(features, query);
    setSearchHits(hits);
  }

  return (
    <form onSubmit={onSearch} className="flex gap-2 mb-1 mt-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search features..."
      />
      <button type="submit">Search</button>
    </form>
  );
}
