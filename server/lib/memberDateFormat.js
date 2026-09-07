import { Meteor } from 'meteor/meteor';
import securityLog from '/server/lib/securityLog';

export const MEMBER_DATE_FORMATS = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'];

export async function setMemberDateFormat(userId, dateFormat, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { username: 1 },
  });
  if (!user || !MEMBER_DATE_FORMATS.includes(dateFormat)) {
    securityLog.record({
      category: 'input', bleed: 'UserBleed', severity: 'high', action: 'blocked',
      source: 'memberDateFormat', userId, username: user?.username,
      req: context.req, connection: context.connection,
      detail: `refused invalid member date format ${String(dateFormat).slice(0, 40)}`,
    });
    throw new Meteor.Error('invalid-date-format');
  }
  await Meteor.users.updateAsync({ _id: userId }, {
    $set: { 'profile.dateFormat': dateFormat },
  });
  return dateFormat;
}
