import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Org from '/models/org';
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
import { adminThemeForUser, setAdminThemeForUser } from '/server/lib/adminThemeSettings';
import {
  organizationMembersForAdmin,
  saveOrganizationTenantFieldsForAdmin,
  setOrganizationAdminForAdmin,
} from '/server/lib/adminOrganizations';

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
    return saveOrganizationTenantFieldsForAdmin(this.userId, orgId, fields);
  },

  // The members of one org, with the per-tenant admin flag - what the "Organization
  // admins" popup lists. Only someone who may administer that org may read it.
  async listOrgMembers(orgId) {
    check(orgId, String);
    return organizationMembersForAdmin(this.userId, orgId);
  },

  // ── the site theme (Admin Panel / Settings / Visibility / Change color) ────
  //
  // The layer between WeKan's default theme and a user's own override
  // (docs/Theme/Theme.md). The site admin sets the instance's; an Organization's
  // admin sets that Organization's, which replaces it on the Organization's own
  // hosts. Where the write lands is decided by the shared rule, not by the client.
  async getAdminThemeColor() {
    return adminThemeForUser(this.userId, this.connection?.httpHeaders);
  },

  async setAdminThemeColor(color, custom) {
    return setAdminThemeForUser(this.userId, this.connection?.httpHeaders, color, custom);
  },

  // Appoint or dismiss a per-tenant Global Admin of one org. The site admin may do
  // it anywhere; a per-tenant admin may do it inside their own org, which is what
  // makes a tenant self-administering. It writes `orgs.$.isAdmin` - the membership
  // the user already has - and NEVER the site-wide `isAdmin` flag.
  async setOrgAdmin(orgId, userId, value) {
    check(orgId, String);
    check(userId, String);
    check(value, Boolean);
    return setOrganizationAdminForAdmin(this.userId, orgId, userId, value);
  },
});
