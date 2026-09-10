// 3-tier Notification Settings resolution.
//
// Precedence (highest wins), mirroring the theme-override pattern used
// elsewhere in WeKan (admin default -> board override -> member override):
//   1) Member Settings override (profile.notifyOverride.<service>)
//   2) Board Settings override   (board.notifyOverride.<service>)
//   3) Admin Panel default       (Settings.notifyDefault<Service>)
//   4) hardcoded fallback (true) — matches the current behavior when
//      nothing has ever been configured anywhere.
//
// A tri-state value is represented as `true` / `false` / `undefined` (or
// `null`, treated the same as `undefined`) at each level: only an explicit
// boolean counts as an override, an unset level falls through to the next.
//
// This module is intentionally pure (no Meteor/Mongo imports) so it can be
// unit-tested with plain Node and reused identically on the client and the
// server.

// The current notification-type catalog. Kept in sync with the services
// registered via Notifications.subscribe() in server/notifications/*.js:
// 'profile' == the in-app notification tray, 'email' == outgoing email
// notifications.
const NOTIFICATION_SERVICES = {
  tray: 'profile',
  email: 'email',
};

const HARDCODED_FALLBACK = true;

function normalize(value) {
  return value === true || value === false ? value : undefined;
}

// resolveNotificationSetting(service, { adminDefault, boardOverride, memberOverride })
// -> Boolean
//
// `service` is one of the NOTIFICATION_SERVICES keys ('tray', 'email'), used
// only for documentation/validation purposes here — the three override
// values are already resolved to this service by the caller.
function resolveNotificationSetting(
  service,
  { adminDefault, boardOverride, memberOverride } = {},
) {
  const member = normalize(memberOverride);
  if (member !== undefined) return member;

  const board = normalize(boardOverride);
  if (board !== undefined) return board;

  const admin = normalize(adminDefault);
  if (admin !== undefined) return admin;

  return HARDCODED_FALLBACK;
}

module.exports = {
  NOTIFICATION_SERVICES,
  HARDCODED_FALLBACK,
  resolveNotificationSetting,
};
