import { it, expect } from "vitest";
import { extractPDFTable, type TextFragment } from "./pdf-extraction";
import { recognise, recognisedRows } from "./recognition";
const f = (text: string, x: number, y: number, page = 1): TextFragment => ({
  text,
  x,
  y,
  width: 60,
  page,
});
it("extracts a digital PDF table by header positions", () => {
  const csv = extractPDFTable([
    f("Employee ID", 10, 700),
    f("Basic Pay", 120, 700),
    f("Hours", 230, 700),
    f("E-01", 10, 680),
    f("£4,400", 120, 680),
    f("160", 230, 680),
  ]);
  const d = recognise(csv);
  expect(recognisedRows(d, d.mapping)[0]).toMatchObject({
    worker_ref: "E-01",
    basic_pay_gbp: "4400",
    hours_worked: "160",
  });
});
it("extracts labelled values without inventing absent CoS details", () => {
  const csv = extractPDFTable([
    f("Basic Pay: £4,400", 10, 700),
    f("Hours worked", 10, 680),
    f("160", 180, 680),
    f("Payment Date: 31 Jul 2026", 10, 660),
  ]);
  const d = recognise(csv);
  expect(recognisedRows(d, d.mapping)[0]).toMatchObject({
    basic_pay_gbp: "4400",
    hours_worked: "160",
    pay_date: "2026-07-31",
    cos_assigned_date: "",
  });
});
it("refuses scans and unstructured text", () => {
  expect(() => extractPDFTable([])).toThrow(/Scanned/);
  expect(() => extractPDFTable([f("Some unknown text", 0, 10)])).toThrow(
    /reliably/,
  );
});
it("does not merge multipage payslips without a reliable table", () =>
  expect(() =>
    extractPDFTable([f("Basic Pay: 4400", 0, 10), f("Hours: 160", 0, 10, 2)]),
  ).toThrow(/not be merged/));
