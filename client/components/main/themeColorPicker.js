import { ReactiveCache } from '/imports/reactiveCache';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { isHexColor, toHex } from '/models/lib/contrastColor';
import { BOARD_COLORS } from '/models/metadata/colors';
import {
  THEME_CATEGORY_ORDER,
  categoryOf,
  colorsInCategory,
  allowsCustomColor,
  customColorCount,
} from '/models/lib/themeCategories';

// Shared "Select Color" picker (docs/Features/Page/Theme.md): VISIBLE color swatches grouped
// by category (with the category name above each group) + native color wheel(s) for
// the flat/clear categories once such a color is selected.
//
// ONE template, rendered wherever a theme is chosen - the way docs/Features/Page/Table.md
// is one table page for every table. `data.scope` says whose theme is being set, and
// that is the only difference between the three places:
//   'board'  — Board Settings / Change Color   -> board.color
//   'global' — Member Settings / Change Color  -> the user's own override (#5778)
//   'admin'  — Admin Panel / Settings / Visibility / Change color -> the SITE theme:
//              the instance's for the site admin, the Organization's own for an
//              Organization's admin (the server decides which, see
//              models/lib/tenantAdmin.js themeTarget).
//
// The layering, from weakest to strongest (docs/Theme/Theme.md):
//   1. WeKan's default theme
//   2. the site theme set here in the Admin Panel (an Organization's own value
//      replaces the instance's on that Organization's hosts)
//   3. the user's own override
// See docs/Features/Page/Theme.md for the whole design.

const DEFAULT_WHEEL = ['#2980b9', '#6dd5fa']; // stock flat accent / second slide stop

function readCurrent(scope) {
  if (scope === 'board') {
    const b = Utils.getCurrentBoard();
    return { color: (b && b.color) || BOARD_COLORS[0], custom: (b && b.customThemeColors) || [] };
  }
  const u = ReactiveCache.getCurrentUser();
  return {
    color: (u && u.getGlobalThemeColor && u.getGlobalThemeColor()) || null,
    custom: (u && u.getGlobalThemeCustomColors && u.getGlobalThemeCustomColors()) || [],
  };
}

const SCOPES = ['board', 'global', 'admin'];

Template.themeColorPicker.onCreated(function () {
  const asked = this.data && this.data.scope;
  const scope = SCOPES.includes(asked) ? asked : 'global';
  this.scope = scope;
  if (scope === 'admin') {
    // The site theme is not published to every client, so it is read once from the
    // server - which also answers WHOSE theme this admin is setting.
    this.color = new ReactiveVar(null);
    this.customColors = new ReactiveVar([]);
    Meteor.call('getAdminThemeColor', (err, res) => {
      if (err || !res) return;
      this.color.set(res.color || null);
      this.customColors.set((res.custom || []).slice());
    });
    return;
  }
  const cur = readCurrent(scope);
  this.color = new ReactiveVar(cur.color); // null for global = no override
  this.customColors = new ReactiveVar((cur.custom || []).slice());
});

// WHICH category's custom colours this picker is offering.
//
// The category of the theme that is selected - and when NOTHING is selected, the
// FLAT one. That case is Member Settings / Change Color and Admin Panel /
// Visibility sitting on "Default (no override)", which is where they open: the
// custom-colour wheel was hidden until a named theme had been picked, so those
// two pages looked as though they had no custom colour at all, while Board
// Settings - where a board always has a colour, and the first one is flat -
// always showed it. A custom colour is now offered in all three, and choosing
// one from "Default" applies it over the first flat theme, which is the base
// its single wheel describes.
function customCategory(tpl) {
  const cur = tpl.color.get();
  return cur ? categoryOf(cur) : THEME_CATEGORY_ORDER[0];
}

Template.themeColorPicker.helpers({
  // The "Default theme" row - clearing the override - belongs to every scope that
  // HAS a weaker layer under it. A board always has a colour, so it has no such row.
  isGlobal() {
    return Template.instance().scope !== 'board';
  },
  isNoneSelected() {
    const tpl = Template.instance();
    return tpl.scope !== 'board' && !tpl.color.get();
  },
  // "All Boards" sits beside "Default (no override)" and belongs to the USER's own
  // theme only: it is a preference about the overview page, not something a site
  // admin sets for everybody, and a board has no overview of its own.
  isUserScope() {
    return Template.instance().scope === 'global';
  },
  allBoardsTilesOn() {
    const u = ReactiveCache.getCurrentUser();
    return !!(u && u.hasAllBoardsThemeTiles && u.hasAllBoardsThemeTiles());
  },
  // Visible swatches grouped by category, each group labelled with its category name.
  themeGroups() {
    const cur = Template.instance().color.get();
    return THEME_CATEGORY_ORDER.map(key => ({
      key,
      label: TAPi18n.__(`theme-category-${key}`),
      colors: colorsInCategory(key).map(name => ({ name, selected: name === cur })),
    }));
  },
  showCustom() {
    return allowsCustomColor(customCategory(Template.instance()));
  },
  customWheels() {
    const tpl = Template.instance();
    const n = customColorCount(customCategory(tpl));
    const cc = tpl.customColors.get();
    const wheels = [];
    for (let i = 0; i < n; i += 1) {
      wheels.push({ index: i, value: toHex(cc[i]) || DEFAULT_WHEEL[i] || '#0079bf' });
    }
    return wheels;
  },
  previewClass() {
    const color = Template.instance().color.get();
    return color ? `board-color-${color}` : '';
  },
  // Inline preview of custom colors (the stock board-color-* CSS can't show arbitrary
  // colors until the CSS-variable refactor; the preview swatch shows them directly).
  previewStyle() {
    const tpl = Template.instance();
    const cat = customCategory(tpl);
    if (!allowsCustomColor(cat)) return '';
    const cc = tpl.customColors.get();
    if (!cc.some(Boolean)) return '';
    if (customColorCount(cat) === 2 && cc[0] && cc[1]) {
      return `background: linear-gradient(135deg, ${cc[0]}, ${cc[1]}) !important;`;
    }
    if (cc[0]) return `background: ${cc[0]} !important;`;
    return '';
  },
});

