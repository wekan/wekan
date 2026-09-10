import { Mongo } from 'meteor/mongo';
const { SimpleSchema } = require('/imports/simpleSchema');

// List sync credentials (docs/Features/ImportExport/Sync.md). One document per
// synced list, keyed by listId, holding the token/password needed to call the
// external tracker's API.
//
// This collection is SERVER-ONLY on purpose: there is no Meteor.publish for
// it anywhere in the codebase (grep server/publications/ - it is not there),
// so a client subscription can never see a row of it, and no method returns
// a raw `token` value to the caller (server/listSync.js and the
// `listSync.setCredential`/`listSync.hasCredential` methods in
// server/methods/listSync.js are the only code that reads/writes it). This is
// the same "do not let a stored secret round-trip to the browser" rule the
// Admin Panel env-var/secrets work applies to server-only settings - applied
// here per-list instead of globally.
const ListSyncCredentials = new Mongo.Collection('listSyncCredentials');

ListSyncCredentials.attachSchema(
  new SimpleSchema({
    listId: {
      type: String,
    },
    // Free-form: a Jira API token, a GitHub/GitLab personal access token, a
    // Gitea access token... whatever the source type's fetcher expects.
    token: {
      type: String,
    },
    // For Jira Cloud, Basic auth is "email:token" - the email half is not a
    // secret, but it travels with the token so the fetcher has both without a
    // second lookup.
    username: {
      type: String,
      optional: true,
    },
    createdAt: {
      type: Date,
      autoValue() {
        if (this.isInsert) return new Date();
        if (this.isUpsert) return { $setOnInsert: new Date() };
        this.unset();
      },
    },
    updatedAt: {
      type: Date,
      optional: true,
      autoValue() {
        if (this.isUpdate || this.isUpsert || this.isInsert) return new Date();
      },
    },
  }),
);

export default ListSyncCredentials;
