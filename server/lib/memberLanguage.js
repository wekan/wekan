import { Meteor } from 'meteor/meteor';
import languages from '/imports/i18n/languages';
import securityLog from '/server/lib/securityLog';

function canonicalLanguage(value) {
  const normalized = String(value || '').toLowerCase().replace(/_/g, '-');
  return Object.values(languages).find(item =>
    String(item.tag).toLowerCase().replace(/_/g, '-') === normalized);
}

export function memberLanguageChoices() {
  return Object.values(languages)
    .map(({ tag, name, rtl }) => ({ tag, name, rtl: rtl === true }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function report(userId, context, detail) {
  securityLog.record({
    category: 'input', bleed: 'UserBleed', severity: 'high', action: 'blocked',
    source: 'memberLanguage', userId, req: context.req, detail,
  });
}

export async function setMemberLanguage(userId, requested, context = {}) {
  if (!userId) {
    report(userId, context, 'refused language change without an account');
    throw new Meteor.Error('not-logged-in');
  }
  const language = canonicalLanguage(requested);
  if (!language) {
    report(userId, context, `refused unsupported language ${String(requested).slice(0, 100)}`);
    throw new Meteor.Error('invalid-language');
  }
  const updated = await Meteor.users.updateAsync({ _id: userId }, {
    $set: { 'profile.language': language.tag },
  });
  if (updated !== 1) throw new Meteor.Error('not-logged-in');
  return language.tag;
}
