import { describe, test, expect, beforeEach, vi } from "vitest";

vi.mock("d3", () => {
  const mockPathGenerator = vi.fn(() => "M0,0L100,100");

  const linkVertical = vi.fn(() => {
    const generator = (...args) => mockPathGenerator(...args);
    generator.x = vi.fn(() => generator);
    generator.y = vi.fn(() => generator);
    return generator;
  });

  return {
    __esModule: true,
    linkVertical,
  };
});

import * as d3 from "d3";
import drawLinks from "../drawLinks";

function createMockSvgContainer() {
  const selection = {
    append: vi.fn(function () {
      return selection;
    }),
    selectAll: vi.fn(function () {
      return selection;
    }),
    data: vi.fn(function () {
      return selection; 
    }),
    join: vi.fn(function () {
      return selection; 
    }),
    attr: vi.fn(function () {
      return selection; 
    }),
  };
  return selection;
}

describe("drawLinks", () => {
  let svgContainer;
  let mockRootNode;
  let mockLinks;

  beforeEach(() => {
    vi.clearAllMocks();
    svgContainer = createMockSvgContainer();

    mockLinks = [
      { source: { x: 0, y: 0 }, target: { x: 100, y: 100 } },
      { source: { x: 50, y: 50 }, target: { x: 150, y: 150 } },
    ];

    mockRootNode = {
      links: vi.fn(() => mockLinks),
    };
  });

  test("creates a <g> group and calls D3 linkVertical", () => {
    drawLinks(svgContainer, mockRootNode);

    expect(svgContainer.append).toHaveBeenCalledWith("g");
    expect(d3.linkVertical).toHaveBeenCalledTimes(1);
  });

  test("binds link data from rootNode.links()", () => {
    drawLinks(svgContainer, mockRootNode);

    expect(mockRootNode.links).toHaveBeenCalledTimes(1);
    expect(svgContainer.data).toHaveBeenCalledWith(mockLinks);
  });

  test("applies expected static attributes", () => {
    drawLinks(svgContainer, mockRootNode);

    const attrCalls = svgContainer.attr.mock.calls.map(([key, val]) => [
      key,
      val,
    ]);

    const keys = attrCalls.map(([k]) => k);
    expect(keys).toContain("fill");
    expect(keys).toContain("stroke");
    expect(keys).toContain("stroke-width");
    expect(keys).toContain("d");

    const fill = attrCalls.find(([k]) => k === "fill")[1];
    const stroke = attrCalls.find(([k]) => k === "stroke")[1];
    const width = attrCalls.find(([k]) => k === "stroke-width")[1];

    expect(fill).toBe("none");
    expect(stroke).toBe("#bbb");
    expect(width).toBe(2);
  });

  test("returns a valid selection object (chainable)", () => {
    const result = drawLinks(svgContainer, mockRootNode);
    expect(result).toBe(svgContainer);
    expect(typeof result.attr).toBe("function");
  });

  test("generates correct path data using d3.linkVertical", () => {
    drawLinks(svgContainer, mockRootNode);

    expect(d3.linkVertical).toHaveBeenCalled();
    expect(svgContainer.attr).toHaveBeenCalledWith("d", expect.any(Function));
  });
});
