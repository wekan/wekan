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
