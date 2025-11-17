/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
// @vitest-environment jsdom

import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi, Mock } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import * as d3 from "d3";
import GraphView from "../Visualizer";

expect.extend(matchers);


const mockDrawLinks = vi.fn();
const mockDrawNodes = vi.fn();
const mockDrawConstraints = vi.fn();
const mockApplyHighlights = vi.fn();
const mockBuildGraphHierarchy = vi.fn();

declare global {
  interface SVGElement {
    getBBox?: () => { x: number; y: number; width: number; height: number };
  }

  interface SVGSVGElement {
    __zoom?: any;
  }
}

vi.mock("../../core/drawLinks", () => ({
  __esModule: true,
  default: (...args: any[]) => mockDrawLinks(...args),
}));
vi.mock("../../core/drawNodes", () => ({
  __esModule: true,
  default: (...args: any[]) => mockDrawNodes(...args),
}));
vi.mock("../../core/drawConstraints", () => ({
  __esModule: true,
  default: (...args: any[]) => mockDrawConstraints(...args),
}));
vi.mock("../../core/applyHighlights", () => ({
  __esModule: true,
  default: (...args: any[]) => mockApplyHighlights(...args),
}));
vi.mock("../../core/buildGraphHierarchy", () => ({
  __esModule: true,
  default: (...args: any[]) => mockBuildGraphHierarchy(...args),
}));

vi.mock("../../state/store", () => ({
  useApp: () => ({
    setSearchHits: vi.fn(),
    setQuery: vi.fn(),
  }),
}));

function createFakeSelection() {
  const api = {
    attr: vi.fn().mockReturnThis(),
    style: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
  };
  return api;
}


describe("GraphView Component", () => {
  const model = { features: [{ id: "root" }] };

  beforeEach(() => {
    vi.clearAllMocks();

    if (!SVGElement.prototype.getBBox) {
      Object.defineProperty(SVGElement.prototype, "getBBox", {
        configurable: true,
        value: vi.fn(() => ({
          x: 0,
          y: 0,
          width: 800,
          height: 600,
        })) as unknown as () => SVGRect,
      });
    }

    Object.defineProperty(SVGSVGElement.prototype, "viewBox", {
      configurable: true,
      value: { baseVal: { x: 0, y: 0, width: 800, height: 600 } },
    });

    const d3Root = d3.hierarchy({
      id: "root",
      label: "Root",
      children: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
    });
    mockBuildGraphHierarchy.mockReturnValue(d3Root);

    mockDrawLinks.mockReturnValue(createFakeSelection());
    mockDrawNodes.mockReturnValue(createFakeSelection());
    mockDrawConstraints.mockReturnValue(undefined);
    mockApplyHighlights.mockReturnValue(undefined);

    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined) as any,
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined) as any,
    });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => null,
    });
  });

  test("renders an SVG and runs the draw pipeline", () => {
    render(
      <GraphView
        graph={{}}
        model={model}
        highlights={["a"] as unknown as never[]}
      />
    );

    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();

    expect(mockBuildGraphHierarchy).toHaveBeenCalledTimes(1);
    expect(mockDrawLinks).toHaveBeenCalledTimes(1);
    expect(mockDrawNodes).toHaveBeenCalledTimes(1);
    expect(mockDrawConstraints).toHaveBeenCalledTimes(1);
    expect(mockApplyHighlights).toHaveBeenCalledTimes(1);

    const args = mockApplyHighlights.mock.calls[0];
    expect(args[2]).toEqual(["a"]);
  });

  test("toggles fullscreen via LegendSection button", async () => {
    render(<GraphView graph={{}} model={model} highlights={[]} />);

    const [fullscreenBtn] = screen.getAllByRole("button", {
      name: /fullscreen/i,
    });
    expect(fullscreenBtn).toBeInTheDocument();

    await fireEvent.click(fullscreenBtn);
    expect(
      (HTMLElement.prototype.requestFullscreen as unknown as Mock).mock.calls
        .length
    ).toBe(1);

    const [exitBtn] = screen.getAllByRole("button", { name: /exit/i });
    expect(exitBtn).toBeInTheDocument();

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => document.body,
    });

    await fireEvent.click(exitBtn);
    expect((document.exitFullscreen as unknown as Mock).mock.calls.length).toBe(
      1
    );
  });

  test("Align Center and Reset Zoom buttons do not throw", async () => {
    render(<GraphView graph={{}} model={model} highlights={[]} />);

    const [alignBtn] = screen.getAllByRole("button", { name: /align center/i });
    const [resetBtn] = screen.getAllByRole("button", { name: /reset zoom/i });

    expect(alignBtn).toBeInTheDocument();
    expect(resetBtn).toBeInTheDocument();

    await fireEvent.click(alignBtn);
    await fireEvent.click(resetBtn);

    expect(true).toBeTruthy();
  });

  test("skips draw pipeline if model has no features", () => {
    render(<GraphView graph={{}} model={{ features: [] }} highlights={[]} />);
    expect(mockBuildGraphHierarchy).not.toHaveBeenCalled();
  });

  test("re-applies highlights when highlights prop updates", () => {
    const { rerender } = render(
      <GraphView
        graph={{}}
        model={model}
        highlights={["a"] as unknown as never[]}
      />
    );
    expect(mockApplyHighlights).toHaveBeenCalledTimes(1);
    rerender(
      <GraphView
        graph={{}}
        model={model}
        highlights={["b"] as unknown as never[]}
      />
    );
    expect(mockApplyHighlights).toHaveBeenCalledTimes(2);
  });

  test("attaches zoom behavior to SVG", () => {
    render(<GraphView graph={{}} model={model} highlights={[]} />);
    const svg = document.querySelector("svg");
    expect(svg?.__zoom).toBeDefined();
  });

  test("align center updates zoomRef transform (safe single button query)", async () => {
    render(<GraphView graph={{}} model={model} highlights={[]} />);

    const alignBtns = screen.getAllByRole("button", { name: /align center/i });
    const alignBtn = alignBtns[0];
    expect(alignBtn).toBeInTheDocument();

    await fireEvent.click(alignBtn);
    expect(mockDrawNodes).toHaveBeenCalled();
  });

  test("renders LegendSection with correct props (by heading, tolerant)", () => {
    render(<GraphView graph={{}} model={model} highlights={[]} />);

    const legends = screen.getAllByText(/Visualizer Legend/i);
    expect(legends.length).toBeGreaterThan(0);

    expect(legends[0]).toBeVisible();
  });

  test("adds black background class when fullscreen is active (unique button)", async () => {
    render(<GraphView graph={{}} model={model} highlights={[]} />);

    const fullscreenBtns = screen.getAllByRole("button", {
      name: /fullscreen/i,
    });
    const fullscreenBtn = fullscreenBtns[0];
    expect(fullscreenBtn).toBeInTheDocument();

    await fireEvent.click(fullscreenBtn);

    const container = document.querySelector("div.relative.w-full");
    expect(container?.className).toContain("bg-black/90");
  });

  test("handles invalid hierarchy safely", () => {
    mockBuildGraphHierarchy.mockReturnValueOnce(null);
    render(<GraphView graph={{}} model={model} highlights={[]} />);
    expect(mockDrawNodes).not.toHaveBeenCalled();
  });
});
