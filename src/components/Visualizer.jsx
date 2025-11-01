import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { useApp } from "../state/store";
import { searchFeatures } from "../core/search";

/* --------------------- LEGEND DATA --------------------- */
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
    sub: "Ancestors and descendants of a highlight.",
  },
];

/* --------------------- HOOKS --------------------- */
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

/* --------------------- UTIL FUNCTIONS --------------------- */
function buildHierarchy(model) {
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

/* --------------------- D3 DRAW FUNCTIONS --------------------- */
function drawLinks(treeContainer, rootNode) {
  const linkGroup = treeContainer.append("g");
  return linkGroup
    .selectAll("path")
    .data(rootNode.links())
    .join("path")
    .attr("fill", "none")
    .attr("stroke", "#bbb")
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .linkVertical()
        .x((p) => p.x)
        .y((p) => p.y)
    );
}

function drawNodes(treeContainer, rootNode, model, setSearchHits, setQuery) {
  const colorForNode = (node) =>
    node.data.type === "mandatory"
      ? "#43a047"
      : node.data.type === "optional"
      ? "#1e88e5"
      : "#999";

  const nodeSelection = treeContainer
    .append("g")
    .selectAll("circle")
    .data(rootNode.descendants())
    .join("circle")
    .attr("cx", (node) => node.x)
    .attr("cy", (node) => node.y)
    .attr("r", 25)
    .attr("fill", colorForNode)
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.15))")
    .style("cursor", "pointer")
    .on("dblclick", (event, node) => {
      event.stopPropagation();
      const query = node.data.label || node.data.id;
      setQuery(query);
      const hits = searchFeatures(model.features, query);
      setSearchHits(hits);
    });

  function wrapText(textSelection, widthLimit = 130) {
    textSelection.each(function (node) {
      const textElement = d3.select(this);
      const words = (node.data.label || "").split(/\s+/).reverse();
      let currentLine = [];
      let lineCount = 0;
      const lineHeightEm = 1.1;
      const y = textElement.attr("y");
      const dy = parseFloat(textElement.attr("dy")) || 0;

      let tspan = textElement
        .text(null)
        .append("tspan")
        .attr("x", textElement.attr("x"))
        .attr("y", y)
        .attr("dy", dy + "em");

      let word;
      while ((word = words.pop())) {
        currentLine.push(word);
        tspan.text(currentLine.join(" "));
        if (tspan.node().getComputedTextLength() > widthLimit) {
          currentLine.pop();
          tspan.text(currentLine.join(" "));
          currentLine = [word];
          tspan = textElement
            .append("tspan")
            .attr("x", textElement.attr("x"))
            .attr("y", y)
            .attr("dy", ++lineCount * lineHeightEm + dy + "em")
            .text(word);
        }
      }

      const totalLines = lineCount + 1;
      const verticalOffsetPx = ((totalLines - 1) * lineHeightEm * 6) / 2;
      textElement.attr(
        "transform",
        `translate(0, ${-verticalOffsetPx + (node.children ? -10 : 15)})`
      );
    });
  }

  treeContainer
    .append("g")
    .selectAll("text")
    .data(rootNode.descendants())
    .join("text")
    .attr("x", (node) => node.x)
    .attr("y", (node) => (node.children ? node.y - 35 : node.y + 40))
    .attr("text-anchor", "middle")
    .attr("font-size", 13)
    .attr("fill", "#333")
    .attr("dy", 0)
    .text((node) => node.data.label)
    .call(wrapText, 120);

  return nodeSelection;
}

function drawConstraints(treeContainer, model, rootNode) {
  const nodeById = {};
  rootNode.descendants().forEach((node) => (nodeById[node.data.id] = node));
  const constraintLayer = treeContainer.append("g");

  (model.constraints || []).forEach((constraint) => {
    const sourceNode = nodeById[constraint.a];
    const targetNode = nodeById[constraint.b];
    if (!sourceNode || !targetNode) return;

    const controlMagnitude = Math.max(
      80,
      Math.abs(sourceNode.y - targetNode.y) / 3
    );
    const pathData = d3
      .line()
      .curve(d3.curveBasis)
      .x((p) => p.x)
      .y((p) => p.y)([
      { x: sourceNode.x, y: sourceNode.y },
      {
        x: (sourceNode.x + targetNode.x) / 2,
        y: (sourceNode.y + targetNode.y) / 2 - controlMagnitude,
      },
      { x: targetNode.x, y: targetNode.y },
    ]);

    constraintLayer
      .append("path")
      .attr("d", pathData)
      .attr("fill", "none")
      .attr("stroke", constraint.type === "requires" ? "#2196f3" : "#e53935")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", constraint.type === "requires" ? "4 3" : "6 4")
      .attr("opacity", 0.9);

    [sourceNode, targetNode].forEach((node) => {
      constraintLayer
        .append("circle")
        .attr("cx", node.x)
        .attr("cy", node.y)
        .attr("r", 4)
        .attr("fill", constraint.type === "requires" ? "#2196f3" : "#e53935")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);
    });
  });
}

