export const DEFAULT_LIMIT = 25;
export const OPERATOR_ASSIGNEE = 'assignees';
export const OPERATOR_COMMENT = 'comment';
export const OPERATOR_CREATED_AT = 'createdAt';
export const OPERATOR_CREATOR = 'userId';
export const OPERATOR_DEBUG = 'debug';
export const OPERATOR_DUE = 'dueAt';
export const OPERATOR_BOARD = 'board';
export const OPERATOR_HAS = 'has';
export const OPERATOR_LABEL = 'label';
export const OPERATOR_LIMIT = 'limit';
export const OPERATOR_LIST = 'list';
export const OPERATOR_MEMBER = 'members';
export const OPERATOR_MODIFIED_AT = 'modifiedAt';
export const OPERATOR_ORG = 'org';
export const OPERATOR_SORT = 'sort';
export const OPERATOR_STATUS = 'status';
export const OPERATOR_SWIMLANE = 'swimlane';
export const OPERATOR_TEAM = 'team';
export const OPERATOR_UNKNOWN = 'unknown';
export const OPERATOR_USER = 'user';
export const OPERATOR_TITLE = 'title';
// #5006 "feature request: Search for card number/#": the number a board shows on
// a card and refers to it by. `cardNumber` is the field, so the operator is
// named for what it searches, like every other one here.
export const OPERATOR_NUMBER = 'cardNumber';
export const OPERATOR_DESCRIPTION = 'description';
export const OPERATOR_CUSTOMFIELD = 'customfield';
export const OPERATOR_ATTACHMENT_TEXT = 'attachment-text';
export const OPERATOR_CHECKLIST_TEXT = 'checklist-text';
export const ORDER_ASCENDING = 'asc';
export const ORDER_DESCENDING = 'des';
export const PREDICATE_ALL = 'all';
export const PREDICATE_ARCHIVED = 'archived';
export const PREDICATE_ASSIGNEES = 'assignees';
export const PREDICATE_ATTACHMENT = 'attachment';
export const PREDICATE_CHECKLIST = 'checklist';
export const PREDICATE_CREATED_AT = 'createdAt';
export const PREDICATE_DESCRIPTION = 'description';
export const PREDICATE_DUE_AT = 'dueAt';
export const PREDICATE_END_AT = 'endAt';
export const PREDICATE_ENDED = 'ended';
export const PREDICATE_MEMBERS = 'members';
export const PREDICATE_MODIFIED_AT = 'modifiedAt';
export const PREDICATE_MONTH = 'month';
export const PREDICATE_OPEN = 'open';
export const PREDICATE_OVERDUE = 'overdue';
export const PREDICATE_PROJECTION = 'projection';
export const PREDICATE_PRIVATE = 'private';
export const PREDICATE_PUBLIC = 'public';
export const PREDICATE_QUARTER = 'quarter';
export const PREDICATE_SELECTOR = 'selector';
export const PREDICATE_START_AT = 'startAt';
export const PREDICATE_SYSTEM = 'system';
export const PREDICATE_WEEK = 'week';
export const PREDICATE_YEAR = 'year';

// Translated search operators of more than one word (2026-11-24). The parser
// reads an operator as letters and marks followed by ":", so a translation
// with a space, a hyphen or a stray "|" could never be typed: 450 operator
// words in 142 languages were like that. Each operator is also known by its
// compact form - every character that is not a letter or a mark taken out -
// and a query that types it as the help shows it is rewritten to that form.
// tests/searchOperatorWords.test.cjs.
export function compactOperatorWord(name) {
  return String(name || '').toLowerCase().replace(/[^\p{Letter}\p{Mark}'’]/gu, '');
}

export function rewriteMultiWordOperators(query, names) {
  let out = String(query || '');
  const multi = [...new Set((names || []).map(n => String(n || '').toLowerCase()))]
    .filter(n => compactOperatorWord(n) && compactOperatorWord(n) !== n)
    .sort((a, b) => b.length - a.length);
  for (const name of multi) {
    const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`(^|\\s|-)${escaped}\\s*:`, 'giu'),
      (whole, lead) => `${lead}${compactOperatorWord(name)}:`);
  }
  return out;
}

// Operator words a language used before they were corrected, kept working:
// people type operators, so a fix must not turn a working search into an
// error. Odia, 2026-11-24: a swimlane was "ସନ୍ତରଣ" (swimming). Old words with
// a space or a "|" never worked, so they are not here.
export const SEARCH_OPERATOR_ALIASES = {
  or_IN: { 'ସନ୍ତରଣ': 'operator-swimlane' },
};

export function searchOperatorAliasesFor(language) {
  return SEARCH_OPERATOR_ALIASES[String(language || '').replace('-', '_')] || {};
}
