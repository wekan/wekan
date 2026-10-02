'use strict';
// A regex replacement that cannot stop the server: run in its own V8 context
// with a time limit, which V8 enforces even inside a backtracking regex.
// Server only (node:vm). See models/lib/customFieldStringTemplate.js.
const vm = require('node:vm');

const REGEX_TIME_LIMIT_MS = 50;

function boundedRegexReplace(value, regex, flags, replacement) {
  return vm.runInNewContext('value.replace(new RegExp(regex, flags), replacement)',
    { value: String(value), regex, flags, replacement }, { timeout: REGEX_TIME_LIMIT_MS });
}

module.exports = { boundedRegexReplace, REGEX_TIME_LIMIT_MS };
