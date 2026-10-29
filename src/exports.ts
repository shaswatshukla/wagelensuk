/** Quoted cells remain literal when opened by spreadsheet software. */
export function csvSafe(s: string): string {
  return (
    '"' +
    (/^\s*[=+\-@]|^[\t\r\n]/.test(s) ? "'" : "") +
    s.replaceAll('"', '""') +
    '"'
  );
}
