import { ReactiveCache } from '/imports/reactiveCache';
import {
  DEFAULT_ASSETLINKS,
  DEFAULT_HEAD_LINKS,
  DEFAULT_HEAD_META,
  DEFAULT_SITE_MANIFEST,
} from '/imports/lib/customHeadDefaults';
import { Blaze } from 'meteor/blaze';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import {
  formatDateTime,
  formatDate,
  formatTime,
  getISOWeek,
  isValidDate,
  isBefore,
  isAfter,
  isSame,
  add,
  subtract,
  startOf,
  endOf,
  format,
  parseDate,
  now,
  createDate,
  fromNow,
  calendar,
} from '/imports/lib/dateUtils';
import { Utils } from '/client/lib/utils';
import { isHexColor, contrastText } from '/models/lib/contrastColor';

// #5514: a color (label / list / swimlane / card) may be either a named palette
// color rendered via a CSS class (e.g. `card-label-green`) or a custom
// '#rrggbb' hex chosen from the color wheel. For a hex value there is no CSS
// class, so we emit an inline `background-color` plus an automatically readable
// text `color` (contrastText). These helpers let templates keep the class path
// for named colors and switch to inline styles for hex.

// Class for a label chip: `card-label-<name>` for named colors, empty for hex.
Blaze.registerHelper('labelColorClass', color =>
  isHexColor(color) ? '' : `card-label-${color}`,
);

// Inline style for a label chip: background + readable text for a hex color,
// empty for a named color (its CSS class already sets both).
Blaze.registerHelper('labelColorStyle', color =>
  isHexColor(color)
    ? `background-color:${color};color:${contrastText(color)};`
    : '',
);

Blaze.registerHelper('currentBoard', () => {
  const ret = Utils.getCurrentBoard();
  return ret;
});

Blaze.registerHelper('currentCard', () => {
  const ret = Utils.getCurrentCard();
  return ret;
});

Blaze.registerHelper('currentList', () => {
  const ret = Utils.getCurrentList();
  return ret;
});

Blaze.registerHelper('currentSetting', () => {
  const ret = ReactiveCache.getCurrentSetting();
  return ret;
});

Blaze.registerHelper('customHeadMetaTagsValue', () => {
  const setting = ReactiveCache.getCurrentSetting();
  if (setting && typeof setting.customHeadMetaTags === 'string') {
    return setting.customHeadMetaTags;
  }
  return DEFAULT_HEAD_META;
});

Blaze.registerHelper('customHeadLinkTagsValue', () => {
  const setting = ReactiveCache.getCurrentSetting();
  if (setting && typeof setting.customHeadLinkTags === 'string') {
    return setting.customHeadLinkTags;
  }
  return DEFAULT_HEAD_LINKS;
});

Blaze.registerHelper('customManifestContentValue', () => {
  const setting = ReactiveCache.getCurrentSetting();
  if (setting && typeof setting.customManifestContent === 'string') {
    return setting.customManifestContent;
  }
  return DEFAULT_SITE_MANIFEST;
});

Blaze.registerHelper('customAssetLinksContentValue', () => {
  const setting = ReactiveCache.getCurrentSetting();
  if (setting && typeof setting.customAssetLinksContent === 'string') {
    return setting.customAssetLinksContent;
  }
  return DEFAULT_ASSETLINKS;
});

Blaze.registerHelper('currentUser', () => {
  const ret = ReactiveCache.getCurrentUser();
  return ret;
});

// Admin Panel / Features / Security master switches. Templates use these to hide
// the import / export menu options when an admin has disabled all import / export.
Blaze.registerHelper('importDisabled', () =>
  !!(ReactiveCache.getCurrentSetting() || {}).disableAllImport,
);

Blaze.registerHelper('exportDisabled', () =>
  !!(ReactiveCache.getCurrentSetting() || {}).disableAllExport,
);

// Admin Panel / Features / Notifications (#5820). Templates use these to hide
// the activity feed and the watch controls when an admin has disabled them.
Blaze.registerHelper('activitiesDisabled', () =>
  !!(ReactiveCache.getCurrentSetting() || {}).disableActivities,
);

Blaze.registerHelper('watchDisabled', () =>
  !!(ReactiveCache.getCurrentSetting() || {}).disableWatch,
);

Blaze.registerHelper('getUser', (userId) => ReactiveCache.getUser(userId));

Blaze.registerHelper('concat', (...args) => args.slice(0, -1).join(''));

Blaze.registerHelper('isMiniScreen', () => Utils.isMiniScreen());

Blaze.registerHelper('isTouchScreen', () => Utils.isTouchScreen());

Blaze.registerHelper('isShowDesktopDragHandles', () =>
  Utils.isShowDesktopDragHandles(),
);

Blaze.registerHelper('isTouchScreenOrShowDesktopDragHandles', () =>
  Utils.isTouchScreenOrShowDesktopDragHandles(),
);

Blaze.registerHelper('displayDate', (...args) => {
  args.pop(); // hash
  const [date, formatStr] = args;
  return format(new Date(date), formatStr ?? 'LLLL');
});

Blaze.registerHelper('canModifyCard', () => Utils.canModifyCard());

Blaze.registerHelper('canMoveCard', () => Utils.canMoveCard());

Blaze.registerHelper('canModifyBoard', () => Utils.canModifyBoard());

Blaze.registerHelper('add', (a, b) => a + b);

Blaze.registerHelper('increment', (n) => (n || 0) + 1);

// Operator helpers (replacement for raix:handlebar-helpers)
Blaze.registerHelper('$eq', (a, b) => a === b);
Blaze.registerHelper('$neq', (a, b) => a !== b);
Blaze.registerHelper('$gt', (a, b) => a > b);
Blaze.registerHelper('$lt', (a, b) => a < b);
Blaze.registerHelper('$gte', (a, b) => a >= b);
Blaze.registerHelper('$lte', (a, b) => a <= b);
Blaze.registerHelper('$and', (a, b) => a && b);
Blaze.registerHelper('$or', (a, b) => a || b);
Blaze.registerHelper('$not', (a) => !a);
Blaze.registerHelper('$in', (...args) => {
  args.pop(); // Blaze hash argument
  const value = args.shift();
  return args.some((arg) => value === arg);
});
Blaze.registerHelper('$nin', (...args) => {
  args.pop(); // Blaze hash argument
  const value = args.shift();
  return args.every((arg) => value !== arg);
});
Blaze.registerHelper('$', () => ({ Session, Meteor }));

// Expose module-scoped objects to Blaze templates (jade references)
import { Filter } from '/client/lib/filter';
import { MultiSelection } from '/client/lib/multiSelection';
import { BoardMultiSelection } from '/client/lib/boardMultiSelection';

let _Sidebar;
function getSidebar() {
  if (!_Sidebar) {
    _Sidebar = require('/client/features/sidebar/service').getSidebarInstance;
  }
  return _Sidebar();
}

Blaze.registerHelper('Filter', () => Filter);
Blaze.registerHelper('MultiSelection', () => MultiSelection);
Blaze.registerHelper('Sidebar', () => getSidebar());
Blaze.registerHelper('BoardMultiSelection', () => BoardMultiSelection);
