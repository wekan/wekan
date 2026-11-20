'use strict';

// Reactions on imported chat messages, as WeKan comment reactions
// (models/cardCommentReactions.js: one emoji code point, written "&#N;", and
// the users who reacted). Pure - no Meteor - so tests/importedReactions.test.cjs
// runs it in plain Node.
//
// A normalized comment may carry
//   reactions: [{ emoji, name, authors: [source user key], count }]
// - `emoji` the character itself (Telegram, Discord), or `name` a shortcode
// (Slack's "thumbsup", Mattermost's "+1"). WeKan keeps a reaction by WHO
// reacted, so only reactions of people mapped to WeKan users are kept; the
// rest are counted and reported, as are emoji WeKan cannot store: a shortcode
// that is not in the table below, or an emoji of several code points (a skin
// tone, a flag, a family).

// The shortcodes Slack and Mattermost write for the reactions people use most;
// both name them the same, from the same emoji set. One code point each.
export const SHORTCODES = {
  '+1': 0x1F44D, thumbsup: 0x1F44D, '-1': 0x1F44E, thumbsdown: 0x1F44E,
  heart: 0x2764, smile: 0x1F604, smiley: 0x1F603, grinning: 0x1F600, laughing: 0x1F606, joy: 0x1F602,
  slightly_smiling_face: 0x1F642, wink: 0x1F609, blush: 0x1F60A, heart_eyes: 0x1F60D, thinking_face: 0x1F914,
  confused: 0x1F615, cry: 0x1F622, sob: 0x1F62D, scream: 0x1F631, open_mouth: 0x1F62E, rage: 0x1F621,
  tada: 0x1F389, eyes: 0x1F440, rocket: 0x1F680, fire: 0x1F525, pray: 0x1F64F, clap: 0x1F44F,
  raised_hands: 0x1F64C, ok_hand: 0x1F44C, wave: 0x1F44B, muscle: 0x1F4AA, point_up: 0x261D,
  100: 0x1F4AF, white_check_mark: 0x2705, heavy_check_mark: 0x2714, x: 0x274C, warning: 0x26A0,
  star: 0x2B50, sparkles: 0x2728, zap: 0x26A1, bulb: 0x1F4A1, memo: 0x1F4DD, coffee: 0x2615,
  beers: 0x1F37B, cake: 0x1F370, trophy: 0x1F3C6, medal: 0x1F3C5, bell: 0x1F514, lock: 0x1F512,
  question: 0x2753, exclamation: 0x2757, hourglass: 0x231B, calendar: 0x1F4C5, pushpin: 0x1F4CC,
};

const VARIATION = /️|︎/g;

// "&#128077;" for one emoji, or null when it is not one code point.
export function reactionCodepoint({ emoji, name } = {}) {
  let point = null;
  if (typeof emoji === 'string' && emoji) {
    const chars = [...emoji.replace(VARIATION, '')];
    if (chars.length === 1) point = chars[0].codePointAt(0);
  } else if (typeof name === 'string' && name) {
    const key = name.trim().replace(/^:|:$/g, '').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(SHORTCODES, key)) point = SHORTCODES[key];
  }
  // The schema's own check: &# and four to six digits.
  if (!point || point < 1000 || point > 999999) return null;
  return `&#${point};`;
}

// A comment's reactions as WeKan stores them, with what could not be kept.
//   members: source user key -> WeKan user id
// -> { reactions: [{ reactionCodepoint, userIds }], unknown, unmapped }
//   unknown   reactions of an emoji WeKan cannot store
//   unmapped  reactions of people not mapped to a WeKan user
export function importedReactions(reactions, members = {}) {
  const out = new Map();
  let unknown = 0;
  let unmapped = 0;
  for (const reaction of Array.isArray(reactions) ? reactions : []) {
    if (!reaction || typeof reaction !== 'object') continue;
    const authors = (Array.isArray(reaction.authors) ? reaction.authors : [])
      .filter(key => (typeof key === 'string' && key) || (typeof key === 'number' && Number.isFinite(key)));
    const count = Math.max(Number(reaction.count) || 0, authors.length);
    if (!count) continue;
    const code = reactionCodepoint(reaction);
    if (!code) { unknown += count; continue; }
    const userIds = [...new Set(authors.map(key => members[key]).filter(Boolean))];
    unmapped += count - userIds.length;
    if (!userIds.length) continue;
    const kept = out.get(code) || [];
    out.set(code, [...new Set([...kept, ...userIds])]);
  }
  return {
    reactions: [...out.entries()].map(([reactionCodepoint, userIds]) => ({ reactionCodepoint, userIds })),
    unknown,
    unmapped,
  };
}
