const legendItems = [
  {
    shape: "circle",
    color: "#43a047",
    label: "Mandatory Feature",
    sub: "Always included in every configuration.",
  },
  {
    shape: "circle",
    color: "#1e88e5",
    label: "Optional Feature",
    sub: "May or may not be selected.",
  },
  {
    shape: "line",
    color: "#bbb",
    label: "Tree Link",
    sub: "Parent to child relationship in the feature tree.",
  },
  {
    shape: "line",
    color: "#2196f3",
    dash: "4 3",
    label: "Requires Constraint",
    sub: "If A is selected, B must also be selected.",
  },
  {
    shape: "line",
    color: "#e53935",
    dash: "6 4",
    label: "Excludes Constraint",
    sub: "A and B cannot coexist.",
  },
  {
    shape: "circle",
    color: "#2196f3",
    stroke: "#2196f3",
    label: "Constraint Endpoint (requires)",
    sub: "Markers at endpoints of a requires curve.",
  },
  {
    shape: "circle",
    color: "#e53935",
    stroke: "#e53935",
    label: "Constraint Endpoint (excludes)",
    sub: "Markers at endpoints of an excludes curve.",
  },
  {
    shape: "circle",
    color: "#e53935",
    stroke: "#e53935",
    label: "Highlighted Feature",
    sub: "Exact match from search or direct selection.",
  },
  {
    shape: "circle",
    color: "#f48fb1",
    stroke: "#f48fb1",
    label: "Related Branch",
    sub: "Related nodes (ancestors / children). Ancestors and descendants of a highlight.",
  },
];
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";

function useKeyboardShortcuts(toggleLegend, toggleFullscreen, isFullscreen) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLegend();
      }
      if (e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        document.exitFullscreen();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullscreen, toggleLegend, toggleFullscreen]);
}

export default function LegendSection({ isFullscreen, toggleFullscreen }) {
  const [showLegend, setShowLegend] = useState(true);
  const toggleLegend = () => setShowLegend((v) => !v);
  useKeyboardShortcuts(toggleLegend, toggleFullscreen, isFullscreen);

  return (
    <div className="w-full mt-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-sm flex flex-col items-center transition-all duration-300">
      <div className="w-full flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white rounded-t-lg">
        <h3 className="text-gray-800 font-semibold text-sm tracking-wide">
          Visualizer Controls
        </h3>
        <div className="flex gap-2">
          <button
            onClick={toggleLegend}
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-full border transition-all cursor-pointer hover:bg-slate-800 bg-slate-900 text-white"
          >
            {showLegend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showLegend ? "Hide Legend" : "Show Legend"}
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-full border transition-all cursor-pointer hover:bg-slate-800 bg-slate-900 text-white"
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={15} /> Exit
              </>
            ) : (
              <>
                <Maximize2 size={15} /> Fullscreen
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={[
          "transition-all duration-300 overflow-hidden",
          showLegend ? "opacity-100 max-h-[1200px]" : "opacity-0 max-h-0",
        ].join(" ")}
        style={{ width: "100%" }}
        aria-hidden={!showLegend}
      >
        <div className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm px-8 py-5 text-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-gray-800 font-semibold text-sm tracking-wide">
              Visualizer Legend
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-4 mb-4">
            {legendItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-2 rounded-md"
              >
                <div className="mt-1 shrink-0">
                  {item.shape === "circle" ? (
                    <span
                      className="inline-block rounded-full shadow-sm"
                      style={{
                        background: item.color,
                        width: 16,
                        height: 16,
                        border: "1px solid rgba(0,0,0,0.15)",
                      }}
                    />
                  ) : (
                    <span
                      className="inline-block"
                      style={{
                        borderTop: `2px ${item.dash ? "dashed" : "solid"} ${
                          item.color
                        }`,
                        width: 22,
                        display: "block",
                      }}
                    />
                  )}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-gray-800 font-medium text-[13.5px]">
                    {item.label}
                  </span>
                  <span className="text-gray-600 text-[12px] mt-0.5">
                    {item.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-gray-800 font-semibold text-sm mb-3">
              Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-[13px] text-gray-700">
              {[
                { key: "Shift + S", desc: "Focus search bar" },
                { key: "Shift + L", desc: "Toggle legend visibility" },
                { key: "Shift + F", desc: "Toggle fullscreen mode" },
                { key: "Shift + M", desc: "Open feature list panel" },
                {
                  key: "Shift + Scroll",
                  desc: "Zoom in and out of graph view",
                },
              ].map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200"
                >
                  <kbd className="bg-gray-800 text-white px-2 py-0.5 rounded text-xs font-mono tracking-wide">
                    {shortcut.key}
                  </kbd>
                  <span className="text-gray-700">{shortcut.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
