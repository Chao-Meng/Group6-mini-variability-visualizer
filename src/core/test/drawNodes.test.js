import { describe, test, expect, beforeEach, vi } from "vitest";

// ---- Robust d3 mock ----
vi.mock("d3", () => {
  const mockSelection = {
    append: vi.fn(function () {
      return mockSelection;
    }),
    selectAll: vi.fn(function () {
      return mockSelection;
    }),
    data: vi.fn(function () {
      return mockSelection;
    }),
    join: vi.fn(function () {
      return mockSelection;
    }),
    attr: vi.fn(function () {
      return mockSelection;
    }),
    style: vi.fn(function () {
      return mockSelection;
    }),
    on: vi.fn(function () {
      return mockSelection;
    }),
    text: vi.fn(function () {
      return mockSelection;
    }),
    each: vi.fn(function () {
      return mockSelection;
    }),
    node: vi.fn(() => ({
      getComputedTextLength: vi.fn(() => 50),
    })),
    call: vi.fn(function (fn, ...args) {
      // Pass itself as the textSelection argument to wrapText
      if (typeof fn === "function") fn(mockSelection, ...args);
      return mockSelection;
    }),
  };

  const select = vi.fn(() => mockSelection);
  return { __esModule: true, select, selectAll: select, ...mockSelection };
});

// --- Mock searchFeatures ---
vi.mock("../search", () => ({
  searchFeatures: vi.fn(() => ["matched-feature"]),
}));

import { searchFeatures } from "../search";
import drawNodes from "../drawNodes";

// ---- helper to make container ----
function createMockContainer() {
  const sel = {
    append: vi.fn(function () {
      return sel;
    }),
    selectAll: vi.fn(function () {
      return sel;
    }),
    data: vi.fn(function () {
      return sel;
    }),
    join: vi.fn(function () {
      return sel;
    }),
    attr: vi.fn(function () {
      return sel;
    }),
    style: vi.fn(function () {
      return sel;
    }),
    on: vi.fn(function () {
      return sel;
    }),
    text: vi.fn(function () {
      return sel;
    }),
    each: vi.fn(function () {
      return sel;
    }),
    call: vi.fn(function (fn, ...args) {
      if (typeof fn === "function") fn(sel, ...args);
      return sel;
    }),
  };
  return sel;
}

describe("drawNodes", () => {
  let mockContainer;
  let rootNode;
  let model;
  let setSearchHits;
  let setQuery;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContainer = createMockContainer();
    setSearchHits = vi.fn();
    setQuery = vi.fn();
    rootNode = {
      descendants: vi.fn(() => [
        { data: { id: "A", label: "Alpha", type: "mandatory" }, x: 10, y: 20 },
        { data: { id: "B", label: "Beta", type: "optional" }, x: 30, y: 40 },
        { data: { id: "C", label: "Gamma", type: "other" }, x: 50, y: 60 },
      ]),
    };
    model = { features: [{ id: "A" }, { id: "B" }] };
  });

  test("renders circle nodes with correct color logic", () => {
    drawNodes(mockContainer, rootNode, model, setSearchHits, setQuery);
    expect(mockContainer.append).toHaveBeenCalledWith("g");
    expect(mockContainer.selectAll).toHaveBeenCalledWith("circle");

    const fillFn = mockContainer.attr.mock.calls.find(([k]) => k === "fill")[1];
    expect(fillFn({ data: { type: "mandatory" } })).toBe("#43a047");
    expect(fillFn({ data: { type: "optional" } })).toBe("#1e88e5");
    expect(fillFn({ data: { type: "other" } })).toBe("#999");
  });

  test("handles dblclick correctly", () => {
    drawNodes(mockContainer, rootNode, model, setSearchHits, setQuery);

    const dbl = mockContainer.on.mock.calls.find(([e]) => e === "dblclick");
    const handler = dbl[1];
    const evt = { stopPropagation: vi.fn() };
    const node = { data: { id: "A", label: "Alpha" } };

    handler(evt, node);
    expect(evt.stopPropagation).toHaveBeenCalled();
    expect(setQuery).toHaveBeenCalledWith("Alpha");
    expect(searchFeatures).toHaveBeenCalledWith(model.features, "Alpha");
    expect(setSearchHits).toHaveBeenCalledWith(["matched-feature"]);
  });

  test("renders text labels", () => {
    drawNodes(mockContainer, rootNode, model, setSearchHits, setQuery);
    expect(mockContainer.selectAll).toHaveBeenCalledWith("text");
    expect(mockContainer.text).toHaveBeenCalled();
  });

  test("calls wrapText safely via call()", () => {
    drawNodes(mockContainer, rootNode, model, setSearchHits, setQuery);
    expect(mockContainer.call).toHaveBeenCalled();
  });

  test("returns a chainable selection", () => {
    const result = drawNodes(
      mockContainer,
      rootNode,
      model,
      setSearchHits,
      setQuery
    );
    expect(result).toBeDefined();
    expect(typeof result.attr).toBe("function");
  });
});
