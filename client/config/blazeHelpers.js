import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import moment from 'moment/min/moment-with-locales';

Blaze.registerHelper('currentBoard', () => {
  const ret = Utils.getCurrentBoard();
  return ret;
});

Blaze.registerHelper('currentCard', () => {
  const ret = Utils.getCurrentCard();
  return ret;
});

Blaze.registerHelper('currentList', () => {
  const listId = Session.get('currentList');
  if (listId) {
    return Lists.findOne(listId);
  } else {
    return null;
  }
});

Blaze.registerHelper('getUser', userId => Users.findOne(userId));

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
  const [date, format] = args;
  return moment(date).format(format);
});
