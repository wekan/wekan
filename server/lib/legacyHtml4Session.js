import crypto from 'crypto';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { resolveClientKey } from '/server/lib/loginAttemptThrottle';

export const LegacyHtml4Sessions = new Mongo.Collection('legacyHtml4Sessions');
const SESSION_MS = 30 * 60 * 1000;

Meteor.startup(async () => {
  await LegacyHtml4Sessions.rawCollection().createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'legacy_html4_session_expiry' },
  );
});

function context(req) {
  return {
    address: resolveClientKey({
      headers: req.headers,
      socketAddress: req.socket?.remoteAddress || req.connection?.remoteAddress,
      forwardedCount: process.env.HTTP_FORWARDED_COUNT,
    }),
    userAgent: String(req.headers?.['user-agent'] || '').slice(0, 500),
  };
}

function actionHash(session, action, counter) {
  return crypto.createHmac('sha256', session.secret)
    .update(`${session._id}|${session.userId}|${session.address}|${session.userAgent}|${action}|${counter}`)
    .digest('hex');
}

export async function createLegacyHtml4Session(userId, req) {
  const requestContext = context(req);
  const session = {
    _id: crypto.randomBytes(24).toString('hex'),
    secret: crypto.randomBytes(32).toString('hex'),
    userId,
    ...requestContext,
    counter: 0,
    createdAt: new Date(),
    touchedAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_MS),
  };
  await LegacyHtml4Sessions.insertAsync(session);
  return sessionFields(session, '/allboards');
}

export function sessionFields(session, action) {
  return {
    legacySession: session._id,
    authAction: action,
    authCounter: session.counter,
    authHash: actionHash(session, action, session.counter),
  };
}

export async function consumeLegacyHtml4Session(req, action) {
  const body = req.body || {};
  const id = typeof body.legacySession === 'string' ? body.legacySession : '';
  const counter = Number(body.authCounter);
  const supplied = typeof body.authHash === 'string' ? body.authHash : '';
  if (!/^[0-9a-f]{48}$/.test(id) || !Number.isSafeInteger(counter) ||
      !/^[0-9a-f]{64}$/.test(supplied) || body.authAction !== action) return null;
  const session = await LegacyHtml4Sessions.findOneAsync({ _id: id });
  const requestContext = context(req);
  if (!session || session.expiresAt <= new Date() || session.counter !== counter ||
      session.address !== requestContext.address || session.userAgent !== requestContext.userAgent) return null;
  const expected = actionHash(session, action, counter);
  if (!crypto.timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'))) return null;
  const consumed = await LegacyHtml4Sessions.rawCollection().findOneAndUpdate(
    { _id: id, counter, expiresAt: { $gt: new Date() } },
    { $inc: { counter: 1 }, $set: { touchedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return consumed || null;
}
