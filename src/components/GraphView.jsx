import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";

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
    color: "#e53935",
    stroke: "#e53935",
    label: "Highlighted Feature",
    sub: "Feature selected or matched via search.",
  },
  {
    shape: "circle",
    color: "#f48fb1",
    stroke: "#f48fb1",
    label: "Related Branch",
    sub: "Connected ancestor or descendant.",
  },
];

/* --------------------- HOOKS --------------------- */
function useKeyboardShortcuts(toggleLegend, toggleFullscreen, isFullscreen) {
  useEffect(() => {
    const handleKey = (e) => {
      // Shift + L → toggle legend
      if (e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLegend();
      }

      // Shift + F → toggle fullscreen
      if (e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      }

      // Escape → exit fullscreen
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
  const featureMap = {};
  model.features.forEach((f) => (featureMap[f.id] = { ...f, children: [] }));
  model.features.forEach((f) => {
    if (f.parent && featureMap[f.parent]) {
      featureMap[f.parent].children.push(featureMap[f.id]);
    }
  });
  const rootFeature = model.features.find((f) => !f.parent);
  return rootFeature ? d3.hierarchy(featureMap[rootFeature.id]) : null;
}

/* --------------------- D3 DRAW FUNCTIONS --------------------- */
function drawLinks(g, root) {
  const linkGroup = g.append("g");
  const links = linkGroup
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("fill", "none")
    .attr("stroke", "#bbb")
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .linkVertical()
        .x((d) => d.x)
        .y((d) => d.y)
    );
  return links;
}

function drawNodes(g, root) {
  const color = (d) =>
    d.data.type === "mandatory"
      ? "#43a047"
      : d.data.type === "optional"
      ? "#1e88e5"
      : "#999";

  const nodes = g
    .append("g")
    .selectAll("circle")
    .data(root.descendants())
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 25)
    .attr("fill", color)
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.15))")
    .style("cursor", "pointer");

  g.append("g")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .attr("x", (d) => d.x)
    .attr("y", (d) => (d.children ? d.y - 35 : d.y + 40))
    .attr("text-anchor", "middle")
    .attr("font-size", 13)
    .attr("fill", "#333")
    .text((d) => d.data.label);

  return nodes;
}

function drawConstraints(g, model, root) {
  const allNodes = {};
  root.descendants().forEach((n) => (allNodes[n.data.id] = n));
  const constraintGroup = g.append("g");

  (model.constraints || []).forEach((c) => {
    const a = allNodes[c.a];
    const b = allNodes[c.b];
    if (!a || !b) return;

    const curveAmt = Math.max(80, Math.abs(a.y - b.y) / 3);
    const line = d3
      .line()
      .curve(d3.curveBasis)
      .x((d) => d.x)
      .y((d) => d.y);
    const pathData = line([
      { x: a.x, y: a.y },
      { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - curveAmt },
      { x: b.x, y: b.y },
    ]);

    constraintGroup
      .append("path")
      .attr("d", pathData)
      .attr("fill", "none")
      .attr("stroke", c.type === "requires" ? "#2196f3" : "#e53935")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", c.type === "requires" ? "4 3" : "6 4")
      .attr("opacity", 0.9);

    [a, b].forEach((n) => {
      constraintGroup
        .append("circle")
        .attr("cx", n.x)
        .attr("cy", n.y)
        .attr("r", 4)
        .attr("fill", c.type === "requires" ? "#2196f3" : "#e53935")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);
    });
  });
}

function applyHighlights(nodes, links, highlights, root) {
  if (!highlights?.length) return;

  const highlightSet = new Set(highlights);
  const related = new Set();

  root.descendants().forEach((n) => {
    if (highlightSet.has(n.data.id)) {
      related.add(n);
      n.ancestors().forEach((a) => related.add(a));
      n.descendants().forEach((a) => related.add(a));
    }
  });

  nodes
    .attr("stroke", (d) =>
      highlightSet.has(d.data.id)
        ? "#e53935"
        : related.has(d)
        ? "#f48fb1"
        : "#fff"
    )
    .attr("stroke-width", (d) =>
      highlightSet.has(d.data.id) ? 5 : related.has(d) ? 3 : 2
    );

  links.attr("stroke", (d) => {
    const s = d?.source;
    const t = d?.target;
    if (!s || !t) return "#bbb";
    return related.has(s) && related.has(t) ? "#f48fb1" : "#bbb";
  });
}

