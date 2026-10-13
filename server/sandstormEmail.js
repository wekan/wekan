// Email in and out of a WeKan grain on Sandstorm (#794).
//
// A grain has no network of its own, so neither SMTP nor IMAP can reach it.
// Sandstorm gives every grain an email address instead, and this is how
// Sandstorm's own mail apps (Roundcube, Mailpile) use it
// (sandstorm docs/developing/email-from-apps.md):
//
//   OUT  HackSessionContext.send() - the grain's session context is also an
//        EmailSendPort. Sandstorm sends through the server's own SMTP, From
//        the grain's address (or the user's verified address), at most 20
//        recipients a message and 50 messages a day per grain owner. So every
//        WeKan email - notifications, invitations, password resets - goes this
//        way on Sandstorm: installGrainTransport() replaces the SMTP transport.
//
//   IN   <publicId>@<sandstorm host>. Sandstorm's SMTP server (port 30025)
//        hands mail for that address to the grain, and sandstorm-http-bridge
//        writes it as a Maildir file in /var/mail/new - the app only has to
//        make /var/mail/{new,cur,tmp}, which the bridge does not. Each file is
//        parsed with mailparser and goes to receiveEmail(), like a webhook or
//        IMAP message, then moves to /var/mail/cur.
//
// There is ONE address per grain, and Sandstorm takes the whole local part as
// the grain id - board+<token>@ cannot reach a grain. So a grain's email
// becomes a card by either:
//   - a member's board token in the SUBJECT ("board+<token> Fix the login"),
//     which the member's Notification Settings shows; the card is that
//     member's, exactly as with a board address elsewhere; or
//   - the board the Admin Panel names as the grain's email board, as the board
//     admin who chose it.
//
// The grain address needs a session: getPublicId() is a call on a user's
// session context, and the grain has no address at all until it is first
// made. Every login on Sandstorm keeps the newest session context (the shell
// does not revoke it), so email still goes out after that browser tab closes;
// until anybody has opened the grain since it started, mail waits.
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';

const isSandstorm = !!Meteor.settings?.public?.sandstorm;
const MAILDIR = process.env.SANDSTORM_MAILDIR || '/var/mail';
const POLL_MS = 5000;

let api = null;
let bridge = null;
let context = null;
let grain = null;          // { publicId, hostname }
let waiting = [];          // sends made before any session existed

async function bridgeApi() {
  if (!api) {
    api = await import('/imports/sandstorm/bridgeClient.mjs');
    bridge = api.createBridge();
  }
  return api;
}

const { subjectBoardToken } = require('/server/lib/inboundBoardAddress');

export async function grainAddress() {
  if (!isSandstorm || !grain) return null;
  return `${grain.publicId}@${grain.hostname}`;
}

async function keepSession(sessionId) {
  if (!sessionId) return;
  const a = await bridgeApi();
  const next = await a.retainSessionContext(bridge.bridge, sessionId);
  const previous = context;
  context = next;
  if (previous) a.release(previous);
  if (!grain) {
    grain = await a.grainPublicId(context);
    // The grain's hostname is the domain board addresses are shown with.
    const Settings = require('/models/settings').default;
    const setting = await Settings.findOneAsync({});
    if (setting && (setting.inboundMail || {}).domain !== grain.hostname) {
      await Settings.updateAsync(setting._id, { $set: { 'inboundMail.domain': grain.hostname } });
    }
  }
  const pending = waiting;
  waiting = [];
  for (const job of pending) job();
}

// Meteor's Email.send() on Sandstorm. From becomes the grain's address (the
// only one Sandstorm lets a grain use without a user's own session), keeping
// the display name; Reply-To keeps the original From when there was none.
async function sendThroughGrain({ packageSettings, ...message }) {
  try {
    if (!context) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('no Sandstorm session yet - open the grain once')), 10 * 60 * 1000);
        waiting.push(() => { clearTimeout(timer); resolve(); });
      });
    }
    await sendGrainMessage(await bridgeApi(), message);
  } catch (error) {
    // Sandstorm said no (over its daily limit, a From it does not allow) or
    // nobody has opened the grain since it started: Problems -> Email.
    require('/server/lib/mailProblems').recordMailProblem('send-failed', {
      source: 'sandstorm-grain-email', detail: (error && error.message) || String(error) });
    throw error;
  }
}

async function sendGrainMessage(a, message) {
  const { addressList, parseFrom } = require('/server/lib/inboundEmailPayload');
  const original = parseFrom(Array.isArray(message.from) ? message.from[0] : message.from);
  const asList = value => addressList(value).map(address => ({ address }));
  const replyTo = message.replyTo ? parseFrom(String(message.replyTo)) : original;
  await a.sendGrainEmail(context, {
    from: { address: `${grain.publicId}@${grain.hostname}`, name: original.name || 'WeKan' },
    to: asList(message.to),
    cc: asList(message.cc),
    bcc: asList(message.bcc),
    replyTo: replyTo.address ? replyTo : undefined,
    subject: message.subject,
    text: message.text,
    html: message.html,
    messageId: message.messageId,
    inReplyTo: message.inReplyTo,
    references: message.references,
    attachments: (message.attachments || []).map(att => ({
      filename: att.filename,
      contentType: att.contentType,
      content: att.content,
      cid: att.cid,
    })),
  });
}

