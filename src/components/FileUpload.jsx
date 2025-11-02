import { useState } from "react";
import { useApp } from "../state/store";
import { UploadCloud, FileJson, RefreshCcw } from "lucide-react";
import processUploadedFile from "../core/processUploadedFile";

/**
 * FileUpload
 * Allows the user to upload, validate, and load a feature model from a JSON file.
 * Supports both click-to-upload and drag-and-drop interactions.
 */
export default function FileUpload() {
  const { setModel, setGraph } = useApp();
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);

  /** Handles file selection via file input */
  async function handleFileInputChange(event) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile)
      await processUploadedFile(
        selectedFile,
        setModel,
        setGraph,
        setUploadedFileName
      );
  }

  /** Drag-and-drop event handlers */
  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }

  async function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) await processUploadedFile(droppedFile);
  }

  /** Clears the current model and allows re-upload */
  function handleReplaceFile() {
    setUploadedFileName(null);
    setModel(null);
    setGraph(null);
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <label
        htmlFor="file-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full max-w-lg p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${
            isDragActive
              ? "border-blue-400 bg-blue-400/10"
              : "border-gray-700 hover:border-blue-500 hover:bg-gray-800/40"
          }
          bg-gray-900/70 text-gray-200 backdrop-blur-md shadow-xl`}
      >
        <UploadCloud
          size={44}
          className={`mb-3 ${
            isDragActive ? "text-blue-400" : "text-blue-500/80"
          } transition-colors`}
        />

        <h2 className="text-lg font-semibold text-gray-100 mb-1">
          Upload Feature Model
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Drop your <span className="text-blue-400 font-mono">.json</span> file
          here, or click anywhere to browse.
        </p>

        <input
          id="file-upload"
          type="file"
          accept="application/json"
          onChange={handleFileInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {/* File preview section */}
        {uploadedFileName ? (
          <div className="mt-4 w-full max-w-sm flex items-center justify-between px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-md text-sm shadow-sm">
            <div className="flex items-center gap-2 truncate">
              <FileJson size={18} className="text-blue-400 flex-shrink-0" />
              <span className="truncate text-gray-200">{uploadedFileName}</span>
            </div>
            <button
              onClick={handleReplaceFile}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition"
              title="Clear and upload new file"
            >
              <RefreshCcw size={14} />
              Replace
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic mt-2">
            No model loaded yet.
          </p>
        )}
      </label>
    </div>
  );
}
