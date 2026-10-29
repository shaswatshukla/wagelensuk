import { describe, it, expect } from "vitest";
import { utils, write } from "xlsx";
import * as workbookTools from "xlsx";
import {
  matrixToCSV,
  textToCSV,
  readWorkbook as readWorkbookWithTools,
  readPayrollFile,
  maxBytes,
  checkExpandedWorkbook,
} from "./imports";
import { columns, parsePayroll } from "./engine/index";
const readWorkbook = (buffer: ArrayBuffer) =>
  readWorkbookWithTools(buffer, workbookTools);
const row = [
  "SW-XLS",
  "2026-07-01",
  "2026-07-31",
  "2026-07-31",
  "4400",
  "0",
  "160",
  "52000",
  "20",
  "2026-04-08",
  "monthly",
];
const bytes = (names = ["Payroll"], type: "xlsx" | "biff8" = "xlsx") => {
  const wb = utils.book_new();
  for (const name of names)
    utils.book_append_sheet(wb, utils.aoa_to_sheet([columns, row]), name);
  return write(wb, { type: "array", bookType: type }) as ArrayBuffer;
};
describe("additional local input formats", () => {
  it("normalises TSV including quoted delimiters", () => {
    expect(
      parsePayroll(textToCSV(columns.join("\t") + "\n" + row.join("\t")))[0]
        .worker_ref,
    ).toBe("SW-XLS");
    expect(textToCSV('a\tb\n"one\ttwo"\tthree')).toBe(
      '"a","b"\n"one\ttwo","three"',
    );
  });
  it("preserves CSV quoting", () =>
    expect(textToCSV('a,b\n"one, two","say ""hi"""')).toBe(
      '"a","b"\n"one, two","say ""hi"""',
    ));
  it("keeps numbers, dates and missing cells explicit", () =>
    expect(matrixToCSV([[1, new Date("2026-07-01T00:00:00Z"), null]])).toBe(
      '"1","2026-07-01",""',
    ));
  it("reads xlsx and legacy xls", () => {
    for (const type of ["xlsx", "biff8"] as const) {
      const imported = readWorkbook(bytes(["Payroll"], type));
      expect(imported.sheets).toEqual(["Payroll"]);
      expect(parsePayroll(imported.csvForSheet("Payroll"))[0].worker_ref).toBe(
        "SW-XLS",
      );
    }
  });
  it("exposes sheets for explicit selection", () => {
    const imported = readWorkbook(bytes(["Notes", "Payroll"]));
    expect(imported.sheets).toEqual(["Notes", "Payroll"]);
    expect(() => imported.csvForSheet("Missing")).toThrow(/visible worksheet/);
  });
  it("rejects formula cells instead of trusting a cached result", () => {
    const wb = utils.book_new();
    const sheet = utils.aoa_to_sheet([columns, row]);
    sheet.E2 = { t: "n", v: 4400, f: "2200*2" };
    utils.book_append_sheet(wb, sheet, "Payroll");
    expect(() =>
      readWorkbook(write(wb, { type: "array", bookType: "xlsx" })).csvForSheet(
        "Payroll",
      ),
    ).toThrow(/contains a formula/);
  });
  it("does not offer hidden sheets", () => {
    const wb = utils.book_new();
    utils.book_append_sheet(wb, utils.aoa_to_sheet([["a"]]), "Hidden");
    wb.Workbook = { Sheets: [{ name: "Hidden", Hidden: 1 }] };
    expect(() =>
      readWorkbook(write(wb, { type: "array", bookType: "xlsx" })),
    ).toThrow(/No visible/);
  });
  it("rejects empty sheets and oversized tables", () => {
    const wb = utils.book_new();
    utils.book_append_sheet(wb, {}, "Empty");
    expect(() =>
      readWorkbook(write(wb, { type: "array", bookType: "xlsx" })).csvForSheet(
        "Empty",
      ),
    ).toThrow(/empty/);
    expect(() =>
      matrixToCSV(Array.from({ length: 10002 }, () => ["a"])),
    ).toThrow(/10,000/);
  });
  it("validates file type and size", async () => {
    await expect(
      readPayrollFile({ name: "x.docx", size: 1 } as File),
    ).rejects.toThrow(/CSV, TSV, Excel/);
    await expect(
      readPayrollFile({ name: "x.csv", size: maxBytes + 1 } as File),
    ).rejects.toThrow(/5 MB/);
    const imported = await readPayrollFile({
      name: "x.tsv",
      size: 100,
      text: async () => columns.join("\t") + "\n" + row.join("\t"),
    } as File);
    expect(parsePayroll(imported.csvForSheet("Payroll"))[0].worker_ref).toBe(
      "SW-XLS",
    );
  });
});
it("rejects workbooks with excessive declared ZIP expansion before parsing", () => {
  const bytes = new ArrayBuffer(80),
    view = new DataView(bytes);
  view.setUint32(0, 0x04034b50, true);
  view.setUint32(4, 0x02014b50, true);
  view.setUint32(28, 51 * 1024 * 1024, true);
  view.setUint32(58, 0x06054b50, true);
  view.setUint16(68, 1, true);
  view.setUint32(74, 4, true);
  expect(() => checkExpandedWorkbook(bytes)).toThrow(/Expanded workbook/);
  expect(() => matrixToCSV([Array(102).fill("x")])).toThrow(/101 columns/);
});