function applyZoom(svg, g, viewWidth, viewHeight, zoomRef) {
  const zoom = d3.zoom().on("zoom", (e) => {
    g.attr("transform", e.transform);
    zoomRef.current = e.transform;
  });
  svg.call(zoom);

  const bbox = g.node().getBBox();
  const scale =
    Math.min(viewWidth / bbox.width, viewHeight / bbox.height) * 0.8;
  const translateX = (viewWidth - bbox.width * scale) / 2 - bbox.x * scale;
  const translateY = (viewHeight - bbox.height * scale) / 2 - bbox.y * scale;
  const initialTransform = d3.zoomIdentity
    .translate(translateX, translateY)
    .scale(scale);

  svg.transition().duration(500).call(zoom.transform, initialTransform);
  zoomRef.current = initialTransform;
}

/* --------------------- LEGEND COMPONENT --------------------- */
function LegendSection({ showLegend }) {
  return (
    <div
      className={`transition-all duration-500 overflow-hidden ${
        showLegend ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="w-full bg-white border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 px-6 py-4 text-sm">
        {legendItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-1">
              {item.shape === "circle" ? (
                <span
                  className="inline-block rounded-full"
                  style={{
                    background: item.color,
                    width: 14,
                    height: 14,
                    border: "1px solid #ccc",
                  }}
                ></span>
              ) : (
                <span
                  className="inline-block"
                  style={{
                    borderTop: `2px ${item.dash ? "dashed" : "solid"} ${
                      item.color
                    }`,
                    width: 18,
                    display: "block",
                  }}
                ></span>
              )}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-gray-800 font-medium">{item.label}</span>
              <span className="text-gray-600 text-xs">{item.sub}</span>
            </div>
          </div>
        ))}
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

  useKeyboardShortcuts(toggleLegend, toggleFullscreen, isFullscreen);

  useEffect(() => {
    if (!model?.features?.length) return;

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();

    // Always reset zoom when model changes
    zoomRef.current = d3.zoomIdentity;

    const svg = svgEl
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background", "linear-gradient(180deg,#fafafa 0%,#eef1f4 100%)");

    const root = buildHierarchy(model);
    if (!root) return;

    const treeLayout = d3.tree().nodeSize([140, 200]);
    treeLayout(root);

    const xExtent = d3.extent(root.descendants(), (d) => d.x);
    const yExtent = d3.extent(root.descendants(), (d) => d.y);
    const margin = { top: 100, right: 200, bottom: 200, left: 200 };
    const viewWidth = xExtent[1] - xExtent[0] + margin.left + margin.right;
    const viewHeight = yExtent[1] - yExtent[0] + margin.top + margin.bottom;
    svg.attr("viewBox", [0, 0, viewWidth, viewHeight]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const links = drawLinks(g, root);
    const nodes = drawNodes(g, root);
    drawConstraints(g, model, root);
    applyHighlights(nodes, links, highlights, root);
    applyZoom(svg, g, viewWidth, viewHeight, zoomRef);
  }, [model, graph, highlights]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col items-center justify-center p-4 ${
        isFullscreen ? "bg-black/90" : ""
      }`}
    >
      <div
        className={`w-full rounded-lg shadow-sm bg-white/95 backdrop-blur-md overflow-hidden border border-gray-200 flex flex-col transition-all duration-300 ${
          isFullscreen ? "max-w-none h-[95vh]" : ""
        }`}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-gray-800 font-semibold text-sm tracking-wide">
            Feature Legend
          </h3>
          <div className="flex gap-2">
            <button
              onClick={toggleLegend}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-all"
            >
              {showLegend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showLegend ? "Hide" : "Show"}
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-all"
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

        {/* Legend */}
        <LegendSection showLegend={showLegend} />

        {/* Graph */}
        <div className="w-full flex-1 flex justify-center items-center overflow-auto bg-gradient-to-b from-gray-50 to-gray-100">
          <svg ref={svgRef}></svg>
        </div>
      </div>
    </div>
  );
}
