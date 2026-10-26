import { pence, type Row } from "./index";
import rules from "../rules/skilled-worker.json";
export type TestFinding = {
  status: "PASS" | "FAIL" | "REVIEW";
  ruleId: string;
  explanation: string;
  shortfallAmount?: number;
};
const params = rules.rules.find((r) => r.id === "window")!.parameters;
const dayMs = 86400000;
const day = (s: string) => Date.parse(s) / dayMs;
export function frequencyHandling(
  frequency: string,
): "monthly" | "frequent" | "review" {
  if (frequency === "monthly") return "monthly";
  if (["weekly", "fortnightly", "four_weekly"].includes(frequency))
    return "frequent";
  return "review";
}
export function partPeriodOrLeave(row: Row): TestFinding | null {
  if (row.leave_context || row.partial_period === "true")
    return {
      status: "REVIEW",
      ruleId: "leave-or-partial",
      explanation:
        "Leave or a partial employment period requires exception and allocation review.",
    };
  if (row.pay_frequency === "monthly") {
    const start = new Date(row.pay_period_start),
      end = new Date(row.pay_period_end);
    const last = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
    );
    if (
      start.getUTCDate() !== 1 ||
      end.getUTCDate() !== last.getUTCDate() ||
      start.getUTCMonth() !== end.getUTCMonth() ||
      start.getUTCFullYear() !== end.getUTCFullYear()
    )
      return {
        status: "REVIEW",
        ruleId: "partial",
        explanation:
          "Non-calendar monthly boundaries require allocation review.",
      };
  }
  return null;
}
export function midPeriodChanges(rows: Row[]): TestFinding | null {
  if (
    new Set(rows.map((r) => r.required_annual_salary_gbp)).size > 1 ||
    new Set(rows.map((r) => r.going_rate_hourly_gbp)).size > 1 ||
    rows.some((r) => r.salary_change_date)
  )
    return {
      status: "REVIEW",
      ruleId: "pay-change",
      explanation:
        "Salary requirements change within the supplied history. Confirm effective dates and allocation with your adviser.",
    };
  return null;
}
/** Only whole aligned windows are screened. No daily allocation is invented. */
export function rollingWindow(rows: Row[], index: number): TestFinding {
  const current = rows[index];
  const frequency = frequencyHandling(current.pay_frequency);
  const review = (explanation: string): TestFinding => ({
    status: "REVIEW",
    ruleId: "window",
    explanation,
  });
  if (frequency === "review")
    return review("Unsupported pay frequency: contract review required.");
  if (
    rules.rules.find((r) => r.id === "window")!.status !== "PRIMARY-CONFIRMED"
  )
    return review("Window rule is not primary-confirmed.");
  if (current.irregular_pattern === "true")
    return review(
      "Uneven working patterns require a confirmed 17-week assessment.",
    );
  let start: number;
  let numerator: number;
  let denominator: number;
  if (frequency === "monthly") {
    const end = new Date(current.pay_period_end);
    start =
      Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth() - params.monthlyMonths! + 1,
        1,
      ) / dayMs;
    numerator = params.monthlyMonths!;
    denominator = params.monthsInYear!;
  } else {
    start =
      day(current.pay_period_end) +
      1 -
      params.frequentWeeks! * params.daysInWeek!;
    numerator = params.frequentWeeks!;
    denominator = params.weeksInYear!;
  }
  const selected = rows
    .slice(0, index + 1)
    .filter((r) => day(r.pay_period_end) >= start);
  if (!selected.length || day(selected[0].pay_period_start) !== start)
    return review(
      "A complete aligned salary window is unavailable; earlier or boundary-spanning payroll is needed.",
    );
  if (
    selected.some(
      (r, i) =>
        r.pay_frequency !== current.pay_frequency ||
        partPeriodOrLeave(r) ||
        (i > 0 &&
          day(r.pay_period_start) !== day(selected[i - 1].pay_period_end) + 1),
    )
  )
    return review(
      "Gaps, overlapping periods, partial periods, leave or frequency changes need review.",
    );
  const changes = midPeriodChanges(selected);
  if (changes) return changes;
  const eligible = selected.reduce(
    (sum, r) => sum + BigInt(pence(r.basic_pay_gbp)),
    0n,
  );
  const required =
    BigInt(pence(current.required_annual_salary_gbp)) * BigInt(numerator);
  const actual = eligible * BigInt(denominator);
  if (actual < required) {
    const gap = Number(
      (required - actual + BigInt(denominator) - 1n) / BigInt(denominator),
    );
    return {
      status: "FAIL",
      ruleId: "window",
      shortfallAmount: gap,
      explanation: `Aligned window basic pay £${(Number(eligible) / 100).toFixed(2)} is £${(gap / 100).toFixed(2)} below the supplied annual requirement × ${numerator}/${denominator}. Exceptions still require review.`,
    };
  }
  return {
    status: "PASS",
    ruleId: "window",
    explanation: `No shortfall found in this aligned window against the supplied annual requirement × ${numerator}/${denominator}. Other possible window boundaries and exceptions are not cleared.`,
  };
}
