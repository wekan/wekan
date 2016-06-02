InvitationCodes = new Mongo.Collection('invitation_code');

InvitationCodes.attachSchema(new SimpleSchema({
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
}));

InvitationCodes.helpers({
  author(){
    return Users.findOne(this.authorId);
  },
});

// InvitationCodes.before.insert((userId, doc) => {
  // doc.createdAt = new Date();
  // doc.authorId = userId;
// });

if (Meteor.isServer) {
  Boards.deny({
    fetch: ['members'],
  });
}
