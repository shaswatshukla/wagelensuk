import { describe, it, expect } from "vitest";
import {
  recognise,
  recognisedRows,
  fieldForHeader,
  normaliseValue,
  validateConfirmedRows,
} from "./recognition";
import { columns } from "./engine/index";
describe("conservative field recognition", () => {
  it("recognises payroll aliases after title rows and excludes identifiers", () => {
    const d = recognise(
      'July payroll\nEmployee Name,Employee ID,Basic Salary,Hours,Payment Date,NI Number\nPrivate Name,E-01,"£4,400.00",160 hrs,31 Jul 2026,PRIVATE-NI',
    );
    expect(d.headerRow).toBe(1);
    expect(d.ignoredCount).toBe(2);
    expect(JSON.stringify(d)).not.toContain("Private Name");
    const rows = recognisedRows(d, d.mapping);
    expect(rows[0]).toMatchObject({
      worker_ref: "E-01",
      basic_pay_gbp: "4400.00",
      hours_worked: "160",
      pay_date: "2026-07-31",
      required_annual_salary_gbp: "",
      going_rate_hourly_gbp: "",
    });
  });
  it("never assumes salary or hourly rate means required CoS pay", () => {
    expect(fieldForHeader("Salary")).toBeUndefined();
    expect(fieldForHeader("Annual Salary")).toBeUndefined();
    expect(fieldForHeader("Hourly Rate")).toBeUndefined();
    expect(fieldForHeader("Required hourly rate")).toBe(
      "going_rate_hourly_gbp",
    );
  });
  it("leaves duplicate candidate matches for confirmation", () => {
    const d = recognise("Basic Pay,Base Pay,Hours\n4000,4100,160");
    expect(d.mapping.basic_pay_gbp).toBe("");
  });
  it("rejects reuse of a source column", () => {
    const d = recognise("Basic Pay,Hours\n4000,160");
    expect(() =>
      recognisedRows(d, { ...d.mapping, hours_worked: "0" }),
    ).toThrow(/once/);
  });
  it("does not fill absent values with zero or dates", () => {
    const d = recognise("Basic Pay,Hours\n4000,160");
    expect(recognisedRows(d, d.mapping)[0].other_pay_gbp).toBe("");
    expect(() => validateConfirmedRows(recognisedRows(d, d.mapping))).toThrow(
      /Required/,
    );
  });
  it("normalises only explicit formatting", () => {
    expect(normaliseValue("basic_pay_gbp", "£4,400.50")).toBe("4400.50");
    expect(normaliseValue("basic_pay_gbp", "4,40")).toBe("4,40");
    expect(normaliseValue("pay_frequency", "4-weekly")).toBe("four_weekly");
    expect(normaliseValue("worker_ref", "  E-01 ")).toBe("E-01");
  });
  it("requires identifiable tabular data", () => {
    expect(() => recognise("a")).toThrow();
    expect(recognise("Unknown,Columns\na,b").mapping.basic_pay_gbp).toBe("");
    expect(recognise("Title\nCustom,Fields\na,b", 1).headers).toEqual([
      "Custom",
      "Fields",
    ]);
    expect(() => recognise("Title\nCustom,Fields\na,b", 8)).toThrow(
      /header row/,
    );
  });
  it("validates explicit confirmed records through the engine parser", () => {
    const values = [
      "E-1",
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
    expect(
      validateConfirmedRows([
        Object.fromEntries(columns.map((c, i) => [c, values[i]])),
      ])[0].worker_ref,
    ).toBe("E-1");
  });
});
