import { it, expect } from "vitest";
import { findingGuidance, structuredReport } from "./guidance";
import type { Result } from "./engine/index";
const base: Result = {
  worker: "SW-1",
  period: "2026-07",
  status: "REVIEW",
  pay: 300000,
  ruleId: "hourly",
  explanation: "Review",
  suggestedAction: "Review evidence",
  windowFinding: {
    status: "REVIEW",
    ruleId: "window",
    explanation: "Incomplete",
  },
};
it("links a potential shortfall to the exact rule without certifying a breach", () => {
  const g = findingGuidance({ ...base, shortfallAmount: 20000 });
  expect(g.references).toContain("SW 14.3B(a)");
  expect(g.heading).toContain("Potential");
  expect(g.actions.join(" ")).toContain("does not automatically cure");
});
it("keeps older CoS cases as scope review", () =>
  expect(
    findingGuidance({ ...base, windowFinding: undefined }).references,
  ).toEqual(["CoS scope / transitional review"]));
it("exports version, provenance, recommendations and disclaimer", () => {
  const r = structuredReport([base], "2026-10-26T12:00:00Z");
  expect(r.generatedAt).toBe("2026-10-26T12:00:00Z");
  expect(r.findings[0].guidance.actions.length).toBeGreaterThan(0);
  expect(r.ruleSources[0].source).toContain("gov.uk");
  expect(r.disclaimer).toContain("not legal advice");
});
