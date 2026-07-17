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

// Shared "Select Color" picker (docs/Theme/Theme.md): two-level dropdowns
// (category -> theme) + native color wheel(s) for the flat/clear categories.
// data.scope is 'board' (writes board.color) or 'global' (writes the user's #5778
// global override).

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
  const forCategory = cur.color || 'belize';
  this.scope = scope;
  this.category = new ReactiveVar(categoryOf(forCategory) || 'flat');
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
  categories() {
    const cur = Template.instance().category.get();
    return THEME_CATEGORY_ORDER.map(key => ({
      key,
      label: TAPi18n.__(`theme-category-${key}`),
      selected: key === cur,
    }));
  },
  themes() {
    const tpl = Template.instance();
    const cur = tpl.color.get();
    return colorsInCategory(tpl.category.get()).map(color => ({ color, selected: color === cur }));
  },
  showCustom() {
    return allowsCustomColor(Template.instance().category.get());
  },
  customWheels() {
    const tpl = Template.instance();
    const n = customColorCount(tpl.category.get());
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
    if (!allowsCustomColor(tpl.category.get())) return '';
    const cc = tpl.customColors.get();
    if (!cc.some(Boolean)) return '';
    if (customColorCount(tpl.category.get()) === 2 && cc[0] && cc[1]) {
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
  const cat = tpl.category.get();
  if (!allowsCustomColor(cat)) return [];
  if (!tpl.customColors.get().some(Boolean)) return [];
  const n = customColorCount(cat);
  const wheels = Array.from(tpl.findAll('.js-theme-wheel'))
    .map(w => w.value)
    .filter(isHexColor)
    .slice(0, n);
  return wheels.length === n ? wheels : [];
}

Template.themeColorPicker.events({
  'change .js-theme-category'(event, tpl) {
    const cat = event.currentTarget.value;
    tpl.category.set(cat);
    tpl.color.set(colorsInCategory(cat)[0]); // default to the first theme in the category
    tpl.customColors.set([]); // custom colors do not carry across categories
  },
  'change .js-theme-color'(event, tpl) {
    tpl.color.set(event.currentTarget.value);
  },
  'input .js-theme-wheel'(event, tpl) {
    const idx = parseInt(event.currentTarget.dataset.index, 10);
    const val = event.currentTarget.value;
    if (!isHexColor(val)) return;
    const cc = tpl.customColors.get().slice();
    cc[idx] = val;
    tpl.customColors.set(cc);
  },
  async 'click .js-theme-save'(event, tpl) {
    event.preventDefault();
    const color = tpl.color.get() || colorsInCategory(tpl.category.get())[0];
    const custom = gatherCustom(tpl);
    if (tpl.scope === 'board') {
      const b = Utils.getCurrentBoard();
      if (b) {
        try {
          await b.setColor(color, custom);
        } catch (e) {
          if (process.env.DEBUG === 'true') console.error('board setColor error', e);
        }
      }
    } else {
      Meteor.call('setGlobalThemeColor', color, custom, err => {
        if (err && process.env.DEBUG === 'true') console.error('setGlobalThemeColor error', err);
      });
    }
    Popup.back();
  },
  'click .js-theme-none'(event, tpl) {
    event.preventDefault();
    if (tpl.scope === 'board') {
      const b = Utils.getCurrentBoard();
      if (b) b.setColor(BOARD_COLORS[0], []);
    } else {
      Meteor.call('setGlobalThemeColor', null, null);
    }
    Popup.back();
  },
});
