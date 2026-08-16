import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { ReactiveCache } from '/imports/reactiveCache';
import { Template } from 'meteor/templating';
import { activeAccent, activeFill } from '/models/lib/themeAccents';

// #5778 + docs/Theme/Theme.md: apply the theme color to the whole UI (All Boards,
// Search, Admin Panel, My Cards, etc.) via a `board-color-<name>` class on <body>,
// and apply CUSTOM colors (flat = 1 accent, clear = 2 = a gradient) as CSS variables
// consumed by customTheme.css.
//
// THE ORDER OF THEMES, weakest first (docs/Theme/Theme.md):
//   1. WeKan's default theme  — nothing on <body>
//   2. the SITE theme         — Admin Panel / Settings / Visibility / Change color.
//                               `currentSetting.themeColor`, which on a multitenancy
//                               host is that Organization's own value (the settings
//                               document is published per host, see
//                               models/lib/tenants.js)
//   3. the USER's own override — Member Settings / Change color
//
// While viewing a single board, that board's own color owns the page, so we do NOT
// put the site theme class on <body> there - a board's colour is what a board looks
// like. A USER's own override does win there too, because they asked for it
// everywhere. Custom colors of the ACTIVE context are exposed either way, so
// custom-colored boards, a custom site theme and a custom user theme all render.

// The class the CHROME (the two top bars, the board wrapper) must carry, from the
// same order of themes the <body> autorun below applies:
//   the user's own override, then the board's own colour on a board page, then the
// site theme (docs/Features/Page/Theme.md). Registered as a Blaze helper so the
// templates read ONE answer instead of each re-deriving part of the order - which is
// what left the top bars on the default colour while the buttons took the site theme.
Template.registerHelper('themeColorClass', () => {
  const user = Meteor.user();
  const own = user && user.profile && user.profile.globalThemeColor;
  if (own) return `board-color-${own}`;
  const boardId = Session.get('currentBoard');
  const board = boardId ? ReactiveCache.getBoard(boardId) : null;
  // colorClass() is a Board HELPER, not a field: reading it without calling it
  // returns the function, which renders as a class of source code.
  const boardClass = board && typeof board.colorClass === 'function' ? board.colorClass() : '';
  if (boardClass) return boardClass;
  const setting = ReactiveCache.getCurrentSetting();
  const siteColor = setting && setting.themeColor;
  return siteColor ? `board-color-${siteColor}` : '';
});

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

  // `color` is the ACTIVE theme's name (or null), `custom` its custom colours.
  //
  // --theme-accent is what the chrome outside a board reads: the Admin Panel's
  // selected left-menu row, its buttons, every Save button, the table-page controls.
  // It used to be set ONLY for a custom colour, so picking a named theme recoloured
  // the header - which has a `.board-color-<name>#header` rule of its own - and left
  // all of those on the stock blue fallback. Now every theme publishes its accent
  // (models/lib/themeAccents.js), and a custom colour still wins over it.
  //
  // The `has-custom-theme-*` classes stay tied to a CUSTOM colour, because those are
  // what let customTheme.css override a named theme's own header rule with
  // `!important`. A named theme must not do that to itself.
  function applyCustom(custom, color) {
    try {
      const root = document.documentElement;
      const c1 = custom && custom[0];
      const c2 = custom && custom[1];
      const accent = activeAccent(color, custom);
      if (accent) {
        root.style.setProperty('--theme-accent', accent);
      } else {
        root.style.removeProperty('--theme-accent');
      }
      // ...and what to PAINT a themed control with, which is not the same
      // thing: --theme-accent is one colour, and a colour-slide theme's fill is
      // a gradient. A control that reads only the accent came out flat while
      // the header above it slid. models/lib/themeAccents.js
      const fill = activeFill(color, custom);
      if (fill) {
        root.style.setProperty('--theme-accent-fill', fill);
      } else {
        root.style.removeProperty('--theme-accent-fill');
      }
      if (c1) {
        document.body.classList.add('has-custom-theme-color');
      } else {
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

  // Member Settings / Change color, beside "Default (no override)": paint the All
  // Boards tiles in the theme's lighter colour instead of each board's own. It is
  // a class on <body> rather than one on the list, because the preference is the
  // user's and follows them to every page that shows board tiles.
  Tracker.autorun(() => {
    const user = Meteor.user();
    const on = !!(user && user.profile && user.profile.allBoardsThemeTiles);
    try {
      document.body.classList.toggle('has-theme-board-tiles', on);
    } catch (_) {
      // document.body may not exist yet in exotic embeddings; ignore.
    }
  });

  Tracker.autorun(() => {
    const user = Meteor.user();
    const globalColor = user && user.profile && user.profile.globalThemeColor;

    if (globalColor) {
      // #5778: a user's own override wins EVERYWHERE — including board pages. The
      // header and .board-wrapper also prefer it (see header.jade / boardBody.jade),
      // so the whole UI takes the chosen theme; unset it to return to the site theme
      // and to per-board colors.
      applyClass(`board-color-${globalColor}`);
      applyCustom((user && user.profile && user.profile.globalThemeCustomColors) || [],
        globalColor);
      return;
    }

    const boardId = Session.get('currentBoard');
    const board = boardId ? ReactiveCache.getBoard(boardId) : null;

    // No user override: the SITE theme, if this site (or this Organization's host)
    // has one. Not on a board page - there, the board's own colour owns the page.
    const setting = ReactiveCache.getCurrentSetting();
    const siteColor = !board && setting && setting.themeColor;
    if (siteColor) {
      applyClass(`board-color-${siteColor}`);
      applyCustom((setting && setting.themeCustomColors) || [], siteColor);
      return;
    }

    // Otherwise WeKan's default theme: on a board expose that board's own custom
    // colors (its color class already lives on .board-wrapper/#header); off a board,
    // apply nothing.
    applyClass(null);
    // On a board the board's own colour owns the page, and its accent is what the
    // chrome should follow too - the sidebar, its buttons and every Save button.
    applyCustom((board && board.customThemeColors) || [], board && board.color);
  });
});
