Org = new Mongo.Collection('org');

/**
 * A Organization in wekan
 */
Org.attachSchema(
  new SimpleSchema({
    id: {
      /**
       * the organization id
       */
      type: Number,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return incrementCounter('counters', 'org_id', 1);
        }
      },
    },
    version: {
      /**
       * the version of the organization
       */
      type: Number,
      optional: true,
    },
    name: {
      /**
       * name of the organization
       */
      type: String,
      optional: true,
      max: 190,
    },
    address1: {
      /**
       * address1 of the organization
       */
      type: String,
      optional: true,
      max: 255,
    },
    address2: {
      /**
       * address2 of the organization
       */
      type: String,
      optional: true,
      max: 255,
    },
    city: {
      /**
       * city of the organization
       */
      type: String,
      optional: true,
      max: 255,
    },
    state: {
      /**
       * state of the organization
       */
      type: String,
      optional: true,
      max: 255,
    },
    zip_code: {
      /**
       * zip_code of the organization
       */
      type: String,
      optional: true,
      max: 50,
    },
    country: {
      /**
       * country of the organization
       */
      type: String,
      optional: true,
      max: 255,
    },
    billing_email: {
      /**
       * billing_email of the organization
       */
      type: String,
      optional: true,
      max: 255,
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
