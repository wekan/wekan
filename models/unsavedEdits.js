// This collection shouldn't be manipulated directly by instead throw the
// `UnsavedEdits` API on the client.
UnsavedEditCollection = new Mongo.Collection('unsaved-edits');

UnsavedEditCollection.attachSchema(
  new SimpleSchema({
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
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return this.userId;
        }
      },
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
      denyUpdate: false,
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

if (Meteor.isServer) {
  function isAuthor(userId, doc, fieldNames = []) {
    return userId === doc.userId && fieldNames.indexOf('userId') === -1;
  }
  Meteor.startup(() => {
    UnsavedEditCollection._collection.createIndex({ modifiedAt: -1 });
    UnsavedEditCollection._collection.createIndex({ userId: 1 });
  });
  UnsavedEditCollection.allow({
    insert: isAuthor,
    update: isAuthor,
    remove: isAuthor,
    fetch: ['userId'],
  });
}

export default UnsavedEditCollection;
