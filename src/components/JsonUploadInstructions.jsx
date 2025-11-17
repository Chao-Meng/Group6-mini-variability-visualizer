import React from "react";
import { FileJson } from "lucide-react";

/**
 * JsonUploadInstructions
 * A static, user-facing component describing how to properly format and upload JSON files
 * for the Mini Variability Visualizer.
 */
export default function JsonUploadInstructions() {
  return (
    <div className="w-full max-w-3xl mx-auto mt-6 p-6 bg-gray-900/70 text-gray-200 rounded-2xl border border-gray-700 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <FileJson size={22} className="text-blue-400" />
        <h2 className="text-xl font-semibold text-blue-300">
          JSON Upload Guidelines
        </h2>
      </div>

      <p className="text-gray-300 mb-4">
        To visualize your feature model, please upload a valid{" "}
        <span className="font-mono text-blue-400">.json</span> file that
        accurately defines your system's <strong>root feature</strong>, its{" "}
        <strong>features</strong> hierarchy, and any{" "}
        <strong>constraints</strong> between features. The uploaded JSON must
        follow the structure outlined below.
      </p>

      <h3 className="text-lg font-semibold text-gray-100 mt-6 mb-2">
        ✅ Required Structure
      </h3>

      <ul className="list-disc list-inside space-y-2 text-gray-300">
        <li>
          <span className="font-semibold text-blue-400">root</span>: a string
          naming the top-level feature.
        </li>
        <li>
          <span className="font-semibold text-blue-400">features</span>: an
          array where each object describes one feature with:
          <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-gray-400">
            <li>
              <span className="font-mono text-gray-200">id</span>: unique string
              name of the feature (required)
            </li>
            <li>
              <span className="font-mono text-gray-200">type</span>: one of{" "}
              <span className="text-blue-400">mandatory</span>,{" "}
              <span className="text-blue-400">optional</span>,{" "}
              <span className="text-blue-400">alternative</span>,{" "}
              <span className="text-blue-400">or</span>
            </li>
            <li>
              <span className="font-mono text-gray-200">parent</span>:
              (optional) ID of the parent feature
            </li>
            <li>
              <span className="font-mono text-gray-200">label</span>: (optional)
              human-readable display name
            </li>
          </ul>
        </li>
        <li>
          <span className="font-semibold text-blue-400">constraints</span>: an
          optional array where each object defines a relationship:
          <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-gray-400">
            <li>
              <span className="font-mono text-gray-200">from</span> and{" "}
              <span className="font-mono text-gray-200">to</span>: valid feature
              IDs
            </li>
            <li>
              <span className="font-mono text-gray-200">type</span>: one of{" "}
              <span className="text-blue-400">requires</span>,{" "}
              <span className="text-blue-400">excludes</span>, or{" "}
              <span className="text-blue-400">conflicts</span>
            </li>
          </ul>
        </li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-100 mt-8 mb-2">
        ⚠️ Common Mistakes
      </h3>

      <ul className="list-disc list-inside space-y-2 text-gray-300">
        <li>
          Missing or misspelled <code>features</code> array
        </li>
        <li>
          Numeric or invalid <code>root</code> value
        </li>
        <li>
          Non-string <code>parent</code> values
        </li>
        <li>
          Unknown <code>type</code> like “maybe” or “core”
        </li>
        <li>
          Constraint references that point to features not defined in the model
        </li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-100 mt-8 mb-2">
        Example of a Valid JSON File
      </h3>

      <pre className="bg-gray-800/70 text-sm text-gray-200 rounded-lg p-4 overflow-x-auto border border-gray-700">
        {`{
  "root": "InfusionPump",
  "features": [
    { "id": "InfusionPump", "label": "Infusion Pump", "type": "mandatory" },
    { "id": "PowerModule", "label": "Power Module", "type": "mandatory", "parent": "InfusionPump" },
    { "id": "BatteryBackup", "label": "Battery Backup System", "type": "optional", "parent": "PowerModule" },
    { "id": "ACAdapter", "label": "AC Adapter", "type": "optional", "parent": "PowerModule" }
  ],
  "constraints": [
    { "from": "BatteryBackup", "to": "ACAdapter", "type": "excludes" }
  ]
}`}
      </pre>

      <p className="mt-4 text-gray-400 text-sm italic">
        Save this as <code>model.json</code> and upload it to get started.
      </p>
    </div>
  );
}
