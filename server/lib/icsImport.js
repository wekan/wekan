/**
 * icsImport.js — pure, dependency-free iCalendar (.ics, RFC 5545) parser
 * for WeKan issue #6323 (part 1: import only).
 *
 * This module turns the VEVENT blocks of an iCalendar file into plain
 * JavaScript objects, and then into WeKan card-shaped objects so that the
 * imported events show up on the Calendar / Gantt views (via startAt / dueAt).
 *
 * It intentionally has NO npm / Meteor dependencies so that it is trivial to
 * unit-test and reuse from any context. All parsing is done with plain string
 * operations and small regexes.
 *
 * NOTE: This covers ONE direction only (Google Calendar .ics -> WeKan cards).
 * Two-way Google Calendar sync is out of scope. For read-only export the other
 * direction (WeKan -> iCal feed) see the separate `wekan-ical-server` project.
 */

/**
 * Unfold RFC 5545 folded lines.
 *
 * Long content lines may be split across multiple physical lines; any line
 * that begins with a space or a horizontal tab is a continuation of the
 * previous line and the leading whitespace must be removed when joining.
 *
 * @param {string} icsText raw .ics text
 * @returns {string[]} array of logical (unfolded) lines
 */
function unfoldLines(icsText) {
  if (typeof icsText !== 'string' || icsText.length === 0) {
    return [];
  }

  // Normalize CRLF / CR to LF, then split into physical lines.
  const physicalLines = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const logicalLines = [];
  for (const line of physicalLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && logicalLines.length > 0) {
      // Continuation: strip the single leading whitespace char and append.
      logicalLines[logicalLines.length - 1] += line.slice(1);
    } else {
      logicalLines.push(line);
    }
  }
  return logicalLines;
}

/**
 * Split a content line into its name (with parameters) and value.
 *
 * A content line looks like:  NAME;PARAM=val;PARAM2=val:VALUE
 * The first unquoted colon separates the property part from the value.
 *
 * @param {string} line a single unfolded content line
 * @returns {{ name: string, params: Object, value: string } | null}
 */
function parseContentLine(line) {
  if (!line) {
    return null;
  }

  // Find the first colon that is not inside a double-quoted parameter value.
  let inQuotes = false;
  let colonIndex = -1;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ':' && !inQuotes) {
      colonIndex = i;
      break;
    }
  }
  if (colonIndex === -1) {
    return null;
  }

  const propertyPart = line.slice(0, colonIndex);
  const value = line.slice(colonIndex + 1);

  // propertyPart: NAME or NAME;PARAM=val;PARAM2=val
  const propertySegments = propertyPart.split(';');
  const name = propertySegments[0].toUpperCase();

  const params = {};
  for (let i = 1; i < propertySegments.length; i += 1) {
    const segment = propertySegments[i];
    const eqIndex = segment.indexOf('=');
    if (eqIndex !== -1) {
      const paramName = segment.slice(0, eqIndex).toUpperCase();
      let paramValue = segment.slice(eqIndex + 1);
      // Strip surrounding quotes from parameter values.
      if (paramValue.startsWith('"') && paramValue.endsWith('"')) {
        paramValue = paramValue.slice(1, -1);
      }
      params[paramName] = paramValue;
    }
  }

  return { name, params, value };
}

/**
 * Unescape an iCalendar TEXT value (RFC 5545 section 3.3.11).
 *
 * Escaped sequences:  \\n or \\N -> newline, \\, -> comma, \\; -> semicolon,
 * \\\\ -> backslash.
 *
 * @param {string} text raw escaped TEXT value
 * @returns {string}
 */
function unescapeText(text) {
  if (typeof text !== 'string') {
    return '';
  }
  let result = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) {
      const next = text[i + 1];
      if (next === 'n' || next === 'N') {
        result += '\n';
        i += 1;
      } else if (next === ',' || next === ';' || next === '\\') {
        result += next;
        i += 1;
      } else {
        // Unknown escape: keep the backslash literally.
        result += ch;
      }
    } else {
      result += ch;
    }
  }
  return result;
}

