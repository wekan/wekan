import { Meteor } from 'meteor/meteor';
import { BOARD_COLORS } from '/models/metadata/colors';
import { isValidCustomColors } from '/models/lib/themeCategories';
import {
  UI_FONTS, UI_FONT_SIZES, isKnownFont, isKnownFontSize, isHexColor6,
} from '/models/lib/uiFonts';
import securityLog from '/server/lib/securityLog';

function report(user, context, detail) {
  securityLog.record({
    category: 'input', bleed: 'UserBleed', severity: 'high', action: 'blocked',
    source: 'memberAppearance', userId: user?._id || context.userId,
    username: user?.username, req: context.req, connection: context.connection, detail,
  });
}

async function account(userId, context) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { username: 1, profile: 1 },
  });
  if (!user) {
    report(user, { ...context, userId }, 'refused member appearance access without an account');
    throw new Meteor.Error('not-authorized');
  }
  return user;
}

export async function memberAppearanceForUser(userId, context = {}) {
  const user = await account(userId, context);
  const profile = user.profile || {};
  return {
    themeColor: BOARD_COLORS.includes(profile.globalThemeColor)
      ? profile.globalThemeColor : '',
    customThemeColors: Array.isArray(profile.globalThemeCustomColors)
      ? profile.globalThemeCustomColors.slice(0, 2) : [],
    allBoardsThemeTiles: profile.allBoardsThemeTiles === true,
    uiFont: isKnownFont(profile.uiFont) ? profile.uiFont : '',
    uiFontSize: isKnownFontSize(profile.uiFontSize) ? profile.uiFontSize : 'default',
    uiTextColor: isHexColor6(profile.uiTextColor) ? profile.uiTextColor : '',
    themeColors: [...BOARD_COLORS],
    fonts: [...UI_FONTS],
    fontSizes: UI_FONT_SIZES.map(size => ({ ...size })),
  };
}

export async function setMemberTheme(userId, input, context = {}) {
  const user = await account(userId, context);
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    report(user, context, 'refused malformed member theme input');
    throw new Meteor.Error('invalid-color');
  }
  const allowed = new Set(['color', 'customColors', 'allBoardsThemeTiles']);
  const unknown = Object.keys(input).filter(key => !allowed.has(key));
  const color = input.color == null ? '' : input.color;
  const customColors = input.customColors == null ? [] : input.customColors;
  if (unknown.length || typeof color !== 'string' || !Array.isArray(customColors)
    || typeof input.allBoardsThemeTiles !== 'boolean'
    || (color && !BOARD_COLORS.includes(color))
    || (customColors.length > 0 && (!color || !isValidCustomColors(color, customColors)))) {
    report(user, context, `refused invalid member theme ${String(color).slice(0, 100)}`);
    throw new Meteor.Error('invalid-color');
  }
  const $set = { 'profile.allBoardsThemeTiles': input.allBoardsThemeTiles };
  const $unset = {};
  if (color) $set['profile.globalThemeColor'] = color;
  else $unset['profile.globalThemeColor'] = '';
  if (customColors.length) $set['profile.globalThemeCustomColors'] = customColors;
  else $unset['profile.globalThemeCustomColors'] = '';
  const modifier = { $set };
  if (Object.keys($unset).length) modifier.$unset = $unset;
  await Meteor.users.updateAsync(userId, modifier);
  return memberAppearanceForUser(userId, context);
}

export async function setMemberFont(userId, input, context = {}) {
  const user = await account(userId, context);
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    report(user, context, 'refused malformed member font input');
    throw new Meteor.Error('invalid-font');
  }
  const allowed = new Set(['font', 'size', 'textColor']);
  const unknown = Object.keys(input).filter(key => !allowed.has(key));
  const font = input.font == null ? '' : input.font;
  const size = input.size == null || input.size === '' ? 'default' : input.size;
  const textColor = input.textColor == null ? '' : input.textColor;
  if (unknown.length || typeof font !== 'string' || typeof size !== 'string'
    || typeof textColor !== 'string' || (font && !isKnownFont(font))
    || !isKnownFontSize(size) || (textColor && !isHexColor6(textColor))) {
    report(user, context, `refused invalid member font ${String(font).slice(0, 100)}`);
    throw new Meteor.Error('invalid-font');
  }
  const $set = {};
  const $unset = { 'profile.uiTextBgColor': '' };
  if (font) $set['profile.uiFont'] = font;
  else $unset['profile.uiFont'] = '';
  if (size !== 'default') $set['profile.uiFontSize'] = size;
  else $unset['profile.uiFontSize'] = '';
  if (textColor) $set['profile.uiTextColor'] = textColor;
  else $unset['profile.uiTextColor'] = '';
  const modifier = { $unset };
  if (Object.keys($set).length) modifier.$set = $set;
  await Meteor.users.updateAsync(userId, modifier);
  return memberAppearanceForUser(userId, context);
}
