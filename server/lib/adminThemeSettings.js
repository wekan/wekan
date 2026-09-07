import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Org from '/models/org';
import Settings from '/models/settings';
import { BOARD_COLORS } from '/models/metadata/colors';
import { isHexColor } from '/models/lib/contrastColor';
import * as tenantAdmin from '/models/lib/tenantAdmin';
import { tenantForHeaders } from '/server/lib/tenantResolver';

async function targetFor(userId, headers) {
  const user = userId && await ReactiveCache.getUser({ _id: userId }, {
    fields: { isAdmin: 1, orgs: 1, username: 1 },
  });
  const org = tenantForHeaders(headers || {});
  const target = tenantAdmin.themeTarget(user, org?._id);
  if (!target) throw new Meteor.Error('not-authorized');
  return target;
}

export async function adminThemeForUser(userId, headers) {
  const target = await targetFor(userId, headers);
  if (target.scope === 'instance') {
    const setting = await Settings.findOneAsync({}, { fields: { themeColor: 1,
      themeCustomColors: 1 } });
    return { scope: 'instance', color: setting?.themeColor || null,
      custom: setting?.themeCustomColors || [] };
  }
  const doc = await Org.findOneAsync(target.orgId, { fields: { orgThemeColor: 1,
    orgThemeCustomColors: 1, orgDisplayName: 1 } });
  return { scope: 'org', orgId: target.orgId, orgDisplayName: doc?.orgDisplayName || '',
    color: doc?.orgThemeColor || null, custom: doc?.orgThemeCustomColors || [] };
}

export async function setAdminThemeForUser(userId, headers, color, custom) {
  check(color, Match.OneOf(String, null, undefined));
  check(custom, Match.OneOf([String], null, undefined));
  const target = await targetFor(userId, headers);
  if (color && !BOARD_COLORS.includes(color)) throw new Meteor.Error('invalid-color');
  const colors = (custom || []).filter(value => isHexColor(value)).slice(0, 2);
  if (target.scope === 'instance') {
    const setting = await Settings.findOneAsync({}, { fields: { _id: 1 } });
    if (!setting) throw new Meteor.Error('no-settings');
    await Settings.direct.updateAsync(setting._id, color
      ? { $set: { themeColor: color, themeCustomColors: colors } }
      : { $unset: { themeColor: '', themeCustomColors: '' } });
    return { scope: 'instance', color: color || null };
  }
  await Org.updateAsync(target.orgId, color
    ? { $set: { orgThemeColor: color, orgThemeCustomColors: colors } }
    : { $unset: { orgThemeColor: '', orgThemeCustomColors: '' } });
  return { scope: 'org', orgId: target.orgId, color: color || null };
}
