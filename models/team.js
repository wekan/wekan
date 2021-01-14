Team = new Mongo.Collection('team');

/**
 * A Team in Wekan. Organization in Trello.
 */
Team.attachSchema(
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
       * the name to display for the team
       */
      type: String,
      optional: true,
    },
    desc: {
      /**
       * the description the team
       */
      type: String,
      optional: true,
      max: 190,
    },
    name: {
      /**
       * short name of the team
       */
      type: String,
      optional: true,
      max: 255,
    },
    website: {
      /**
       * website of the team
       */
      type: String,
      optional: true,
      max: 255,
    },
    createdAt: {
      /**
       * creation date of the team
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
  // Index for Team name.
  Meteor.startup(() => {
    Team._collection._ensureIndex({ name: -1 });
  });
}

export default Team;
