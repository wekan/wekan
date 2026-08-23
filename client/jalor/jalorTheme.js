import { Meteor } from 'meteor/meteor';

// ---------------------------------------------------------------------------
// Jalor — keep the DSFR's colour scheme in step with WeKan's theme.
//
// The DSFR has a dark mode, switched on by `data-fr-theme="dark"` on the root
// element; every one of its ~1000 tokens is redefined under that attribute, so
// the whole Jalor layer follows from this one flag with no second stylesheet to
// maintain.
//
// WeKan has themes of its own (Member Settings / Change color, and Admin Panel /
// Settings / Layout), several of which are dark. client/components/main/
// globalThemeColor.js puts the active one on <body> as `board-color-<name>`.
// This file watches that class and mirrors it onto the root element.
//
// Two deliberate non-behaviours:
//
//  * `prefers-color-scheme` is NOT consulted. Turning the DSFR dark on its own
//    would leave WeKan's own stylesheets light and the app would be half of
//    each. Dark mode is a WeKan setting here, and this only follows it.
//
//  * a BOARD's colour is not consulted either, even when it is one of the dark
//    ones. A board's colour decorates that board; it is not the application's
//    theme, and switching the whole chrome to dark on opening one board and
//    back on the next is worse than not offering it.
//
// The DSFR's own JavaScript is not loaded (see docs/Jalor/DSFR.md): every DSFR
// component Jalor uses is CSS-only, and the interactive ones - menus, modals -
// are WeKan's, with their own behaviour already written and tested. Loading the
// DSFR runtime beside them would mean two scripts binding the same elements.
// ---------------------------------------------------------------------------

// WeKan themes whose header and page are dark. Kept in one place so the list is
// checkable: tests/jalorDarkTheme.test.cjs holds it against the accent map in
// models/lib/themeAccents.js, so a dark theme added upstream cannot quietly
// stop switching the DSFR over.
export const JALOR_DARK_THEMES = [
  'dark',
  'midnight',
  'moderndark',
  'exodark',
  'cleandark',
];

export function isDarkThemeClassList(classList) {
  const names = Array.from(classList || []);
  return JALOR_DARK_THEMES.some((theme) => names.includes(`board-color-${theme}`));
}

function apply() {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;
  if (isDarkThemeClassList(body.classList)) {
    root.setAttribute('data-fr-theme', 'dark');
  } else {
    root.removeAttribute('data-fr-theme');
  }
}

Meteor.startup(() => {
  if (typeof document === 'undefined' || !document.body) return;

  // A marker for the Jalor layer to hang anything body-wide off, and for a
  // developer looking at the DOM to see which UI they are in.
  document.body.classList.add('jalor-ui');

  apply();

  // globalThemeColor.js writes the class from a Tracker autorun. Watching the
  // attribute rather than re-deriving the theme keeps this file from having to
  // know how WeKan decides which theme is active - a decision that has changed
  // upstream more than once (user override, then site theme, then board colour).
  if (typeof MutationObserver === 'function') {
    new MutationObserver(apply).observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }
});
