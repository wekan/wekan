import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Translation from '/models/translation';
import securityLog from '/server/lib/securityLog';

export const ADMIN_TRANSLATIONS_PAGE_SIZE = 25;

async function requireAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  if (context.reportAttempt) securityLog.record({
    severity: 'high', category: 'authz', bleed: 'TranslationBleed', action: 'blocked',
    source: 'adminTranslations', userId, username: user?.username, req: context.req,
    detail: 'refused an attempt to change instance translation overrides',
  });
  throw new Meteor.Error('not-authorized');
}

export function normalizeTranslationSearch(value) {
  check(value, String);
  const search = value.trim();
  if (search.length > 500) throw new Meteor.Error('search-too-long');
  return search;
}

export function translationSearchSelector(value) {
  const search = normalizeTranslationSearch(value);
  if (!search) return {};
  const literal = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(literal, 'i');
  return { $or: [{ language: regex }, { text: regex }, { translationText: regex }] };
}

function bounded(value, maximum, error) {
  check(value, String);
  const result = value.trim();
  if (result.length > maximum) throw new Meteor.Error(error);
  return result;
}

function values(language, text, translationText) {
  const normalized = {
    language: bounded(language, 5, 'language-too-long'),
    text: bounded(text, 10000, 'text-too-long'),
    translationText: bounded(translationText, 20000, 'translation-too-long'),
  };
  if (!/^[A-Za-z0-9@_-]{1,5}$/.test(normalized.language)) {
    throw new Meteor.Error('invalid-language');
  }
  if (!normalized.text) throw new Meteor.Error('text-required');
  return normalized;
}

export async function translationsPageForAdmin(userId, search = '', page = 1) {
  await requireAdmin(userId);
  const selector = translationSearchSelector(search);
  const count = await Translation.find(selector).countAsync();
  const totalPages = Math.max(1, Math.ceil(count / ADMIN_TRANSLATIONS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, Number.isSafeInteger(page) ? page : 1), totalPages);
  const rows = await Translation.find(selector, { sort: { modifiedAt: -1, _id: 1 },
    limit: ADMIN_TRANSLATIONS_PAGE_SIZE,
    skip: (safePage - 1) * ADMIN_TRANSLATIONS_PAGE_SIZE,
    fields: { language: 1, text: 1, translationText: 1 },
  }).fetchAsync();
  return { rows, count, page: safePage, totalPages, search: normalizeTranslationSearch(search) };
}

export async function createTranslationForAdmin(
  userId, language, text, translationText, context = {},
) {
  const user = await requireAdmin(userId, { ...context, reportAttempt: true });
  let normalized;
  try { normalized = values(language, text, translationText); } catch (error) {
    securityLog.record({ severity: 'high', category: 'validation', bleed: 'TranslationBleed',
      action: 'blocked', source: 'adminTranslations', userId: user._id,
      username: user.username, req: context.req,
      detail: `refused invalid translation override: ${error.error || error.message}` });
    throw error;
  }
  if (await Translation.findOneAsync({ language: normalized.language, text: normalized.text })) {
    throw new Meteor.Error('text-already-taken');
  }
  const now = new Date();
  return Translation.direct.insertAsync({ ...normalized, createdAt: now, modifiedAt: now });
}

export async function updateTranslationForAdmin(
  userId, translationId, translationText, context = {},
) {
  check(translationId, String);
  await requireAdmin(userId, { ...context, reportAttempt: true });
  const value = bounded(translationText, 20000, 'translation-too-long');
  const existing = await Translation.findOneAsync({ _id: translationId }, { fields: { _id: 1 } });
  if (!existing) throw new Meteor.Error('translation-not-found');
  await Translation.direct.updateAsync(existing._id, {
    $set: { translationText: value, modifiedAt: new Date() },
  });
  return true;
}

export async function deleteTranslationForAdmin(userId, translationId, context = {}) {
  check(translationId, String);
  await requireAdmin(userId, { ...context, reportAttempt: true });
  const removed = await Translation.direct.removeAsync({ _id: translationId });
  if (!removed) throw new Meteor.Error('translation-not-found');
  return true;
}
