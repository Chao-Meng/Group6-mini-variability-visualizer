/// <reference types="@testing-library/jest-dom" />
// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

import ControlBar from "../SearchBar";
import { useApp } from "../../state/store";
import { searchFeatures } from "../../core/search";

vi.mock("../../state/store", () => ({
  useApp: vi.fn(),
}));
vi.mock("../../core/search", () => ({
  searchFeatures: vi.fn(),
}));

describe("ControlBar Component", () => {
  const setSearchHits = vi.fn();
  const setQuery = vi.fn();

  const mockModel = {
    features: [
      { id: 1, name: "Login" },
      { id: 2, name: "Logout" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as any).mockReturnValue({
      model: mockModel,
      query: "",
      setQuery,
      setSearchHits,
    });
  });

  afterEach(() => {
    cleanup();
  });

  test("renders search input and icon", () => {
    render(<ControlBar />);
    const input = screen.getByPlaceholderText(/search features/i);
    expect(input).toBeInTheDocument();
  });

  test("updates query on input change", () => {
    render(<ControlBar />);
    const input = screen.getByPlaceholderText(/search features/i);
    fireEvent.change(input, { target: { value: "test" } });
    expect(setQuery).toHaveBeenCalledWith("test");
  });

  test("clears query when clear button is clicked", () => {
    (useApp as any).mockReturnValue({
      model: mockModel,
      query: "login",
      setQuery,
      setSearchHits,
    });
    render(<ControlBar />);
    const button = screen.getByRole("button", { name: /clear search/i });
    fireEvent.click(button);
    expect(setQuery).toHaveBeenCalledWith("");
  });

  test("calls searchFeatures and updates searchHits when query changes", () => {
    (searchFeatures as any).mockReturnValue([{ id: 1, name: "Login" }]);
    (useApp as any).mockReturnValue({
      model: mockModel,
      query: "log",
      setQuery,
      setSearchHits,
    });
    render(<ControlBar />);
    expect(searchFeatures).toHaveBeenCalledWith(mockModel.features, "log");
    expect(setSearchHits).toHaveBeenCalledWith([{ id: 1, name: "Login" }]);
  });

  test("shows green feedback when matches found", () => {
    (searchFeatures as any).mockReturnValue([{ id: 1, name: "Login" }]);
    (useApp as any).mockReturnValue({
      model: mockModel,
      query: "log",
      setQuery,
      setSearchHits,
    });
    render(<ControlBar />);
    const matches = screen.getAllByText(/1 feature found/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("shows red feedback when no features match", () => {
    (searchFeatures as any).mockReturnValue([]);
    (useApp as any).mockReturnValue({
      model: mockModel,
      query: "xyz",
      setQuery,
      setSearchHits,
    });
    render(<ControlBar />);
    const noMatch = screen.getByText(/no features match/i);
    expect(noMatch).toBeInTheDocument(); 
  });

  test("focuses input when Shift+S is pressed", () => {
    render(<ControlBar />);
    const [input] = screen.getAllByPlaceholderText(/search features/i);
    const focusSpy = vi.spyOn(input, "focus");
    fireEvent.keyDown(window, { shiftKey: true, key: "s" });
    expect(focusSpy).toHaveBeenCalled();
  });
});
