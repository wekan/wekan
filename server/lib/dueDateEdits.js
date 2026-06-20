// Pure helpers for counting due-date changes (issue #6081).
//
// WeKan records a due-date change as an Activity with
// `activityType === 'a-dueAt'` (see server/models/cards.js before.update hook).
// Counting those activities for a card gives the number of times the due date
// was set or changed, which lets a Scrum Master see deadline movement without
// being able to quietly move it.

export const DUE_DATE_ACTIVITY_TYPE = 'a-dueAt';

// Count how many of the given activities represent a due-date change.
// `activities` is expected to be an array of activity documents (or any
// array-like with a `.filter`); anything falsy yields 0.
export function countDueDateChanges(activities) {
  if (!Array.isArray(activities)) {
    return 0;
  }
  return activities.filter(
    activity => activity && activity.activityType === DUE_DATE_ACTIVITY_TYPE,
  ).length;
}
