// @vitest-environment jsdom
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import JsonUploadInstructions from "../JsonUploadInstructions";

describe("JsonUploadInstructions Component", () => {
  test("renders main heading and description", () => {
    render(<JsonUploadInstructions />);
    expect(screen.getByText(/JSON Upload Guidelines/i)).toBeTruthy();

    const matches = screen.queryAllByText(/To visualize your feature model/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("contains required structure explanation", () => {
    render(<JsonUploadInstructions />);

    // handle duplicate headings
    const structureHeadings = screen.getAllByText(/Required Structure/i);
    expect(structureHeadings.length).toBeGreaterThan(0);

    // ensure key field names appear
    expect(screen.getAllByText(/root/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/features/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/constraints/i).length).toBeGreaterThan(0);
  });

  test("includes example JSON block with InfusionPump", () => {
    render(<JsonUploadInstructions />);
    const jsonBlocks = screen.getAllByText(/InfusionPump/i);
    expect(jsonBlocks.length).toBeGreaterThan(0);

    const codeSnippets = screen.queryAllByText((content) =>
      content.includes('"root": "InfusionPump"')
    );
    expect(codeSnippets.length).toBeGreaterThan(0);
  });

  test("renders list of common mistakes clearly", () => {
    render(<JsonUploadInstructions />);
    const mistakes = screen.getAllByText(/Common Mistakes/i);
    expect(mistakes.length).toBeGreaterThan(0);

    expect(screen.queryAllByText(/Missing or misspelled/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Unknown/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Constraint references/i).length).toBeGreaterThan(0);
  });

  test("shows final upload tip at the bottom", () => {
    render(<JsonUploadInstructions />);
    const tips = screen.queryAllByText(/Save this as/i);
    expect(tips.length).toBeGreaterThan(0);
  });
});
