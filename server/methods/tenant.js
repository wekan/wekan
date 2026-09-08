import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Org from '/models/org';
import Settings from '/models/settings';
import { BOARD_COLORS } from '/models/metadata/colors';
import { isHexColor } from '/models/lib/contrastColor';
import { tenantForConnection, tenancyEnabled } from '/server/lib/tenantResolver';

// Multitenancy option D — the methods behind the Admin Panel
// (docs/Design/Multitenancy/Multitenancy.md, D.7 and D.9).
//
//   currentTenant()        — which tenant is this connection, and its branding
//   setOrgTenantFields()   — the org's domains + branding (site admin, or the org's
//                            own per-tenant Global Admin)
//   listOrgMembers()       — the members of one org, with their per-tenant admin flag
//   setOrgAdmin()          — appoint / dismiss a per-tenant Global Admin
//   myAdminOrgs()          — the orgs the CALLER administers, for the panes that
//                            need to offer a scope (Backup)
//
// Every one of them asks models/lib/tenantAdmin.js the same questions the client
// asked before drawing the menu entry. The client-side answer is a convenience; this
// is the one that counts.

import * as tenants from '/models/lib/tenants';
import * as tenantAdmin from '/models/lib/tenantAdmin';

// #5850's lesson: Meteor.user()/getCurrentUser() can return null inside an async
// method after an await, so the caller is looked up by this.userId directly.
async function callerUser(userId) {
  if (!userId) return null;
  return await ReactiveCache.getUser(
    { _id: userId },
    { fields: { isAdmin: 1, orgs: 1, username: 1 } },
  );
}

