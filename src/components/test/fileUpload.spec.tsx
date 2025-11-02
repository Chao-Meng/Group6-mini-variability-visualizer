// @vitest-environment jsdom
import type { Mock } from "vitest";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// ========== Mocks ==========
vi.mock("../../state/store", () => ({
  useApp: vi.fn(),
}));

vi.mock("../../core/processUploadedFile", () => ({
  default: vi.fn(),
}));

import { useApp } from "../../state/store";
import processUploadedFileImport from "../../core/processUploadedFile";
import FileUpload from "../FileUpload";

const processUploadedFile = processUploadedFileImport as unknown as Mock;

// Simple helper to log only failure details
function logIfError(label: string, fn: () => void) {
  try {
    fn();
  } catch (err) {
    console.error(`❌ ${label}:`, (err as Error).message);
    throw err; // rethrow so test still fails
  }
}

describe("FileUpload Component (Debug Mode)", () => {
  const mockSetModel = vi.fn();
  const mockSetGraph = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as unknown as Mock).mockReturnValue({
      model: null,
      setModel: mockSetModel,
      graph: null,
      setGraph: mockSetGraph,
      searchHits: [],
      setSearchHits: vi.fn(),
      activeId: null,
      setActiveId: vi.fn(),
      query: "",
      setQuery: vi.fn(),
    });
  });

  // 1. Basic UI
  test("renders initial upload UI", () => {
    render(<FileUpload />);
    logIfError("Upload heading missing", () =>
      expect(screen.getByText("Upload Feature Model")).toBeTruthy()
    );
    logIfError("Drop text missing", () =>
      expect(screen.getByText(/Drop your/i)).toBeTruthy()
    );
    logIfError("No model text missing", () =>
      expect(screen.getByText("No model loaded yet.")).toBeTruthy()
    );
  });

  // 2. File select
  test("calls processUploadedFile when file is selected", async () => {
    const fakeFile = new File([JSON.stringify({})], "test.json", {
      type: "application/json",
    });
    processUploadedFile.mockResolvedValueOnce(undefined);

    render(<FileUpload />);

    const [heading] = await screen.findAllByText(/upload feature model/i);
    const label = heading.closest("label") as HTMLElement;
    const input = label.querySelector("#file-upload") as HTMLInputElement;

    await fireEvent.change(input, { target: { files: [fakeFile] } });

    await waitFor(() => {
      logIfError("processUploadedFile not called", () =>
        expect(processUploadedFile).toHaveBeenCalledWith(
          fakeFile,
          mockSetModel,
          mockSetGraph,
          expect.any(Function)
        )
      );
    });
  });

  // 3. Drag style
  test("applies and removes drag style correctly", async () => {
    render(<FileUpload />);
    const [heading] = await screen.findAllByText(/upload feature model/i);
    const label = heading.closest("label") as HTMLElement;

    fireEvent.dragOver(label);
    logIfError("dragOver style not applied", () =>
      expect(label.className.includes("border-blue-400")).toBe(true)
    );

    fireEvent.dragLeave(label);
    logIfError("dragLeave style not removed", () =>
      expect(label.className.includes("border-blue-400")).toBe(false)
    );
  });

  // 4. Drop file
  test("calls processUploadedFile when a file is dropped", async () => {
    const fakeFile = new File([JSON.stringify({})], "drop.json", {
      type: "application/json",
    });
    processUploadedFile.mockResolvedValueOnce(undefined);

    render(<FileUpload />);

    const [heading] = await screen.findAllByText(/upload feature model/i);
    const label = heading.closest("label") as HTMLElement;

    await fireEvent.drop(label, {
      dataTransfer: { files: [fakeFile] },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    });

    await waitFor(() => {
      logIfError("processUploadedFile not called on drop", () =>
        expect(processUploadedFile).toHaveBeenCalledWith(fakeFile)
      );
    });
  });

  // 5. Replace logic
  test("displays uploaded file name and handles replacement", async () => {
    processUploadedFile.mockImplementation(
      async (
        file: File,
        setModel: (value: any) => void,
        setGraph: (value: any) => void,
        setUploadedFileName: (name: string | null) => void
      ) => {
        setUploadedFileName(file.name);
        setModel({ loaded: true });
        setGraph({ nodes: [] });
      }
    );

    const fakeFile = new File(["{}"], "replace.json", {
      type: "application/json",
    });

    render(<FileUpload />);

    const [heading] = await screen.findAllByText(/upload feature model/i);
    const label = heading.closest("label") as HTMLElement;
    const input = label.querySelector("#file-upload") as HTMLInputElement;

    await fireEvent.change(input, { target: { files: [fakeFile] } });

    await screen.findByText("replace.json");

    const replaceBtn = screen.getByText("Replace");
    fireEvent.click(replaceBtn);

    logIfError("Replace didn't reset state", () =>
      expect(screen.getByText("No model loaded yet.")).toBeTruthy()
    );
  });
});

// 6. Accessibility: file input exists with correct attributes
test("renders file input with correct accessibility attributes", async () => {
  render(<FileUpload />);
  const input = document.querySelector(
    "#file-upload"
  ) as HTMLInputElement | null;
  logIfError("File input missing", () => {
    expect(input).toBeTruthy();
    expect(input?.type).toBe("file");
    expect(input?.accept).toBe("application/json");
  });
});

// 7. Handles rejected upload safely (alert shown)
test("shows alert when upload fails", async () => {
  const mockAlert = vi.fn();
  (globalThis as any).alert = mockAlert;

  processUploadedFile.mockRejectedValueOnce(new Error("Invalid JSON content"));

  render(<FileUpload />);

  const input = document.querySelector("#file-upload") as HTMLInputElement;
  const badFile = new File(["{ bad json"], "broken.json", {
    type: "application/json",
  });

  await fireEvent.change(input, { target: { files: [badFile] } });

  await waitFor(() => {
    expect(mockAlert).toHaveBeenCalledWith(
      expect.stringContaining("Failed to load file")
    );
  });
});

// 8. Non-JSON file still triggers upload without errors
test("handles non-JSON file upload safely", async () => {
  vi.clearAllMocks();
  const txtFile = new File(["dummy content"], "notes.txt", {
    type: "text/plain",
  });
  processUploadedFile.mockResolvedValueOnce(undefined);

  render(<FileUpload />);

  const input = document.querySelector("#file-upload") as HTMLInputElement;
  await fireEvent.change(input, { target: { files: [txtFile] } });

  await waitFor(() => {
    expect(processUploadedFile).toHaveBeenCalledTimes(1);
  });
});
