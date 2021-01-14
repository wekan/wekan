Org = new Mongo.Collection('org');

/**
 * A Organization in Wekan. A Enterprise in Trello.
 */
Org.attachSchema(
  new SimpleSchema({
    _id: {
      /**
       * the organization id
       */
      type: Number,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return incrementCounter('counters', 'orgId', 1);
        }
      },
    },
    displayName: {
      /**
       * the name to display for the organization
       */
      type: String,
      optional: true,
    },
    desc: {
      /**
       * the description the organization
       */
      type: String,
      optional: true,
      max: 190,
    },
    name: {
      /**
       * short name of the organization
       */
      type: String,
      optional: true,
      max: 255,
    },
    website: {
      /**
       * website of the organization
       */
      type: String,
      optional: true,
      max: 255,
    },
    teams: {
      /**
       * List of teams of a organization
       */
      type: [Object],
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return [
            {
              teamId: this.teamId,
              isAdmin: true,
              isActive: true,
              isNoComments: false,
              isCommentOnly: false,
              isWorker: false,
            },
          ];
        }
      },
    },
    'teams.$.teamId': {
      /**
       * The uniq ID of the team
       */
      type: String,
    },
    'teams.$.isAdmin': {
      /**
       * Is the team an admin of the board?
       */
      type: Boolean,
    },
    'teams.$.isActive': {
      /**
       * Is the team active?
       */
      type: Boolean,
    },
    'teams.$.isNoComments': {
      /**
       * Is the team not allowed to make comments
       */
      type: Boolean,
      optional: true,
    },
    'teams.$.isCommentOnly': {
      /**
       * Is the team only allowed to comment on the board
       */
      type: Boolean,
      optional: true,
    },
    'teams.$.isWorker': {
      /**
       * Is the team only allowed to move card, assign himself to card and comment
       */
      type: Boolean,
      optional: true,
    },
    createdAt: {
      /**
       * creation date of the organization
       */
      type: Date,
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
  // Index for Organization name.
  Meteor.startup(() => {
    Org._collection._ensureIndex({ name: -1 });
  });
}

export default Org;
