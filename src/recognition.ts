import { columns, csvCells, parsePayroll, type Row } from "./engine/index";
import { matrixToCSV } from "./imports";
export const labels: Record<string, string> = {
  worker_ref: "Worker reference",
  pay_period_start: "Period start",
  pay_period_end: "Period end",
  pay_date: "Pay date",
  basic_pay_gbp: "Basic pay (£)",
  other_pay_gbp: "Other pay (£)",
  hours_worked: "Hours worked",
  required_annual_salary_gbp: "Required annual salary (£)",
  going_rate_hourly_gbp: "Required hourly going rate (£)",
  cos_assigned_date: "CoS assigned date",
  pay_frequency: "Pay frequency",
};
const aliases: Record<string, string[]> = {
  worker_ref: [
    "worker ref",
    "worker reference",
    "employee id",
    "employee number",
    "employee no",
    "payroll id",
    "payroll number",
    "payroll no",
    "staff id",
    "staff number",
  ],
  pay_period_start: [
    "pay period start",
    "period start",
    "period from",
    "pay period from",
    "payroll start date",
    "pay from",
  ],
  pay_period_end: [
    "pay period end",
    "period end",
    "period to",
    "pay period to",
    "payroll end date",
    "pay to",
  ],
  pay_date: ["pay date", "payment date", "date paid", "payday"],
  basic_pay_gbp: [
    "basic pay gbp",
    "basic pay",
    "basic salary",
    "base pay",
    "regular pay",
    "ordinary pay",
  ],
  other_pay_gbp: ["other pay gbp", "other pay", "additional pay"],
  hours_worked: [
    "hours worked",
    "worked hours",
    "total hours worked",
    "paid hours",
    "hours",
  ],
  required_annual_salary_gbp: [
    "required annual salary gbp",
    "required annual salary",
    "cos required annual salary",
    "annual salary requirement",
  ],
  going_rate_hourly_gbp: [
    "going rate hourly gbp",
    "hourly going rate",
    "required hourly going rate",
    "required hourly rate",
  ],
  cos_assigned_date: [
    "cos assigned date",
    "cos assignment date",
    "certificate of sponsorship assigned date",
  ],
  pay_frequency: [
    "pay frequency",
    "payment frequency",
    "payroll frequency",
    "frequency",
  ],
};
export const normalHeader = (value: string) =>
  value
    .toLowerCase()
    .replace(/[£()]/g, " ")
    .replace(/[_\-/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export function sensitiveHeader(value: string): boolean {
  return /(^|\s)(name|names|email|address|ni|nino|dob)(\s|$)|national.?insurance|date.?of.?birth|bank.?account|sort.?code|passport|telephone|phone/i.test(
    normalHeader(value),
  );
}
export function fieldForHeader(value: string): string | undefined {
  const normalized = normalHeader(value).replace(/\s+gbp$/, "");
  return columns.find(
    (field) =>
      normalHeader(field).replace(/\s+gbp$/, "") === normalized ||
      aliases[field].includes(normalized),
  );
}
export type Recognition = {
  headers: string[];
  rows: string[][];
  mapping: Record<string, string>;
  headerRow: number;
  ignoredCount: number;
  notes: string[];
};
export function recognise(csv: string, chosenHeaderRow?: number): Recognition {
  const all = csvCells(csv);
  if (all.length < 2)
    throw Error(
      "No payroll table found. Include a header and at least one payroll row.",
    );
  let headerRow = 0,
    best = 0;
  all.slice(0, 30).forEach((row, index) => {
    const score = new Set(row.map(fieldForHeader).filter(Boolean)).size;
    if (score > best) {
      best = score;
      headerRow = index;
    }
  });
  if (chosenHeaderRow !== undefined) {
    if (
      !Number.isInteger(chosenHeaderRow) ||
      chosenHeaderRow < 0 ||
      chosenHeaderRow >= all.length - 1
    )
      throw Error("Choose a header row with payroll rows beneath it.");
    headerRow = chosenHeaderRow;
  }
  const source = all[headerRow];
  const keep = source
    .map((h, i) => (sensitiveHeader(h) ? -1 : i))
    .filter((i) => i >= 0);
  const headers = keep.map((i) => source[i]);
  const rows = all
    .slice(headerRow + 1)
    .filter((row) => row.some(Boolean) && row.join("|") !== source.join("|"))
    .map((row) => keep.map((i) => row[i] || ""));
  if (!rows.length)
    throw Error("The detected header has no payroll rows beneath it.");
  const mapping: Record<string, string> = {};
  for (const field of columns) {
    const found = headers
      .map((h, i) => (fieldForHeader(h) === field ? String(i) : ""))
      .filter(Boolean);
    mapping[field] = found.length === 1 ? found[0] : "";
  }
  return {
    headers,
    rows,
    mapping,
    headerRow,
    ignoredCount: source.length - keep.length,
    notes: [
      ...(!best
        ? [
            "No headings matched automatically. Choose the header row and map the useful columns below; you do not need to edit the original file.",
          ]
        : []),
      ...(headerRow
        ? [
            `Payroll headings found on source row ${headerRow + 1}; preceding title rows were ignored.`,
          ]
        : []),
      ...(source.length > keep.length
        ? [
            `${source.length - keep.length} identifying column(s) excluded. They cannot be mapped or used in results.`,
          ]
        : []),
    ],
  };
}
export function normaliseValue(field: string, value: string): string {
  const trimmed = value.trim();
  if (field.endsWith("_gbp")) {
    const amount = trimmed.replace(/^(?:£|GBP)\s*/i, "");
    if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(amount))
      return amount.replaceAll(",", "");
    return /^\d+(\.\d{1,2})?$/.test(amount) ? amount : trimmed;
  }
  if (field === "hours_worked")
    return trimmed.replace(/\s*(hours?|hrs?)$/i, "").trim();
  if (field === "pay_frequency") {
    const f = normalHeader(trimmed);
    return (
      (
        {
          monthly: "monthly",
          month: "monthly",
          weekly: "weekly",
          week: "weekly",
          fortnightly: "fortnightly",
          "2 weekly": "fortnightly",
          "two weekly": "fortnightly",
          "4 weekly": "four_weekly",
          "four weekly": "four_weekly",
        } as Record<string, string>
      )[f] || trimmed
    );
  }
  if (field.includes("date") || field.startsWith("pay_period")) {
    const m = /^(\d{1,2})[ -]([A-Za-z]{3,9})[ , -]+(\d{4})$/.exec(trimmed);
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    if (m && months.includes(m[2].slice(0, 3).toLowerCase()))
      return `${m[3]}-${String(months.indexOf(m[2].slice(0, 3).toLowerCase()) + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return trimmed;
}
export function recognisedRows(
  data: Recognition,
  mapping: Record<string, string>,
): Row[] {
  const selected = Object.values(mapping).filter(Boolean);
  if (new Set(selected).size !== selected.length)
    throw Error(
      "Each source column can be used once. Resolve conflicting matches.",
    );
  return data.rows.map((row) =>
    Object.fromEntries(
      columns.map((field) => [
        field,
        mapping[field] !== "" && mapping[field] !== undefined
          ? normaliseValue(field, row[Number(mapping[field])] || "")
          : "",
      ]),
    ),
  );
}
export function validateConfirmedRows(rows: Row[]): Row[] {
  return parsePayroll(
    matrixToCSV([
      columns,
      ...rows.map((row) => columns.map((field) => row[field] || "")),
    ]),
  );
}
