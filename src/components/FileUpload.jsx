import { useState } from "react";
import { loadJSONFile } from "../data/loaders/jsonLoader";
import { validateModel } from "../core/parser";
import { buildGraph } from "../core/model";
import { useApp } from "../state/store";
import { UploadCloud, FileJson, RefreshCcw } from "lucide-react";

export default function FileUpload() {
  const { model, setModel, setGraph } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(null);

  async function handleFile(file) {
    try {
      const json = await loadJSONFile(file);
      const { ok, errors } = validateModel(json);
      if (!ok) {
        alert("Invalid model:\n" + errors.join("\n"));
        return;
      }
      const g = buildGraph(json.features);
      setModel(json);
      setGraph(g);
      setFileName(file.name);
    } catch (err) {
      alert("Failed to load: " + err.message);
    }
  }

  async function onChange(e) {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  async function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <label
        htmlFor="file-upload"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center w-full max-w-lg p-10 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${
            dragActive
              ? "border-blue-400 bg-blue-400/10"
              : "border-gray-700 hover:border-blue-500 hover:bg-gray-800/40"
          }
          bg-gray-900/70 text-gray-200 backdrop-blur-md shadow-xl`}
      >
        <UploadCloud
          size={44}
          className={`mb-3 ${
            dragActive ? "text-blue-400" : "text-blue-500/80"
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
          onChange={onChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {/* ✅ File preview section */}
        {fileName ? (
          <div className="mt-4 w-full max-w-sm flex items-center justify-between px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-md text-sm shadow-sm">
            <div className="flex items-center gap-2 truncate">
              <FileJson size={18} className="text-blue-400 flex-shrink-0" />
              <span className="truncate text-gray-200">{fileName}</span>
            </div>
            <button
              onClick={() => {
                setFileName(null);
                setModel(null);
                setGraph(null);
              }}
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
