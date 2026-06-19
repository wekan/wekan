import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import Org from '/models/org';
import { ensureIndex } from '/server/lib/mongoStartup';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';

// #5850: reliable admin check from a method's this.userId. Meteor.user()/
// getCurrentUser() can return null inside an async method after an await
// (the DDP invocation context is not always preserved), so we look the caller
// up directly by id.
async function callerIsAdmin(userId) {
  if (!userId) return false;
  const u = await ReactiveCache.getUser({ _id: userId }, { fields: { isAdmin: 1 } });
  return !!(u && u.isAdmin);
}

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
    // SECURITY (GHSA-cv95-8h7c-2ffq): This *FromOidc method is an internal
    // helper invoked only server-side during the OIDC login flow (via
    // Meteor.callAsync from packages/wekan-oidc/loginHandler.js). It performs
    // a privileged org write with no per-user authorization, so it must never
    // be callable directly by a client over DDP — otherwise any authenticated
    // user could create/modify organizations, bypassing the admin-only check
    // on setCreateOrg/setOrgAllFields. A server-side method call has
    // this.connection === null; a direct client call has a non-null
    // connection. Reject the latter.
    if (this.connection !== null) {
      throw new Meteor.Error('not-authorized');
    }
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

  // #4737/#5850: per-org feature toggles shown as columns in Admin Panel >
  // People > Organizations. All default off. NOTE: arguments are check()ed
  // unconditionally (audit-argument-checks), and admin is verified via the
  // method's this.userId (Meteor.user()/getCurrentUser() can lose the DDP
  // invocation context across awaits in async methods and return null).
  async setOrgSharedTemplates(org, value) {
    check(org, Object);
    check(value, Boolean);
    if (await callerIsAdmin(this.userId)) {
      await Org.updateAsync(org, { $set: { orgSharedTemplates: value } });
    }
  },

  async setOrgPropagateMembersToBoards(org, value) {
    check(org, Object);
    check(value, Boolean);
    if (await callerIsAdmin(this.userId)) {
      await Org.updateAsync(org, { $set: { orgPropagateMembersToBoards: value } });
    }
  },

  async setOrgSyncMembersFromAuth(org, value) {
    check(org, Object);
    check(value, Boolean);
    if (await callerIsAdmin(this.userId)) {
      await Org.updateAsync(org, { $set: { orgSyncMembersFromAuth: value } });
    }
  },

  // Bulk select-all / unselect-all for one of the org feature columns.
  async setAllOrgsFeature(field, value) {
    check(field, String);
    check(value, Boolean);
    if (await callerIsAdmin(this.userId)) {
      const allowed = [
        'orgSharedTemplates',
        'orgPropagateMembersToBoards',
        'orgSyncMembersFromAuth',
      ];
      if (!allowed.includes(field)) {
        throw new Meteor.Error('invalid-field');
      }
      await Org.updateAsync({}, { $set: { [field]: value } }, { multi: true });
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
    // SECURITY (GHSA-cv95-8h7c-2ffq): Internal OIDC-login-only helper (called
    // server-side from packages/wekan-oidc/loginHandler.js). Performs a
    // privileged org update of an arbitrary _id with no per-user
    // authorization, so reject direct client/DDP calls (this.connection
    // non-null) to keep the admin-only restriction of setOrgAllFields intact.
    if (this.connection !== null) {
      throw new Meteor.Error('not-authorized');
    }
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
    check(query, Match.OneOf(Object, null, undefined));
    if (!(await ReactiveCache.getCurrentUser())?.isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    const cursor = await ReactiveCache.getOrgs(query || {}, {}, true);
    return typeof cursor.countAsync === 'function' ? await cursor.countAsync() : cursor.count();
  },
});

Meteor.startup(async () => {
  await ensureIndex(Org, { orgDisplayName: 1 });
});

// #4737/#5850: per-org feature toggles exposed over the GlobalAdmin REST API.
const ORG_FEATURE_FIELDS = [
  'orgSharedTemplates',
  'orgPropagateMembersToBoards',
  'orgSyncMembersFromAuth',
];

/**
 * @operation get_admin_orgs
 * @tag Organizations
 *
 * @summary List organizations with their feature toggles (GlobalAdmin)
 *
 * @description Only the global admin can call this. Returns every organization
 * with its identifying fields and the per-org feature toggles shown as columns
 * in Admin Panel > People > Organizations.
 *
 * @return_type [{_id: string, orgDisplayName: string, orgShortName: string, orgSharedTemplates: boolean, orgPropagateMembersToBoards: boolean, orgSyncMembersFromAuth: boolean}]
 */
WebApp.handlers.get('/api/admin/orgs', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const orgs = await Org.find(
      {},
      {
        fields: {
          orgDisplayName: 1,
          orgShortName: 1,
          orgSharedTemplates: 1,
          orgPropagateMembersToBoards: 1,
          orgSyncMembersFromAuth: 1,
        },
      },
    ).fetchAsync();
    const data = orgs.map(org => ({
      _id: org._id,
      orgDisplayName: org.orgDisplayName,
      orgShortName: org.orgShortName,
      orgSharedTemplates: !!org.orgSharedTemplates,
      orgPropagateMembersToBoards: !!org.orgPropagateMembersToBoards,
      orgSyncMembersFromAuth: !!org.orgSyncMembersFromAuth,
    }));
    sendJsonResult(res, { code: 200, data });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

/**
 * @operation update_admin_org_features
 * @tag Organizations
 *
 * @summary Set feature toggles on one organization (GlobalAdmin)
 *
 * @description Only the global admin can call this. The request body may
 * contain any of `orgSharedTemplates`, `orgPropagateMembersToBoards` and
 * `orgSyncMembersFromAuth` (booleans); only those whitelisted fields are
 * `$set` on the organization. Returns the updated organization.
 *
 * @param {string} orgId the ID of the organization
 * @param {Object} features the feature toggles to set
 * @return_type Object
 */
WebApp.handlers.put('/api/admin/orgs/:orgId/features', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const orgId = req.params.orgId;
    const body = req.body || {};
    const $set = {};
    ORG_FEATURE_FIELDS.forEach(field => {
      if (body[field] !== undefined) {
        $set[field] = !!body[field];
      }
    });
    if (Object.keys($set).length > 0) {
      await Org.updateAsync(orgId, { $set });
    }
    const updated = await Org.findOneAsync(orgId);
    sendJsonResult(res, { code: 200, data: updated });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

/**
 * @operation update_all_admin_org_features
 * @tag Organizations
 *
 * @summary Set one feature toggle on all organizations (GlobalAdmin)
 *
 * @description Only the global admin can call this. The request body is
 * `{ field, value }` where `field` is one of `orgSharedTemplates`,
 * `orgPropagateMembersToBoards` or `orgSyncMembersFromAuth` and `value` is a
 * boolean. The field is `$set` on ALL organizations. Returns the number of
 * organizations updated.
 *
 * @param {string} field the feature field to set
 * @param {boolean} value the value to set
 * @return_type {updated: number}
 */
WebApp.handlers.put('/api/admin/orgs/features', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const body = req.body || {};
    const field = body.field;
    if (!ORG_FEATURE_FIELDS.includes(field)) {
      sendJsonResult(res, { code: 200, data: { error: 'invalid-field' } });
      return;
    }
    const value = !!body.value;
    const updated = await Org.updateAsync(
      {},
      { $set: { [field]: value } },
      { multi: true },
    );
    sendJsonResult(res, { code: 200, data: { updated } });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});
