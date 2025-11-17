import { useState, useEffect } from "react";
import { useApp } from "../state/store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { searchFeatures } from "../core/search";
import buildFeatureHierarchy from "../core/buildFeatureHierarchy";

export default function FeatureListPanel() {
  const { model, searchHits, setSearchHits, setQuery } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect mobile vs desktop view
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize(); // initialize immediately
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcut: Shift + M toggles panel visibility
  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.shiftKey && event.key.toLowerCase() === "m") {
        setIsOpen((prevOpen) => !prevOpen);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  if (!model) return null;

  // Handles clicking a feature item
  const handleFeatureClick = (feature) => {
    const featureQuery = feature.label || feature.id;
    setQuery(featureQuery);
    const matchedFeatures = searchFeatures(model.features, featureQuery);
    setSearchHits(matchedFeatures);
    if (isMobileView) setIsOpen(false);
  };

  const rootFeatures = buildFeatureHierarchy(model.features);

  // Recursively render feature hierarchy
  const renderFeatureTree = (featureNodes, depth = 0) =>
    featureNodes.map((feature) => {
      const isHighlighted = searchHits?.includes(feature.id);
      return (
        <div key={feature.id}>
          <div
            onClick={() => handleFeatureClick(feature)}
            style={{ marginLeft: depth * 14 }}
            className={`px-3 py-2 rounded-md cursor-pointer border border-transparent select-none transition-all duration-150 ${
              isHighlighted
                ? "bg-blue-500/10 border-blue-400/40"
                : "hover:bg-gray-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  feature.type === "mandatory"
                    ? "bg-green-500"
                    : feature.type === "optional"
                    ? "bg-blue-400"
                    : "bg-gray-400"
                }`}
              ></span>
              <span
                className={`truncate text-base font-medium ${
                  isHighlighted ? "text-blue-300" : "text-gray-100"
                }`}
              >
                {feature.label}
              </span>
            </div>

            <div className="mt-1 ml-5 flex flex-col text-sm font-mono text-gray-400 leading-tight">
              <span>({feature.id})</span>
              {feature.parent && <span>↳ {feature.parent}</span>}
            </div>
          </div>

          {feature.children?.length > 0 &&
            renderFeatureTree(feature.children, depth + 1)}
        </div>
      );
    });

  return (
    <>
      {/* Sidebar / Bottom Sheet */}
      <div
        className={`fixed z-40 flex flex-col backdrop-blur-md transition-all duration-500 ease-in-out
        ${
          isMobileView
            ? "bottom-0 left-0 w-full max-h-[65%] rounded-t-2xl"
            : "top-0 left-0 h-full w-[320px]"
        } 
        bg-gray-900 border-r border-gray-700/40 shadow-2xl text-gray-100
        ${
          isOpen
            ? "translate-x-0 opacity-100"
            : isMobileView
            ? "translate-y-full opacity-0"
            : "-translate-x-full opacity-0"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
          <h2 className="font-semibold tracking-wide text-gray-200">
            Features
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-800 transition"
            title="Hide feature list"
          >
            {isMobileView ? (
              <ChevronRight className="rotate-90 text-gray-300" size={18} />
            ) : (
              <ChevronLeft size={18} className="text-gray-300" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 pr-2 custom-scroll">
          {renderFeatureTree(rootFeatures)}
        </div>

        {searchHits?.length > 0 && (
          <div className="px-4 py-2 text-sm text-blue-300/70 font-mono border-t border-gray-700/40 bg-gray-800/60">
            {searchHits.length} feature
            {searchHits.length > 1 ? "s" : ""} matched your search.
          </div>
        )}
      </div>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed z-50 ${
            isMobileView
              ? "bottom-5 left-1/2 -translate-x-1/2 px-4 py-2"
              : "top-1/2 -translate-y-1/2 left-3 p-2"
          } bg-gray-900/70 backdrop-blur-md border border-gray-700/50 rounded-full shadow-lg text-gray-100 hover:bg-gray-800/80 flex items-center justify-center gap-2 transition`}
          title="Open feature list (Shift + M)"
        >
          <ChevronRight size={18} />
          {isMobileView && <span className="font-medium">Features</span>}
        </button>
      )}
    </>
  );
}
