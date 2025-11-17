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

afterEach(() => cleanup());

vi.mock("../../state/store", () => ({ useApp: vi.fn() }));
vi.mock("../../core/processUploadedFile", () => ({ default: vi.fn() }));

import { useApp } from "../../state/store";
import processUploadedFileImport from "../../core/processUploadedFile";
import FileUpload from "../FileUpload";

const processUploadedFile = processUploadedFileImport as unknown as Mock;

function logIfError(label: string, fn: () => void) {
  try {
    fn();
  } catch (err) {
    console.error(`❌ ${label}:`, (err as Error).message);
    throw err;
  }
}

// Helper to create mock File objects that always pass validation
function makeMockFile(
  name: string,
  content: any = { root: "A", features: [{ id: "A", label: "Root" }] },
  type = "application/json"
): File {
  const jsonStr = JSON.stringify(content);
  const file = new File([jsonStr], name, { type });
  file.text = vi.fn().mockResolvedValueOnce(jsonStr);
  return file;
}

// ================================================================
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

  test("calls processUploadedFile when file is selected", async () => {
    const fakeFile = makeMockFile("test.json");
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

  test("calls processUploadedFile when a file is dropped", async () => {
    const fakeFile = makeMockFile("drop.json");
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
        expect(processUploadedFile).toHaveBeenCalledWith(
          fakeFile,
          mockSetModel,
          mockSetGraph,
          expect.any(Function)
        )
      );
    });
  });

  test("displays uploaded file name and handles replacement", async () => {
    processUploadedFile.mockImplementation(
      async (
        file: File,
        setModel: (v: any) => void,
        setGraph: (v: any) => void,
        setUploadedFileName: (n: string | null) => void
      ) => {
        setUploadedFileName(file.name);
        setModel({ loaded: true });
        setGraph({ nodes: [] });
      }
    );

    const fakeFile = makeMockFile("replace.json");

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

test("renders file input with correct accessibility attributes", async () => {
  render(<FileUpload />);
  const input = document.querySelector("#file-upload") as HTMLInputElement;
  logIfError("File input missing", () => {
    expect(input).toBeTruthy();
    expect(input.type).toBe("file");
    expect(input.accept).toBe("application/json");
  });
});

test("renders visible error message when upload fails", async () => {
  render(<FileUpload />);

  const input = document.querySelector("#file-upload") as HTMLInputElement;

  const badFile = new File(["{ bad json"], "broken.json", {
    type: "application/json",
  });

  badFile.text = vi.fn().mockResolvedValueOnce("{ bad json");

  await fireEvent.change(input, { target: { files: [badFile] } });

  await waitFor(() => {
    const errorDiv = screen.getByText(
      (text) =>
        text.startsWith("Failed to load file:") &&
        text.toLowerCase().includes("expected")
    );
    expect(errorDiv).toBeTruthy();
    expect(errorDiv.className).toMatch(/text-red-300/);
  });
});

test("handles non-JSON file upload safely", async () => {
  vi.clearAllMocks();
  const txtFile = makeMockFile(
    "notes.txt",
    { root: "A", features: [{ id: "A" }] },
    "text/plain"
  );
  processUploadedFile.mockResolvedValueOnce(undefined);

  render(<FileUpload />);

  const input = document.querySelector("#file-upload") as HTMLInputElement;
  await fireEvent.change(input, { target: { files: [txtFile] } });

  await waitFor(() => {
    expect(processUploadedFile).toHaveBeenCalledTimes(1);
  });
});
