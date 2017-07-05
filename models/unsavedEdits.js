// This collection shouldn't be manipulated directly by instead throw the
// `UnsavedEdits` API on the client.
UnsavedEditCollection = new Mongo.Collection('unsaved-edits');

UnsavedEditCollection.attachSchema(new SimpleSchema({
  fieldName: {
    type: String,
  },
  docId: {
    type: String,
  },
  value: {
    type: String,
  },
  userId: {
    type: String,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return this.userId;
      }
    },
  },
}));

if (Meteor.isServer) {
  function isAuthor(userId, doc, fieldNames = []) {
    return userId === doc.userId && fieldNames.indexOf('userId') === -1;
  }
  Meteor.startup(() => {
    UnsavedEditCollection._collection._ensureIndex({ userId: 1 });
  });
  UnsavedEditCollection.allow({
    insert: isAuthor,
    update: isAuthor,
    remove: isAuthor,
    fetch: ['userId'],
  });
}
