import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { ReactiveCache } from '/imports/reactiveCache';

// #5778 + docs/Theme/Theme.md: apply the user's optional GLOBAL theme color to the
// whole UI (All Boards, Search, Admin Panel, My Cards, etc.) via a `board-color-<name>`
// class on <body>, and apply CUSTOM colors (flat = 1 accent, clear = 2 = a gradient)
// as CSS variables consumed by customTheme.css.
//
// While viewing a single board, that board's own color owns the page, so we do NOT
// put the global color class on <body> there; but we DO expose the ACTIVE context's
// custom colors (the board's when on a board, the user's global override otherwise)
// so custom-colored boards and the custom global theme both render.

Meteor.startup(() => {
  let appliedClass = null;

  function applyClass(colorClass) {
    if (colorClass === appliedClass) return;
    try {
      if (appliedClass) document.body.classList.remove(appliedClass);
      if (colorClass) document.body.classList.add(colorClass);
    } catch (_) {
      // document.body may not exist yet in exotic embeddings; ignore.
    }
    appliedClass = colorClass;
  }

  function applyCustom(custom) {
    try {
      const root = document.documentElement;
      const c1 = custom && custom[0];
      const c2 = custom && custom[1];
      if (c1) {
        root.style.setProperty('--theme-accent', c1);
        document.body.classList.add('has-custom-theme-color');
      } else {
        root.style.removeProperty('--theme-accent');
        document.body.classList.remove('has-custom-theme-color');
      }
      if (c2) {
        root.style.setProperty('--theme-accent-2', c2);
        document.body.classList.add('has-custom-theme-slide');
      } else {
        root.style.removeProperty('--theme-accent-2');
        document.body.classList.remove('has-custom-theme-slide');
      }
    } catch (_) {
      // ignore
    }
  }

  Tracker.autorun(() => {
    const user = Meteor.user();
    const globalColor = user && user.profile && user.profile.globalThemeColor;

    if (globalColor) {
      // #5778: a global override wins EVERYWHERE — including board pages. The header
      // and .board-wrapper also prefer it (see header.jade / boardBody.jade), so the
      // whole UI takes the chosen theme; unset it to return to per-board colors.
      applyClass(`board-color-${globalColor}`);
      applyCustom((user && user.profile && user.profile.globalThemeCustomColors) || []);
      return;
    }

    // No global override: on a board expose that board's own custom colors (its color
    // class already lives on .board-wrapper/#header); off a board, apply nothing.
    const boardId = Session.get('currentBoard');
    const board = boardId ? ReactiveCache.getBoard(boardId) : null;
    applyClass(null);
    applyCustom((board && board.customThemeColors) || []);
  });
});