// Collect the custom colors to save: [] unless the user actually engaged a wheel, in
// which case read every wheel's current value (untouched ones contribute their shown
// default) so the result is a complete set of the category's expected count.
function gatherCustom(tpl) {
  const cat = customCategory(tpl);
  if (!allowsCustomColor(cat)) return [];
  if (!tpl.customColors.get().some(Boolean)) return [];
  const n = customColorCount(cat);
  const wheels = Array.from(tpl.findAll('.js-theme-wheel'))
    .map(w => w.value)
    .filter(isHexColor)
    .slice(0, n);
  return wheels.length === n ? wheels : [];
}

// Apply the current selection immediately (no Save button): board scope writes
// board.color, global scope calls setGlobalThemeColor. `color`/`custom` are read
// from the reactive state so the same helper serves the swatch click and the wheel.
function applySelection(tpl) {
  const color = tpl.color.get() || colorsInCategory(THEME_CATEGORY_ORDER[0])[0];
  const custom = gatherCustom(tpl);
  if (tpl.scope === 'board') {
    const b = Utils.getCurrentBoard();
    if (b) {
      Promise.resolve(b.setColor(color, custom)).catch(e => {
        if (process.env.DEBUG === 'true') console.error('board setColor error', e);
      });
    }
  } else if (tpl.scope === 'admin') {
    Meteor.call('setAdminThemeColor', color, custom, err => {
      if (err && process.env.DEBUG === 'true') console.error('setAdminThemeColor error', err);
    });
  } else {
    Meteor.call('setGlobalThemeColor', color, custom, err => {
      if (err && process.env.DEBUG === 'true') console.error('setGlobalThemeColor error', err);
    });
  }
}

Template.themeColorPicker.events({
  // Clicking a color swatch applies that theme IMMEDIATELY (there is no Save button).
  'click .js-select-theme'(event, tpl) {
    const color = event.currentTarget.dataset.color;
    if (!color) return;
    tpl.color.set(color);
    tpl.customColors.set([]); // a fresh theme -> its stock colors
    applySelection(tpl);
  },
  // Live-update the preview while dragging the wheel...
  'input .js-theme-wheel'(event, tpl) {
    const idx = parseInt(event.currentTarget.dataset.index, 10);
    const val = event.currentTarget.value;
    if (!isHexColor(val)) return;
    const cc = tpl.customColors.get().slice();
    cc[idx] = val;
    tpl.customColors.set(cc);
  },
  // ...and apply the custom color when the wheel is committed (avoids spamming the
  // server on every intermediate value during the drag).
  'change .js-theme-wheel'(event, tpl) {
    // From "Default (no override)" there is no theme under the colour yet.
    // applySelection() already falls back to the first flat theme, so the SAME
    // fallback is written into the picker's own state: otherwise the wheel would
    // save a theme the page does not show as chosen, and the next click would
    // read the selection back as "none".
    if (!tpl.color.get()) tpl.color.set(colorsInCategory(THEME_CATEGORY_ORDER[0])[0]);
    applySelection(tpl);
  },
  // Paint the All Boards tiles in the theme's lighter colour, or give them back
  // their own colours. Applies immediately, like everything else in this popup,
  // and the popup stays open so the effect can be seen and undone in one place.
  'click .js-theme-all-boards'(event) {
    event.preventDefault();
    Meteor.call('toggleAllBoardsThemeTiles', err => {
      if (err && process.env.DEBUG === 'true') {
        console.error('toggleAllBoardsThemeTiles error', err);
      }
    });
  },
  // Clear the global override (Default) — applies immediately too.
  'click .js-theme-none'(event, tpl) {
    event.preventDefault();
    tpl.color.set(null);
    tpl.customColors.set([]);
    if (tpl.scope === 'board') {
      const b = Utils.getCurrentBoard();
      if (b) b.setColor(BOARD_COLORS[0], []);
    } else if (tpl.scope === 'admin') {
      Meteor.call('setAdminThemeColor', null, null);
    } else {
      Meteor.call('setGlobalThemeColor', null, null);
    }
  },
});
