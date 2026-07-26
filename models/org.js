import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
const { SimpleSchema } = require('/imports/simpleSchema');

const Org = new Mongo.Collection('org');

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
    orgSharedTemplates: {
      /**
       * #5850: members may drag personal Template Boards onto this org to share
       * (per-org form of "Shared Templates for Organizations"). Off by default.
       */
      type: Boolean,
      optional: true,
    },
    orgPropagateMembersToBoards: {
      /**
       * #4737: add this org's members to the boards that list this org. Off by default.
       */
      type: Boolean,
      optional: true,
    },
    orgSyncMembersFromAuth: {
      /**
       * #4737: this org's membership is maintained by the authentication
       * provider's group/membership sync (LDAP, OAuth2/OIDC, SAML, etc.). Off by default.
       */
      type: Boolean,
      optional: true,
    },
    orgDomains: {
      /**
       * Multitenancy option D (docs/Design/Multitenancy/Multitenancy.md): the
       * hostname(s) this Organization is served on, free text separated by commas,
       * semicolons or whitespace - e.g. "a.example.com, kanban.example.org". A
       * request whose host matches one of these is that tenant's request, and the
       * org's branding below replaces the instance branding for it. Empty (the
       * default) means the org is not a tenant and nothing changes.
       * Only read when the deployment sets MULTITENANCY=true.
       */
      type: String,
      optional: true,
      max: 1000,
    },
    orgProductName: {
      /**
       * Per-tenant branding. Each of these overrides the SAME-named instance
       * setting of Admin Panel / Settings / Visibility for this tenant's requests,
       * and an empty one leaves the instance value alone - so a tenant overrides
       * only what it sets. See models/lib/tenants.js BRANDING_FIELDS.
       */
      type: String,
      optional: true,
      max: 255,
    },
    orgThemeColor: {
      /**
       * The site theme for this Organization's hosts - the layer between WeKan's
       * default theme and a user's own override (docs/Theme/Theme.md). Set in
       * Admin Panel / Settings / Visibility / Change color.
       */
      type: String,
      optional: true,
      max: 255,
    },
    orgThemeCustomColors: {
      /**
       * The custom colours of that theme, for the flat (1 colour) and clear
       * (2 colours, a gradient) categories.
       */
      type: Array,
      optional: true,
    },
    'orgThemeCustomColors.$': {
      type: String,
      optional: true,
    },
    orgCustomLoginLogoImageUrl: {
      type: String,
      optional: true,
      max: 1000,
    },
    orgCustomLoginLogoLinkUrl: {
      type: String,
      optional: true,
      max: 1000,
    },
    orgTextBelowCustomLoginLogo: {
      type: String,
      optional: true,
      max: 1000,
    },
    orgCustomTopLeftCornerLogoImageUrl: {
      type: String,
      optional: true,
      max: 1000,
    },
    orgCustomTopLeftCornerLogoLinkUrl: {
      type: String,
      optional: true,
      max: 1000,
    },
    orgCustomHelpLinkUrl: {
      type: String,
      optional: true,
      max: 1000,
    },
    orgLegalNotice: {
      type: String,
      optional: true,
      max: 1000,
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

export default Org;