function applyHighlights(
  nodeSelection,
  linkSelection,
  highlightedIds,
  rootNode
) {
  if (!highlightedIds?.length) return;

  const highlighted = new Set(highlightedIds);
  const relatedNodes = new Set();

  rootNode.descendants().forEach((node) => {
    if (highlighted.has(node.data.id)) {
      relatedNodes.add(node);
      node.ancestors().forEach((ancestor) => relatedNodes.add(ancestor));
      node.descendants().forEach((descendant) => relatedNodes.add(descendant));
    }
  });

  nodeSelection
    .attr("stroke", (node) =>
      highlighted.has(node.data.id)
        ? "#e53935"
        : relatedNodes.has(node)
        ? "#f48fb1"
        : "#fff"
    )
    .attr("stroke-width", (node) =>
      highlighted.has(node.data.id) ? 5 : relatedNodes.has(node) ? 3 : 2
    );

  linkSelection.attr("stroke", (link) => {
    const source = link?.source;
    const target = link?.target;
    if (!source || !target) return "#bbb";
    return relatedNodes.has(source) && relatedNodes.has(target)
      ? "#f48fb1"
      : "#bbb";
  });
}

/* --------------------- LEGEND COMPONENT --------------------- */
function LegendSection({ showLegend }) {
  return (
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

        {/* Feature Legend Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-4 mb-4">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-2 rounded-md">
              <div className="mt-1 flex-shrink-0">
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

        {/* Keyboard Shortcuts */}
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
              { key: "Shift + Scroll", desc: "Zoom in and out of graph view" },
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
  );
}


