'use strict';

// Which template-container boards are safe to remove, and which are not.
//
// WHY THIS EXISTS. Before v10.00 every new account got a "Templates" container
// board created for it at signup, whether or not the person ever saved a
// template. That was removed in v10.00 (#2339, #5850) - the container is created
// lazily by `ensureTemplatesBoard` now, only when a template is actually saved -
// but nothing ever removed the ones already made, and they are not visible enough
// for anyone to delete by hand.
//
// On an instance that provisions accounts automatically the leftovers dominate
// the boards collection. One reported instance: 14490 boards, of which 13404 are
// template containers, for 9264 accounts of which 478 have ever logged in. Every
// query that touches boards - and under polling reactivity that is every poll -
// carries that 13x.
//
// WHAT IS SAFE TO REMOVE is the whole question, and the answer is deliberately
// narrow: a container that is EMPTY. If somebody ever saved a template into it,
// or renamed it, or invited anyone to it, it is theirs and it stays - the point
// is to remove boards that were created FOR people who never used them, not to
// tidy up after people who did.
//
// Nothing here deletes anything. It decides, and returns the decision with a
// reason attached, so the caller can show what WOULD go before anything does.

// A container is removable only when every one of these holds.
//
//   type === 'template-container'   it is a container, not a board or a template
//   no template boards inside it    nothing was ever saved into it
//   no lists, swimlanes or cards    nothing was put in it directly either
//   exactly one member              only the person it was made for
//   not renamed                     still called whatever WeKan called it
//   not starred / not archived      nobody has expressed any interest in it
//
// `templateCount`, `listCount`, `swimlaneCount` and `cardCount` are supplied by
// the caller, which is what queries the database; this stays pure.
function classifyTemplateContainer(board, counts = {}, options = {}) {
  const reasons = [];
  if (!board || typeof board !== 'object') {
    return { removable: false, reasons: ['not a board'] };
  }
  if (board.type !== 'template-container') {
    return { removable: false, reasons: ['not a template container'] };
  }

  const {
    templateCount = 0,
    listCount = 0,
    swimlaneCount = 0,
    cardCount = 0,
  } = counts;

  if (templateCount > 0) reasons.push(`holds ${templateCount} template(s)`);
  if (cardCount > 0) reasons.push(`holds ${cardCount} card(s)`);
  if (listCount > 0) reasons.push(`holds ${listCount} list(s)`);
  if (swimlaneCount > 0) reasons.push(`holds ${swimlaneCount} swimlane(s)`);

  const members = Array.isArray(board.members) ? board.members : [];
  if (members.length > 1) {
    reasons.push(`shared with ${members.length} members`);
  }

  if (board.archived) reasons.push('archived by hand');
  if (board.starred) reasons.push('starred');

  // Renamed = somebody made it theirs. The default title is whatever the
  // creating code used; the caller passes the set of titles that count as
  // untouched, because that string is translated and has changed over time.
  const defaultTitles = options.defaultTitles;
  if (Array.isArray(defaultTitles) && defaultTitles.length > 0) {
    const title = typeof board.title === 'string' ? board.title.trim() : '';
    if (title && !defaultTitles.includes(title)) {
      reasons.push(`renamed to "${title}"`);
    }
  }

  return { removable: reasons.length === 0, reasons };
}

// The selector for candidate containers. Deliberately only narrows by TYPE: what
// makes one removable needs counts from four other collections, so the caller
// walks these and asks classifyTemplateContainer about each.
function templateContainersSelector() {
  return { type: 'template-container' };
}

// Split a classified list into what would go and what would stay, so a caller
// can report both without repeating the rule.
function planTemplateContainerCleanup(entries) {
  const remove = [];
  const keep = [];
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || !entry.board) continue;
    const verdict = classifyTemplateContainer(
      entry.board, entry.counts, entry.options);
    (verdict.removable ? remove : keep).push({
      boardId: entry.board._id,
      title: entry.board.title,
      reasons: verdict.reasons,
    });
  }
  return { remove, keep };
}

module.exports = {
  classifyTemplateContainer,
  templateContainersSelector,
  planTemplateContainerCleanup,
};
