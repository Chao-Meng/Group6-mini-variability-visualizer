import * as d3 from "d3";
import { searchFeatures } from "./search";
export default function drawNodes(
  treeContainer,
  rootNode,
  model,
  setSearchHits,
  setQuery
) {
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
