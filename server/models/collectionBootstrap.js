import { Meteor } from 'meteor/meteor';
import AccessibilitySettings from '/models/accessibilitySettings';
import AccountSettings from '/models/accountSettings';
import Announcements from '/models/announcements';
import CardCommentReactions from '/models/cardCommentReactions';
import InvitationCodes from '/models/invitationCodes';
import LockoutSettings from '/models/lockoutSettings';
import OrgUser from '/models/orgUser';
import PositionHistory from '/models/positionHistory';
import Presences from '/models/presences';
import Rules from '/models/rules';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import InviteToBoardRolesSettings, {
  INVITE_TO_BOARD_ROLES_ID,
  INVITE_TO_BOARD_ROLES_DEFAULT,
} from '/models/inviteToBoardRolesSettings';
import Triggers from '/models/triggers';
import UnsavedEditCollection from '/models/unsavedEdits';
import { ensureIndex } from '/server/lib/mongoStartup';

Meteor.startup(async () => {
  await ensureIndex(AccessibilitySettings, { modifiedAt: -1 });
  if (!(await AccessibilitySettings.findOneAsync({}))) {
    await AccessibilitySettings.insertAsync({ enabled: false, sort: 0 });
  }

  await ensureIndex(AccountSettings, { modifiedAt: -1 });
  await AccountSettings.upsertAsync(
    { _id: 'accounts-allowEmailChange' },
    { $setOnInsert: { booleanValue: false, sort: 0 } },
  );
  await AccountSettings.upsertAsync(
    { _id: 'accounts-allowUserNameChange' },
    { $setOnInsert: { booleanValue: false, sort: 1 } },
  );
  await AccountSettings.upsertAsync(
    { _id: 'accounts-allowUserDelete' },
    { $setOnInsert: { booleanValue: false, sort: 0 } },
  );

  await ensureIndex(Announcements, { modifiedAt: -1 });
  if (!(await Announcements.findOneAsync({}))) {
    await Announcements.insertAsync({ enabled: false, sort: 0 });
  }

  await ensureIndex(
    CardCommentReactions,
    { cardCommentId: 1 },
    { unique: true },
  );
  await ensureIndex(InvitationCodes, { modifiedAt: -1 });

  await ensureIndex(LockoutSettings, { modifiedAt: -1 });
  await LockoutSettings.upsertAsync(
    { _id: 'known-failuresBeforeLockout' },
    {
      $setOnInsert: {
        value: process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE
          ? parseInt(process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE, 10) : 3,
        category: 'known',
        sort: 0,
      },
    },
  );
  await LockoutSettings.upsertAsync(
    { _id: 'known-lockoutPeriod' },
    {
      $setOnInsert: {
        value: process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD
          ? parseInt(process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD, 10) : 60,
        category: 'known',
        sort: 1,
      },
    },
  );
  await LockoutSettings.upsertAsync(
    { _id: 'known-failureWindow' },
    {
      $setOnInsert: {
        value: process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW
          ? parseInt(process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW, 10) : 15,
        category: 'known',
        sort: 2,
      },
    },
  );
  const typoVar = process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BERORE;
  const correctVar = process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BEFORE;
  await LockoutSettings.upsertAsync(
    { _id: 'unknown-failuresBeforeLockout' },
    {
      $setOnInsert: {
        value: (correctVar || typoVar) ? parseInt(correctVar || typoVar, 10) : 3,
        category: 'unknown',
        sort: 0,
      },
    },
  );
  await LockoutSettings.upsertAsync(
    { _id: 'unknown-lockoutPeriod' },
    {
      $setOnInsert: {
        value: process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD
          ? parseInt(process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD, 10) : 60,
        category: 'unknown',
        sort: 1,
      },
    },
  );
  await LockoutSettings.upsertAsync(
    { _id: 'unknown-failureWindow' },
    {
      $setOnInsert: {
        value: process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW
          ? parseInt(process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW, 10) : 15,
        category: 'unknown',
        sort: 2,
      },
    },
  );

  await ensureIndex(OrgUser, { orgId: -1 });
  await ensureIndex(OrgUser, { orgId: -1, userId: -1 });

  await ensureIndex(Presences, { serverId: -1 });

  await ensureIndex(PositionHistory, { boardId: 1, entityType: 1, entityId: 1 });
  await ensureIndex(PositionHistory, { boardId: 1, entityType: 1 });
  await ensureIndex(PositionHistory, { createdAt: -1 });

  await ensureIndex(Rules, { modifiedAt: -1 });

  await ensureIndex(TableVisibilityModeSettings, { modifiedAt: -1 });
  await TableVisibilityModeSettings.upsertAsync(
    { _id: 'tableVisibilityMode-allowPrivateOnly' },
    { $setOnInsert: { booleanValue: false, sort: 0 } },
  );

  await ensureIndex(InviteToBoardRolesSettings, { modifiedAt: -1 });
  await InviteToBoardRolesSettings.upsertAsync(
    { _id: INVITE_TO_BOARD_ROLES_ID },
    { $setOnInsert: { allowedRoles: INVITE_TO_BOARD_ROLES_DEFAULT, sort: 0 } },
  );

  await ensureIndex(Triggers, { modifiedAt: -1 });

  await ensureIndex(UnsavedEditCollection, { modifiedAt: -1 });
  await ensureIndex(UnsavedEditCollection, { userId: 1 });
});
