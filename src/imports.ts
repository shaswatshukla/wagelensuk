import type { WorkBook, WorkSheet } from "xlsx";
import { csvCells } from "./engine/index";
type WorkbookTools = typeof import("xlsx");
let toolsPromise: Promise<WorkbookTools> | undefined;
export function preloadWorkbookTools(): Promise<WorkbookTools> {
  return (toolsPromise ||= import("xlsx"));
}

export const acceptedFiles = ".csv,.tsv,.txt,.xlsx,.xls,.pdf";
export const maxBytes = 5 * 1024 * 1024;
export type PayrollImport = {
  sheets: string[];
  csvForSheet: (name: string) => string;
};
const quote = (value: string) => '"' + value.replaceAll('"', '""') + '"';
export function matrixToCSV(rows: unknown[][]): string {
  if (rows.length > 10001)
    throw Error("Import up to 10,000 payroll rows at a time.");
  return rows
    .map((row) =>
      row
        .map((value) =>
          quote(
            value instanceof Date
              ? value.toISOString().slice(0, 10)
              : String(value ?? ""),
          ),
        )
        .join(","),
    )
    .join("\n");
}
export function textToCSV(text: string, delimiter?: string): string {
  const cleaned = text.replace(/^\uFEFF/, "");
  const separator =
    delimiter || (cleaned.split(/\r?\n/, 1)[0].includes("\t") ? "\t" : ",");
  return matrixToCSV(csvCells(cleaned, separator));
}
function sheetToCSV(sheet: WorkSheet, tools: WorkbookTools): string {
  const { utils } = tools;
  if (!sheet["!ref"])
    throw Error("This worksheet is empty. Choose another sheet.");
  const range = utils.decode_range(sheet["!ref"]);
  if (range.e.r - range.s.r > 10000 || range.e.c - range.s.c > 100)
    throw Error(
      "Use a sheet with at most 10,000 payroll rows and 101 columns.",
    );
  for (const [key, cell] of Object.entries(sheet)) {
    if (!key.startsWith("!") && cell.f)
      throw Error(
        `Cell ${key} contains a formula. Paste values into a payroll-only sheet before importing, so the checker does not rely on stale cached results.`,
      );
  }
  return matrixToCSV(
    utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: "",
      blankrows: false,
    }),
  );
}
export function readWorkbook(
  buffer: ArrayBuffer,
  tools: WorkbookTools,
): PayrollImport {
  let workbook: WorkBook;
  try {
    workbook = tools.read(buffer, {
      type: "array",
      cellDates: true,
      cellFormula: true,
      sheetRows: 10002,
    });
  } catch {
    throw Error(
      "Could not read this workbook. Check that it is a valid, unencrypted Excel file.",
    );
  }
  const sheets = workbook.SheetNames.filter(
    (name) => !workbook.Workbook?.Sheets?.find((s) => s.name === name)?.Hidden,
  );
  if (!sheets.length) throw Error("No visible worksheets found.");
  return {
    sheets,
    csvForSheet: (name: string) => {
      if (!sheets.includes(name))
        throw Error("Choose a visible worksheet from this workbook.");
      return sheetToCSV(workbook.Sheets[name], tools);
    },
  };
}
export async function readPayrollFile(file: File): Promise<PayrollImport> {
  if (file.size > maxBytes)
    throw Error("Choose a payroll file smaller than 5 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf")
    return (await import("./pdf-import")).readDigitalPDF(
      await file.arrayBuffer(),
    );
  if (["xlsx", "xls"].includes(extension || ""))
    return readWorkbook(await file.arrayBuffer(), await preloadWorkbookTools());
  if (!["csv", "tsv", "txt"].includes(extension || ""))
    throw Error(
      "Choose a CSV, TSV, Excel (.xlsx / .xls) or digital PDF file, or paste your spreadsheet data.",
    );
  const csv = textToCSV(
    await file.text(),
    extension === "tsv" ? "\t" : undefined,
  );
  return { sheets: ["Payroll"], csvForSheet: () => csv };
}
