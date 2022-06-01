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
    orgIsActive: {
      /**
       * status of the organization
       */
      type: Boolean,
      optional: true,
    },
    createdAt: {
      /**
       * creation date of the organization
       */
      type: Date,
      denyUpdate: false,
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
  Org.allow({
    insert(userId, doc) {
      const user = Users.findOne({
        _id: userId,
      });
      if ((user && user.isAdmin) || (Meteor.user() && Meteor.user().isAdmin))
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    update(userId, doc) {
      const user = Users.findOne({
        _id: userId,
      });
      if ((user && user.isAdmin) || (Meteor.user() && Meteor.user().isAdmin))
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    remove(userId, doc) {
      const user = Users.findOne({
        _id: userId,
      });
      if ((user && user.isAdmin) || (Meteor.user() && Meteor.user().isAdmin))
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    fetch: [],
  });


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
        check(orgIsActive, Boolean);

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
    setCreateOrgFromOidc(
      orgDisplayName,
      orgDesc,
      orgShortName,
      orgWebsite,
      orgIsActive,
    ) {
      check(orgDisplayName, String);
      check(orgDesc, String);
      check(orgShortName, String);
      check(orgWebsite, String);
      check(orgIsActive, Boolean);

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
    },
    setOrgDisplayName(org, orgDisplayName) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(org, Object);
        check(orgDisplayName, String);
        Org.update(org, {
          $set: { orgDisplayName: orgDisplayName },
        });
        Meteor.call('setUsersOrgsOrgDisplayName', org._id, orgDisplayName);
      }
    },

    setOrgDesc(org, orgDesc) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(org, Object);
        check(orgDesc, String);
        Org.update(org, {
          $set: { orgDesc: orgDesc },
        });
      }
    },

    setOrgShortName(org, orgShortName) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(org, Object);
        check(orgShortName, String);
        Org.update(org, {
          $set: { orgShortName: orgShortName },
        });
      }
    },

    setOrgIsActive(org, orgIsActive) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(org, Object);
        check(orgIsActive, Boolean);
        Org.update(org, {
          $set: { orgIsActive: orgIsActive },
        });
      }
    },
    setOrgAllFieldsFromOidc(
      org,
      orgDisplayName,
      orgDesc,
      orgShortName,
      orgWebsite,
      orgIsActive,
    ) {
      check(org, Object);
      check(orgDisplayName, String);
      check(orgDesc, String);
      check(orgShortName, String);
      check(orgWebsite, String);
      check(orgIsActive, Boolean);
      Org.update(org, {
        $set: {
          orgDisplayName: orgDisplayName,
          orgDesc: orgDesc,
          orgShortName: orgShortName,
          orgWebsite: orgWebsite,
          orgIsActive: orgIsActive,
        },
      });
      Meteor.call('setUsersOrgsOrgDisplayName', org._id, orgDisplayName);
    },
    setOrgAllFields(
      org,
      orgDisplayName,
      orgDesc,
      orgShortName,
      orgWebsite,
      orgIsActive,
    ) {
      if (Meteor.user() && Meteor.user().isAdmin) {
        check(org, Object);
        check(orgDisplayName, String);
        check(orgDesc, String);
        check(orgShortName, String);
        check(orgWebsite, String);
        check(orgIsActive, Boolean);
        Org.update(org, {
          $set: {
            orgDisplayName: orgDisplayName,
            orgDesc: orgDesc,
            orgShortName: orgShortName,
            orgWebsite: orgWebsite,
            orgIsActive: orgIsActive,
          },
        });
        Meteor.call('setUsersOrgsOrgDisplayName', org._id, orgDisplayName);
      }
    },
  });
}

if (Meteor.isServer) {
  // Index for Organization name.
  Meteor.startup(() => {
    // Org._collection.createIndex({ name: -1 });
    Org._collection.createIndex({ orgDisplayName: 1 });
  });
}

export default Org;
