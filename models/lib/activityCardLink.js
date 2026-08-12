'use strict';

// What an activity in the board feed says about the card it happened to.
//
// wekan/wekan#3144: "Activities for archived card displayed as undefined on board
// settings". Move a card around to make some activities, archive it, and open the
// board sidebar: the sentences that named that card no longer name anything.
// "Instead undefined, suggest to display '{{ card title }} [archived]'."
//
// The feed asks `activity.card()` and renders its title. An archived card is not
// published to the client, so that lookup returns nothing and the sentence is
// built around a hole - which is how a card that still exists, with a title, and
// whose activities are right there, ends up nameless in its own history.
//
// An activity already knows the title in most cases: createCard, moveCard and
// moveCardBoard have stored `cardTitle` for years. So the answer is not to publish
// archived cards to every board sidebar - it is to read what the activity itself
// recorded, and to record it on the activities that were not storing it.
//
// WHAT IT DECIDES, in order:
//   * the card is here          -> its CURRENT title, because a card that has been
//                                  renamed since should read as it reads now
//   * the card is here and archived -> that title, marked, which is what the
//                                  reporter asked for
//   * the card is gone from this client but the activity recorded a title
//                              -> that title, unmarked
//   * neither                  -> null, and the caller says "this card" rather
//                                  than an empty gap
//
// The link survives all four: a card URL is `/b/<boardId>/<slug>/<cardId>`, and an
// activity carries the boardId and the cardId, so it can be built without the card
// document (models/lib/cardUrl.js).
//
// WHY A MISSING CARD IS NOT MARKED ARCHIVED. It usually is - the activities of a
// DELETED card are removed with the card (Cards.cardRemover), so an activity
// pointing at a card this client cannot see is nearly always an archived one. But
// "nearly always" is not always: with lazy card loading a card can simply be
// outside the window this client has been sent. Marking that one "archived" would
// be a statement the feed cannot support, so the mark is used only where the card
// IS here and says so itself.
//
// Pure and dependency-free: the client renders from it, and
// tests/activityCardLink.test.cjs exercises it on its own.

const { buildCardRelativeUrl } = require('./cardUrl');

// The title an activity recorded when it happened. Several activity types store
// it under `cardTitle`; `title` is what a few older ones used.
function recordedTitle(activity) {
  if (!activity) return null;
  for (const field of ['cardTitle', 'title']) {
    const value = activity[field];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

// { title, url, archived, fromActivity } - or null when there is nothing to name.
//   activity  the activity document
//   card      the card document, when this client has it
//   board     the board document, for the human-readable slug (optional)
function activityCardLinkData(activity, card, board) {
  const liveTitle = card && typeof card.title === 'string' && card.title.trim()
    ? card.title
    : null;
  const stored = recordedTitle(activity);
  const title = liveTitle || stored;
  if (!title) return null;

  // The card document is the better source for the URL (it may have moved), but
  // an activity knows enough to build one on its own.
  const target = card && card._id
    ? card
    : (activity && activity.cardId
      ? { _id: activity.cardId, boardId: activity.boardId }
      : null);
  const url = target ? buildCardRelativeUrl(target, board) : undefined;

  return {
    title,
    url: url || null,
    archived: !!(card && card.archived),
    fromActivity: !liveTitle,
  };
}

module.exports = { activityCardLinkData, recordedTitle };
