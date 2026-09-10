import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import {
  resolveShowLabelText as resolveShowLabelTextValue,
  nextShowLabelTextOverride,
} from '/models/lib/labelTextVisibility';

// "Show minicard label text" - the labels on a minicard as coloured WORDS,
// or as coloured bars with the words left out (#4256).
//
// This layers exactly the same way the global theme override does
// (client/components/main/globalThemeColor.js): a BOARD-level default
// (Boards.showLabelText, Board Settings) that every board can set for
// itself, and an optional PER-USER override (profile.showLabelTextOverride)
// that - when set - wins on every board regardless of that board's own
// setting. Unset (null/undefined) means "use the board's setting"; the
// historical global default (text shown) is what a board or a user that has
// never touched either setting still gets, so existing boards and users see
// no behaviour change.
//
// Logged-out readers of a public board have no profile to store an override
// on, so they keep the old, simpler localStorage-only personal toggle,
// falling back to the board's own setting.
export function resolveShowLabelText(board) {
  const boardShowLabelText = board && typeof board.showLabelText === 'boolean'
    ? board.showLabelText
    : null;
  const currentUser = ReactiveCache.getCurrentUser();
  if (currentUser) {
    const override = (currentUser.profile || {}).showLabelTextOverride;
    return resolveShowLabelTextValue(
      typeof override === 'boolean' ? override : null,
      boardShowLabelText,
    );
  }
  const stored = window.localStorage.getItem('hiddenMinicardLabelText');
  const storedOverride = stored !== null ? stored !== 'true' : null;
  return resolveShowLabelTextValue(storedOverride, boardShowLabelText);
}

// Blaze helper: called with `this` set to the current card by the minicard
// template, so the board it belongs to is read from there. Falls back to no
// board (global default) when there is no card in context, e.g. a stray call
// from a non-card template.
export function hiddenMinicardLabelText() {
  const board = this && typeof this.board === 'function' ? this.board() : null;
  return !resolveShowLabelText(board);
}

// Cycles the per-user override: no override -> force shown -> force hidden ->
// no override, mirroring the tri-state the global theme override uses
// (unset/'no override' vs. an explicit chosen value).
export function toggleMinicardLabelText() {
  const currentUser = ReactiveCache.getCurrentUser();
  if (currentUser) {
    const override = (currentUser.profile || {}).showLabelTextOverride;
    const next = nextShowLabelTextOverride(typeof override === 'boolean' ? override : null);
    // The profile is reactive, so the board redraws by itself.
    Meteor.call('setShowLabelTextOverride', next);
    return;
  }
  // localStorage is not reactive, so the page has to be read again for the
  // change to show. Only the logged-OUT half pays that.
  if (window.localStorage.getItem('hiddenMinicardLabelText')) {
    window.localStorage.removeItem('hiddenMinicardLabelText');
  } else {
    window.localStorage.setItem('hiddenMinicardLabelText', 'true');
  }
  location.reload();
}
