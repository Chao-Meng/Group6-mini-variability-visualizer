import { describe, test, expect, vi, beforeEach } from "vitest";
import applyHighlights from "../applyHighlights";

/* ---------------- Mock Helpers ---------------- */

function createFakeSelection() {
  const attrs = {};
  const api = {
    attr: vi.fn(function (key, value) {
      if (typeof value === "function") {
        attrs[key] = value;
      } else {
        attrs[key] = () => value;
      }
      return api;
    }),
    _attrs: attrs,
  };
  return api;
}

function makeNode(id) {
  return {
    data: { id },
    ancestors: vi.fn(() => []),
    descendants: vi.fn(() => []),
  };
}

/* ---------------- Tests ---------------- */

describe("applyHighlights", () => {
  let nodeSel;
  let linkSel;
  let rootNode;
  let nodes;
  let links;

  beforeEach(() => {
    nodeSel = createFakeSelection();
    linkSel = createFakeSelection();

    const root = makeNode("root");
    const a = makeNode("a");
    const b = makeNode("b");

    root.descendants = () => [root, a, b];
    a.ancestors = () => [root];
    b.ancestors = () => [root];
    a.descendants = () => [a];
    b.descendants = () => [b];

    nodes = [root, a, b];
    links = [
      { source: root, target: a },
      { source: a, target: b },
    ];

    rootNode = root;
    rootNode.descendants = () => nodes;
  });

  test("skips processing when no highlightedIds", () => {
    applyHighlights(nodeSel, linkSel, [], rootNode);
    expect(nodeSel.attr).not.toHaveBeenCalled();
    expect(linkSel.attr).not.toHaveBeenCalled();
  });

  test("applies correct stroke and width for highlighted and related nodes", () => {
    applyHighlights(nodeSel, linkSel, ["a"], rootNode);

    const strokeFn = nodeSel._attrs["stroke"];
    const widthFn = nodeSel._attrs["stroke-width"];

    expect(typeof strokeFn).toBe("function");
    expect(typeof widthFn).toBe("function");

    const rootColor = strokeFn(nodes[0]);
    const aColor = strokeFn(nodes[1]);
    const bColor = strokeFn(nodes[2]);

    expect(aColor).toBe("#e53935");
    expect(rootColor).toBe("#f48fb1");
    expect(bColor).toBe("#fff");
  });

  test("sets link stroke based on related nodes", () => {
    applyHighlights(nodeSel, linkSel, ["a"], rootNode);
    const linkFn = linkSel._attrs["stroke"];
    expect(typeof linkFn).toBe("function");

    const relatedLink = links[0];
    const unrelatedLink = { source: nodes[2], target: makeNode("x") };

    expect(linkFn(relatedLink)).toBe("#f48fb1");
    expect(linkFn(unrelatedLink)).toBe("#bbb");
  });

  test("returns early if rootNode has no descendants", () => {
    const root = { descendants: () => [] };
    applyHighlights(nodeSel, linkSel, ["a"], root);
    expect(nodeSel.attr).toHaveBeenCalledTimes(2);
  });
});
