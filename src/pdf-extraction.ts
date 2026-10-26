import { fieldForHeader } from "./recognition";
import { matrixToCSV } from "./imports";
export type TextFragment = {
  text: string;
  x: number;
  y: number;
  width: number;
  page: number;
};
export function groupPDFLines(fragments: TextFragment[]): TextFragment[][] {
  const lines: TextFragment[][] = [];
  for (const item of [...fragments].sort(
    (a, b) => a.page - b.page || b.y - a.y || a.x - b.x,
  )) {
    if (!item.text.trim()) continue;
    const line = lines.find(
      (l) => l[0].page === item.page && Math.abs(l[0].y - item.y) < 3,
    );
    if (line) line.push(item);
    else lines.push([item]);
  }
  return lines.map((line) => line.sort((a, b) => a.x - b.x));
}
/** Extraction is a suggestion only. No value is evaluated before user confirmation. */
export function extractPDFTable(fragments: TextFragment[]): string {
  const lines = groupPDFLines(fragments);
  if (!lines.length)
    throw Error(
      "This PDF has no readable text. Scanned or image-only documents need a text payroll export; OCR is not supported yet.",
    );
  const tables: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const header = lines[i];
    if (
      new Set(header.map((item) => fieldForHeader(item.text)).filter(Boolean))
        .size < 2 ||
      header.some((item) => /[\d£]/.test(item.text))
    )
      continue;
    tables.push(header.map((item) => item.text));
    for (
      let j = i + 1;
      j < lines.length && lines[j][0].page === header[0].page;
      j++
    ) {
      const line = lines[j];
      if (
        new Set(line.map((item) => fieldForHeader(item.text)).filter(Boolean))
          .size >= 2
      )
        break;
      const row = header.map(() => "");
      for (const item of line) {
        let column = 0;
        for (let c = 1; c < header.length; c++)
          if (item.x >= header[c].x - 2) column = c;
        row[column] += (row[column] ? " " : "") + item.text;
      }
      if (row.filter(Boolean).length >= 2) tables.push(row);
    }
  }
  if (tables.length > 1) return matrixToCSV(tables);
  if (new Set(fragments.map((item) => item.page)).size > 1)
    throw Error(
      "Multiple pages without a reliable payroll table were found. Import one payslip at a time or use a spreadsheet export; records will not be merged automatically.",
    );
  const values: Record<string, string> = {};
  const conflicts = new Set<string>();
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const item = line[i];
      const combined = /^(.+?)\s*:\s*(.+)$/.exec(item.text);
      const field = fieldForHeader(
        combined ? combined[1] : item.text.replace(/:$/, ""),
      );
      if (!field) continue;
      let next = i + 1;
      while (
        next < line.length &&
        !fieldForHeader(line[next].text.replace(/:$/, ""))
      )
        next++;
      const value = combined
        ? combined[2]
        : line
            .slice(i + 1, next)
            .map((x) => x.text)
            .join(" ")
            .trim();
      if (!value) continue;
      if (values[field] && values[field] !== value) conflicts.add(field);
      else values[field] = value;
    }
  }
  for (const field of conflicts) delete values[field];
  if (Object.keys(values).length < 2)
    throw Error(
      "We could not reliably identify a payroll table or labelled payslip values. Upload a spreadsheet export or paste a labelled payroll table instead.",
    );
  return matrixToCSV([Object.keys(values), Object.values(values)]);
}
