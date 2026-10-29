import { it, expect } from "vitest";
import { evaluate, parsePayroll } from "./engine/index";
import { workerMarkup } from "./results-view";
it("bounds each worker page to twenty periods", () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({
    worker: "W",
    period: `Period-${i}`,
    status: "REVIEW" as const,
    pay: 400000,
    explanation: "Review",
    ruleId: "hourly",
    suggestedAction: "Confirm source",
  }));
  const indices = new Map(rows.map((r, i) => [r, i]));
  const first = workerMarkup("W", rows, indices, 1, 0);
  expect(first).toContain("Next periods");
  expect(first).not.toContain("<td>Period-24</td>");
  const second = workerMarkup("W", rows, indices, 1, 1);
  expect(second).toContain("<td>Period-24</td>");
});
it("escapes imported references and exposes the exact confirmed arithmetic", () => {
  const results = evaluate(
    parsePayroll(
      "worker_ref,pay_period_start,pay_period_end,pay_date,basic_pay_gbp,other_pay_gbp,hours_worked,required_annual_salary_gbp,going_rate_hourly_gbp,cos_assigned_date,pay_frequency\n<img src=x onerror=alert(1)>,2026-07-01,2026-07-31,2026-07-31,3000,0,160,52000,20,2026-04-08,monthly",
    ),
  );
  const markup = workerMarkup(
    results[0].worker,
    results,
    new Map([[results[0], 0]]),
    1,
    0,
  );
  expect(markup).not.toContain("<img");
  expect(markup).toContain("&lt;img");
  expect(markup).toContain("160 hours × £20.00/hour = £3,200.00");
  expect(markup).toContain('aria-label="View calculation for');
});
