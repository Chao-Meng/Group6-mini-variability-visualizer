// @vitest-environment node
// @vitest-environment jsdom
import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";

vi.mock("../../data/loaders/jsonLoader", () => ({
  loadJSONFile: vi.fn(),
}));

vi.mock("../parser", () => ({
  validateModel: vi.fn(),
}));

vi.mock("../model", () => ({
  buildGraph: vi.fn(),
}));

import { loadJSONFile } from "../../data/loaders/jsonLoader";
import { validateModel } from "../parser";
import { buildGraph } from "../model";
import processUploadedFile from "../processUploadedFile";

beforeAll(() => {
  class MockFile {
    constructor(chunks, name, options = {}) {
      this.name = name || "unnamed";
      this.type = options.type || "application/json";
      this.content = chunks.join("");
    }
  }
  globalThis.File = MockFile;
});

describe("processUploadedFile()", () => {
  const setModel = vi.fn();
  const setGraph = vi.fn();
  const setUploadedFileName = vi.fn();

  const uploadedFile = new File([`{ "root": "X" }`], "model.json");

  const validJsonModel = {
    root: "InfusionPump",
    features: [{ id: "InfusionPump", label: "Infusion Pump" }],
    constraints: [],
  };

  const validGraph = {
    nodes: [{ id: "InfusionPump" }],
    edges: [],
    childrenMap: new Map(),
    parentMap: new Map(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
  });

  afterEach(() => {
    delete globalThis.alert;
  });

  test("loads file, validates model, builds graph, and sets state on success", async () => {
    loadJSONFile.mockResolvedValueOnce(validJsonModel);
    validateModel.mockReturnValueOnce({ ok: true, errors: [] });
    buildGraph.mockReturnValueOnce(validGraph);

    await processUploadedFile(
      uploadedFile,
      setModel,
      setGraph,
      setUploadedFileName
    );

    expect(loadJSONFile).toHaveBeenCalledWith(uploadedFile);
    expect(validateModel).toHaveBeenCalledWith(validJsonModel);
    expect(buildGraph).toHaveBeenCalledWith(validJsonModel.features);
    expect(setModel).toHaveBeenCalledWith(validJsonModel);
    expect(setGraph).toHaveBeenCalledWith(validGraph);
    expect(setUploadedFileName).toHaveBeenCalledWith("model.json");
    expect(globalThis.alert).not.toHaveBeenCalled();
  });

  test("alerts and aborts when validation fails", async () => {
    loadJSONFile.mockResolvedValueOnce(validJsonModel);
    validateModel.mockReturnValueOnce({
      ok: false,
      errors: ["Missing root", "features must be array"],
    });

    await processUploadedFile(
      uploadedFile,
      setModel,
      setGraph,
      setUploadedFileName
    );

    expect(buildGraph).not.toHaveBeenCalled();
    expect(setModel).not.toHaveBeenCalled();
    expect(setGraph).not.toHaveBeenCalled();
    expect(setUploadedFileName).not.toHaveBeenCalled();

    expect(globalThis.alert).toHaveBeenCalledTimes(1);
    const msg = globalThis.alert.mock.calls[0][0];
    expect(msg).toMatch(/^Invalid model:\n/);
    expect(msg).toContain("Missing root");
    expect(msg).toContain("features must be array");
  });

  test("alerts when loadJSONFile throws", async () => {
    loadJSONFile.mockRejectedValueOnce(new Error("read failure"));

    await processUploadedFile(
      uploadedFile,
      setModel,
      setGraph,
      setUploadedFileName
    );

    expect(validateModel).not.toHaveBeenCalled();
    expect(buildGraph).not.toHaveBeenCalled();
    expect(setModel).not.toHaveBeenCalled();
    expect(setGraph).not.toHaveBeenCalled();
    expect(setUploadedFileName).not.toHaveBeenCalled();
    expect(globalThis.alert).toHaveBeenCalledWith(
      "Failed to load file: read failure"
    );
  });

  test("alerts when buildGraph throws", async () => {
    loadJSONFile.mockResolvedValueOnce(validJsonModel);
    validateModel.mockReturnValueOnce({ ok: true, errors: [] });
    buildGraph.mockImplementationOnce(() => {
      throw new Error("graph build failed");
    });

    await processUploadedFile(
      uploadedFile,
      setModel,
      setGraph,
      setUploadedFileName
    );

    expect(setModel).not.toHaveBeenCalled();
    expect(setGraph).not.toHaveBeenCalled();
    expect(setUploadedFileName).not.toHaveBeenCalled();
    expect(globalThis.alert).toHaveBeenCalledWith(
      "Failed to load file: graph build failed"
    );
  });

  test("passes the file's name to setUploadedFileName on success", async () => {
    const customFile = new File([`{}`], "custom-name.json");
    loadJSONFile.mockResolvedValueOnce(validJsonModel);
    validateModel.mockReturnValueOnce({ ok: true, errors: [] });
    buildGraph.mockReturnValueOnce(validGraph);

    await processUploadedFile(
      customFile,
      setModel,
      setGraph,
      setUploadedFileName
    );

    expect(setUploadedFileName).toHaveBeenCalledWith("custom-name.json");
  });

  test("does not call setters if validation fails, even if features exist", async () => {
    loadJSONFile.mockResolvedValueOnce({
      root: "X",
      features: [{ id: "X" }],
      constraints: [],
    });
    validateModel.mockReturnValueOnce({
      ok: false,
      errors: ["Invalid constraint type: oops"],
    });

    await processUploadedFile(
      uploadedFile,
      setModel,
      setGraph,
      setUploadedFileName
    );

    expect(buildGraph).not.toHaveBeenCalled();
    expect(setModel).not.toHaveBeenCalled();
    expect(setGraph).not.toHaveBeenCalled();
    expect(setUploadedFileName).not.toHaveBeenCalled();
    expect(globalThis.alert).toHaveBeenCalledTimes(1);
  });

  test("handles models lacking features gracefully if validator marks them valid", async () => {
    const modelWithoutFeatures = { root: "RootOnly" };
    loadJSONFile.mockResolvedValueOnce(modelWithoutFeatures);
    validateModel.mockReturnValueOnce({ ok: true, errors: [] });
    buildGraph.mockReturnValueOnce(validGraph);

    await processUploadedFile(
      uploadedFile,
      setModel,
      setGraph,
      setUploadedFileName
    );

    expect(buildGraph).toHaveBeenCalledWith(modelWithoutFeatures.features);
    expect(setModel).toHaveBeenCalledWith(modelWithoutFeatures);
    expect(setGraph).toHaveBeenCalledWith(validGraph);
    expect(setUploadedFileName).toHaveBeenCalledWith("model.json");
  });
});
