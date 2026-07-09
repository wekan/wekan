'use strict';

// #3606 "activity feed shows 'edited comment undefined' / 'deleted comment
// undefined'". The activity template fed the comment's ID into the "%s" of the
// activity-editComment / activity-deleteComment strings. On older activities
// commentId was absent (→ literally "undefined"), and even when present it is an
// opaque id, not the comment text; for a DELETED comment the CardComment doc is
// already gone, so it cannot be looked up live either.
//
// The edit/delete activities now store the comment text (commentText), and this
// helper picks the best text to display — the stored text, else the live
// comment's text (edit case, comment still exists), else an empty string so the
// feed never renders the word "undefined". Meteor-free and unit tested.
function commentActivityDisplayText(activity) {
  if (!activity) return '';
  if (typeof activity.commentText === 'string') return activity.commentText;
  const live = activity.comment;
  if (live && typeof live.text === 'string') return live.text;
  return '';
}

module.exports = { commentActivityDisplayText };
