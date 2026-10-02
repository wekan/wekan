import Translation from '/models/translation';
import { allowSiteAdminCollectionMutation } from '/server/lib/adminCollectionPermission';

// Custom translations are instance administration data: they replace UI and
// e-mail text for everyone, and several strings render as HTML
// ({{{_ 'board-public-info'}}}, the legal notice). Client-side mutation is
// site-admin only.
//
// MegaBleed / TenantBleed sibling (2026-10-02): this rule also allowed any
// logged-in user to insert, update or remove a document whose _id equalled
// their own user id - the same "a document id is not an authorization
// relationship" mistake TenantBleed removed from Org and Team - so a member
// could plant markup in a translation that renders as HTML in an admin's
// browser. The UI uses the admin-only methods (server/models/translation.js).
Translation.allow({
  async insert(userId) {
    return allowSiteAdminCollectionMutation(userId);
  },
  async update(userId) {
    return allowSiteAdminCollectionMutation(userId);
  },
  async remove(userId) {
    return allowSiteAdminCollectionMutation(userId);
  },
  fetch: [],
});
