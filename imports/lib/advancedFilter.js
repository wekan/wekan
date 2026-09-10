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

// --- Command-array -> Mongo selector -----------------------------------------
//
// #3092: this is the exact selector-building algorithm the sidebar's
// "Advanced Filter" (client/lib/filter.js AdvancedFilter class) uses to turn
// a typed filter string into the Mongo selector it filters the board with.
// It is isomorphic (no Tracker/ReactiveCache import) so a Rule trigger can
// call the SAME function server-side to decide whether a card matches a
// stored advanced-filter string, instead of re-implementing the parser. Only
// the three lookups that need live board data (custom field name -> id,
// dropdown value -> id, date-typed custom field range) are injected via
// `resolvers`, so the client can back them with ReactiveCache and the server
// can back them with a synchronous, pre-fetched lookup built from the same
// CustomFields documents.

function processConditions(commands, resolvers) {
  for (let i = 0; i < commands.length; i++) {
    if (!commands[i].string && commands[i].cmd) {
      switch (commands[i].cmd) {
        case '=':
        case '==':
        case '===': {
          const field = commands[i - 1].cmd;
          const str = commands[i + 1].cmd;
          if (commands[i + 1].regex) {
            const match = str.match(new RegExp('^/(.*?)/([gimy]*)$'));
            let regex = null;
            if (match.length > 2) regex = new RegExp(match[1], match[2]);
            else regex = new RegExp(match[1]);
            commands[i] = {
              'customFields._id': resolvers.fieldNameToId(field),
              'customFields.value': regex,
            };
          } else {
            commands[i] = {
              'customFields._id': resolvers.fieldNameToId(field),
              'customFields.value': resolvers.customFieldDateSelector(
                field,
                str,
                commands[i].cmd,
              ) || {
                $in: [resolvers.fieldValueToId(field, str), parseInt(str, 10)],
              },
            };
          }
          commands.splice(i - 1, 1);
          commands.splice(i, 1);
          i--;
          break;
        }
        case '!=':
        case '!==': {
          const field = commands[i - 1].cmd;
          const str = commands[i + 1].cmd;
          if (commands[i + 1].regex) {
            const match = str.match(new RegExp('^/(.*?)/([gimy]*)$'));
            let regex = null;
            if (match.length > 2) regex = new RegExp(match[1], match[2]);
            else regex = new RegExp(match[1]);
            commands[i] = {
              'customFields._id': resolvers.fieldNameToId(field),
              'customFields.value': {
                $not: regex,
              },
            };
          } else {
            commands[i] = {
              'customFields._id': resolvers.fieldNameToId(field),
              'customFields.value': resolvers.customFieldDateSelector(
                field,
                str,
                commands[i].cmd,
              ) || {
                $not: {
                  $in: [resolvers.fieldValueToId(field, str), parseInt(str, 10)],
                },
              },
            };
          }
          commands.splice(i - 1, 1);
          commands.splice(i, 1);
          i--;
          break;
        }
        case '>':
        case 'gt':
        case 'Gt':
        case 'GT': {
          const field = commands[i - 1].cmd;
          const str = commands[i + 1].cmd;
          commands[i] = {
            'customFields._id': resolvers.fieldNameToId(field),
            'customFields.value': resolvers.customFieldDateSelector(
              field,
              str,
              commands[i].cmd,
            ) || {
              $gt: parseInt(str, 10),
            },
          };
          commands.splice(i - 1, 1);
          commands.splice(i, 1);
          i--;
          break;
        }
        case '>=':
        case '>==':
        case 'gte':
        case 'Gte':
        case 'GTE': {
          const field = commands[i - 1].cmd;
          const str = commands[i + 1].cmd;
          commands[i] = {
            'customFields._id': resolvers.fieldNameToId(field),
            'customFields.value': resolvers.customFieldDateSelector(
              field,
              str,
              commands[i].cmd,
            ) || {
              $gte: parseInt(str, 10),
            },
          };
          commands.splice(i - 1, 1);
          commands.splice(i, 1);
          i--;
          break;
        }
        case '<':
        case 'lt':
        case 'Lt':
        case 'LT': {
          const field = commands[i - 1].cmd;
          const str = commands[i + 1].cmd;
          commands[i] = {
            'customFields._id': resolvers.fieldNameToId(field),
            'customFields.value': resolvers.customFieldDateSelector(
              field,
              str,
              commands[i].cmd,
            ) || {
              $lt: parseInt(str, 10),
            },
          };
          commands.splice(i - 1, 1);
          commands.splice(i, 1);
          i--;
          break;
        }
        case '<=':
        case '<==':
        case 'lte':
        case 'Lte':
        case 'LTE': {
          const field = commands[i - 1].cmd;
          const str = commands[i + 1].cmd;
          commands[i] = {
            'customFields._id': resolvers.fieldNameToId(field),
            'customFields.value': resolvers.customFieldDateSelector(
              field,
              str,
              commands[i].cmd,
            ) || {
              $lte: parseInt(str, 10),
            },
          };
          commands.splice(i - 1, 1);
          commands.splice(i, 1);
          i--;
          break;
        }
        default:
          break;
      }
    }
  }
}

