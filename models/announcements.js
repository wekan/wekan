import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
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
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
  }),
);

// Pure, dependency-free helpers for per-user announcement dismissal (#6051).
// Re-exported from server/lib/announcementVisibility.js so they can be unit
// tested in isolation. Defined here (an isomorphic model file) so both client
// and server share the exact same logic.

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

export default Announcements;
