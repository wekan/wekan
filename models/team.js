import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');

const Team = new Mongo.Collection('team');

/**
 * A Team in WeKan. Organization in Trello.
 */
Team.attachSchema(
  new SimpleSchema({
    teamDisplayName: {
      /**
       * the name to display for the team
       */
      type: String,
      optional: true,
    },
    teamDesc: {
      /**
       * the description the team
       */
      type: String,
      optional: true,
      max: 190,
    },
    teamShortName: {
      /**
       * short name of the team
       */
      type: String,
      optional: true,
      max: 255,
    },
    teamWebsite: {
      /**
       * website of the team
       */
      type: String,
      optional: true,
      max: 255,
    },
    teamIsActive: {
      /**
       * status of the team
       */
      type: Boolean,
      optional: true,
    },
    teamSharedTemplates: {
      /**
       * #5850: members may drag personal Template Boards onto this team to share
       * (per-team form of "Shared Templates for Teams"). Off by default.
       */
      type: Boolean,
      optional: true,
    },
    teamPropagateMembersToBoards: {
      /**
       * #4737: add this team's members to the boards that list this team. Off by default.
       */
      type: Boolean,
      optional: true,
    },
    teamSyncMembersFromAuth: {
      /**
       * #4737: this team's membership is maintained by the authentication
       * provider's group/membership sync (LDAP, OAuth2/OIDC, SAML, etc.). Off by default.
       */
      type: Boolean,
      optional: true,
    },
    createdAt: {
      /**
       * creation date of the team
       */
      type: Date,
      autoValue: createdAtAutoValue,
    },
    modifiedAt: {
      type: Date,
      autoValue: modifiedAtAutoValue,
    },
  }),
);

export default Team;
