'use strict';

// Only these public display values are addressable: never walk arbitrary
// document properties or evaluate expressions supplied in a format string.
const CONTEXT_KEYS = new Set(['card.title', 'board.title', 'list.title', 'swimlane.title']);
const TOKENS = /\$\{(?:[^"{}]|"(?:\\.|[^"\\])*")*\}|%\{[^{}]*\}|\{%[^{}]*\}/g;

function formatStringTemplate(rawValue, format, separator = '', context = {}) {
  if (!Array.isArray(rawValue) || typeof format !== 'string') return '';
  return rawValue.filter(value => typeof value === 'string' && value.trim())
    .map(value => format.replace(TOKENS, token => {
      if (token.startsWith('${')) {
        // Retain the existing JSON regex/flags/replace syntax. A malformed
        // format remains visible rather than becoming the word "undefined".
        try {
          const spec = JSON.parse(token.slice(1));
          if (typeof spec.regex !== 'string' || typeof spec.replace !== 'string' ||
              (spec.flags !== undefined && typeof spec.flags !== 'string')) return token;
          return value.replace(new RegExp(spec.regex, spec.flags), spec.replace);
        } catch (error) { return token; }
      }
      const expression = token.slice(2, -1);
      const [name, modifier, ...extra] = expression.toLowerCase().split('|');
      if (extra.length || (modifier !== undefined && modifier !== 'urlencode')) return token;
      let result;
      if (name === 'value') result = value;
      else if (CONTEXT_KEYS.has(name) && Object.hasOwn(context, name)) result = context[name];
      if (typeof result !== 'string') return token;
      if (modifier === 'urlencode') {
        try { return encodeURIComponent(result); }
        catch (error) { return token; }
      }
      return result;
    })).join(separator ?? '');
}

module.exports = { formatStringTemplate };
