export default function applyHighlights(
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
