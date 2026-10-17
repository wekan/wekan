'use strict';

// Search phrases in plain language (docs/Features/Pages/Search-Phrases.md):
// "my overdue cards printer" -> "user:alice due:overdue printer". Jira turns
// plain language into JQL with AI; here it is a phrase table, one translation
// key per phrase, longest phrase first, and the English phrase works in every
// language.
//
// Pure, no Meteor. Tests: tests/searchPhrases.test.cjs.

// Each phrase is a list of [operator, predicate] pairs. A predicate is the
// i18n key of a predicate (predicate-*), a number, or 'me' for the reader.
const PHRASES = [
  { key: 'search-phrase-my-overdue-cards', en: 'my overdue cards', ops: [['user', 'me'], ['due', 'predicate-overdue']] },
  { key: 'search-phrase-my-cards', en: 'my cards', ops: [['user', 'me']] },
  { key: 'search-phrase-overdue-cards', en: 'overdue cards', ops: [['due', 'predicate-overdue']] },
  { key: 'search-phrase-due-this-week', en: 'due this week', ops: [['due', 7]] },
  { key: 'search-phrase-unassigned-cards', en: 'unassigned cards', ops: [['has', '-predicate-assignee']] },
  { key: 'search-phrase-cards-without-due-date', en: 'cards without due date', ops: [['has', '-predicate-due']] },
  { key: 'search-phrase-created-today', en: 'created today', ops: [['created', 1]] },
  { key: 'search-phrase-changed-this-week', en: 'changed this week', ops: [['modified', 7]] },
  { key: 'search-phrase-archived-cards', en: 'archived cards', ops: [['status', 'predicate-archived']] },
  { key: 'search-phrase-cards-with-attachments', en: 'cards with attachments', ops: [['has', 'predicate-attachment']] },
];

const words = text => String(text || '').normalize('NFC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);

// Any `name:` in the query means the reader already wrote operators.
function hasOperator(text) {
  return /(^|\s)-?[^\s:]+:\S/u.test(String(text || ''));
}

// translate(key) gives the reader's language; username is the reader's.
// Returns { query, matched } - matched false when nothing was rewritten.
function rewriteSearchPhrases(text, { translate = key => key, username = '' } = {}) {
  const original = String(text || '').trim();
  if (!original || hasOperator(original)) return { query: original, matched: false };
  const candidates = [];
  for (const phrase of PHRASES) {
    for (const form of new Set([translate(phrase.key), phrase.en])) {
      const w = words(form);
      if (w.length) candidates.push({ words: w, phrase });
    }
  }
  candidates.sort((a, b) => b.words.length - a.words.length);

  const tokens = original.split(/\s+/);
  const lower = tokens.map(t => t.normalize('NFC').toLocaleLowerCase());
  const ops = [];
  const rest = [];
  let matched = false;
  for (let i = 0; i < tokens.length;) {
    const hit = candidates.find(c => c.words.every((w, j) => lower[i + j] === w));
    if (hit) {
      matched = true;
      ops.push(...hit.phrase.ops);
      i += hit.words.length;
    } else {
      rest.push(tokens[i]);
      i += 1;
    }
  }
  if (!matched) return { query: original, matched: false };
  const operator = name => translate(`operator-${name}`);
  const value = v => {
    if (v === 'me') return username;
    if (typeof v === 'number') return String(v);
    return v.startsWith('-') ? `-${translate(v.slice(1))}` : translate(v);
  };
  const seen = new Set();
  const parts = [];
  for (const [name, v] of ops) {
    const part = `${operator(name)}:${value(v)}`;
    if (!seen.has(part) && value(v)) { seen.add(part); parts.push(part); }
  }
  return { query: [...parts, ...rest].join(' '), matched: true };
}

module.exports = { PHRASES, hasOperator, rewriteSearchPhrases };
