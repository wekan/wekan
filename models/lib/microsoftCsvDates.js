// Dates in the CSV files Microsoft's web apps write - Azure DevOps Boards'
// "Export to CSV" and Microsoft Lists' "Export to CSV" - read in plain
// JavaScript (tests/azureDevOpsCsv.test.cjs, tests/msListsCsv.test.cjs).
//
// Both write a date in the exporting user's regional format: "11/20/2026
// 3:14:00 PM" for en-US, "20.11.2026 15.14" for fi-FI, "20/11/2026 15:14"
// for en-GB; Lists' "Export to CSV with schema" and Azure DevOps' REST
// answers use ISO 8601. A slash date whose first part is above 12 anywhere
// in the file is day first, and so is every other slash date of that file;
// a dotted date is always day first.

const SLASH = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T]+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp][Mm])?)?$/;
const DOTTED = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T]+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?)?$/;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// 'dmy' when a slash date of these values can only be day first, else 'mdy'.
export function slashOrder(values) {
  for (const value of values || []) {
    const match = SLASH.exec(String(value || '').trim());
    if (match && Number(match[1]) > 12) return 'dmy';
  }
  return 'mdy';
}

const valid = (y, m, d, hh = 0, mm = 0, ss = 0) => {
  if (m < 1 || m > 12 || d < 1 || d > 31 || hh > 23 || mm > 59 || ss > 59) return undefined;
  const date = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
  return date.getUTCMonth() === m - 1 ? date.toISOString() : undefined;
};

// An ISO string, '' for an empty cell, undefined for one that is not a date.
// A date without a time zone is read as UTC, as both apps' exports have none.
export function microsoftCsvDate(value, order = 'mdy') {
  const text = String(value == null ? '' : value).trim();
  if (!text) return '';
  let match = SLASH.exec(text);
  if (match) {
    let hour = Number(match[4] || 0);
    const meridiem = (match[7] || '').toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    const [a, b] = [Number(match[1]), Number(match[2])];
    return order === 'dmy' ? valid(Number(match[3]), b, a, hour, Number(match[5] || 0), Number(match[6] || 0))
      : valid(Number(match[3]), a, b, hour, Number(match[5] || 0), Number(match[6] || 0));
  }
  match = DOTTED.exec(text);
  if (match) {
    return valid(Number(match[3]), Number(match[2]), Number(match[1]), Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0));
  }
  if (ISO_DAY.test(text)) {
    const [y, m, d] = text.split('-').map(Number);
    return valid(y, m, d);
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) {
    const date = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text}Z`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
}

// A cell of a CSV both apps read back: quoted when it has to be.
export const csvCell = value => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// A date as YYYY-MM-DD, which both apps' CSV import read in every locale.
export const csvDay = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};
