import { test, expect } from "vitest";
import { searchFeatures } from "../../src/core/search";

test("search finds by label", () => {
  const f = [{ id: "A", label: "Battery Backup" }];
  expect(searchFeatures(f, "battery")).toEqual(["A"]);
});

test("empty query returns []", () => {
  const f = [{ id: "A", label: "Battery Backup" }];
  expect(searchFeatures(f, "   ")).toEqual([]);
});