/* --------------------- MAIN COMPONENT --------------------- */
export default function GraphView({ graph, highlights = [], model }) {
  const svgRef = useRef();
  const zoomRef = useRef(d3.zoomIdentity);
  const containerRef = useRef(null);
  const [showLegend, setShowLegend] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { setSearchHits, setQuery } = useApp();

  const toggleLegend = () => setShowLegend((v) => !v);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // D3 graph state
  const graphStateRef = useRef({
    svgSelection: null,
    treeContainer: null,
    viewWidth: 0,
    viewHeight: 0,
    zoomBehavior: null,
    initialTransform: null,
  });

  useKeyboardShortcuts(toggleLegend, toggleFullscreen, isFullscreen);

  useEffect(() => {
    if (!model?.features?.length) return;

    const svgSelection = d3.select(svgRef.current);
    svgSelection.selectAll("*").remove();
    zoomRef.current = d3.zoomIdentity;

    const svg = svgSelection
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background", "linear-gradient(180deg,#fafafa 0%,#eef1f4 100%)");

    const rootNode = buildHierarchy(model);
    if (!rootNode) return;

    // Layout
    const treeLayout = d3.tree().nodeSize([140, 200]);
    treeLayout(rootNode);

    const xExtent = d3.extent(rootNode.descendants(), (node) => node.x);
    const yExtent = d3.extent(rootNode.descendants(), (node) => node.y);
    const margin = { top: 100, right: 200, bottom: 200, left: 200 };
    const viewWidth = xExtent[1] - xExtent[0] + margin.left + margin.right;
    const viewHeight = yExtent[1] - yExtent[0] + margin.top + margin.bottom;
    svg.attr("viewBox", [0, 0, viewWidth, viewHeight]);

    const treeContainer = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw
    const linkSelection = drawLinks(treeContainer, rootNode);
    const nodeSelection = drawNodes(
      treeContainer,
      rootNode,
      model,
      setSearchHits,
      setQuery
    );
    drawConstraints(treeContainer, model, rootNode);
    applyHighlights(nodeSelection, linkSelection, highlights, rootNode);

    // Zoom behavior with Shift-only wheel zoom
    const zoomBehavior = d3
      .zoom()
      .filter((event) => {
        // Allow drag/pan with mouse, allow double-click, allow touch.
        // For wheel events, only allow when Shift is pressed.
        if (event.type === "wheel") return event.shiftKey === true;
        return (
          !event.ctrlKey ||
          event.type === "dblclick" ||
          event.type === "touchstart"
        );
      })
      .on("zoom", (event) => {
        treeContainer.attr("transform", event.transform);
        zoomRef.current = event.transform;
      });

    svg.call(zoomBehavior);

    // Initial fit-to-view transform
    const boundingBox = treeContainer.node().getBBox();
    const fitScale =
      Math.min(viewWidth / boundingBox.width, viewHeight / boundingBox.height) *
      0.8;
    const fitTx =
      (viewWidth - boundingBox.width * fitScale) / 2 - boundingBox.x * fitScale;
    const fitTy =
      (viewHeight - boundingBox.height * fitScale) / 2 -
      boundingBox.y * fitScale;
    const initialTransform = d3.zoomIdentity
      .translate(fitTx, fitTy)
      .scale(fitScale);

    svg
      .transition()
      .duration(600)
      .call(zoomBehavior.transform, initialTransform);
    zoomRef.current = initialTransform;

    // Persist graph state
    graphStateRef.current = {
      svgSelection: svg,
      treeContainer,
      viewWidth,
      viewHeight,
      zoomBehavior,
      initialTransform,
    };
  }, [model, graph, highlights, setSearchHits, setQuery]);

  // --- Align Center (pan only, keep current zoom level) ---
  const handleAlignCenter = () => {
    const { svgSelection, treeContainer, viewWidth, viewHeight, zoomBehavior } =
      graphStateRef.current;
    if (!svgSelection || !treeContainer || !zoomBehavior) return;

    const currentTransform = zoomRef.current || d3.zoomIdentity;
    const currentScale = currentTransform.k;

    const bbox = treeContainer.node().getBBox();

    const translateX =
      (viewWidth - bbox.width * currentScale) / 2 - bbox.x * currentScale;
    const translateY =
      (viewHeight - bbox.height * currentScale) / 2 - bbox.y * currentScale;

    const centeredTransform = d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(currentScale);
    svgSelection
      .transition()
      .duration(500)
      .call(zoomBehavior.transform, centeredTransform);
    zoomRef.current = centeredTransform;
  };

  // --- Reset Zoom (restore default zoom scale around current viewport center) ---
  const handleResetZoom = () => {
    const { svgSelection, zoomBehavior, initialTransform } =
      graphStateRef.current;
    if (!svgSelection || !zoomBehavior || !initialTransform) return;

    const currentTransform = zoomRef.current || d3.zoomIdentity;
    const defaultScale = initialTransform.k;

    // Determine viewport center in screen coordinates
    const svgElement = svgSelection.node();
    const viewportRect = svgElement.getBoundingClientRect();
    const centerX = viewportRect.width / 2;
    const centerY = viewportRect.height / 2;

    // Convert screen center to graph coordinates under current transform
    const graphCenterX = (centerX - currentTransform.x) / currentTransform.k;
    const graphCenterY = (centerY - currentTransform.y) / currentTransform.k;

    // Compute new translation that keeps the same visual center
    const newTranslateX = centerX - graphCenterX * defaultScale;
    const newTranslateY = centerY - graphCenterY * defaultScale;

    const newTransform = d3.zoomIdentity
      .translate(newTranslateX, newTranslateY)
      .scale(defaultScale);

    svgSelection
      .transition()
      .duration(500)
      .call(zoomBehavior.transform, newTransform);
    zoomRef.current = newTransform;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col items-center justify-start min-h-[100vh] p-2 sm:p-4 ${
        isFullscreen ? "bg-black/90" : ""
      }`}
    >
      {/* Graph Section */}
      <div
        className={`relative w-full flex-1 rounded-lg shadow-sm overflow-hidden border border-gray-200 transition-all duration-300 bg-gradient-to-b from-gray-50 to-gray-100 ${
          isFullscreen ? "max-w-none h-full" : "min-h-[75vh] sm:min-h-[80vh]"
        }`}
      >
        <div className="absolute inset-0 overflow-auto">
          <svg
            ref={svgRef}
            className="w-full h-full block"
            preserveAspectRatio="xMidYMid meet"
          ></svg>
        </div>

        {/* Floating Graph Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleAlignCenter}
            className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-md shadow hover:bg-slate-800 transition"
            title="Align graph to center"
          >
            Align Center
          </button>
          <button
            onClick={handleResetZoom}
            className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-md shadow hover:bg-slate-800 transition"
            title="Reset zoom"
          >
            Reset Zoom
          </button>
        </div>
      </div>

      {/* Control + Legend Section */}
      <div className="w-full mt-4 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-sm flex flex-col items-center transition-all duration-300">
        {/* Buttons */}
        <div className="w-full flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-t-lg">
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

        {/* Legend (now collapses smoothly, stays in-flow) */}
        <LegendSection showLegend={showLegend} />
      </div>
    </div>
  );
}
