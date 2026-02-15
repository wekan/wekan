import { ReactiveCache } from '/imports/reactiveCache';
import {
  DEFAULT_ASSETLINKS,
  DEFAULT_HEAD_LINKS,
  DEFAULT_HEAD_META,
  DEFAULT_SITE_MANIFEST,
} from '/imports/lib/customHeadDefaults';
import { Blaze } from 'meteor/blaze';
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
  calendar 
} from '/imports/lib/dateUtils';

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

Blaze.registerHelper('getUser', userId => ReactiveCache.getUser(userId));

Blaze.registerHelper('concat', (...args) => args.slice(0, -1).join(''));

Blaze.registerHelper('isMiniScreen', () => Utils.isMiniScreen());

Blaze.registerHelper('isTouchScreen', () => Utils.isTouchScreen());

Blaze.registerHelper('isShowDesktopDragHandles', () =>
  Utils.isShowDesktopDragHandles(),
);

Blaze.registerHelper('isTouchScreenOrShowDesktopDragHandles', () =>
  Utils.isTouchScreenOrShowDesktopDragHandles(),
);

Blaze.registerHelper('moment', (...args) => {
  args.pop(); // hash
  const [date, formatStr] = args;
  return format(new Date(date), formatStr ?? 'LLLL');
});

Blaze.registerHelper('canModifyCard', () =>
  Utils.canModifyCard(),
);

Blaze.registerHelper('canMoveCard', () =>
  Utils.canMoveCard(),
);

Blaze.registerHelper('canModifyBoard', () =>
  Utils.canModifyBoard(),
);

Blaze.registerHelper('add', (a, b) => a + b);

Blaze.registerHelper('increment', (n) => (n || 0) + 1);
