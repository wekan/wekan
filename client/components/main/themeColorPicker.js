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

// Shared "Select Color" picker (docs/Theme/Theme.md): VISIBLE color swatches grouped
// by category (with the category name above each group) + native color wheel(s) for
// the flat/clear categories once such a color is selected. data.scope is 'board'
// (writes board.color) or 'global' (writes the user's #5778 global override).

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

Template.themeColorPicker.onCreated(function () {
  const scope = this.data && this.data.scope === 'board' ? 'board' : 'global';
  const cur = readCurrent(scope);
  this.scope = scope;
  this.color = new ReactiveVar(cur.color); // null for global = no override
  this.customColors = new ReactiveVar((cur.custom || []).slice());
});

Template.themeColorPicker.helpers({
  isGlobal() {
    return Template.instance().scope === 'global';
  },
  isNoneSelected() {
    const tpl = Template.instance();
    return tpl.scope === 'global' && !tpl.color.get();
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
    const cur = Template.instance().color.get();
    return cur ? allowsCustomColor(categoryOf(cur)) : false;
  },
  customWheels() {
    const tpl = Template.instance();
    const cur = tpl.color.get();
    const n = cur ? customColorCount(categoryOf(cur)) : 0;
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
    const cur = tpl.color.get();
    const cat = cur ? categoryOf(cur) : null;
    if (!cat || !allowsCustomColor(cat)) return '';
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
  const color = tpl.color.get();
  const cat = color ? categoryOf(color) : null;
  if (!cat || !allowsCustomColor(cat)) return [];
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
    applySelection(tpl);
  },
  // Clear the global override (Default) — applies immediately too.
  'click .js-theme-none'(event, tpl) {
    event.preventDefault();
    tpl.color.set(null);
    tpl.customColors.set([]);
    if (tpl.scope === 'board') {
      const b = Utils.getCurrentBoard();
      if (b) b.setColor(BOARD_COLORS[0], []);
    } else {
      Meteor.call('setGlobalThemeColor', null, null);
    }
  },
});
