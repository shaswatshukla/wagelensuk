import { columns, type Row } from "./engine/index";
import {
  recognise,
  recognisedRows,
  validateConfirmedRows,
  labels,
  normaliseValue,
  type Recognition,
} from "./recognition";
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function mountConfirmation(
  container: Element,
  csv: string,
  name: string,
  onConfirm: (rows: Row[]) => void,
  onCancel: () => void,
  chosenHeaderRow?: number,
) {
  const data: Recognition = recognise(csv, chosenHeaderRow);
  let mapping = { ...data.mapping };
  let rows = recognisedRows(data, mapping);
  let page = 0;
  let dirtyMapping = false;
  const pageSize = 10;
  const error = (message: string) => {
    container.querySelector("#mapping-error")!.textContent = message;
  };
  function render() {
    dirtyMapping = false;
    const matched = columns.filter((f) => mapping[f] !== "").length;
    const missing = columns.filter((f) => rows.some((row) => !row[f]));
    container.innerHTML = `<section class="mapping recognition"><div class="recognition-head"><div><span class="eyebrow">YOUR FORMAT. RECOGNISED.</span><h2>We found the fields. You make the call.</h2><p>${esc(name)} · ${rows.length} payroll row(s). ${matched} of ${columns.length} fields matched. Confirm the source matches and values below before screening.</p></div><span class="status">Confirmation required</span></div>${data.notes.map((n) => `<p class="recognition-note">${esc(n)}</p>`).join("")}<details class="match-details"><summary>Review source matches <span>${matched} suggested · ${columns.length - matched} not found in file</span></summary><div class="shared-fill header-choice"><label>Header row in imported table<input id="header-row" type="number" min="1" value="${data.headerRow + 1}"></label><button class="secondary" id="use-header-row">Use this header row</button></div><div class="mapping-grid">${columns.map((field) => `<label>${labels[field]}<select data-column="${field}"><option value="">Provide below / not in this file</option>${data.headers.map((header, i) => `<option value="${i}" ${mapping[field] === String(i) ? "selected" : ""}>${esc(header)}</option>`).join("")}</select><small>${mapping[field] !== "" ? `Source: ${esc(data.headers[Number(mapping[field])])} · first imported row ${data.headerRow + 2}` : "No match. We will not infer this value."}</small></label>`).join("")}</div><button class="secondary" id="apply-matches">Apply source matches</button><p class="paste-help">Changing matches replaces any manual edits. Generic “salary” and “hourly rate” columns are never treated as CoS requirements.</p></details><div class="notice">${missing.length ? `Still needed: ${missing.map((f) => esc(labels[f])).join(", ")}. Add the missing details below.` : "All fields contain values. Please check them against the original document."} No salary requirements, dates, zero other pay or worker identities are assumed.${/\.pdf$/i.test(name) ? " PDF layout extraction is approximate. Compare every value with your original PDF." : ""}</div><details class="match-details"><summary>Fill a shared value <span>Only when it applies to every row</span></summary><div class="shared-fill"><label>Field<select id="shared-field">${columns.map((f) => `<option value="${f}">${labels[f]}</option>`).join("")}</select></label><label>Confirmed value<input id="shared-value" autocomplete="off" placeholder="Enter a value you have verified"></label><button class="secondary" id="fill-shared">Fill empty cells only</button></div><p class="paste-help">For different workers or different requirements, edit the individual rows. Existing values are never overwritten by this button.</p></details><h3 class="confirm-heading">Confirm the extracted values</h3><p class="paste-help">Every cell is editable. Blank cells require your input. Dates: YYYY-MM-DD or DD/MM/YYYY. For pay frequency use monthly, four_weekly, fortnightly or weekly.</p><div class="table-shell confirm-table" tabindex="0" role="region" aria-label="Editable extracted payroll values"><table><thead><tr><th scope="col">Imported row</th>${columns.map((f) => `<th scope="col">${labels[f]}</th>`).join("")}</tr></thead><tbody>${rows
      .slice(page * pageSize, (page + 1) * pageSize)
      .map((row, offset) => {
        const i = page * pageSize + offset;
        return `<tr><th scope="row">${data.headerRow + i + 2}</th>${columns.map((f) => `<td><input data-row="${i}" data-field="${f}" value="${esc(row[f])}" aria-label="${labels[f]} for row ${i + 1}" class="${row[f] ? "" : "missing-cell"}" placeholder="Required" autocomplete="off"><small>${mapping[f] !== "" ? `Source ${esc(data.headers[Number(mapping[f])])}: ${esc((data.rows[i][Number(mapping[f])] || "blank").slice(0, 80))}` : "Provided by you"}</small></td>`).join("")}</tr>`;
      })
      .join(
        "",
      )}</tbody></table></div><div class="confirm-pagination"><button class="secondary" id="prev-rows" ${page === 0 ? "disabled" : ""}>Previous rows</button><span>Rows ${page * pageSize + 1}–${Math.min(rows.length, (page + 1) * pageSize)} of ${rows.length}</span><button class="secondary" id="next-rows" ${(page + 1) * pageSize >= rows.length ? "disabled" : ""}>Next rows</button></div><label class="confirm-consent"><input type="checkbox" id="confirm-values"> I have checked the extracted values, supplied the missing details and confirmed the CoS requirements. No names or NI numbers are included in the selected fields.</label><div id="mapping-error" class="error" role="alert"></div><div class="sheet-actions"><button class="primary" id="run" disabled>Review payroll →</button><button class="secondary" id="cancel">Choose another file</button></div></section>`;
    container
      .querySelectorAll<HTMLSelectElement>("[data-column]")
      .forEach((select) =>
        select.addEventListener("change", () => {
          dirtyMapping = true;
          (
            container.querySelector("#confirm-values") as HTMLInputElement
          ).checked = false;
          (container.querySelector("#run") as HTMLButtonElement).disabled =
            true;
          error(
            "Apply the changed source matches before confirming the values.",
          );
        }),
      );
    container
      .querySelectorAll<HTMLInputElement>("[data-row]")
      .forEach((input) =>
        input.addEventListener("input", () => {
          rows[Number(input.dataset.row)][input.dataset.field!] = input.value;
          const absent = columns.filter((field) =>
            rows.some((row) => !row[field]),
          );
          container.querySelector(".notice")!.textContent =
            (absent.length
              ? `Still needed: ${absent.map((field) => labels[field]).join(", ")}. Add the missing details below.`
              : "All fields contain values. Please check them against the original document.") +
            " No salary requirements, dates, zero other pay or worker identities are assumed." +
            (/\.pdf$/i.test(name)
              ? " PDF layout extraction is approximate. Compare every value with your original PDF."
              : "");
          input.classList.toggle("missing-cell", !input.value);
          const consent =
            container.querySelector<HTMLInputElement>("#confirm-values")!;
          consent.checked = false;
          (container.querySelector("#run") as HTMLButtonElement).disabled =
            true;
        }),
      );
    container
      .querySelector("#confirm-values")!
      .addEventListener("change", (e) => {
        (container.querySelector("#run") as HTMLButtonElement).disabled =
          dirtyMapping || !(e.target as HTMLInputElement).checked;
      });
    container.querySelector("#apply-matches")!.addEventListener("click", () => {
      try {
        const nextMapping = Object.fromEntries(
          [
            ...container.querySelectorAll<HTMLSelectElement>("[data-column]"),
          ].map((s) => [s.dataset.column!, s.value]),
        );
        rows = recognisedRows(data, nextMapping);
        mapping = nextMapping;
        page = 0;
        render();
      } catch (e) {
        error((e as Error).message);
      }
    });
    container
      .querySelector("#use-header-row")!
      .addEventListener("click", () => {
        try {
          mountConfirmation(
            container,
            csv,
            name,
            onConfirm,
            onCancel,
            Number(
              (container.querySelector("#header-row") as HTMLInputElement)
                .value,
            ) - 1,
          );
        } catch (e) {
          error((e as Error).message);
        }
      });
    container.querySelector("#fill-shared")!.addEventListener("click", () => {
      const field = (
        container.querySelector("#shared-field") as HTMLSelectElement
      ).value;
      const value = (
        container.querySelector("#shared-value") as HTMLInputElement
      ).value;
      if (!value.trim()) {
        error("Enter the shared value first.");
        return;
      }
      rows = rows.map((row) => ({
        ...row,
        [field]: row[field] || normaliseValue(field, value),
      }));
      render();
    });
    container.querySelector("#prev-rows")!.addEventListener("click", () => {
      page--;
      render();
    });
    container.querySelector("#next-rows")!.addEventListener("click", () => {
      page++;
      render();
    });
    container.querySelector("#cancel")!.addEventListener("click", onCancel);
    container.querySelector("#run")!.addEventListener("click", () => {
      try {
        onConfirm(validateConfirmedRows(rows));
      } catch (e) {
        error((e as Error).message);
      }
    });
  }
  render();
}
