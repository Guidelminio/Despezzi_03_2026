export function buildPtBrCsv(rows: Array<Array<string | number | null | undefined>>): string {
  const escapeCell = (value: string | number | null | undefined) => {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  return `\uFEFF${rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')}`;
}
