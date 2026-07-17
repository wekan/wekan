// Pure helpers for the sidebar "Advanced filter" (no Meteor imports, so the
// logic is unit-testable with plain Node — see tests/advancedFilterDate.test.cjs).
//
// #2989 "Date custom field, filter problem": filtering a date-type custom
// field with `'Date de fin' == '06/04/2020'` never matched anything, for two
// independent reasons fixed here:
//
// 1. Tokenizer: inside a '…'-quoted value every '/' toggled the tokenizer's
//    string mode (it is also the regex delimiter), so '06/04/2020' came out
//    flagged as a regex and the whole filter string failed to parse (the
//    filter silently fell back to the last valid selector).
// 2. Selector: date custom-field values are stored as Date objects (the date
//    picker calls card.setCustomField(id, date)), but the '==' selector
//    compared them with {$in: ['06/04/2020', NaN]} — a string and a number
//    never equal a BSON date, so '==' matched nothing while '!=' matched
//    everything. parseAdvancedFilterDate()/buildDateValueSelector() translate
//    the typed date into a Date range selector instead.

// --- Tokenizer ---------------------------------------------------------------

/**
 * Split an advanced-filter string into commands.
 * Returns [{cmd, string, regex}, …]:
 *   - '…' quotes a literal string (may contain spaces and slashes),
 *   - /…/  delimits a regex (only when not inside a '…' string),
 *   - '\'  escapes the next character outside strings,
 *   - space separates commands.
 */
export function tokenizeAdvancedFilter(filter) {
  const commands = [];
  let current = '';
  let string = false;
  let regex = false;
  let wasString = false;
  let ignore = false;
  for (let i = 0; i < filter.length; i++) {
    const char = filter.charAt(i);
    if (ignore) {
      ignore = false;
      current += char;
      continue;
    }
    // '/' starts/ends a regex — but inside a '…'-quoted string it is a plain
    // character (#2989: dates like '06/04/2020' must stay literal strings).
    if (char === '/' && (!string || regex)) {
      string = !string;
      if (string) regex = true;
      current += char;
      continue;
    }
    // eslint-disable-next-line quotes
    if (char === "'" && !regex) {
      string = !string;
      if (string) wasString = true;
      continue;
    }
    if (char === '\\' && !string) {
      ignore = true;
      continue;
    }
    if (char === ' ' && !string) {
      commands.push({
        cmd: current,
        string: wasString,
        regex,
      });
      wasString = false;
      regex = false;
      current = '';
      continue;
    }
    current += char;
  }
  if (current !== '') {
    commands.push({
      cmd: current,
      string: wasString,
      regex,
    });
  }
  return commands;
}

// --- Date parsing ------------------------------------------------------------

// YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD, optional " HH:mm[:ss]" (or T separator)
const YMD_RE = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
// DD/MM/YYYY or MM/DD/YYYY (separators -, / or .), optional time as above
const DMY_RE = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

function buildRange(year, month, day, hour, minute, second) {
  // Validate by round-trip: new Date() rolls over out-of-range components
  // (e.g. 31 February becomes 2/3 March), which must be rejected.
  const hasTime = hour !== undefined;
  const hasSeconds = second !== undefined;
  const h = hasTime ? Number(hour) : 0;
  const min = hasTime ? Number(minute) : 0;
  const s = hasSeconds ? Number(second) : 0;
  const start = new Date(year, month - 1, day, h, min, s);
  if (
    start.getFullYear() !== year ||
    start.getMonth() !== month - 1 ||
    start.getDate() !== day ||
    start.getHours() !== h ||
    start.getMinutes() !== min ||
    start.getSeconds() !== s
  ) {
    return null;
  }
  let end;
  if (hasSeconds) {
    end = new Date(year, month - 1, day, h, min, s + 1);
  } else if (hasTime) {
    end = new Date(year, month - 1, day, h, min + 1);
  } else {
    end = new Date(year, month - 1, day + 1);
  }
  return { start, end };
}

/**
 * Parse a date typed in the advanced filter into a {start, end} range
 * (half-open: start inclusive, end exclusive) in the local timezone.
 * The range spans the given day, minute or second depending on how much
 * precision the user typed. Returns null when the string is not a date.
 *
 * options.dayFirst resolves ambiguous "a/b/yyyy" input (both a and b <= 12):
 * true reads it day-first (DD/MM/YYYY, e.g. French locale), false month-first.
 * Unambiguous input (one component > 12) ignores the flag.
 */
export function parseAdvancedFilterDate(str, options = {}) {
  if (typeof str !== 'string') return null;
  const dayFirst = !!options.dayFirst;
  const trimmed = str.trim();
  let m = trimmed.match(YMD_RE);
  if (m) {
    return buildRange(
      Number(m[1]),
      Number(m[2]),
      Number(m[3]),
      m[4],
      m[5],
      m[6],
    );
  }
  m = trimmed.match(DMY_RE);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const year = Number(m[3]);
    let day;
    let month;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    } else if (b > 12 && a <= 12) {
      day = b;
      month = a;
    } else if (dayFirst) {
      day = a;
      month = b;
    } else {
      month = a;
      day = b;
    }
    return buildRange(year, month, day, m[4], m[5], m[6]);
  }
  return null;
}

// --- Selector building -------------------------------------------------------

/**
 * Build the Mongo operator document for 'customFields.value' comparing a
 * Date-typed custom field against the {start, end} range from
 * parseAdvancedFilterDate(). Returns null for unknown operators.
 */
export function buildDateValueSelector(op, range) {
  if (!range) return null;
  switch (op) {
    case '=':
    case '==':
    case '===':
      return { $gte: range.start, $lt: range.end };
    case '!=':
    case '!==':
      return { $not: { $gte: range.start, $lt: range.end } };
    case '>':
    case 'gt':
    case 'Gt':
    case 'GT':
      return { $gte: range.end };
    case '>=':
    case '>==':
    case 'gte':
    case 'Gte':
    case 'GTE':
      return { $gte: range.start };
    case '<':
    case 'lt':
    case 'Lt':
    case 'LT':
      return { $lt: range.start };
    case '<=':
    case '<==':
    case 'lte':
    case 'Lte':
    case 'LTE':
      return { $lt: range.end };
    default:
      return null;
  }
}
