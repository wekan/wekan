'use strict';

// WHERE an imported thing lands (#1173).
//
// A swimlane imported from a swimlane's menu goes BELOW that swimlane. A list
// imported from a list's menu goes after it - which is to its RIGHT in a
// left-to-right language and to its LEFT in a right-to-left one, and that is one
// rule rather than two: the page carries `dir` (client/components/main/
// layouts.jade), so the board's row of lists mirrors itself and "after in sort
// order" is already "the other side" in Arabic, Hebrew or Persian. Writing
// separate LTR and RTL branches here would mirror it twice and put the list back
// on the wrong side. A card goes below the card it was imported from.
//
// All three are the same question - what sort value sits between this one and
// the next - and `sort` is a Number in every one of the three schemas, so the
// answer is a fraction rather than a renumbering of every sibling. Renumbering
// is what a board with ten thousand cards cannot afford, and what a second
// client doing the same thing at the same time gets wrong.

// The sort values for `count` new items placed directly after `targetSort`,
// spread evenly in the gap before whatever comes next.
//
//   existingSorts  every sibling's sort, in any order
//   targetSort     the sort of the item they go after; null/undefined puts them
//                  at the very top, before everything
//   count          how many are being inserted
function sortsAfter(existingSorts, targetSort, count = 1) {
  if (!Number.isFinite(count) || count < 1) return [];

  const sorts = (existingSorts || [])
    .filter(value => Number.isFinite(value))
    .sort((a, b) => a - b);

  // Nothing to sit between: start at 0 and count up, the way an empty board does.
  if (sorts.length === 0) {
    const from = Number.isFinite(targetSort) ? targetSort + 1 : 0;
    return Array.from({ length: count }, (unused, index) => from + index);
  }

  if (!Number.isFinite(targetSort)) {
    // Before everything, which is what "no target" means: below the top edge.
    const first = sorts[0];
    return Array.from({ length: count }, (unused, index) =>
      first - (count - index));
  }

  const next = sorts.find(value => value > targetSort);
  if (next === undefined) {
    // Last: there is no gap to divide, so count on from the end.
    return Array.from({ length: count }, (unused, index) => targetSort + 1 + index);
  }

  // Evenly through the gap. With one item that is the midpoint; with three it is
  // the quarter points, so importing a swimlane of ten lists does not put nine
  // of them in the same position.
  const step = (next - targetSort) / (count + 1);
  return Array.from({ length: count }, (unused, index) => targetSort + step * (index + 1));
}

// A gap can be divided only so many times before two sorts are the same double.
// When that happens the caller has to renumber; this says when.
function gapIsExhausted(sorts) {
  for (let i = 1; i < sorts.length; i += 1) {
    if (!(sorts[i] > sorts[i - 1])) return true;
  }
  return false;
}

export { sortsAfter, gapIsExhausted };
