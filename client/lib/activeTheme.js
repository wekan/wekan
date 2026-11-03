import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveCache } from '/imports/reactiveCache';

// The name of the theme the page is drawn in, in the order of themes of
// client/components/main/globalThemeColor.js: the member's own override, then the
// board's own colour on a board page, then the site theme. '' for WeKan's default.
// Reactive, so a Tracker.autorun that reads it follows a change of theme.
export function activeThemeName() {
  const user = Meteor.user();
  const own = user && user.profile && user.profile.globalThemeColor;
  if (own) return own;
  const boardId = Session.get('currentBoard');
  const board = boardId ? ReactiveCache.getBoard(boardId) : null;
  if (board && board.color) return board.color;
  const setting = ReactiveCache.getCurrentSetting();
  return (!board && setting && setting.themeColor) || '';
}
