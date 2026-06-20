// Pure, dependency-free helpers for per-user announcement dismissal (#6051).
// The implementation lives in models/announcements.js (an isomorphic model
// file) so client and server share identical logic. This module re-exports the
// pure functions at the documented test path and is itself free of any
// Meteor/Mongo runtime dependency.
export {
  announcementVersion,
  shouldShowAnnouncement,
} from '/models/announcements';
