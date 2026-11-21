import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');

const Announcements = new Mongo.Collection('announcements');

Announcements.attachSchema(
  new SimpleSchema({
    enabled: {
      type: Boolean,
      defaultValue: false,
    },
    title: {
      type: String,
      optional: true,
    },
    body: {
      type: String,
      optional: true,
    },
    sort: {
      type: Number,
    },
    createdAt: {
      type: Date,
      optional: true,
      autoValue: createdAtAutoValue,
    },
    modifiedAt: {
      type: Date,
      autoValue: modifiedAtAutoValue,
    },
  }),
);

// Pure, dependency-free helpers for per-user announcement dismissal (#6051).
// Defined here (an isomorphic model file) so both client and server share the
// exact same logic; server/lib/tests/announcementDismiss.tests.js imports them
// from this file.

// Produce a stable "version" identity for the current announcement.
// The version changes whenever the admin edits the announcement title/body,
// so a previously dismissed announcement reappears for everyone once updated.
// Returns null when there is no usable announcement.
export function announcementVersion(announcement) {
  if (!announcement || !announcement._id) {
    return null;
  }
  const id = String(announcement._id);
  const title = announcement.title == null ? '' : String(announcement.title);
  const body = announcement.body == null ? '' : String(announcement.body);
  const raw = `${id} ${title} ${body}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    // djb2
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) | 0;
  }
  return `${id}:${(hash >>> 0).toString(36)}`;
}

// Decide whether the banner should be visible for a given user.
// - enabled: the global admin toggle (unchanged semantics).
// - version: announcementVersion(currentAnnouncement).
// - dismissedVersion: the version the user previously dismissed (or null).
export function shouldShowAnnouncement({ enabled, version, dismissedVersion }) {
  if (!enabled || !version) {
    return false;
  }
  return dismissedVersion !== version;
}

// #6854: who the site announcement is for. A signed-in user on a page with no
// board of its own - Home and every All Boards list: Remaining, Starred,
// Templates, Archive - and a member of the board that is open on a board page.
// It used to ask for membership of the current board on every page, and there
// is none on those, so it showed only on boards. Nobody signed out sees it
// (#1281).
export function showAnnouncementToUser({ userId, board }) {
  if (!userId) return false;
  if (!board) return true;
  return typeof board.hasMember === 'function' ? !!board.hasMember(userId) : false;
}

export default Announcements;
