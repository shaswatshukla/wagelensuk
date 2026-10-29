import rules from "../rules/skilled-worker.json";
import { rollingWindow, type TestFinding } from "./windows";
export { rules };
export const columns = [
  "worker_ref",
  "pay_period_start",
  "pay_period_end",
  "pay_date",
  "basic_pay_gbp",
  "other_pay_gbp",
  "hours_worked",
  "required_annual_salary_gbp",
  "going_rate_hourly_gbp",
  "cos_assigned_date",
  "pay_frequency",
];
export type Row = Record<string, string>;
export type Result = {
  worker: string;
  period: string;
  status: "PASS" | "FAIL" | "REVIEW";
  ruleId: string;
  explanation: string;
  suggestedAction: string;
  shortfallAmount?: number;
  pay: number;
  inputs?: {
    hoursWorked: string;
    hourlyRate: string;
    annualSalary: string;
    otherPay: string;
  };
  windowFinding?: TestFinding;
};
export function pence(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw Error("Use a non-negative GBP amount with at most two decimals.");
  const [a, b = ""] = value.split(".");
  const n = Number(a) * 100 + Number(b.padEnd(2, "0"));
  if (!Number.isSafeInteger(n) || n > 100000000000)
    throw Error("Amount is too large.");
  return n;
}
export function date(value: string): string {
  const uk = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const iso = uk ? `${uk[3]}-${uk[2]}-${uk[1]}` : value;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(iso) ||
    !Number.isFinite(Date.parse(iso)) ||
    new Date(iso).toISOString().slice(0, 10) !== iso
  )
    throw Error("Use a real date: YYYY-MM-DD or DD/MM/YYYY.");
  return iso;
}
export function csvCells(text: string, delimiter = ","): string[][] {
  const out: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!cell || quoted) quoted = !quoted;
      else throw Error("Unexpected quote in CSV.");
    } else if (c === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) out.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("Unclosed quoted CSV field.");
  row.push(cell.trim());
  if (row.some(Boolean)) out.push(row);
  return out;
}
export function parsePayroll(
  text: string,
  mapping?: Record<string, string>,
): Row[] {
  const cells = csvCells(text.replace(/^\uFEFF/, ""));
  if (cells.length < 2)
    throw Error("Include a header and at least one payroll row.");
  const headers = cells[0];
  if (new Set(headers).size !== headers.length)
    throw Error("Duplicate column headers.");
  if (
    headers.some((h) =>
      /(^|[ _-])(name|email|address|ni|nino|dob)([ _-]|$)|national.?insurance|date.?of.?birth/i.test(
        h,
      ),
    )
  )
    throw Error(
      "Remove names, NI numbers and other direct identifiers before importing.",
    );
  const map = Object.fromEntries(columns.map((c) => [c, mapping?.[c] || c]));
  for (const c of columns)
    if (!headers.includes(map[c]))
      throw Error(`Missing column: ${c}. Map your headers below.`);
  const seen = new Set<string>();
  return cells.slice(1).map((values, i) => {
    if (values.length !== headers.length)
      throw Error(`Row ${i + 2}: column count does not match header.`);
    const r = Object.fromEntries(
      columns.map((c) => [c, values[headers.indexOf(map[c])]]),
    );
    for (const c of columns) {
      try {
        if (!r[c]) throw Error("Required value missing.");
        if (c.endsWith("_gbp")) pence(r[c]);
        if (c.includes("date") || c.startsWith("pay_period")) r[c] = date(r[c]);
        if (c === "hours_worked" && !/^\d+(\.\d{1,2})?$/.test(r[c]))
          throw Error("Use hours with at most two decimals.");
      } catch (e) {
        throw Error(`Row ${i + 2}, ${c}: ${(e as Error).message}`);
      }
    }
    if (r.pay_period_start > r.pay_period_end)
      throw Error(`Row ${i + 2}: period ends before it starts.`);
    if (
      !["monthly", "four_weekly", "fortnightly", "weekly"].includes(
        r.pay_frequency,
      )
    )
      throw Error(`Row ${i + 2}: unsupported pay_frequency.`);
    const key = r.worker_ref + r.pay_period_start;
    if (seen.has(key)) throw Error(`Row ${i + 2}: duplicate worker period.`);
    seen.add(key);
    return r;
  });
}
export function evaluateWorker(
  worker: string,
  periods: Row[],
  config = rules,
): Result[] {
  const sorted = periods
    .filter((p) => p.worker_ref === worker)
    .sort((a, b) => a.pay_period_start.localeCompare(b.pay_period_start));
  return sorted.map((r, index) => {
    const pay = pence(r.basic_pay_gbp);
    const base = {
      worker,
      period: `${r.pay_period_start} → ${r.pay_period_end}`,
      pay,
      inputs: {
        hoursWorked: r.hours_worked,
        hourlyRate: r.going_rate_hourly_gbp,
        annualSalary: r.required_annual_salary_gbp,
        otherPay: r.other_pay_gbp,
      },
      ruleId: "hourly",
      suggestedAction:
        "Confirm the applicable rates, deductions, leave and full payroll history with your adviser.",
    };
    if (r.cos_assigned_date < config.effectiveDate)
      return {
        ...base,
        status: "REVIEW",
        explanation: "Earlier CoS: transitional treatment needs review.",
      };
    if (
      config.rules.find((x) => x.id === "hourly")?.status !==
      "PRIMARY-CONFIRMED"
    )
      return {
        ...base,
        status: "REVIEW",
        explanation: "Hourly rule is not primary-confirmed.",
      };
    const windowFinding = rollingWindow(sorted, index);
    const [whole, fraction = ""] = r.hours_worked.split(".");
    const hours = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
    const required = hours * BigInt(pence(r.going_rate_hourly_gbp));
    const actual = BigInt(pay) * 100n;
    if (actual < required) {
      const shortfall = Number((required - actual + 99n) / 100n);
      return {
        ...base,
        windowFinding,
        status: "REVIEW",
        shortfallAmount: shortfall,
        explanation: `Hourly screening found a £${(shortfall / 100).toFixed(2)} potential shortfall. Leave, deductions and eligibility declarations are not yet verified.`,
      };
    }
    return {
      ...base,
      windowFinding,
      status: "REVIEW",
      explanation:
        "Hourly screening found no shortfall. Overall result requires full window-boundary, eligible-pay and exception review.",
    };
  });
}
export function evaluate(rows: Row[]): Result[] {
  return [...new Set(rows.map((r) => r.worker_ref))].flatMap((w) =>
    evaluateWorker(w, rows),
  );
}
