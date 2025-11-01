import { describe, it, test, expect } from "vitest";
import { validateModel } from "../../src/core/parser";
import { sampleModel } from "./sample.fixture";

test("invalid when missing root", () => {
  const { ok } = validateModel({ features: [] });
  expect(ok).toBe(false);
});

test("valid sample model passes", () => {
  const { ok, errors } = validateModel(sampleModel);
  expect(ok).toBe(true);
  expect(errors).toHaveLength(0);
});

test("invalid constraint type is caught", () => {
  const bad = {
    ...sampleModel,
    constraints: [{ type: "oops", a: "Bluetooth", b: "WiFi" }],
  };
  const { ok, errors } = validateModel(bad);
  expect(ok).toBe(false);
  expect(errors.join(" ")).toMatch(/Invalid constraint type/);
});