export function installGrainTransport() {
  if (!isSandstorm) return false;
  const { Email } = require('meteor/email');
  Email.customTransport = sendThroughGrain;
  return true;
}

// --- Receiving: the grain's Maildir -------------------------------------

async function receiveFile(fs, path, maildir, name) {
  const file = path.join(maildir, 'new', name);
  const { simpleParser } = require('mailparser');
  const { fromParsedMail } = require('/server/lib/inboundEmailPayload');
  const { receiveEmail } = require('/server/routes/inboundEmail');
  const message = fromParsedMail(await simpleParser(await fs.promises.readFile(file),
    { skipImageLinks: true, skipTextLinks: true }));
  await routeToBoard(message);
  try {
    await receiveEmail(message, { source: 'sandstorm-grain-email' });
  } finally {
    // Read once, whatever became of it: a refused email does not get better
    // by being read again every five seconds.
    await fs.promises.rename(file, path.join(maildir, 'cur', `${name}:2,S`)).catch(() => fs.promises.unlink(file));
  }
}

// Point a grain email at a board address, which is what receiveBoardEmail
// understands: the member token in the subject, else the Admin Panel's
// grain email board as the admin who chose it.
async function routeToBoard(message) {
  const { token, subject } = subjectBoardToken(message.subject);
  const domain = (grain && grain.hostname) || 'sandstorm.invalid';
  if (token) {
    message.subject = subject;
    message.deliveredTo = [`board+${token}@${domain}`, ...(message.deliveredTo || [])];
    return;
  }
  const { inboundMailSettings, BoardEmailAddresses } = require('/server/emailToCard');
  const inboundMail = await inboundMailSettings();
  const target = inboundMail.sandstormBoard;
  if (!target || !target.boardId || !target.userId) return;
  const row = await BoardEmailAddresses.findOneAsync({ boardId: target.boardId, userId: target.userId });
  if (row) message.deliveredTo = [`board+${row.token}@${domain}`, ...(message.deliveredTo || [])];
}

// Read every message in <maildir>/new once. Exported for the tests, which
// give it a Maildir of their own.
let polling = false;
export async function pollMaildir(maildir = MAILDIR) {
  if (polling) return;
  polling = true;
  try {
    const fs = require('fs');
    const path = require('path');
    const names = await fs.promises.readdir(path.join(maildir, 'new')).catch(() => []);
    for (const name of names.filter(n => !n.startsWith('.')).sort()) {
      try {
        await receiveFile(fs, path, maildir, name);
      } catch (e) {
        console.warn('Sandstorm grain email: not processed:', name, e && e.message);
        require('/server/lib/mailProblems').recordMailProblem('receive-unreadable', {
          source: 'sandstorm-grain-email', detail: `${name}: ${e && e.message}` });
        // An unreadable file is moved aside, not read again every five seconds.
        await fs.promises.rename(path.join(maildir, 'new', name), path.join(maildir, 'cur', `${name}:2,F`)).catch(() => {});
      }
    }
  } finally {
    polling = false;
  }
}

if (isSandstorm) {
  Meteor.startup(() => {
    const fs = require('fs');
    for (const dir of ['new', 'cur', 'tmp']) {
      try { fs.mkdirSync(`${MAILDIR}/${dir}`, { recursive: true }); } catch (e) {
        console.warn(`Sandstorm grain email: cannot create ${MAILDIR}/${dir}:`, e && e.message);
      }
    }
    installGrainTransport();
    Meteor.setInterval(() => { pollMaildir().catch(() => {}); }, POLL_MS);
  });

  Accounts.onLogin(({ connection }) => {
    let sessionId = null;
    try { sessionId = connection && connection.sandstormSessionId && connection.sandstormSessionId(); } catch (e) { /* none */ }
    keepSession(sessionId).catch(e => console.warn('Sandstorm grain email: session:', e && e.message));
  });

  Meteor.methods({
    // Admin Panel on Sandstorm: which board the grain's address makes cards
    // on, as the calling admin (who must have write access there).
    async setSandstormEmailBoard(boardId) {
      check(boardId, String);
      const user = this.userId && await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1 } });
      if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
      const Settings = require('/models/settings').default;
      const setting = await Settings.findOneAsync({});
      if (!boardId) {
        await Settings.updateAsync(setting._id, { $unset: { 'inboundMail.sandstormBoard': '' } });
        return null;
      }
      const { ReactiveCache } = require('/imports/reactiveCache');
      const { allowIsBoardMemberWithWriteAccess } = require('/server/lib/utils');
      const board = await ReactiveCache.getBoard(boardId);
      if (!board || !allowIsBoardMemberWithWriteAccess(this.userId, board)) throw new Meteor.Error('not-authorized');
      await require('/server/emailToCard').addressRow(boardId, this.userId);
      const value = { boardId, userId: this.userId };
      await Settings.updateAsync(setting._id, { $set: { 'inboundMail.sandstormBoard': value } });
      return value;
    },
  });
}
