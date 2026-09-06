'use strict';

// One allow-list for every client. The database keeps HTML numeric character
// references for backwards compatibility, while `ascii` gives HTML4 clients a
// meaningful printable label when their font cannot display the emoji.
const REACTION_DEFINITIONS = [
  { codepoint: '&#128077;', ascii: '+1' },
  { codepoint: '&#128078;', ascii: '-1' },
  { codepoint: '&#128064;', ascii: 'eyes' },
  { codepoint: '&#9989;', ascii: 'done' },
  { codepoint: '&#10060;', ascii: 'no' },
  { codepoint: '&#128591;', ascii: 'thanks' },
  { codepoint: '&#128079;', ascii: 'clap' },
  { codepoint: '&#127881;', ascii: 'party' },
  { codepoint: '&#128640;', ascii: 'rocket' },
  { codepoint: '&#128522;', ascii: 'smile' },
  { codepoint: '&#129300;', ascii: 'think' },
  { codepoint: '&#128532;', ascii: 'sad' },
];

const COMMENT_REACTIONS = Object.freeze(REACTION_DEFINITIONS.map(item => Object.freeze({
  ...item,
  character: String.fromCodePoint(Number(item.codepoint.slice(2, -1))),
})));

const COMMENT_REACTION_BY_CODEPOINT = new Map(
  COMMENT_REACTIONS.map(reaction => [reaction.codepoint, reaction]),
);

function commentReaction(codepoint) {
  return COMMENT_REACTION_BY_CODEPOINT.get(String(codepoint || '')) || null;
}

function canonicalCommentReactions(value) {
  const byCodepoint = new Map();
  for (const item of Array.isArray(value) ? value : []) {
    const catalogued = commentReaction(item && item.reactionCodepoint);
    if (!catalogued) continue;
    const ids = byCodepoint.get(catalogued.codepoint) || new Set();
    for (const id of Array.isArray(item.userIds) ? item.userIds : []) {
      if (typeof id === 'string' && id) ids.add(id);
    }
    byCodepoint.set(catalogued.codepoint, ids);
  }
  return COMMENT_REACTIONS.flatMap(({ codepoint }) => {
    const ids = byCodepoint.get(codepoint);
    return ids && ids.size
      ? [{ reactionCodepoint: codepoint, userIds: [...ids].sort() }]
      : [];
  });
}

module.exports = { COMMENT_REACTIONS, canonicalCommentReactions, commentReaction };
