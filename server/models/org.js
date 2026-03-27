import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Org from '/models/org';

Meteor.methods({
  async setCreateOrg(
    orgDisplayName,
    orgDesc,
    orgShortName,
    orgAutoAddUsersWithDomainName,
    orgWebsite,
    orgIsActive,
  ) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(orgDisplayName, String);
      check(orgDesc, String);
      check(orgShortName, String);
      check(orgAutoAddUsersWithDomainName, String);
      check(orgWebsite, String);
      check(orgIsActive, Boolean);

      const nOrgNames = (await ReactiveCache.getOrgs({ orgShortName })).length;
      if (nOrgNames > 0) {
        throw new Meteor.Error('orgname-already-taken');
      }

      await Org.insertAsync({
        orgDisplayName,
        orgDesc,
        orgShortName,
        orgAutoAddUsersWithDomainName,
        orgWebsite,
        orgIsActive,
      });
    }
  },

  async setCreateOrgFromOidc(
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

    const nOrgNames = (await ReactiveCache.getOrgs({ orgShortName })).length;
    if (nOrgNames > 0) {
      throw new Meteor.Error('orgname-already-taken');
    }

    await Org.insertAsync({
      orgDisplayName,
      orgDesc,
      orgShortName,
      orgAutoAddUsersWithDomainName,
      orgWebsite,
      orgIsActive,
    });
  },

  async setOrgDisplayName(org, orgDisplayName) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(org, Object);
      check(orgDisplayName, String);
      await Org.updateAsync(org, {
        $set: { orgDisplayName },
      });
      await Meteor.callAsync('setUsersOrgsOrgDisplayName', org._id, orgDisplayName);
    }
  },

  async setOrgDesc(org, orgDesc) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(org, Object);
      check(orgDesc, String);
      await Org.updateAsync(org, {
        $set: { orgDesc },
      });
    }
  },

  async setOrgShortName(org, orgShortName) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(org, Object);
      check(orgShortName, String);
      await Org.updateAsync(org, {
        $set: { orgShortName },
      });
    }
  },

  async setAutoAddUsersWithDomainName(org, orgAutoAddUsersWithDomainName) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(org, Object);
      check(orgAutoAddUsersWithDomainName, String);
      await Org.updateAsync(org, {
        $set: { orgAutoAddUsersWithDomainName },
      });
    }
  },

  async setOrgIsActive(org, orgIsActive) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(org, Object);
      check(orgIsActive, Boolean);
      await Org.updateAsync(org, {
        $set: { orgIsActive },
      });
    }
  },

  async setOrgAllFieldsFromOidc(
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
    await Org.updateAsync(org, {
      $set: {
        orgDisplayName,
        orgDesc,
        orgShortName,
        orgAutoAddUsersWithDomainName,
        orgWebsite,
        orgIsActive,
      },
    });
    await Meteor.callAsync('setUsersOrgsOrgDisplayName', org._id, orgDisplayName);
  },

  async setOrgAllFields(
    org,
    orgDisplayName,
    orgDesc,
    orgShortName,
    orgAutoAddUsersWithDomainName,
    orgWebsite,
    orgIsActive,
  ) {
    if ((await ReactiveCache.getCurrentUser())?.isAdmin) {
      check(org, Object);
      check(orgDisplayName, String);
      check(orgDesc, String);
      check(orgShortName, String);
      check(orgAutoAddUsersWithDomainName, String);
      check(orgWebsite, String);
      check(orgIsActive, Boolean);
      await Org.updateAsync(org, {
        $set: {
          orgDisplayName,
          orgDesc,
          orgShortName,
          orgAutoAddUsersWithDomainName,
          orgWebsite,
          orgIsActive,
        },
      });
      await Meteor.callAsync('setUsersOrgsOrgDisplayName', org._id, orgDisplayName);
    }
  },

  async getOrgsCollectionCount(query = {}) {
    if (!(await ReactiveCache.getCurrentUser())?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    check(query, Match.OneOf(Object, null, undefined));
    const cursor = await ReactiveCache.getOrgs(query || {}, {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});

Meteor.startup(async () => {
  await Org._collection.createIndexAsync({ orgDisplayName: 1 });
});
