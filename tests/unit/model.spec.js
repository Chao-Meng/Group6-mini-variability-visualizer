import { describe, it, test, expect } from "vitest";
import { buildGraph } from "../../src/core/model";
import { pathToRoot } from "../../src/core/search";
import { sampleModel } from "./sample.fixture";

test("buildGraph creates nodes/edges/parentMap", () => {
  const g = buildGraph(sampleModel.features);
  expect(g.nodes).toHaveLength(sampleModel.features.length);
  // Communication -> Bluetooth edge exsits
  expect(
    g.edges.some((e) => e.from === "Communication" && e.to === "Bluetooth")
  ).toBe(true);
  // parentMap with Bluetooth -> Communication
  expect(g.parentMap.get("Bluetooth")).toBe("Communication");
});

test("pathToRoot works", () => {
  const g = buildGraph(sampleModel.features);
  const path = pathToRoot("Bluetooth", g.parentMap);
  expect(path).toEqual(["InfusionPump", "Communication", "Bluetooth"]);
});
