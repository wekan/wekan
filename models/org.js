Org = new Mongo.Collection('org');

/**
 * A Organization in Wekan. A Enterprise in Trello.
 */
Org.attachSchema(
  new SimpleSchema({
    orgDisplayName: {
      /**
       * the name to display for the organization
       */
      type: String,
      optional: true,
    },
    orgDesc: {
      /**
       * the description the organization
       */
      type: String,
      optional: true,
      max: 190,
    },
    orgShortName: {
      /**
       * short name of the organization
       */
      type: String,
      optional: true,
      max: 255,
    },
    orgWebsite: {
      /**
       * website of the organization
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
  Meteor.methods({
    setCreateOrg(
      orgDisplayName,
      orgDesc,
      orgShortName,
      orgWebsite,
      orgIsActive,
    ) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(orgDisplayName, String);
        check(orgDesc, String);
        check(orgShortName, String);
        check(orgWebsite, String);
        check(orgIsActive, String);

        const nOrgNames = Org.find({ orgShortName }).count();
        if (nOrgNames > 0) {
          throw new Meteor.Error('orgname-already-taken');
        } else {
          Org.insert({
            orgDisplayName,
            orgDesc,
            orgShortName,
            orgWebsite,
            orgIsActive,
          });
        }
      }
    },

    setOrgDisplayName(org, orgDisplayName) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(org, String);
        check(orgDisplayName, String);
        Org.update(org, {
          $set: { orgDisplayName: orgDisplayName },
        });
      }
    },

    setOrgDesc(org, orgDesc) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(org, String);
        check(orgDesc, String);
        Org.update(org, {
          $set: { orgDesc: orgDesc },
        });
      }
    },

    setOrgShortName(org, orgShortName) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(org, String);
        check(orgShortName, String);
        Org.update(org, {
          $set: { orgShortName: orgShortName },
        });
      }
    },

    setOrgIsActive(org, orgIsActive) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(org, String);
        check(orgIsActive, String);
        Org.update(org, {
          $set: { orgIsActive: orgIsActive },
        });
      }
    },
  });
}

if (Meteor.isServer) {
  // Index for Organization name.
  Meteor.startup(() => {
    Org._collection._ensureIndex({ name: -1 });
  });
}

export default Org;
