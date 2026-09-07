import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Integrations from '/models/integrations';
import { validateAttachmentUrl } from '/models/lib/attachmentUrlValidation';
import securityLog from '/server/lib/securityLog';

const GLOBAL_ID = Integrations.Const.GLOBAL_WEBHOOK_ID;

async function requireGlobalAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  if (context.reportAttempt) securityLog.record({
    severity: 'high', category: 'authz', bleed: 'SettingsBleed', action: 'blocked',
    source: 'adminGlobalWebhooks', userId, username: user?.username, req: context.req,
    detail: 'refused an attempt to change global webhooks',
  });
  throw new Meteor.Error('not-authorized', 'Admin only');
}

function bounded(value, maximum, error) {
  check(value, String);
  const result = value.trim();
  if (result.length > maximum) throw new Meteor.Error(error);
  return result;
}

export async function globalWebhooksForAdmin(userId) {
  await requireGlobalAdmin(userId);
  return Integrations.find({ boardId: GLOBAL_ID }, {
    fields: { title: 1, url: 1, type: 1, enabled: 1 },
    sort: { createdAt: 1, _id: 1 },
  }).fetchAsync();
}

export async function saveGlobalWebhookForAdmin(userId, id, input, context = {}) {
  check(id, String);
  check(input, { title: String, url: String, token: String, type: String, enabled: Boolean });
  const user = await requireGlobalAdmin(userId, { ...context, reportAttempt: true });
  const title = bounded(input.title, 200, 'webhook-title-too-long');
  const url = bounded(input.url, 4096, 'webhook-url-too-long');
  const token = bounded(input.token, 4096, 'webhook-token-too-long');
  if (!Integrations.Const.WEBHOOK_TYPES.includes(input.type)) {
    securityLog.record({
      severity: 'high', category: 'validation', bleed: 'WebhookBleed', action: 'blocked',
      source: 'adminGlobalWebhooks', userId: user._id, username: user.username,
      req: context.req, detail: 'refused a non-allowlisted global webhook type',
    });
    throw new Meteor.Error('invalid-webhook-type');
  }
  const existing = id ? await Integrations.findOneAsync({ _id: id, boardId: GLOBAL_ID }) : null;
  if (id && !existing) throw new Meteor.Error('webhook-not-found');
  if (!url) {
    if (existing) await Integrations.direct.removeAsync(existing._id);
    return { removed: !!existing };
  }
  const validation = await validateAttachmentUrl(url);
  if (!validation.valid) {
    securityLog.record({
      severity: 'high', category: 'ssrf', bleed: 'WebhookBleed', action: 'blocked',
      source: 'adminGlobalWebhooks', userId: user._id, username: user.username,
      req: context.req, detail: `refused global webhook URL: ${validation.reason}`,
    });
    throw new Meteor.Error('invalid-webhook-url', validation.reason);
  }
  const values = { title, url, type: input.type, enabled: input.enabled };
  if (token) values.token = token;
  if (existing) {
    await Integrations.direct.updateAsync(existing._id, { $set: values });
    return { _id: existing._id };
  }
  return { _id: await Integrations.direct.insertAsync({
    ...values, token, userId: user._id, boardId: GLOBAL_ID, activities: ['all'],
  }) };
}
