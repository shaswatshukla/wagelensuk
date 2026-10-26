import { describe, it, expect } from "vitest";
import {
  pence,
  date,
  csvCells,
  parsePayroll,
  evaluate,
  evaluateWorker,
  columns,
  rules,
} from "./index";
const make = (extra: Record<string, string> = {}): Record<string, string> => ({
  worker_ref: "SW-001",
  pay_period_start: "2026-05-01",
  pay_period_end: "2026-05-31",
  pay_date: "2026-05-31",
  basic_pay_gbp: "4400",
  other_pay_gbp: "0",
  hours_worked: "160",
  required_annual_salary_gbp: "52000",
  going_rate_hourly_gbp: "20",
  cos_assigned_date: "2026-04-08",
  pay_frequency: "monthly",
  ...extra,
});
const csv = (extra: Record<string, string> = {}) =>
  columns.join(",") + "\n" + columns.map((c) => make(extra)[c]).join(",");
it("rejects stray quotes, missing columns and uneven rows", () => {
  expect(() => csvCells('a\nb"c')).toThrow(/Unexpected quote/);
  expect(() => parsePayroll("foo,bar\na,b")).toThrow(/Missing column/);
  expect(() => parsePayroll(csv() + ",extra")).toThrow(/column count/);
});
it("unconfirmed or missing hourly rule cannot pass", () => {
  const config = structuredClone(rules);
  config.rules[0].status = "SECONDARY-ONLY";
  expect(evaluateWorker("SW-001", [make()], config)[0].status).toBe("REVIEW");
  config.rules = [];
  expect(evaluateWorker("SW-001", [make()], config)[0].explanation).toContain(
    "not primary-confirmed",
  );
});
describe("integer money and dates", () => {
  it("preserves pence", () => {
    expect(pence("0.01")).toBe(1);
    expect(pence("4333.33")).toBe(433333);
    expect(pence("1.2")).toBe(120);
  });
  it.each(["-1", "1.001", "NaN", "", "1e5", "1000000001"])("rejects %s", (n) =>
    expect(() => pence(n)).toThrow(),
  );
  it("validates UK and ISO dates", () => {
    expect(date("08/04/2026")).toBe("2026-04-08");
    expect(date("2026-04-08")).toBe("2026-04-08");
    expect(() => date("2026-02-30")).toThrow();
    expect(() => date("8/4/26")).toThrow();
  });
});
describe("CSV safety", () => {
  it("handles quoting, BOM and CRLF", () => {
    expect(csvCells('a,b\r\n"one, two","a""b"\r\n')).toEqual([
      ["a", "b"],
      ["one, two", 'a"b'],
    ]);
    expect(parsePayroll("\uFEFF" + csv())).toHaveLength(1);
  });
  it("rejects malformed CSV", () => {
    expect(() => csvCells('a\n"b')).toThrow();
    expect(() => parsePayroll("a")).toThrow();
    expect(() => parsePayroll("a,a\n1,2")).toThrow();
    expect(() => parsePayroll("name,b\n1,2")).toThrow(/identifiers/);
  });
  it("validates fields with row context", () => {
    expect(() => parsePayroll(csv({ basic_pay_gbp: "oops" }))).toThrow(
      /Row 2, basic_pay/,
    );
    expect(() => parsePayroll(csv({ hours_worked: "x" }))).toThrow();
    expect(() => parsePayroll(csv({ pay_frequency: "other" }))).toThrow();
    expect(() => parsePayroll(csv({ pay_period_end: "2026-04-01" }))).toThrow();
    expect(() => parsePayroll(csv({ worker_ref: "" }))).toThrow();
  });
  it("rejects duplicates", () =>
    expect(() =>
      parsePayroll(csv() + "\n" + columns.map((c) => make()[c]).join(",")),
    ).toThrow(/duplicate worker/));
  it("maps custom headers", () => {
    const content = csv().replace("worker_ref", "reference");
    expect(
      parsePayroll(content, { worker_ref: "reference" })[0].worker_ref,
    ).toBe("SW-001");
  });
});
describe("research preview acceptance fixtures", () => {
  it.each([
    ["monthly equality", "4333", "160", "20", undefined],
    ["monthly window shortage", "4000", "160", "20", undefined],
    ["hourly shortage", "4400", "230", "20", 20000],
    ["weekly equality", "1000", "40", "20", undefined],
    ["weekly shortage", "950", "40", "20", undefined],
    ["four-weekly", "4000", "160", "20", undefined],
    ["fortnightly", "2000", "80", "20", undefined],
    ["bonus-heavy", "3000", "160", "20", 20000],
    ["variable pattern", "1000", "50", "20", undefined],
    ["mid-year rise", "4500", "160", "20", undefined],
    ["unpaid leave", "0", "0", "20", undefined],
    ["part starter", "2200", "80", "20", undefined],
    ["deduction unresolved", "4333", "160", "20", undefined],
    ["hourly-paid", "1000", "40", "25", undefined],
  ])(
    "%s stays REVIEW until full checks exist",
    (_name, pay, hours, rate, gap) => {
      const result = evaluate([
        make({
          basic_pay_gbp: pay as string,
          hours_worked: hours as string,
          going_rate_hourly_gbp: rate as string,
        }),
      ])[0];
      expect(result.status).toBe("REVIEW");
      expect(result.shortfallAmount).toBe(gap);
    },
  );
  it("older CoS stays REVIEW", () =>
    expect(
      evaluate([make({ cos_assigned_date: "2026-04-07" })])[0].explanation,
    ).toMatch(/Earlier/));
  it("does not use bonuses to mask a gap", () =>
    expect(
      evaluate([make({ basic_pay_gbp: "3000", other_pay_gbp: "9000" })])[0]
        .shortfallAmount,
    ).toBe(20000));
  it("rounds fractional minimum pence upward", () =>
    expect(
      evaluate([
        make({
          basic_pay_gbp: "0",
          hours_worked: "0.01",
          going_rate_hourly_gbp: "0.01",
        }),
      ])[0].shortfallAmount,
    ).toBe(1));
  it("increasing pay never increases a shortfall", () => {
    let previous = Infinity;
    for (let pay = 0; pay <= 4000; pay += 13) {
      const r = evaluate([make({ basic_pay_gbp: String(pay) })])[0];
      expect(r.shortfallAmount || 0).toBeLessThanOrEqual(previous);
      previous = r.shortfallAmount || 0;
    }
  });
  it("sorts periods without mutation", () => {
    const rows = [
      make({ pay_period_start: "2026-06-01", pay_period_end: "2026-06-30" }),
      make(),
    ];
    const out = evaluate(rows);
    expect(out[0].period).toContain("2026-05-01");
    expect(rows[0].pay_period_start).toBe("2026-06-01");
    expect(rules.lastVerified).toBe("2026-10-26");
  });
});
