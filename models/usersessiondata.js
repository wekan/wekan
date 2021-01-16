SessionData = new Mongo.Collection('sessiondata');

/**
 * A UserSessionData in Wekan. Organization in Trello.
 */
SessionData.attachSchema(
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
    userId: {
      /**
       * userId of the user
       */
      type: String,
      optional: false,
    },
    totalHits: {
      /**
       * total number of hits in the last report query
       */
      type: Number,
      optional: true,
    },
    lastHit: {
      /**
       * the last hit returned from a report query
       */
      type: Number,
      optional: true,
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

export default SessionData;
