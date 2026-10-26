# Import your existing payroll export

## Supported input

Excel (.xlsx/.xls), CSV, TSV, copied spreadsheet cells, and readable digital PDFs. The file stays in browser memory. It is not sent to a server or an AI service. Text extraction does not require AI and uses deterministic header aliases and PDF text positions.

The app recognises headings such as Employee ID, Payroll Number, Basic Salary, Period From/To, Payment Date and Hours worked. It looks through the first 30 imported rows for likely headings and lets the user select a different header row. Duplicate candidates require a choice. Unknown headings remain available for manual mapping. A standard WageLens template is optional.

Generic Salary, Gross Pay, Net Pay and Hourly Rate are not automatically substituted for basic pay or CoS requirements. Required annual salary, applicable hourly going rate and CoS assignment date must be explicitly present or supplied by the user. Absent other pay is not silently assumed to be zero. Worker references are not invented or inferred from names.

## Confirmation and provenance

Users see the suggested source column, original cell contents, normalised extracted values and missing fields. They can correct values per row, map another column, or fill an explicitly verified shared value into empty cells only. Source remapping replaces manual edits and requires renewed confirmation. A final checkbox confirms values and the absence of direct identifiers before evaluation.

Identifying columns (including obvious name, NI, address, bank account and contact headings) are excluded from available mapping candidates and evaluator input. Header checks cannot recognise every identifier in free text, so users must verify the selected fields. Raw documents are necessarily read locally to extract relevant values; there is no persistent storage.

## PDF limits

PDF.js is bundled locally. Its worker reads local bytes through in-browser messaging. No PDF URL or contents are sent to a service. The PDF parser and worker can be loaded from fixed same-origin asset URLs on first use; these requests contain no payroll data. CSP permits only same-origin resources. The browser regression test checks requests against the actual build asset filenames and rejects requests with payloads or other URLs.

Digital text is grouped by position, then interpreted as a table with recognisable headings or one labelled payslip. These are suggestions, not reliable understanding of every PDF layout. Conflicting labelled values are discarded rather than guessed. Separate payslips across pages are not automatically merged. Scans/image-only files have no readable text and receive an explicit unsupported message. OCR, Word documents and arbitrary document understanding are not implemented.

Imports are limited to 5 MB, 10,000 payroll rows, 101 Excel columns and 20 PDF pages. Some exports with unusual formulas or layout still need a values-only export, manual mapping or copied cells. Never describe this as support for any document.