function processLogicalOperators(commands) {
  for (let i = 0; i < commands.length; i++) {
    if (!commands[i].string && commands[i].cmd) {
      switch (commands[i].cmd) {
        case 'or':
        case 'Or':
        case 'OR':
        case '|':
        case '||': {
          const op1 = commands[i - 1];
          const op2 = commands[i + 1];
          commands[i] = {
            $or: [op1, op2],
          };
          commands.splice(i - 1, 1);
          commands.splice(i, 1);
          i--;
          break;
        }
        case 'and':
        case 'And':
        case 'AND':
        case '&':
        case '&&': {
          const op1 = commands[i - 1];
          const op2 = commands[i + 1];
          commands[i] = {
            $and: [op1, op2],
          };
          commands.splice(i - 1, 1);
          commands.splice(i, 1);
          i--;
          break;
        }
        case 'not':
        case 'Not':
        case 'NOT':
        case '!': {
          const op1 = commands[i + 1];
          commands[i] = {
            $not: op1,
          };
          commands.splice(i + 1, 1);
          i--;
          break;
        }
        default:
          break;
      }
    }
  }
}

function processSubCommands(commands, resolvers) {
  const subcommands = [];
  let level = 0;
  let start = -1;
  for (let i = 0; i < commands.length; i++) {
    if (commands[i].cmd) {
      switch (commands[i].cmd) {
        case '(': {
          level++;
          if (start === -1) start = i;
          continue;
        }
        case ')': {
          level--;
          commands.splice(i, 1);
          i--;
          continue;
        }
        default: {
          if (level > 0) {
            subcommands.push(commands[i]);
            commands.splice(i, 1);
            i--;
            continue;
          }
        }
      }
    }
  }
  if (start !== -1) {
    processSubCommands(subcommands, resolvers);
    if (subcommands.length === 1) commands.splice(start, 0, subcommands[0]);
    else commands.splice(start, 0, subcommands);
  }
  processConditions(commands, resolvers);
  processLogicalOperators(commands);
}

/**
 * Turn an already-tokenized advanced-filter command array into the same
 * `{ $or: [...] }` Mongo selector the sidebar's Advanced Filter builds.
 * `resolvers` supplies the three lookups that need live board data:
 *   - fieldNameToId(fieldName) -> custom field _id
 *   - fieldValueToId(fieldName, value) -> dropdown item _id (or value itself)
 *   - customFieldDateSelector(fieldName, str, op) -> operator doc, or null
 * Mutates `commands`; callers that still need the original array should pass
 * a copy.
 */
export function advancedFilterCommandsToSelector(commands, resolvers) {
  processSubCommands(commands, resolvers);
  return { $or: commands };
}

/**
 * Convenience wrapper: tokenize + build the selector in one call, the same
 * two steps client/lib/filter.js's AdvancedFilter._getMongoSelector() and the
 * "card matches advanced filter" rule trigger both perform.
 */
export function advancedFilterStringToSelector(filterString, resolvers) {
  return advancedFilterCommandsToSelector(
    tokenizeAdvancedFilter(filterString),
    resolvers,
  );
}

// --- Synchronous resolvers from a pre-fetched custom-field list -------------

/**
 * #3092: build the same resolver shape client/lib/filter.js's AdvancedFilter
 * class backs with (synchronous, on the client) ReactiveCache, but from a
 * plain pre-fetched array of the board's custom field documents instead —
 * so server/lib/advancedFilterMatch.js (which must pre-fetch on the server,
 * since Meteor 3 collections are async there) can call the exact same
 * advancedFilterStringToSelector() with no Meteor/ReactiveCache dependency
 * inside this file.
 */
export function buildAdvancedFilterResolversFromCustomFields(customFields, options = {}) {
  const dayFirst = !!options.dayFirst;
  const byName = new Map();
  (customFields || []).forEach(cf => byName.set(cf.name, cf));

  const fieldNameToId = field => {
    const found = byName.get(field);
    return found && found._id;
  };

  const fieldValueToId = (field, value) => {
    const found = byName.get(field);
    if (
      found &&
      found.settings &&
      found.settings.dropdownItems &&
      found.settings.dropdownItems.length > 0
    ) {
      for (let i = 0; i < found.settings.dropdownItems.length; i++) {
        if (found.settings.dropdownItems[i].name === value) {
          return found.settings.dropdownItems[i]._id;
        }
      }
    }
    return value;
  };

  const customFieldDateSelector = (field, str, op) => {
    const found = byName.get(field);
    if (!found || found.type !== 'date') return null;
    const range = parseAdvancedFilterDate(str, { dayFirst });
    if (!range) return null;
    return buildDateValueSelector(op, range);
  };

  return { fieldNameToId, fieldValueToId, customFieldDateSelector };
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
