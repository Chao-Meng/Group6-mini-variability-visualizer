import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../state/store";
import LegendSection from "./LegendSelection";
import buildGraphHierarchy from "../core/buildGraphHierarchy";
import drawLinks from "../core/drawLinks";
import drawNodes from "../core/drawNodes";
import drawConstraints from "../core/drawConstraints";
import applyHighlights from "../core/applyHighlights";

export default function GraphView({ graph, highlights = [], model }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef();
  const zoomRef = useRef(d3.zoomIdentity);
  const containerRef = useRef(null);

  const { setSearchHits, setQuery } = useApp();

  // D3 graph state
  const graphStateRef = useRef({
    svgSelection: null,
    treeContainer: null,
    viewWidth: 0,
    viewHeight: 0,
    zoomBehavior: null,
    initialTransform: null,
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (!model?.features?.length) return;

    const svgSelection = d3.select(svgRef.current);
    svgSelection.selectAll("*").remove();
    zoomRef.current = d3.zoomIdentity;

    const svg = svgSelection
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background", "linear-gradient(180deg,#fafafa 0%,#eef1f4 100%)");

    const rootNode = buildGraphHierarchy(model);
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

  // Align Center (pan only, and maintain keep current zoom level)
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

  // Reset Zoom (restore default zoom scale around current viewport center)
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
      className={`relative w-full flex flex-col items-center justify-start min-h-screen p-2 sm:p-4 ${
        isFullscreen ? "bg-black/90" : ""
      }`}
    >
      <div
        className={`relative w-full flex-1 rounded-lg shadow-sm overflow-hidden border border-gray-200 transition-all duration-300 bg-linear-to-b from-gray-50 to-gray-100 ${
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

      <LegendSection
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
