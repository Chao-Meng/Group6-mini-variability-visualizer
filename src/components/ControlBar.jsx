import { useMemo, useState } from "react";
import { useApp } from "../state/store";
import { searchFeatures } from "../core/search";

// Control bar with search input
export default function ControlBar() {
  const { model, graph, setSearchHits } = useApp();
  const [q, setQ] = useState("");

  const features = useMemo(() => model?.features || [], [model]);
// Handle search submission
  function onSearch(e) {
    e.preventDefault();
    const hits = searchFeatures(features, q);
    setSearchHits(hits);
  }

  return (
    <form onSubmit={onSearch} className="flex gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search features..."
      />
      <button type="submit">Search</button>
    </form>
  );
}
