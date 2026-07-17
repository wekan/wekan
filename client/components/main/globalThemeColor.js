import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';

// #5778: apply the user's optional GLOBAL theme color to the whole UI by putting a
// `board-color-<name>` class on <body>, mirroring the per-board color mechanism.
// This themes the pages that otherwise have no color — All Boards, Search All
// Boards, Admin Panel, My Cards, Due Cards, etc. — so a user can pick e.g. a dark
// theme everywhere.
//
// While the user is viewing a single board, that board's own Board Settings color
// owns the page (it is applied to #header and cascades to the board content). We
// therefore CLEAR the global <body> class on a board so the two color themes never
// fight over the same elements; the global override resumes on every other page.
// (The header template applies the global class itself on non-board pages via the
// user's globalThemeColorClass helper, covering the #header-specific rules.)

Meteor.startup(() => {
  let appliedClass = null;

  function apply(colorClass) {
    if (colorClass === appliedClass) return;
    try {
      if (appliedClass) document.body.classList.remove(appliedClass);
      if (colorClass) document.body.classList.add(colorClass);
    } catch (_) {
      // document.body may not exist yet in exotic embeddings; ignore.
    }
    appliedClass = colorClass;
  }

  Tracker.autorun(() => {
    const user = Meteor.user();
    const color = user && user.profile && user.profile.globalThemeColor;
    const onBoard = !!Session.get('currentBoard');
    apply(!onBoard && color ? `board-color-${color}` : null);
  });
});
