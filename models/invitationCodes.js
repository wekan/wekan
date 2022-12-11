InvitationCodes = new Mongo.Collection('invitation_codes');

InvitationCodes.attachSchema(
  new SimpleSchema({
    code: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      regEx: SimpleSchema.RegEx.Email,
    },
    createdAt: {
      type: Date,
      denyUpdate: false,
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
    // always be the admin if only one admin
    authorId: {
      type: String,
    },
    boardsToBeInvited: {
      type: [String],
      optional: true,
    },
    valid: {
      type: Boolean,
      defaultValue: true,
    },
  }),
);

InvitationCodes.helpers({
  author() {
    return Users.findOne(this.authorId);
  },
});

// InvitationCodes.before.insert((userId, doc) => {
// doc.createdAt = new Date();
// doc.authorId = userId;
// });

if (Meteor.isServer) {
  Meteor.startup(() => {
    InvitationCodes._collection._ensureIndex({ modifiedAt: -1 });
  });
  Boards.deny({
    fetch: ['members'],
  });
}

export default InvitationCodes;
