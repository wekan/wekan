// Pure, dependency-free check that a comment-reaction update only changes the
// ACTING USER's own reactions. No Meteor imports, so it is unit tested directly
// with plain Node (tests/reactionOwnership.test.cjs).
//
// Found while auditing for more of GHSA-pqr4-rxgp-hv2m (the REST comment delete
// that checked board membership and nothing about WHOSE comment it was). A
// CardCommentReactions document is
//
//   { cardCommentId, reactions: [ { reactionCodepoint, userIds: [...] } ] }
//
// and its allow rule was `allowIsBoardMemberCommentOnly` for insert, update AND
// remove - board membership, and nothing about whose reaction is being changed.
// The whole `reactions` array is one field, so a member could $set it to
// anything: add their colleague's userId to a reaction they never made, or
// remove one they did. `toggleReaction()` only ever touches Meteor.userId(), so
// no legitimate client needs anything else - the rule simply never said so.
//
// Not a confidentiality bug: reactions are visible to everyone on the board
// already. It is an integrity one, and it puts words in another person's mouth.

/**
 * Normalise a reactions array into `codepoint -> Set(userIds)`, ignoring
 * anything that is not shaped like a reaction.
 * @param {Array} reactions
 * @return {Map<string, Set<string>>}
 */
function indexReactions(reactions) {
  const index = new Map();
  if (!Array.isArray(reactions)) return index;

  reactions.forEach(reaction => {
    if (!reaction || typeof reaction !== 'object') return;
    const codepoint = reaction.reactionCodepoint;
    if (typeof codepoint !== 'string') return;
    const userIds = Array.isArray(reaction.userIds)
      ? reaction.userIds.filter(id => typeof id === 'string')
      : [];
    // A codepoint repeated in the array is still one reaction.
    const existing = index.get(codepoint) || new Set();
    userIds.forEach(id => existing.add(id));
    index.set(codepoint, existing);
  });

  return index;
}

/**
 * True when going from `oldReactions` to `newReactions` changes nothing about
 * any user other than `userId`.
 *
 * Deliberately compares MEMBERSHIP rather than array order or shape: the client
 * rebuilds the array on every toggle, so a reordered array with the same
 * membership is the same set of reactions and must not be refused.
 *
 * @param {Array} oldReactions the reactions as stored
 * @param {Array} newReactions the reactions being written
 * @param {string} userId the acting user
 * @return {boolean}
 */
function changesOnlyOwnReactions(oldReactions, newReactions, userId) {
  if (typeof userId !== 'string' || !userId) return false;

  const before = indexReactions(oldReactions);
  const after = indexReactions(newReactions);

  const codepoints = new Set([...before.keys(), ...after.keys()]);

  for (const codepoint of codepoints) {
    const wasThere = before.get(codepoint) || new Set();
    const isThere = after.get(codepoint) || new Set();

    // Everyone except the acting user must appear in exactly the same
    // reactions before and after.
    const othersBefore = [...wasThere].filter(id => id !== userId).sort();
    const othersAfter = [...isThere].filter(id => id !== userId).sort();

    if (othersBefore.length !== othersAfter.length) return false;
    for (let i = 0; i < othersBefore.length; i++) {
      if (othersBefore[i] !== othersAfter[i]) return false;
    }
  }

  return true;
}

/**
 * The deny-rule form: true means "refuse this write". A modifier that does not
 * set `reactions` is not a reaction change and is left to the allow rule.
 *
 * @param {string} userId the acting user
 * @param {object} doc the stored document (needs `reactions`)
 * @param {object} modifier the update modifier
 * @return {boolean}
 */
function denyForeignReactionChange(userId, doc, modifier) {
  const set = modifier && modifier.$set;
  if (!set || !Object.prototype.hasOwnProperty.call(set, 'reactions')) {
    // Any OTHER way of writing the array - $push, $pull, $addToSet, a dotted
    // `reactions.0.userIds` - cannot be checked field by field here, and no
    // legitimate client sends one: toggleReaction() always $sets the whole
    // array. Refuse those outright rather than letting them through unchecked.
    const touchesReactions = modifier
      ? Object.keys(modifier).some(op => {
          const value = modifier[op];
          return (
            value &&
            typeof value === 'object' &&
            Object.keys(value).some(field => field === 'reactions' || field.startsWith('reactions.'))
          );
        })
      : false;
    return touchesReactions;
  }

  return !changesOnlyOwnReactions(doc && doc.reactions, set.reactions, userId);
}

module.exports = {
  indexReactions,
  changesOnlyOwnReactions,
  denyForeignReactionChange,
};
