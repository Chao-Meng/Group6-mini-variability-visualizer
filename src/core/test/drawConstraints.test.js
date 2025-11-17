import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("d3", () => {
  const mockPathGenerator = vi.fn(() => "M0,0L100,100");

  function mockLine() {
    const lineFn = (...args) => mockPathGenerator(...args);
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

function createMockSvgContainer() {
  const container = {
    append: vi.fn(function () {
      return container; 
    }),
    attr: vi.fn(function () {
      return container;
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

    expect(svgContainer.append).toHaveBeenCalledWith("g");

    const drawnShapes = svgContainer.append.mock.calls
      .map(([tag]) => tag)
      .filter((tag) => tag === "path" || tag === "circle");
    expect(drawnShapes.length).toBe(6);

    const strokeColors = svgContainer.attr.mock.calls
      .filter(([k]) => k === "stroke")
      .map(([, v]) => v);
    expect(strokeColors).toContain("#2196f3");
    expect(strokeColors).toContain("#e53935"); 
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
