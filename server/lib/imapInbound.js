// Email to card and reply-by-email from IMAP mailboxes (#794): the Admin
// Panel names the mailboxes (Notification Settings -> Inbound email), and
// WeKan polls each one - Gmail, Outlook/Microsoft 365, Fastmail, Dovecot,
// Exchange, anything that speaks IMAP - with imapflow, parses each new
// message with mailparser, and hands it to the same receiveEmail() the
// webhook uses (server/routes/inboundEmail.js).
//
// Only one WeKan process polls a mailbox: a lease document per account in
// `inbound_mail_state`, taken with an atomic update and renewed each poll, so
// several replicas behind one database do not each make the card. The same
// document remembers the mailbox's UIDVALIDITY and the last UID read, so a
// message is read once even when it is not for WeKan (a shared mailbox) and
// is left as it was; a message that was for WeKan is marked seen, or deleted
// when the account says so.
//
// Not on Sandstorm: a grain has no network, and gets its mail through its own
// address instead (server/sandstormEmail.js).
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';

const { simpleParser } = require('mailparser');
const { fromParsedMail } = require('/server/lib/inboundEmailPayload');

const State = new Mongo.Collection('inbound_mail_state');
const OWNER = Random.id();
// Admin Panel / People / Notification Settings first, then the environment
// variable (models/lib/authConfigCatalog.js, section inboundEmail), read when
// used: a module-level constant was read before the Admin Panel values were.
const { authEnv, onAuthConfigChange } = require('/server/lib/authConfig');
const intervalMs = () => Math.max(15, Number(authEnv('INBOUND_IMAP_POLL_SECONDS')) || 60) * 1000;
const leaseMs = () => intervalMs() * 3;
const MAX_PER_POLL = 50;
const maxMessageBytes = () => Number(authEnv('INBOUND_EMAIL_MAX_BYTES')) || 30 * 1024 * 1024;

let timer = null;

async function takeLease(accountId) {
  const now = new Date();
  try {
    const result = await State.rawCollection().findOneAndUpdate(
      { _id: accountId, $or: [{ owner: OWNER }, { leaseUntil: { $lt: now } }, { leaseUntil: { $exists: false } }] },
      { $set: { owner: OWNER, leaseUntil: new Date(now.getTime() + leaseMs()) } },
      { upsert: true, returnDocument: 'after' },
    );
    const doc = result && (result.value !== undefined ? result.value : result);
    return doc && doc.owner === OWNER ? doc : null;
  } catch (e) {
    // Another process holds it: the upsert collided with its document.
    return null;
  }
}

async function pollAccount(account, password) {
  const state = await takeLease(account.id);
  if (!state) return;
  const { ImapFlow } = require('imapflow');
  const client = new ImapFlow({
    host: account.host,
    port: account.port,
    secure: account.secure,
    auth: { user: account.username, pass: password },
    logger: false,
  });
  const { receiveEmail } = require('/server/routes/inboundEmail');
  await client.connect();
  try {
    const lock = await client.getMailboxLock(account.mailbox || 'INBOX');
    try {
      const uidValidity = String(client.mailbox.uidValidity);
      // A new UIDVALIDITY means the old UIDs mean nothing: start from what is
      // unseen now rather than reading the whole mailbox again.
      let lastUid = state.uidValidity === uidValidity ? Number(state.lastUid) || 0 : null;
      const range = lastUid === null ? { seen: false } : { uid: `${lastUid + 1}:*` };
      const uids = ((await client.search(range, { uid: true })) || [])
        .filter(uid => lastUid === null || uid > lastUid)
        .sort((a, b) => a - b)
        .slice(0, MAX_PER_POLL);
      for (const uid of uids) {
        const msg = await client.fetchOne(String(uid), { source: true, size: true }, { uid: true });
        let handled = false;
        if (msg && msg.source && (!msg.size || msg.size <= maxMessageBytes())) {
          try {
            const message = fromParsedMail(await simpleParser(msg.source, { skipImageLinks: true, skipTextLinks: true }));
            const result = await receiveEmail(message, { source: `imap:${account.id}` });
            handled = result.handled === true;
          } catch (e) {
            console.warn(`inbound IMAP ${account.id}: message ${uid} not processed:`, e && e.message);
            require('/server/lib/mailProblems').recordMailProblem('receive-unreadable', {
              source: `imap:${account.id}`, detail: `message ${uid} in ${account.mailbox}: ${e && e.message}` });
          }
        }
        if (handled) {
          if (account.after === 'delete') await client.messageDelete(String(uid), { uid: true });
          else await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
        }
        lastUid = uid;
        await State.updateAsync(account.id, { $set: { uidValidity, lastUid, lastPollAt: new Date(), lastError: null } });
      }
      if (lastUid === null) {
        // Nothing unseen on a fresh mailbox: remember where it ends.
        lastUid = Math.max(0, (client.mailbox.uidNext || 1) - 1);
      }
      await State.updateAsync(account.id, { $set: { uidValidity, lastUid, lastPollAt: new Date(), lastError: null } });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

// One poll of every mailbox. A poll already running is waited for and then
// followed by a fresh one, so a caller (the Admin Panel's Save, a test) always
// gets a poll that started after it asked.
let inFlight = null;
export async function pollAll() {
  while (inFlight) await inFlight.catch(() => {});
  inFlight = pollAllOnce();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

async function pollAllOnce() {
  const { inboundMailSettings } = require('/server/emailToCard');
  const inboundMail = await inboundMailSettings();
  if (inboundMail.enabled !== true) return;
  for (const account of inboundMail.accounts || []) {
    const password = inboundMail.passwords && inboundMail.passwords[account.id];
    if (!account.enabled || !password) continue;
    try {
      await pollAccount(account, password);
    } catch (e) {
      const error = String((e && (e.responseText || e.message)) || e).slice(0, 500);
      console.warn(`inbound IMAP ${account.id}:`, error);
      require('/server/lib/mailProblems').recordMailProblem('imap-failed', {
        source: `imap:${account.id}`,
        detail: `${account.label || account.id} (${account.username}@${account.host}:${account.port}): ${error}`,
      });
      try { await State.updateAsync(account.id, { $set: { lastError: error, lastPollAt: new Date() } }); } catch (x) { /* best effort */ }
    }
  }
}

function start() {
  if (timer || Meteor.settings?.public?.sandstorm || process.env.INBOUND_IMAP_DISABLED === 'true') return;
  timer = Meteor.setInterval(() => { pollAll().catch(e => console.warn('inbound IMAP:', e && e.message)); }, intervalMs());
}

// A poll interval changed in Admin Panel takes effect at once.
onAuthConfigChange('inboundEmail', () => { if (timer) { Meteor.clearInterval(timer); timer = null; start(); } });

export function restart() {
  if (timer) { Meteor.clearInterval(timer); timer = null; }
  start();
  pollAll().catch(e => console.warn('inbound IMAP:', e && e.message));
}

// For Admin Panel: when each mailbox was last read, and its last error.
export async function imapAccountStatus() {
  const rows = await State.find({}, { fields: { lastPollAt: 1, lastError: 1 } }).fetchAsync();
  return Object.fromEntries(rows.map(r => [r._id, { lastPollAt: r.lastPollAt || null, lastError: r.lastError || null }]));
}

Meteor.startup(start);
