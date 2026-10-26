import { describe, it, expect } from "vitest";
import {
  frequencyHandling,
  partPeriodOrLeave,
  midPeriodChanges,
  rollingWindow,
} from "./windows";
import type { Row } from "./index";
import rules from "../rules/skilled-worker.json";
const month = (m: number, pay = "4333"): Row => ({
  worker_ref: "SW-1",
  pay_period_start: `2026-${String(m).padStart(2, "0")}-01`,
  pay_period_end: `2026-${String(m).padStart(2, "0")}-${[4, 6, 9, 11].includes(m) ? 30 : 31}`,
  pay_frequency: "monthly",
  basic_pay_gbp: pay,
  required_annual_salary_gbp: "52000",
  going_rate_hourly_gbp: "20",
});
const weeks = (pay = "1000", length = 12, period = 7): Row[] =>
  Array.from({ length }, (_, i) => ({
    worker_ref: "SW-1",
    pay_period_start: new Date(Date.UTC(2026, 4, 4 + i * period))
      .toISOString()
      .slice(0, 10),
    pay_period_end: new Date(Date.UTC(2026, 4, 4 + (i + 1) * period - 1))
      .toISOString()
      .slice(0, 10),
    pay_frequency:
      period === 7 ? "weekly" : period === 14 ? "fortnightly" : "four_weekly",
    basic_pay_gbp: pay,
    required_annual_salary_gbp: "52000",
    going_rate_hourly_gbp: "20",
  }));
it("unconfirmed window rule stays REVIEW", () => {
  const rule = rules.rules.find((r) => r.id === "window")!;
  const previous = rule.status;
  try {
    rule.status = "SECONDARY-ONLY";
    expect(rollingWindow([month(5)], 0).explanation).toContain(
      "not primary-confirmed",
    );
  } finally {
    rule.status = previous;
  }
});
describe("frequency and exceptions", () => {
  it("classifies only supported frequencies", () => {
    expect(frequencyHandling("monthly")).toBe("monthly");
    expect(frequencyHandling("weekly")).toBe("frequent");
    expect(frequencyHandling("other")).toBe("review");
  });
  it("detects partial months and explicit leave", () => {
    expect(partPeriodOrLeave(month(5))).toBeNull();
    expect(
      partPeriodOrLeave({ ...month(5), pay_period_start: "2026-05-16" })
        ?.status,
    ).toBe("REVIEW");
    expect(
      partPeriodOrLeave({ ...month(5), leave_context: "sick" })?.status,
    ).toBe("REVIEW");
    expect(partPeriodOrLeave(weeks()[0])).toBeNull();
  });
  it("detects changed rates", () => {
    expect(midPeriodChanges([month(5), month(6)])).toBeNull();
    expect(
      midPeriodChanges([
        month(5),
        { ...month(6), required_annual_salary_gbp: "54000" },
      ])?.status,
    ).toBe("REVIEW");
    expect(
      midPeriodChanges([{ ...month(6), salary_change_date: "2026-06-15" }])
        ?.status,
    ).toBe("REVIEW");
  });
});
describe("aligned windows", () => {
  it("monthly equality", () => {
    const rows = [month(5), month(6), month(7, "4334")];
    expect(rollingWindow(rows, 0).status).toBe("REVIEW");
    expect(rollingWindow(rows, 1).status).toBe("REVIEW");
    expect(rollingWindow(rows, 2).status).toBe("PASS");
  });
  it("monthly shortage", () =>
    expect(
      rollingWindow([month(5, "4000"), month(6, "4000"), month(7, "4000")], 2)
        .shortfallAmount,
    ).toBe(100000));
  it("weekly equality and shortage", () => {
    expect(rollingWindow(weeks(), 11).status).toBe("PASS");
    expect(rollingWindow(weeks("950"), 11).shortfallAmount).toBe(60000);
    expect(rollingWindow(weeks(), 4).status).toBe("REVIEW");
  });
  it("four-weekly and fortnightly", () => {
    expect(rollingWindow(weeks("4000", 3, 28), 2).status).toBe("PASS");
    expect(rollingWindow(weeks("2000", 6, 14), 5).status).toBe("PASS");
  });
  it("requires full contiguous history", () => {
    const rows = weeks();
    rows[4].pay_period_start = "2026-06-03";
    expect(rollingWindow(rows, 11).status).toBe("REVIEW");
  });
  it("handles changing requirements and irregularity conservatively", () => {
    const rows = weeks();
    rows[5].required_annual_salary_gbp = "54000";
    expect(rollingWindow(rows, 11).ruleId).toBe("pay-change");
    expect(
      rollingWindow([{ ...month(5), irregular_pattern: "true" }], 0).status,
    ).toBe("REVIEW");
    expect(
      rollingWindow([{ ...month(5), pay_frequency: "other" }], 0).status,
    ).toBe("REVIEW");
  });
});
