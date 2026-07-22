export type CsvCell = string | number | boolean | null | undefined;
export type CsvRow = Record<string, CsvCell>;

function escapeCsvCell(value: CsvCell) {
  const text = value === null || value === undefined ? "" : String(value);

  if (!/[",\n\r;]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll("\"", "\"\"")}"`;
}

export function downloadCsv(filename: string, rows: CsvRow[]) {
  if (!import.meta.client || !rows.length) {
    return;
  }

  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.map(escapeCsvCell).join(";"),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(";"))
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}