Meteor.methods({
  // Anyone may ask which tenant they are talking to - it is the branding of the
  // page they are already looking at. Returns null when tenancy is off or the host
  // belongs to no org.
  async currentTenant() {
    if (!tenancyEnabled()) return null;
    const org = tenantForConnection(this.connection);
    if (!org) return null;
    return {
      _id: org._id,
      orgDisplayName: org.orgDisplayName || '',
      hosts: tenants.hostsOfOrg(org),
      branding: tenants.tenantBrandingOverrides(org),
    };
  },

  // The orgs the caller may administer, as { _id, orgDisplayName }. The site admin
  // gets every org; a per-tenant admin gets theirs; anyone else gets nothing. The
  // Backup pane offers exactly this list as its scope.
  async myAdminOrgs() {
    const user = await callerUser(this.userId);
    if (!tenantAdmin.canOpenAdminPanel(user)) return [];
    const ids = tenantAdmin.manageableOrgIds(user);
    const selector = ids === null ? {} : { _id: { $in: ids } };
    const orgs = await Org.find(selector, {
      fields: { orgDisplayName: 1, orgShortName: 1 },
      sort: { orgDisplayName: 1 },
    }).fetchAsync();
    return orgs.map(org => ({
      _id: org._id,
      orgDisplayName: org.orgDisplayName || org.orgShortName || org._id,
    }));
  },

  // The tenant half of an Organization: the hostnames it is served on and the
  // branding that replaces the instance branding on them.
  async setOrgTenantFields(orgId, fields) {
    check(orgId, String);
    check(fields, Object);
    const user = await callerUser(this.userId);
    if (!tenantAdmin.canManageOrg(user, orgId)) {
      throw new Meteor.Error('not-authorized');
    }
    const $set = {};

    if (fields.orgDomains !== undefined) {
      check(fields.orgDomains, String);
      const hosts = tenants.parseHostList(fields.orgDomains);
      // Two orgs claiming one host would silently give one of them the other's
      // brand, so the save is refused and the offending host named.
      const others = await Org.find(
        { _id: { $ne: orgId }, orgDomains: { $exists: true, $ne: '' } },
        { fields: { orgDomains: 1 } },
      ).fetchAsync();
      const clashes = tenants.conflictingHosts(others, orgId, hosts);
      if (clashes.length) {
        throw new Meteor.Error('tenant-domain-taken', clashes.join(', '));
      }
      // Stored normalised, so what the admin reads back is what is matched.
      $set.orgDomains = hosts.join(', ');
    }

    tenants.brandingOrgFields().forEach(field => {
      if (fields[field] !== undefined) {
        check(fields[field], String);
        $set[field] = fields[field].trim();
      }
    });

    if (Object.keys($set).length === 0) return { updated: 0 };
    await Org.updateAsync(orgId, { $set });
    return { updated: 1, orgDomains: $set.orgDomains };
  },

  // The members of one org, with the per-tenant admin flag - what the "Organization
  // admins" popup lists. Only someone who may administer that org may read it.
  async listOrgMembers(orgId) {
    check(orgId, String);
    const user = await callerUser(this.userId);
    if (!tenantAdmin.canManageOrg(user, orgId)) {
      throw new Meteor.Error('not-authorized');
    }
    const members = await ReactiveCache.getUsers(
      { 'orgs.orgId': orgId },
      {
        sort: { username: 1 },
        fields: { username: 1, 'profile.fullname': 1, isAdmin: 1, orgs: 1 },
      },
    );
    return members.map(member => ({
      _id: member._id,
      username: member.username,
      fullname: (member.profile && member.profile.fullname) || '',
      // The site-wide flag is shown but never editable here: appointing an instance
      // owner is not something a tenant does.
      isSiteAdmin: !!member.isAdmin,
      isOrgAdmin: tenantAdmin.isOrgAdmin(member, orgId),
    }));
  },

  // ── the site theme (Admin Panel / Settings / Visibility / Change color) ────
  //
  // The layer between WeKan's default theme and a user's own override
  // (docs/Theme/Theme.md). The site admin sets the instance's; an Organization's
  // admin sets that Organization's, which replaces it on the Organization's own
  // hosts. Where the write lands is decided by the shared rule, not by the client.
  async getAdminThemeColor() {
    const user = await callerUser(this.userId);
    const org = tenantForConnection(this.connection);
    const target = tenantAdmin.themeTarget(user, org && org._id);
    if (!target) throw new Meteor.Error('not-authorized');
    if (target.scope === 'instance') {
      const setting = await Settings.findOneAsync({});
      return {
        scope: 'instance',
        color: (setting && setting.themeColor) || null,
        custom: (setting && setting.themeCustomColors) || [],
      };
    }
    const doc = await Org.findOneAsync(target.orgId,
      { fields: { orgThemeColor: 1, orgThemeCustomColors: 1, orgDisplayName: 1 } });
    return {
      scope: 'org',
      orgId: target.orgId,
      orgDisplayName: (doc && doc.orgDisplayName) || '',
      color: (doc && doc.orgThemeColor) || null,
      custom: (doc && doc.orgThemeCustomColors) || [],
    };
  },

  async setAdminThemeColor(color, custom) {
    check(color, Match.OneOf(String, null, undefined));
    check(custom, Match.OneOf([String], null, undefined));
    const user = await callerUser(this.userId);
    const org = tenantForConnection(this.connection);
    const target = tenantAdmin.themeTarget(user, org && org._id);
    if (!target) throw new Meteor.Error('not-authorized');
    // A colour is a theme NAME from the shared list, or a custom colour on top of
    // one; anything else is refused rather than stored and rendered as a class.
    if (color && !BOARD_COLORS.includes(color)) throw new Meteor.Error('invalid-color');
    const colors = (custom || []).filter(c => isHexColor(c)).slice(0, 2);
    if (target.scope === 'instance') {
      const setting = await Settings.findOneAsync({});
      if (!setting) throw new Meteor.Error('no-settings');
      await Settings.updateAsync(setting._id, color
        ? { $set: { themeColor: color, themeCustomColors: colors } }
        : { $unset: { themeColor: '', themeCustomColors: '' } });
      return { scope: 'instance', color: color || null };
    }
    await Org.updateAsync(target.orgId, color
      ? { $set: { orgThemeColor: color, orgThemeCustomColors: colors } }
      : { $unset: { orgThemeColor: '', orgThemeCustomColors: '' } });
    return { scope: 'org', orgId: target.orgId, color: color || null };
  },

  // Appoint or dismiss a per-tenant Global Admin of one org. The site admin may do
  // it anywhere; a per-tenant admin may do it inside their own org, which is what
  // makes a tenant self-administering. It writes `orgs.$.isAdmin` - the membership
  // the user already has - and NEVER the site-wide `isAdmin` flag.
  async setOrgAdmin(orgId, userId, value) {
    check(orgId, String);
    check(userId, String);
    check(value, Boolean);
    const actor = await callerUser(this.userId);
    if (!tenantAdmin.canSetOrgAdmin(actor, orgId)) {
      throw new Meteor.Error('not-authorized');
    }
    const target = await ReactiveCache.getUser(
      { _id: userId },
      { fields: { isAdmin: 1, orgs: 1 } },
    );
    if (!target) throw new Meteor.Error('user-not-found');
    // A per-tenant admin may not touch a site admin at all (privilege escalation,
    // not tenancy) - and nobody may appoint someone who is not a member of the org.
    if (!tenantAdmin.canManageUser(actor, target)) {
      throw new Meteor.Error('not-authorized');
    }
    if (!tenantAdmin.memberOrgIds(target).includes(orgId)) {
      throw new Meteor.Error('not-a-member');
    }
    await Meteor.users.updateAsync(
      { _id: userId, 'orgs.orgId': orgId },
      { $set: { 'orgs.$.isAdmin': value } },
    );
    return { orgId, userId, isOrgAdmin: value };
  },
});
