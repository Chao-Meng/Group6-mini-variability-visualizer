import * as d3 from "d3";

export default function drawLinks(treeContainer, rootNode) {
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
