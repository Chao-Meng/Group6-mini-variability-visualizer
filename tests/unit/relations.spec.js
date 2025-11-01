import { describe, it, test, expect } from "vitest";
import { getRelationsFor } from "../../src/core/parser";
import { sampleModel } from "./sample.fixture";

test("getRelationsFor lists requires/excludes from selected node", () => {
  const r = getRelationsFor("Bluetooth", sampleModel.constraints);
  expect(r.requires).toEqual(["BatteryBackup"]);
  // Bluetooth and WiFi are mutually excludes
  expect(r.excludes).toContain("WiFi");
});
