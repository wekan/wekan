OrgUser = new Mongo.Collection('org_user');

/**
 * A Organization User in wekan
 */
OrgUser.attachSchema(
  new SimpleSchema({
    id: {
      /**
       * the organization user's id
       */
      type: Number,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return incrementCounter('counters', 'org_user_id', 1);
        }
      },
    },
    org_id: {
      /**
       * the organization id
       */
      type: Number,
      optional: true,
    },
    user_id: {
      /**
       * the user id
       */
      type: Number,
      optional: true,
    },
    role: {
      /**
       * the role of user
       */
      type: String,
      optional: true,
      max: 20,
    },
    createdAt: {
      /**
       * creation date of the organization user
       */
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
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
  // Index for Organization User.
  Meteor.startup(() => {
    OrgUser._collection._ensureIndex({ org_id: -1 });
    OrgUser._collection._ensureIndex({ org_id: -1, user_id: -1 });
  });
}

export default OrgUser;
