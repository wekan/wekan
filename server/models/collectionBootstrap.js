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
import Triggers from '/models/triggers';
import UnsavedEditCollection from '/models/unsavedEdits';

Meteor.startup(async () => {
  await AccessibilitySettings._collection.createIndexAsync({ modifiedAt: -1 });
  if (!(await AccessibilitySettings.findOneAsync({}))) {
    await AccessibilitySettings.insertAsync({ enabled: false, sort: 0 });
  }

  await AccountSettings._collection.createIndexAsync({ modifiedAt: -1 });
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

  await Announcements._collection.createIndexAsync({ modifiedAt: -1 });
  if (!(await Announcements.findOneAsync({}))) {
    await Announcements.insertAsync({ enabled: false, sort: 0 });
  }

  await CardCommentReactions._collection.createIndexAsync(
    { cardCommentId: 1 },
    { unique: true },
  );
  await InvitationCodes._collection.createIndexAsync({ modifiedAt: -1 });

  await LockoutSettings._collection.createIndexAsync({ modifiedAt: -1 });
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

  await OrgUser._collection.createIndexAsync({ orgId: -1 });
  await OrgUser._collection.createIndexAsync({ orgId: -1, userId: -1 });

  let lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  await Presences.removeAsync({ ttl: { $lte: lastWeek } });
  await Presences._collection.createIndexAsync({ serverId: -1 });

  await PositionHistory._collection.createIndexAsync({ boardId: 1, entityType: 1, entityId: 1 });
  await PositionHistory._collection.createIndexAsync({ boardId: 1, entityType: 1 });
  await PositionHistory._collection.createIndexAsync({ createdAt: -1 });

  await Rules._collection.createIndexAsync({ modifiedAt: -1 });

  await TableVisibilityModeSettings._collection.createIndexAsync({ modifiedAt: -1 });
  await TableVisibilityModeSettings.upsertAsync(
    { _id: 'tableVisibilityMode-allowPrivateOnly' },
    { $setOnInsert: { booleanValue: false, sort: 0 } },
  );

  await Triggers._collection.createIndexAsync({ modifiedAt: -1 });

  await UnsavedEditCollection._collection.createIndexAsync({ modifiedAt: -1 });
  await UnsavedEditCollection._collection.createIndexAsync({ userId: 1 });
});
