import CardCommentReactions from '/models/cardCommentReactions';
import { tripCanaryDeny } from '/server/lib/canary';

// Reactions are per-user statements, so clients never write this aggregate
// collection directly. Both HTML5 and the cookieless HTML4 baseline call the
// same server method, which derives the actor from its authenticated invocation,
// verifies board/card/comment consistency and accepts only the fixed catalog.
// Server-side collection writes bypass allow/deny, as Meteor intends.
//
// Denying only updates was insufficient: a member could INSERT a fresh document
// whose userIds attributed a reaction to somebody else. Deny every direct form,
// including remove, and report attempts in Admin Panel / Problems / Security.
CardCommentReactions.deny({
  insert(userId) {
    return tripCanaryDeny('reaction.foreign', { userId });
  },
  update(userId) {
    return tripCanaryDeny('reaction.foreign', { userId });
  },
  remove(userId) {
    return tripCanaryDeny('reaction.foreign', { userId });
  },
});