/**
 * Parse an iCalendar date or date-time value into a JS Date.
 *
 * Supported forms:
 *   - Date only:        YYYYMMDD               (e.g. all-day events)
 *   - Date-time UTC:    YYYYMMDDTHHMMSSZ
 *   - Date-time local:  YYYYMMDDTHHMMSS        (treated as UTC, best-effort)
 *
 * @param {string} value the raw property value
 * @returns {Date|null} a Date, or null if it cannot be parsed
 */
function parseIcsDate(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();

  // Date-time form: YYYYMMDDTHHMMSS with optional trailing Z.
  const dateTimeMatch = trimmed.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/,
  );
  if (dateTimeMatch) {
    const [, y, mo, d, h, mi, s] = dateTimeMatch;
    // Both UTC ("Z") and floating local times are treated as UTC here so that
    // parsing is deterministic and independent of the server timezone.
    return new Date(
      Date.UTC(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h),
        Number(mi),
        Number(s),
      ),
    );
  }

  // Date-only form: YYYYMMDD (all-day). Anchored at UTC midnight.
  const dateMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateMatch) {
    const [, y, mo, d] = dateMatch;
    return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), 0, 0, 0));
  }

  return null;
}

/**
 * Parse an iCalendar (.ics) string into an array of VEVENT objects.
 *
 * @param {string} icsText raw .ics file contents
 * @returns {Array<{ summary: string, description: string, start: Date|null, end: Date|null, uid: string }>}
 */
export function parseIcs(icsText) {
  const lines = unfoldLines(icsText);
  if (lines.length === 0) {
    return [];
  }

  const events = [];
  let current = null;

  for (const rawLine of lines) {
    if (rawLine === '') {
      continue;
    }

    // Cheap checks first to avoid parsing every single line.
    const upper = rawLine.toUpperCase();
    if (upper === 'BEGIN:VEVENT') {
      current = { summary: '', description: '', start: null, end: null, uid: '' };
      continue;
    }
    if (upper === 'END:VEVENT') {
      if (current) {
        events.push(current);
      }
      current = null;
      continue;
    }
    if (!current) {
      // Outside any VEVENT (e.g. VCALENDAR header / VTIMEZONE) — ignore.
      continue;
    }

    const parsed = parseContentLine(rawLine);
    if (!parsed) {
      continue;
    }

    switch (parsed.name) {
      case 'SUMMARY':
        current.summary = unescapeText(parsed.value);
        break;
      case 'DESCRIPTION':
        current.description = unescapeText(parsed.value);
        break;
      case 'DTSTART':
        current.start = parseIcsDate(parsed.value);
        break;
      case 'DTEND':
        current.end = parseIcsDate(parsed.value);
        break;
      case 'UID':
        current.uid = parsed.value;
        break;
      default:
        break;
    }
  }

  return events;
}

/**
 * Map a parsed iCalendar event to a WeKan card-shaped object.
 *
 * @param {Object} event a parsed VEVENT (see parseIcs)
 * @param {Object} [opts]
 * @param {string} [opts.boardId]
 * @param {string} [opts.listId]
 * @param {string} [opts.swimlaneId]
 * @returns {{ title: string, description: string, startAt: Date|null, dueAt: Date|null, boardId: (string|undefined), listId: (string|undefined), swimlaneId: (string|undefined) }}
 */
export function icsEventToCard(event, { boardId, listId, swimlaneId } = {}) {
  const safeEvent = event || {};
  return {
    title: safeEvent.summary || '',
    description: safeEvent.description || '',
    startAt: safeEvent.start || null,
    // dueAt falls back to the start date when there is no explicit end.
    dueAt: safeEvent.end || safeEvent.start || null,
    boardId,
    listId,
    swimlaneId,
  };
}

/**
 * Parse an .ics string and map every VEVENT to a WeKan card-shaped object.
 *
 * @param {string} icsText raw .ics file contents
 * @param {Object} [opts] passed through to icsEventToCard ({ boardId, listId, swimlaneId })
 * @returns {Array<Object>} array of card-shaped objects
 */
export function icsToCards(icsText, opts) {
  return parseIcs(icsText).map(event => icsEventToCard(event, opts));
}
