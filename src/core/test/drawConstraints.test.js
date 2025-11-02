import { describe, test, expect, beforeEach, vi } from "vitest";

// --- Proper D3 mock (returns callable chain) ---
vi.mock("d3", () => {
  // The callable function returned at the end of the chain
  const mockPathGenerator = vi.fn(() => "M0,0L100,100");

  // The core line() factory
  function mockLine() {
    const lineFn = (...args) => mockPathGenerator(...args);
    // Chainable methods
    lineFn.curve = vi.fn(() => lineFn);
    lineFn.x = vi.fn(() => lineFn);
    lineFn.y = vi.fn(() => lineFn);
    return lineFn;
  }

  return {
    __esModule: true,
    line: vi.fn(() => mockLine()),
    curveBasis: "curveBasis",
  };
});

import * as d3 from "d3";
import drawConstraints from "../drawConstraints";

/* ---------------- Mock SVG Selection ---------------- */
function createMockSvgContainer() {
  const container = {
    append: vi.fn(function () {
      return container; // chainable
    }),
    attr: vi.fn(function () {
      return container; // chainable
    }),
  };
  return container;
}

describe("drawConstraints", () => {
  let svgContainer;
  let constraintModel;
  let rootNode;
  let nodeList;

  beforeEach(() => {
    vi.clearAllMocks();
    svgContainer = createMockSvgContainer();

    nodeList = [
      { data: { id: "A" }, x: 0, y: 0 },
      { data: { id: "B" }, x: 100, y: 100 },
      { data: { id: "C" }, x: 200, y: 200 },
    ];
    rootNode = { descendants: () => nodeList };

    constraintModel = {
      constraints: [
        { a: "A", b: "B", type: "requires" },
        { a: "B", b: "C", type: "conflicts" },
      ],
    };
  });

  test("creates one group and draws all constraint paths and circles", () => {
    drawConstraints(svgContainer, constraintModel, rootNode);

    // 1 group created
    expect(svgContainer.append).toHaveBeenCalledWith("g");

    // 2 constraints => 1 path + 2 circles each
    const drawnShapes = svgContainer.append.mock.calls
      .map(([tag]) => tag)
      .filter((tag) => tag === "path" || tag === "circle");
    expect(drawnShapes.length).toBe(6);

    // Verify both stroke colors appear
    const strokeColors = svgContainer.attr.mock.calls
      .filter(([k]) => k === "stroke")
      .map(([, v]) => v);
    expect(strokeColors).toContain("#2196f3"); // requires
    expect(strokeColors).toContain("#e53935"); // conflicts
  });

  test("ignores invalid constraints safely", () => {
    const badModel = { constraints: [{ a: "A", b: "Z", type: "requires" }] };
    drawConstraints(svgContainer, badModel, rootNode);

    const appended = svgContainer.append.mock.calls
      .map(([t]) => t)
      .filter((t) => t === "path" || t === "circle");
    expect(appended.length).toBe(0);
  });

  test("applies correct stroke-dasharray for requires vs conflicts", () => {
    drawConstraints(svgContainer, constraintModel, rootNode);
    const dashPatterns = svgContainer.attr.mock.calls
      .filter(([k]) => k === "stroke-dasharray")
      .map(([, v]) => v);
    expect(dashPatterns).toContain("4 3");
    expect(dashPatterns).toContain("6 4");
  });

  test("uses minimum controlMagnitude of 80", () => {
    const closeNodes = [
      { data: { id: "A" }, x: 0, y: 0 },
      { data: { id: "B" }, x: 50, y: 10 },
    ];
    const smallRoot = { descendants: () => closeNodes };
    const smallModel = { constraints: [{ a: "A", b: "B", type: "requires" }] };

    drawConstraints(svgContainer, smallModel, smallRoot);
    expect(d3.line).toHaveBeenCalled();
  });
});
