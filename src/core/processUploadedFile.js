import { loadJSONFile } from "../data/loaders/jsonLoader";
import { validateModel } from "./parser";
import { buildGraph } from "./model";

/**
 * Reads and validates the uploaded JSON model file.
 * If valid, sets model and graph states; otherwise alerts user.
 */
export default async function processUploadedFile(
  file,
  setModel,
  setGraph,
  setUploadedFileName
) {
  try {
    const jsonData = await loadJSONFile(file);
    const { ok: isValid, errors: validationErrors } = validateModel(jsonData);

    if (!isValid) {
      alert("Invalid model:\n" + validationErrors.join("\n"));
      return;
    }

    const graphData = buildGraph(jsonData.features);
    setModel(jsonData);
    setGraph(graphData);
    setUploadedFileName(file.name);
  } catch (error) {
    alert("Failed to load file: " + error.message);
  }
}
