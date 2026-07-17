'use strict';

// Plain-Node unit test (no Meteor) for the sidebar Advanced Filter's handling
// of date-type custom fields.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/advancedFilterDate.test.cjs
//
// Regression guard for #2989 ("Date custom field, filter problem"):
// `'Date de fin' == '06/04/2020'` never matched any card, while '!=' matched
// everything. Two independent defects:
//   1. The tokenizer treated every '/' as a regex delimiter, even inside a
//      '…'-quoted value, so '06/04/2020' toggled string-mode twice and came
//      out flagged as a regex — the whole filter failed to parse.
//   2. Date custom-field values are stored as Date objects (the date picker
//      calls card.setCustomField(id, date)), but '==' built
//      {$in: ['06/04/2020', NaN]} — a string and NaN never equal a BSON
//      date. parseAdvancedFilterDate()/buildDateValueSelector() now build a
//      Date-range selector instead.
//
// The logic lives in /imports/lib/advancedFilter.js (an ES module used by
// client/lib/filter.js), loaded here with a dynamic import().

const assert = require('assert');

let passed = 0;
const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// Minimal evaluator for the operator documents the filter builds against a
// single stored 'customFields.value' — enough of Mongo/minimongo semantics
// ($gte/$lt/$gt/$lte/$in/$not with BSON type bracketing: a Date only ever
// compares to another Date) to show which cards a selector matches.
function matchValue(selector, value) {
  if (selector instanceof RegExp) {
    return typeof value === 'string' && selector.test(value);
  }
  const comparable = (a, b) =>
    (a instanceof Date && b instanceof Date) ||
    (typeof a === 'number' && typeof b === 'number') ||
    (typeof a === 'string' && typeof b === 'string');
  const toV = x => (x instanceof Date ? x.getTime() : x);
  for (const [op, arg] of Object.entries(selector)) {
    switch (op) {
      case '$gte':
        if (!(comparable(value, arg) && toV(value) >= toV(arg))) return false;
        break;
      case '$gt':
        if (!(comparable(value, arg) && toV(value) > toV(arg))) return false;
        break;
      case '$lte':
        if (!(comparable(value, arg) && toV(value) <= toV(arg))) return false;
        break;
      case '$lt':
        if (!(comparable(value, arg) && toV(value) < toV(arg))) return false;
        break;
      case '$in':
        if (
          !arg.some(
            x =>
              (comparable(value, x) && toV(value) === toV(x)) ||
              (Number.isNaN(x) && Number.isNaN(value)),
          )
        )
          return false;
        break;
      case '$not':
        if (matchValue(arg, value)) return false;
        break;
      default:
        throw new Error(`matchValue: unsupported operator ${op}`);
    }
  }
  return true;
}

