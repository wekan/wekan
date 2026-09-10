// #2522: shared "who triggered this rule" concept, used by the "add member"
// action's acting-user option. Reuses the exact activity.userId source
// server/rulesHelper.js's buildRuleVars() already resolves for the
// {username} template variable (#3304/#3301) - this file is the ONE place
// both call, so there is no second acting-user-resolution mechanism.

// Sentinel stored as an addMember action's `username` field to mean "resolve
// to whichever user's action fired this rule at execution time" instead of a
// fixed board member.
export const RULE_ACTING_USER_SENTINEL = '_actinguser_';

// The activity that triggered a rule always carries the id of the user who
// performed the triggering action as `activity.userId` (a '*' means a
// system/no-user activity, e.g. some scheduled actions, so there is no
// acting user to resolve to).
export function resolveActingUserId(activity) {
  if (activity && activity.userId && activity.userId !== '*') {
    return activity.userId;
  }
  return null;
}
