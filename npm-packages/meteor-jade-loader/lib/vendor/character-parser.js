'use strict';

/**
 * Minimal self-contained implementation of the character-parser API
 * (originally by ForbesLindesay, MIT licensed).
 *
 * Used by the vendored Jade 1.x lexer and parser to track string/bracket
 * nesting state when scanning JavaScript expressions embedded in templates.
 *
 * Only the methods actually called by jade/lib/lexer.js and jade/lib/parser.js
 * are implemented here.
 */

module.exports = parse;

/**
 * Parse the whole string `src` (or the range [options.start, options.end))
 * and return the final state.
 *
 * @param {string} src
 * @param {object} [state]
 * @param {object} [options]  { start, end }
 * @return {State}
 */
function parse(src, state, options) {
  options = options || {};
  state = state || defaultState();
  var start = options.start || 0;
  var end = (options.end !== undefined) ? options.end : src.length;
  for (var i = start; i < end; i++) {
    parseChar(src[i], state);
  }
  return state;
}

/**
 * Parse from options.start until bracket nesting returns to zero (the first
 * closing bracket that brings nesting below 0).  The caller has already
 * consumed the opening bracket, so state starts at nesting = 0.
 *
 * @param {string} src
 * @param {object} [options]  { start }
 * @return {{ start: number, end: number, src: string }}
 *         end is the index of the closing bracket in `src`.
 */
module.exports.parseMax = parseMax;
function parseMax(src, options) {
  options = options || {};
  var start = options.start || 0;
  var state = defaultState();
  var i = start;
  while (i < src.length) {
    parseChar(src[i], state);
    i++;
    if (state.nesting < 0) {
      // i has already been incremented past the closing bracket
      return {
        start: start,
        end: i - 1,
        src: src.slice(start, i - 1),
      };
    }
  }
  throw new Error('character-parser: end of string reached with no closing bracket');
}

/**
 * Parse a single character against the given state and return the (mutated)
 * state object.
 *
 * @param {string} character  single character
 * @param {State}  [state]
 * @return {State}
 */
module.exports.parseChar = parseChar;
function parseChar(character, state) {
  state = state || defaultState();

  // The previous character is tracked so we can detect // and /* comment openers.
  var lastChar = state.lastChar;

  if (state.escaped) {
    state.escaped = false;
    state.lastChar = character;
    return state;
  }

  if (state.blockComment) {
    if (lastChar === '*' && character === '/') {
      state.blockComment = false;
    }
    state.lastChar = character;
    return state;
  }

  if (state.lineComment) {
    if (character === '\n') {
      state.lineComment = false;
    }
    state.lastChar = character;
    return state;
  }

  if (state.singleQuote) {
    if (character === '\'') {
      state.singleQuote = false;
    } else if (character === '\\') {
      state.escaped = true;
    }
    state.lastChar = character;
    return state;
  }

  if (state.doubleQuote) {
    if (character === '"') {
      state.doubleQuote = false;
    } else if (character === '\\') {
      state.escaped = true;
    }
    state.lastChar = character;
    return state;
  }

  // Outside strings / comments — check for comment openers.
  if (lastChar === '/' && character === '/') {
    state.lineComment = true;
    state.lastChar = character;
    return state;
  }
  if (lastChar === '/' && character === '*') {
    state.blockComment = true;
    state.lastChar = character;
    return state;
  }

  // Normal character — handle brackets and string openers.
  if (character === '\'') {
    state.singleQuote = true;
  } else if (character === '"') {
    state.doubleQuote = true;
  } else if (character === '(' || character === '{' || character === '[') {
    state.nesting++;
  } else if (character === ')' || character === '}' || character === ']') {
    state.nesting--;
  }

  state.lastChar = character;
  return state;
}

/**
 * Return a fresh parser state object.
 * @return {State}
 */
module.exports.defaultState = defaultState;
function defaultState() {
  return {
    // String tracking
    singleQuote: false,
    doubleQuote: false,
    escaped: false,

    // Comment tracking
    lineComment: false,
    blockComment: false,

    // Bracket nesting depth (goes negative when a closing bracket
    // is encountered that doesn't match an opener we saw).
    nesting: 0,

    // Previous character (used to detect // and /* openers)
    lastChar: '',

    // Convenience predicates
    isString: function () { return this.singleQuote || this.doubleQuote; },
    isNesting: function () { return this.nesting !== 0; },
    isComment: function () { return this.lineComment || this.blockComment; },
  };
}

/**
 * Return true if `character` is a JavaScript punctuator.
 * Used by jade's attribute parser to decide whether a following character
 * is still part of an expression value or starts a new attribute.
 *
 * @param {string} character
 * @return {boolean}
 */
module.exports.isPunctuator = isPunctuator;
function isPunctuator(character) {
  switch (character) {
    case '.': case '(': case ')': case ';': case ',':
    case '{': case '}': case '[': case ']': case '\'':
    case '"': case ':': case '?': case '~': case '+':
    case '-': case '*': case '%': case '&': case '|':
    case '^': case '!': case '/': case '=': case '<':
    case '>':
      return true;
    default:
      return false;
  }
}
