/// <reference types="@testing-library/jest-dom" />
// @vitest-environment jsdom

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom/vitest"; 
import ExampleDownloads from "../ExampleDownloads";

const samples = [
  { name: "Automotive System", file: "sample-automotive.json" },
  {
    name: "Complex Infusion System",
    file: "sample-complex-infusion-system.json",
  },
  { name: "IoT Device Suite", file: "sample-iot.json" },
  { name: "Medical Device Model", file: "sample-medical.json" },
];

// cleanup DOM after every test
afterEach(() => cleanup());

describe("<ExampleDownloads />", () => {
  it("renders heading and helper text", () => {
    render(<ExampleDownloads />);

    expect(
      screen.getByRole("heading", {
        name: /download sample feature models/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/download any of the sample models below/i)
    ).toBeInTheDocument();
  });

  it("renders all sample items with correct labels", () => {
    render(<ExampleDownloads />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(samples.length);

    samples.forEach((sample) => {
      expect(screen.getByText(sample.name)).toBeInTheDocument();
    });
  });

  it("anchors point to the correct files and use download attribute", () => {
    render(<ExampleDownloads />);

    samples.forEach((sample) => {
      const link = screen.getByRole("link", {
        name: new RegExp(`${sample.name}\\s*Download`, "i"),
      });

      expect(link).toHaveAttribute("href", `/${sample.file}`);
      expect(link).toHaveAttribute("download");
    });
  });

  it("wraps the entire row in an anchor so label text is part of clickable area", () => {
    render(<ExampleDownloads />);

    const label = screen.getByText("Automotive System");
    const anchor = label.closest("a");

    expect(anchor).not.toBeNull();
    expect(anchor).toHaveAttribute("href", "/sample-automotive.json");
  });

  it("only exposes a single interactive link per row", () => {
    render(<ExampleDownloads />);

    const automotiveLinks = screen.getAllByRole("link", {
      name: /automotive system.*download/i,
    });

    expect(automotiveLinks).toHaveLength(1);
  });

  it("allows clicking both the anchor and inner text label", async () => {
    // prevent jsdom navigation crash
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        ...window.location,
        assign: vi.fn(),
      },
    });

    const user = userEvent.setup();
    render(<ExampleDownloads />);

    const link = screen.getByRole("link", {
      name: /automotive system.*download/i,
    });

    await user.click(link);
    expect(link).toBeInTheDocument();

    const label = screen.getByText("Automotive System");
    await user.click(label);

    expect(label.closest("a")).toBe(link);
  });

  it("applies pointer + hover classes so rows behave as interactive buttons", () => {
    render(<ExampleDownloads />);

    const link = screen.getByRole("link", {
      name: /automotive system.*download/i,
    });

    expect(link).toHaveClass("cursor-pointer");
    expect(link).toHaveClass("hover:bg-gray-700/70");
  });

  it("renders rows in the same order as the samples array", () => {
    render(<ExampleDownloads />);

    const links = screen.getAllByRole("link");
    const renderedNames = links.map((link) => link.textContent || "");

    samples.forEach((sample, index) => {
      expect(renderedNames[index]).toMatch(new RegExp(sample.name, "i"));
    });
  });
});
