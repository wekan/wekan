'use strict';

// ============================================================================
// Injection detection — the pure half
// (design: docs/Security/Remediation/WeKan.md §12.6)
// ----------------------------------------------------------------------------
// Two shapes of NoSQL injection reach a Meteor app, and they are different
// problems:
//
//  1. A client-supplied SELECTOR carrying an operator that makes the DATABASE do
//     something: `$where`, `$function`, `$accumulator` (server-side JavaScript),
//     `$out`/`$merge` (write the result somewhere). A selector is data; these
//     turn it into code.
//
//  2. An OPERATOR OBJECT where a scalar was expected. This is the classic one:
//     a field that should hold the string a user typed arrives as
//     `{"$ne": null}` or `{"$gt": ""}` or `{"$regex": ".*"}`, and a comparison
//     that was meant to match one value now matches every value. It is how
//     "log in as anybody" is spelled in a document database, and it needs no
//     JavaScript at all.
//
// Both are detected here, purely - no Meteor, no database - so they are unit
// tested with plain Node (tests/injectionDetect.test.cjs) and so the same
// functions can be used on any input path.
//
// SQL injection is NOT detected here: WeKan never builds SQL. The database does,
// and it has its own last-look guard (FerretDB internal/util/sqlguard), which
// refuses the statement and marks the refusal so WeKan can record it -
// docs/Security/Remediation/FerretDB.md §3b.
// ============================================================================

// Operators that make the database EXECUTE something rather than compare.
// Presence of any of these in a client-supplied selector is not a query.
const EXECUTION_OPERATORS = [
  '$where',        // server-side JavaScript
  '$function',     // aggregation JavaScript
  '$accumulator',  // aggregation JavaScript
  '$out',          // write the result into a collection
  '$merge',        // ...or merge it into one
];

// Operators that are legitimate in a query but NOT in a place that expects the
// scalar a user typed. `{"$ne": null}` in a username field is an attack; the
// same operator built by WeKan's own code is ordinary.
const COMPARISON_OPERATORS = [
  '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
  '$regex', '$not', '$exists', '$type', '$expr', '$elemMatch',
];

const MAX_DEPTH = 12;

/**
 * Every execution operator found anywhere in a value, deduplicated and sorted.
 * Walks objects and arrays; bounded in depth so a deeply nested payload cannot
 * be used to burn CPU here.
 * @param {*} value
 * @return {string[]}
 */
function executionOperatorsIn(value) {
  const found = new Set();

  const walk = (node, depth) => {
    if (depth > MAX_DEPTH || !node || typeof node !== 'object') return;

    if (Array.isArray(node)) {
      node.forEach(item => walk(item, depth + 1));
      return;
    }

    Object.keys(node).forEach(key => {
      if (EXECUTION_OPERATORS.includes(key)) found.add(key);
      walk(node[key], depth + 1);
    });
  };

  walk(value, 0);
  return [...found].sort();
}

/**
 * True when `value` is an OPERATOR OBJECT - a plain object whose keys are Mongo
 * operators - in a position that expected a scalar.
 *
 * Deliberately strict about what counts: EVERY key must be an operator. A plain
 * object with ordinary keys is somebody sending the wrong type, which is a
 * validation error and not an attack, and calling it one would fill the security
 * report with noise.
 *
 * @param {*} value
 * @return {boolean}
 */
function isOperatorObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const keys = Object.keys(value);
  if (keys.length === 0) return false;

  const known = COMPARISON_OPERATORS.concat(EXECUTION_OPERATORS);
  return keys.every(key => known.includes(key));
}

/**
 * The operators inside such an object, for the report. Empty when it is not one.
 * @param {*} value
 * @return {string[]}
 */
function operatorsOf(value) {
  return isOperatorObject(value) ? Object.keys(value).sort() : [];
}

/**
 * Classify one client-supplied value that should have been a scalar.
 *
 * @param {*} value the value as it arrived
 * @return {{injection: boolean, kind: string, operators: string[]}}
 *   `kind` is 'execution' (the database would run something), 'operator' (a
 *   comparison where a value was expected) or '' (ordinary).
 */
function classifyScalarParam(value) {
  const execution = executionOperatorsIn(value);
  if (execution.length) {
    return { injection: true, kind: 'execution', operators: execution };
  }

  if (isOperatorObject(value)) {
    return { injection: true, kind: 'operator', operators: operatorsOf(value) };
  }

  return { injection: false, kind: '', operators: [] };
}

/**
 * Classify a whole client-supplied SELECTOR. Only execution operators make a
 * selector an attack - comparison operators are what a selector is made of.
 * @param {*} selector
 * @return {{injection: boolean, kind: string, operators: string[]}}
 */
function classifySelector(selector) {
  const execution = executionOperatorsIn(selector);
  return execution.length
    ? { injection: true, kind: 'execution', operators: execution }
    : { injection: false, kind: '', operators: [] };
}

/**
 * The one-clause summary a canary carries. Names the OPERATORS, which are a
 * short fixed vocabulary, and never any value beside them - those are
 * attacker-controlled.
 * @param {{kind: string, operators: string[]}} classification
 * @param {string} [where] the parameter or publication name
 * @return {string}
 */
function injectionDetail(classification, where) {
  const what =
    classification.kind === 'execution'
      ? 'database-side execution operator'
      : 'query operator where a value was expected';
  const ops = classification.operators.join(', ');
  return where ? `${what} (${ops}) in ${where}` : `${what} (${ops})`;
}

// Markup that would have DONE something if it had survived. Sanitizing text is
// routine - a pasted `<b>` gets stripped from a comment every day - and routine
// is not worth an admin's attention. A script tag, an event handler, a
// javascript: URI or an embedding element is not routine: it is a stored-XSS
// attempt that the sanitizer defused, and that is worth knowing about with the
// author attached.
const ACTIVE_MARKUP = [
  /<\s*script\b/i,
  /<\s*iframe\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /<\s*svg\b/i,
  /\son[a-z]+\s*=/i,          // onerror=, onload=, onclick=, …
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
];

/**
 * True when sanitizing `original` into `sanitized` removed ACTIVE markup, as
 * opposed to tidying formatting away.
 *
 * Compares what the sanitizer took OUT: text that never had any is not
 * interesting, and text that still has it was not sanitized at all (which would
 * be a different bug).
 *
 * @param {string} original
 * @param {string} sanitized
 * @return {boolean}
 */
function removedActiveMarkup(original, sanitized) {
  if (typeof original !== 'string' || typeof sanitized !== 'string') return false;
  if (original === sanitized) return false;

  return ACTIVE_MARKUP.some(re => re.test(original) && !re.test(sanitized));
}

// Which canary id a caller passes for each finding. Kept here, beside the
// detector, so a call site does not have to guess and so the ids cannot drift
// from the catalog (models/lib/canaryTokens.js).
const CANARY_IDS = {
  // A client-supplied SELECTOR carrying a database-side execution operator.
  selector: 'injection.nosql-selector',
  // An operator object where the value a user typed belongs.
  operator: 'injection.nosql-operator',
  // Text whose active markup the sanitizer had to remove.
  text: 'sanitize.dangerous-text',
};

module.exports = {
  EXECUTION_OPERATORS,
  COMPARISON_OPERATORS,
  ACTIVE_MARKUP,
  CANARY_IDS,
  removedActiveMarkup,
  executionOperatorsIn,
  isOperatorObject,
  operatorsOf,
  classifyScalarParam,
  classifySelector,
  injectionDetail,
};
