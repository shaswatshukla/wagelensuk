import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerURL from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { extractPDFTable, type TextFragment } from "./pdf-extraction";
import type { PayrollImport } from "./imports";
GlobalWorkerOptions.workerSrc = workerURL;
export async function readDigitalPDF(
  buffer: ArrayBuffer,
): Promise<PayrollImport> {
  const task = getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useSystemFonts: false,
    stopAtErrors: true,
  });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 20)
      throw Error("Import a digital PDF with at most 20 pages.");
    const fragments: TextFragment[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const text = await page.getTextContent();
      for (const item of text.items)
        if ("str" in item)
          fragments.push({
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            page: p,
          });
      page.cleanup();
    }
    const csv = extractPDFTable(fragments);
    return { sheets: ["Extracted PDF"], csvForSheet: () => csv };
  } catch (e) {
    if ((e as Error).name === "PasswordException")
      throw Error(
        "This PDF is password protected. Use an unlocked payroll export.",
      );
    throw e;
  } finally {
    await task.destroy();
  }
}
