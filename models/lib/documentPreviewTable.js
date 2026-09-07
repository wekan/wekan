'use strict';

const TABLE_OPEN = '<table border="1" cellspacing="0" cellpadding="4">';
const STYLE_PART = /^(?:font-weight:bold|font-style:italic|color:#[0-9A-F]{6}|background-color:#[0-9A-F]{6}|text-align:(?:left|center|right))$/;

function safeDocumentTableHtml(value) {
  const html = String(value || '');
  if (!html || html.length > 2 * 1024 * 1024
    || !html.startsWith(TABLE_OPEN) || !html.endsWith('</table>')) return '';
  let rows = html.slice(TABLE_OPEN.length, -8);
  while (rows) {
    const row = /^<tr>((?:.|\n)*?)<\/tr>/.exec(rows);
    if (!row) return '';
    let cells = row[1];
    while (cells) {
      const cell = /^<td(?: style="([^"]*)")?>([^<]*)<\/td>/.exec(cells);
      if (!cell) return '';
      if (cell[1] && cell[1].split(';').some(part => !STYLE_PART.test(part))) return '';
      cells = cells.slice(cell[0].length);
    }
    rows = rows.slice(row[0].length);
  }
  return html;
}

module.exports = { safeDocumentTableHtml };