(async () => {
  const {
    tokenizeAdvancedFilter,
    parseAdvancedFilterDate,
    buildDateValueSelector,
  } = await import('../imports/lib/advancedFilter.js');

  // --- Tokenizer -------------------------------------------------------------

  test('#2989: slashes inside a quoted value stay a literal string, not a regex', () => {
    const cmds = tokenizeAdvancedFilter("'Date de fin' == '06/04/2020'");
    assert.strictEqual(cmds.length, 3);
    assert.deepStrictEqual(cmds[0], {
      cmd: 'Date de fin',
      string: true,
      regex: false,
    });
    assert.strictEqual(cmds[1].cmd, '==');
    // Before the fix this token came out as {cmd: '06/04/2020', regex: true},
    // whose later regex parse threw and silently invalidated the whole filter.
    assert.deepStrictEqual(cmds[2], {
      cmd: '06/04/2020',
      string: true,
      regex: false,
    });
  });

  test('regexes outside quotes still tokenize as regexes', () => {
    const cmds = tokenizeAdvancedFilter("'Test' == /to.o/i");
    assert.strictEqual(cmds.length, 3);
    assert.strictEqual(cmds[2].cmd, '/to.o/i');
    assert.strictEqual(cmds[2].regex, true);
  });

  test('regex flag does not leak into the following commands', () => {
    const cmds = tokenizeAdvancedFilter("'f' == /x/ and 'g' == 'y'");
    assert.strictEqual(cmds.length, 7);
    assert.strictEqual(cmds[2].regex, true); // the /x/ regex itself
    assert.strictEqual(cmds[6].cmd, 'y');
    assert.strictEqual(cmds[6].regex, false); // 'y' is a plain string
  });

  test('quoted strings may contain spaces; escaped spaces work outside quotes', () => {
    assert.deepStrictEqual(tokenizeAdvancedFilter("'a b c'"), [
      { cmd: 'a b c', string: true, regex: false },
    ]);
    assert.deepStrictEqual(tokenizeAdvancedFilter('a\\ b'), [
      { cmd: 'a b', string: false, regex: false },
    ]);
  });

  // --- Date parsing ----------------------------------------------------------

  test('ISO YYYY-MM-DD parses to the local day range', () => {
    const r = parseAdvancedFilterDate('2020-04-06');
    assert.ok(r);
    assert.deepStrictEqual(r.start, new Date(2020, 3, 6));
    assert.deepStrictEqual(r.end, new Date(2020, 3, 7));
  });

  test("#2989: '06/04/2020' is 6 April for day-first users, 4 June otherwise", () => {
    const fr = parseAdvancedFilterDate('06/04/2020', { dayFirst: true });
    assert.deepStrictEqual(fr.start, new Date(2020, 3, 6));
    const us = parseAdvancedFilterDate('06/04/2020', { dayFirst: false });
    assert.deepStrictEqual(us.start, new Date(2020, 5, 4));
  });

  test('unambiguous day/month order wins over the dayFirst flag', () => {
    const a = parseAdvancedFilterDate('25/12/2020', { dayFirst: false });
    assert.deepStrictEqual(a.start, new Date(2020, 11, 25));
    const b = parseAdvancedFilterDate('12/25/2020', { dayFirst: true });
    assert.deepStrictEqual(b.start, new Date(2020, 11, 25));
  });

  test('a time component narrows the range to the minute (or second)', () => {
    const m = parseAdvancedFilterDate('2020-04-06 14:30');
    assert.deepStrictEqual(m.start, new Date(2020, 3, 6, 14, 30));
    assert.deepStrictEqual(m.end, new Date(2020, 3, 6, 14, 31));
    const s = parseAdvancedFilterDate('2020-04-06 14:30:05');
    assert.deepStrictEqual(s.start, new Date(2020, 3, 6, 14, 30, 5));
    assert.deepStrictEqual(s.end, new Date(2020, 3, 6, 14, 30, 6));
  });

  test('non-dates and impossible dates return null (negative cases)', () => {
    assert.strictEqual(parseAdvancedFilterDate('toto'), null);
    assert.strictEqual(parseAdvancedFilterDate(''), null);
    assert.strictEqual(parseAdvancedFilterDate('42'), null);
    assert.strictEqual(parseAdvancedFilterDate('31/02/2020'), null); // rollover
    assert.strictEqual(parseAdvancedFilterDate('2020-13-01'), null);
    assert.strictEqual(parseAdvancedFilterDate('2020-04-06 25:00'), null);
    assert.strictEqual(parseAdvancedFilterDate(undefined), null);
  });

  // --- Selector building + end-to-end matching -------------------------------

  test("#2989 scenario: '==' a date now matches cards stored with a Date value", () => {
    // The date picker stores a Date (with whatever time was picked).
    const stored = new Date(2020, 3, 6, 10, 15); // 6 April 2020 10:15 local
    const range = parseAdvancedFilterDate('06/04/2020', { dayFirst: true });
    const eq = buildDateValueSelector('==', range);
    assert.deepStrictEqual(eq, { $gte: range.start, $lt: range.end });
    assert.strictEqual(matchValue(eq, stored), true);
    // Negative: a card dated the day after must NOT match.
    assert.strictEqual(matchValue(eq, new Date(2020, 3, 7, 0, 0)), false);
    // Negative: the OLD selector shape never matched the stored Date.
    const old = { $in: ['06/04/2020', parseInt('06/04/2020', 10)] };
    assert.strictEqual(matchValue(old, stored), false);
  });

  test("'!=' matches other days but not the named day", () => {
    const range = parseAdvancedFilterDate('2020-04-06');
    const ne = buildDateValueSelector('!=', range);
    assert.deepStrictEqual(ne, {
      $not: { $gte: range.start, $lt: range.end },
    });
    assert.strictEqual(matchValue(ne, new Date(2020, 3, 6, 23, 59)), false);
    assert.strictEqual(matchValue(ne, new Date(2020, 3, 7)), true);
    assert.strictEqual(matchValue(ne, new Date(2020, 3, 5, 23, 59)), true);
  });

  test('range operators use day boundaries', () => {
    const range = parseAdvancedFilterDate('2020-04-06');
    const inDay = new Date(2020, 3, 6, 12, 0);
    const before = new Date(2020, 3, 5, 12, 0);
    const after = new Date(2020, 3, 7, 12, 0);
    const gt = buildDateValueSelector('>', range);
    assert.strictEqual(matchValue(gt, after), true);
    assert.strictEqual(matchValue(gt, inDay), false);
    assert.strictEqual(matchValue(gt, before), false);
    const gte = buildDateValueSelector('>=', range);
    assert.strictEqual(matchValue(gte, inDay), true);
    assert.strictEqual(matchValue(gte, before), false);
    const lt = buildDateValueSelector('<', range);
    assert.strictEqual(matchValue(lt, before), true);
    assert.strictEqual(matchValue(lt, inDay), false);
    const lte = buildDateValueSelector('<=', range);
    assert.strictEqual(matchValue(lte, inDay), true);
    assert.strictEqual(matchValue(lte, after), false);
    // word-form operators map like their symbols
    assert.deepStrictEqual(buildDateValueSelector('gte', range), gte);
    assert.deepStrictEqual(buildDateValueSelector('LT', range), lt);
  });

  test('unknown operators and missing ranges return null (negative cases)', () => {
    const range = parseAdvancedFilterDate('2020-04-06');
    assert.strictEqual(buildDateValueSelector('~=', range), null);
    assert.strictEqual(buildDateValueSelector('==', null), null);
  });

  test('text custom fields are untouched: a non-date value yields no date selector', () => {
    // filter.js only calls the date path when the field's type === 'date';
    // even then, unparsable input falls back to the legacy selector because
    // parseAdvancedFilterDate() returns null.
    assert.strictEqual(parseAdvancedFilterDate('toto'), null);
    assert.strictEqual(
      buildDateValueSelector('==', parseAdvancedFilterDate('toto')),
      null,
    );
  });

  // --- Runner ----------------------------------------------------------------

  for (const [name, fn] of tests) {
    try {
      await fn();
      passed += 1;
      console.log('  ok -', name);
    } catch (err) {
      console.error('  FAIL -', name);
      console.error(err);
      process.exitCode = 1;
    }
  }
  console.log(`${passed}/${tests.length} tests passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
