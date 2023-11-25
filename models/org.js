import { ReactiveCache } from '/imports/reactiveCache';

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
    orgAutoAddUsersWithDomainName: {
      /**
       * automatically add users with domain name
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
      const user = ReactiveCache.getUser(userId) || ReactiveCache.getCurrentUser();
      if (user?.isAdmin)
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    update(userId, doc) {
      const user = ReactiveCache.getUser(userId) || ReactiveCache.getCurrentUser();
      if (user?.isAdmin)
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    remove(userId, doc) {
      const user = ReactiveCache.getUser(userId) || ReactiveCache.getCurrentUser();
      if (user?.isAdmin)
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
      orgAutoAddUsersWithDomainName,
      orgWebsite,
      orgIsActive,
    ) {
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        check(orgDisplayName, String);
        check(orgDesc, String);
        check(orgShortName, String);
        check(orgAutoAddUsersWithDomainName, String);
        check(orgWebsite, String);
        check(orgIsActive, Boolean);

        const nOrgNames = ReactiveCache.getOrgs({ orgShortName }).length;
        if (nOrgNames > 0) {
          throw new Meteor.Error('orgname-already-taken');
        } else {
          Org.insert({
            orgDisplayName,
            orgDesc,
            orgShortName,
            orgAutoAddUsersWithDomainName,
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
      orgAutoAddUsersWithDomainName,
      orgWebsite,
      orgIsActive,
    ) {
      check(orgDisplayName, String);
      check(orgDesc, String);
      check(orgShortName, String);
      check(orgAutoAddUsersWithDomainName, String);
      check(orgWebsite, String);
      check(orgIsActive, Boolean);

      const nOrgNames = ReactiveCache.getOrgs({ orgShortName }).length;
      if (nOrgNames > 0) {
        throw new Meteor.Error('orgname-already-taken');
      } else {
        Org.insert({
          orgDisplayName,
          orgDesc,
          orgShortName,
          orgAutoAddUsersWithDomainName,
          orgWebsite,
          orgIsActive,
        });
      }
    },
    setOrgDisplayName(org, orgDisplayName) {
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        check(org, Object);
        check(orgDisplayName, String);
        Org.update(org, {
          $set: { orgDisplayName: orgDisplayName },
        });
        Meteor.call('setUsersOrgsOrgDisplayName', org._id, orgDisplayName);
      }
    },

    setOrgDesc(org, orgDesc) {
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        check(org, Object);
        check(orgDesc, String);
        Org.update(org, {
          $set: { orgDesc: orgDesc },
        });
      }
    },

    setOrgShortName(org, orgShortName) {
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        check(org, Object);
        check(orgShortName, String);
        Org.update(org, {
          $set: { orgShortName: orgShortName },
        });
      }
    },

    setAutoAddUsersWithDomainName(org, orgAutoAddUsersWithDomainName) {
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        check(org, Object);
        check(orgAutoAddUsersWithDomainName, String);
        Org.update(org, {
          $set: { orgAutoAddUsersWithDomainName: orgAutoAddUsersWithDomainName },
        });
      }
    },

    setOrgIsActive(org, orgIsActive) {
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
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
      orgAutoAddUsersWithDomainName,
      orgWebsite,
      orgIsActive,
    ) {
      check(org, Object);
      check(orgDisplayName, String);
      check(orgDesc, String);
      check(orgShortName, String);
      check(orgAutoAddUsersWithDomainName, String);
      check(orgWebsite, String);
      check(orgIsActive, Boolean);
      Org.update(org, {
        $set: {
          orgDisplayName: orgDisplayName,
          orgDesc: orgDesc,
          orgShortName: orgShortName,
          orgAutoAddUsersWithDomainName: orgAutoAddUsersWithDomainName,
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
      orgAutoAddUsersWithDomainName,
      orgWebsite,
      orgIsActive,
    ) {
      if (ReactiveCache.getCurrentUser()?.isAdmin) {
        check(org, Object);
        check(orgDisplayName, String);
        check(orgDesc, String);
        check(orgShortName, String);
        check(orgAutoAddUsersWithDomainName, String);
        check(orgWebsite, String);
        check(orgIsActive, Boolean);
        Org.update(org, {
          $set: {
            orgDisplayName: orgDisplayName,
            orgDesc: orgDesc,
            orgShortName: orgShortName,
            orgAutoAddUsersWithDomainName: orgAutoAddUsersWithDomainName,
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
