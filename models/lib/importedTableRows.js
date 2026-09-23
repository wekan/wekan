// CSV parsers represent trailing newlines as empty rows. Keep the header and
// every row containing data, including numeric zero or an empty title with text.
export function importedTableRows(rows) {
  return rows.filter((row, index) => index === 0 || row.some(
    value => value != null && String(value).trim() !== '',
  ));
}
