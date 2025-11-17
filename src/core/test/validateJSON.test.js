// @vitest-environment node
/* eslint-env node */
import { describe, test, expect, vi } from "vitest";
import validateJSON from "../validateJSON.js";

import emptyJSON from "../../../public/error-empty-sample.json";
import invalidJSON from "../../../public/error-sample-example.json";

describe("validateJSON – structure validation tests", () => {
  test("throws clear error for completely empty JSON", () => {
    expect(() => validateJSON(emptyJSON)).toThrowError(
      /'features' array describing all system features/i
    );
  });

  test("throws user-friendly error messages for multiple invalid fields", () => {
    try {
      validateJSON(invalidJSON);
    } catch (err) {
      const message = err.message;

      expect(message).toMatch(/(feature|root|constraint)/i);
      expect(message).toMatch(/(missing|invalid|must be)/i);
      expect(message).not.toMatch(/undefined/i);
      expect(message.length).toBeGreaterThan(10);

      console.log("\n validateJSON detected:", message);
    }
  });

  test("passes validation for a minimal valid feature model", () => {
    const valid = {
      root: "System",
      features: [
        { id: "System", type: "mandatory" },
        { id: "ModuleA", parent: "System", type: "optional" },
      ],
      constraints: [{ from: "ModuleA", to: "System", type: "requires" }],
    };

    const result = validateJSON(valid);
    expect(result).toBe(true);
  });

  test("shows warnings for constraints referencing missing features", () => {
    const data = {
      root: "Engine",
      features: [{ id: "Engine", type: "mandatory" }],
      constraints: [{ from: "MissingFeature", to: "Engine", type: "requires" }],
    };

    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = validateJSON(data);

    expect(result).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/references features not defined/i)
    );

    spy.mockRestore();
  });
});
