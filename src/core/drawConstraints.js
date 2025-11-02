import * as d3 from "d3";

export default function drawConstraints(treeContainer, model, rootNode) {
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
