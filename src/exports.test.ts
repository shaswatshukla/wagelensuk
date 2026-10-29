import { it, expect } from "vitest";
import { csvSafe } from "./exports";
it("neutralises spreadsheet formulas including whitespace-prefixed payloads", () => {
  for (const value of [
    '=HYPERLINK("https://example.com")',
    "+SUM(1,1)",
    "-2+3",
    "@SUM(1)",
    "  =1+1",
    "\t=1",
    "\r=1",
    "\n=1",
  ])
    expect(csvSafe(value).startsWith("\"'")).toBe(true);
  expect(csvSafe("SW-001")).toBe('"SW-001"');
  expect(csvSafe('a"b,c')).toBe('"a""b,c"');
});
