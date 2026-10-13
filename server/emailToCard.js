// Email to card (#794, #3948): an email to a member's personal board address
// becomes a card on that board, the way Trello's email-to-board does.
//
//   board+<token>@<domain>      server/lib/inboundBoardAddress.js
//
// The email arrives by any of three paths, which all end in receiveBoardEmail():
//   - a mail provider's inbound webhook, POST /api/inbound-email
//     (server/routes/inboundEmail.js) - Mailgun, SendGrid, Postmark, or any
//     relay posting the raw message;
//   - an IMAP mailbox the Admin Panel names, polled (server/lib/imapInbound.js);
//   - on Sandstorm, the grain's own email address (server/sandstormEmail.js).
//
// Settings - Notification Settings, three levels (models/lib/emailToCard.js):
//   Admin Panel  on/off, the domain, the webhook secret, the IMAP servers and
//                their passwords - only here, and the secrets never leave the
//                server;
//   Board        on/off (off until a board admin turns it on), the list and
//                swimlane new cards go to, which parts of an email are used;
//   Member       on/off for their own addresses, and the parts they want.
//
// Security:
//   - the card's author is the address's MEMBER, never the From address
//     (ReplyBleed, GHSA-mc7c-cv99-64h7, taught that From is the sender's to
//     write); the member must still have write access to the board when the
//     email arrives, not merely when the address was made;
//   - the token is 131 random bits, compared exactly, and a member replaces a
//     leaked one with "New address";
//   - per-address rate limit, size limits, SVG attachments refused - the same
//     rule the upload path applies (models/attachments.js);
//   - an unknown address is an attempt (nobody is given one) and is logged
//     under 'authn.inbound-email'; a turned-off board or a member who has lost
//     access is refused quietly, since a real member's old address reaches it.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Settings from '/models/settings';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Attachments from '/models/attachments';
import { cardCreation } from '/models/cards';
import { allowIsBoardMemberWithWriteAccess, allowIsBoardAdminOrSiteAdmin } from '/server/lib/utils';

const {
  resolveEmailToCard, cardFromEmail, cleanParts, cleanInboundAdmin, inboundMailAdminView,
  createRateLimiter,
} = require('/models/lib/emailToCard');
const {
  newBoardAddressToken, boardAddress, parseBoardAddress, recipientAddresses,
} = require('/server/lib/inboundBoardAddress');
const { stripQuotedReply } = require('/server/lib/inboundEmailQuoteStrip');
const { cleanFileName } = require('/imports/lib/fileNameDisplay');

// Server-only: no publication sends these.
export const BoardEmailAddresses = new Mongo.Collection('board_email_addresses');
// Message-IDs already turned into cards, so an IMAP poll that dies between
// creating the card and marking the message seen, or a provider that retries
// a webhook, does not make the card twice. Kept 30 days.
const ReceivedEmails = new Mongo.Collection('email_to_card_received');

const MAX_ATTACHMENTS = 20;
const MAX_ATTACHMENT_BYTES = Number(process.env.INBOUND_EMAIL_MAX_ATTACHMENT_BYTES) || 25 * 1024 * 1024;
const allowAddress = createRateLimiter({
  limit: Number(process.env.INBOUND_EMAIL_PER_ADDRESS_PER_HOUR) || 60,
});

Meteor.startup(async () => {
  try {
    await BoardEmailAddresses.rawCollection().createIndex({ token: 1 }, { unique: true });
    await BoardEmailAddresses.rawCollection().createIndex({ boardId: 1, userId: 1 }, { unique: true });
    await ReceivedEmails.rawCollection().createIndex({ at: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });
  } catch (e) {
    console.warn('email to card: could not create indexes:', e && e.message);
  }
});

function logRefusal(source, detail) {
  try {
    require('/server/lib/securityLog').record({
      key: 'authn.inbound-email', action: 'blocked', source, detail,
    });
  } catch (e) {
    // logging must never break the guard
  }
}

export async function inboundMailSettings() {
  const setting = await Settings.findOneAsync({}, { fields: { inboundMail: 1 } });
  return (setting && setting.inboundMail) || {};
}

function adminGate(inboundMail) {
  return { enabled: inboundMail.enabled === true, domain: inboundMail.domain || '' };
}

async function memberSettings(userId) {
  const user = await Meteor.users.findOneAsync(userId, { fields: { 'profile.emailToCard': 1 } });
  return (user && user.profile && user.profile.emailToCard) || {};
}

export async function addressRow(boardId, userId, { create = true } = {}) {
  const row = await BoardEmailAddresses.findOneAsync({ boardId, userId });
  if (row || !create) return row;
  const doc = { boardId, userId, token: newBoardAddressToken(), createdAt: new Date() };
  try {
    doc._id = await BoardEmailAddresses.insertAsync(doc);
    return doc;
  } catch (e) {
    // Two tabs asking at once: the unique index let one through.
    return BoardEmailAddresses.findOneAsync({ boardId, userId });
  }
}

// The list and swimlane a new card goes to: the board's choice while it still
// exists on this board and is not archived, otherwise the first list and the
// default swimlane.
async function placement(board, resolved) {
  let list = resolved.listId
    ? await ReactiveCache.getList({ _id: resolved.listId, boardId: board._id, archived: false }) : null;
  if (!list) {
    const lists = await ReactiveCache.getLists({ boardId: board._id, archived: false }, { sort: { sort: 1 } });
    list = lists && lists[0];
  }
  let swimlane = resolved.swimlaneId
    ? await ReactiveCache.getSwimlane({ _id: resolved.swimlaneId, boardId: board._id, archived: false }) : null;
  if (!swimlane) swimlane = await board.getDefaultSwimlineAsync();
  return { list, swimlane };
}

async function attach(card, userId, attachments) {
  let stored = 0;
  for (const a of attachments.slice(0, MAX_ATTACHMENTS)) {
    const name = cleanFileName(String(a.filename).split(/[\\/]/).pop().replace(/\0/g, '')) || 'unnamed';
    const type = String(a.contentType || 'application/octet-stream').toLowerCase();
    if (name.toLowerCase().endsWith('.svg') || type === 'image/svg+xml') continue;
    if (!Buffer.isBuffer(a.content) || a.content.length === 0 || a.content.length > MAX_ATTACHMENT_BYTES) continue;
    try {
      await Attachments.writeAsync(a.content, {
        fileName: name,
        type,
        userId,
        meta: { boardId: card.boardId, cardId: card._id, listId: card.listId, swimlaneId: card.swimlaneId },
      }, true);
      stored += 1;
    } catch (e) {
      console.warn('email to card: attachment not stored:', e && e.message);
    }
  }
  return stored;
}

// One email, already in the shape of server/lib/inboundEmailPayload.js.
// Returns { code, error } or { code: 200, cardId }; `handled` is false when no
// recipient is a board address, so the caller can try its other uses.
export async function receiveBoardEmail(message, { source = 'webhook' } = {}) {
  const recipients = recipientAddresses({
    deliveredTo: message.deliveredTo, to: message.to, cc: message.cc,
  });
  const token = recipients.map(parseBoardAddress).find(Boolean);
  if (!token) return { handled: false };

  const inboundMail = await inboundMailSettings();
  const admin = adminGate(inboundMail);
  // An email somebody really sent that cannot become a card - not an attack,
  // so Problems -> Email, where the administrator sees that mail is bouncing.
  const refused = (reason, result) => {
    require('/server/lib/mailProblems').recordMailProblem('delivery-refused', { source, detail: reason });
    return result;
  };
  if (!admin.enabled || !admin.domain) {
    return refused('email to card is turned off in the Admin Panel', { handled: true, code: 404, error: 'Not found' });
  }

  const row = await BoardEmailAddresses.findOneAsync({ token });
  if (!row) {
    logRefusal(source, 'email to an unknown board address');
    return { handled: true, code: 404, error: 'Not found' };
  }

  const board = await ReactiveCache.getBoard(row.boardId);
  const user = await Meteor.users.findOneAsync(row.userId, { fields: { _id: 1, loginDisabled: 1 } });
  if (!board || board.archived || !user || user.loginDisabled
    || !allowIsBoardMemberWithWriteAccess(user._id, board)) {
    return refused('the address\'s member has no write access to its board any more, or the board is archived',
      { handled: true, code: 403, error: 'Address no longer valid' });
  }
  const resolved = resolveEmailToCard({
    admin, board: board.emailToCard || {}, member: await memberSettings(user._id),
  });
  if (!resolved.enabled) {
    return refused(`email to card is off (${resolved.reason})`, { handled: true, code: 403, error: 'Email to card is off' });
  }
  if (!allowAddress(token)) {
    logRefusal(source, 'board address over its hourly limit');
    return { handled: true, code: 429, error: 'Too many emails' };
  }

  const messageKey = message.messageId ? `${token}:${message.messageId}`.slice(0, 1000) : null;
  if (messageKey && await ReceivedEmails.findOneAsync(messageKey)) {
    return { handled: true, code: 200, duplicate: true };
  }

  const fields = cardFromEmail(message, resolved.parts, { stripQuoted: stripQuotedReply });
  const threadKeys = [...(message.inReplyTo || []), ...(message.references || [])].slice(0, 100);
  const thread = threadKeys.length
    ? await Cards.findOneAsync({ boardId: board._id, archived: false, 'email.threadIds': { $in: threadKeys } })
    : null;
  if (thread) {
    // A reply in a conversation this board already has: a comment on that
    // card, the way Gmail shows it in the same thread.
    const commentId = await addEmailComment(thread, user._id, fields.description || fields.title);
    if (message.messageId) {
      await Cards.direct.updateAsync(thread._id, { $addToSet: { 'email.threadIds': message.messageId } });
    }
    if (messageKey) {
      try { await ReceivedEmails.insertAsync({ _id: messageKey, at: new Date() }); } catch (e) { /* raced: fine */ }
    }
    if (fields.attachments.length) await attach(thread, user._id, fields.attachments);
    return { handled: true, code: 200, cardId: thread._id, commentId };
  }

  const { list, swimlane } = await placement(board, resolved);
  if (!list || !swimlane) {
    return refused('the board has no list for new cards', { handled: true, code: 409, error: 'The board has no list' });
  }
  const siblings = await ReactiveCache.getCards({ listId: list._id, archived: false });
  const customFields = await ReactiveCache.getCustomFields({ boardIds: board._id });
  const cardId = await Cards.direct.insertAsync({
    title: fields.title,
    description: fields.description,
    boardId: board._id,
    listId: list._id,
    swimlaneId: swimlane._id,
    userId: user._id,
    sort: (siblings || []).length,
    cardNumber: await board.getNextCardNumber(),
    receivedAt: new Date(),
    email: {
      direction: 'in',
      from: message.from && message.from.address ? { name: message.from.name || '', address: message.from.address } : null,
      to: (message.to || []).slice(0, 50),
      cc: (message.cc || []).slice(0, 50),
      subject: String(message.subject || '').slice(0, 1000),
      messageId: message.messageId || null,
      threadIds: message.messageId ? [message.messageId] : [],
      at: new Date(),
    },
    customFields: (customFields || [])
      .filter(f => f.automaticallyOnCard || f.alwaysOnCard)
      .map(f => ({ _id: f._id, value: null })),
  });
  if (messageKey) {
    try { await ReceivedEmails.insertAsync({ _id: messageKey, at: new Date() }); } catch (e) { /* raced: fine */ }
  }
  const card = await ReactiveCache.getCard(cardId);
  if (card) {
    await cardCreation(user._id, card);
    if (fields.attachments.length) await attach(card, user._id, fields.attachments);
  }
  return { handled: true, code: 200, cardId };
}

// A comment on a card, written by the address's member, with the activity a
// comment made in the app gets.
export async function addEmailComment(card, userId, text) {
  const CardComments = require('/models/cardComments').default;
  const Activities = require('/models/activities').default;
  const commentId = await CardComments.direct.insertAsync({
    userId, text: String(text || '').slice(0, 100000), cardId: card._id, boardId: card.boardId,
  });
  await Activities.insertAsync({
    userId, activityType: 'addComment', boardId: card.boardId, cardId: card._id, commentId,
    listId: card.listId, swimlaneId: card.swimlaneId,
  });
  return commentId;
}

// The address a member is shown (null while it cannot work), with why not.
async function addressFor(userId, board) {
  const inboundMail = await inboundMailSettings();
  const resolved = resolveEmailToCard({
    admin: adminGate(inboundMail), board: board.emailToCard || {}, member: await memberSettings(userId),
  });
  if (!resolved.enabled) return { enabled: false, reason: resolved.reason, address: null };
  const row = await addressRow(board._id, userId);
  if (Meteor.settings?.public?.sandstorm) {
    // One address per grain: the member's token goes in the subject
    // (server/sandstormEmail.js).
    const grain = await require('/server/sandstormEmail').grainAddress();
    return { enabled: !!grain, reason: grain ? null : 'sandstorm-no-session', address: grain,
      subjectTag: row ? `board+${row.token}` : null };
  }
  return { enabled: true, reason: null, address: boardAddress(row && row.token, inboundMail.domain) || null };
}

async function writableBoard(userId, boardId) {
  check(boardId, String);
  if (!userId) throw new Meteor.Error('not-authorized');
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !allowIsBoardMemberWithWriteAccess(userId, board)) throw new Meteor.Error('not-authorized');
  return board;
}

const PartsPattern = Match.Optional(Match.OneOf(null, Object));

Meteor.methods({
  // Member: my address for this board, made on first ask.
  async emailToCardAddress(boardId) {
    const board = await writableBoard(this.userId, boardId);
    return addressFor(this.userId, board);
  },

  // Member: replace my address (the old one stops working at once).
  async emailToCardNewAddress(boardId) {
    const board = await writableBoard(this.userId, boardId);
    await BoardEmailAddresses.removeAsync({ boardId: board._id, userId: this.userId });
    return addressFor(this.userId, board);
  },

  // Board admin: on/off, where cards go, which parts.
  async setBoardEmailToCard(boardId, settings) {
    check(boardId, String);
    check(settings, { enabled: Boolean, listId: Match.Optional(Match.OneOf(null, String)),
      swimlaneId: Match.Optional(Match.OneOf(null, String)), parts: PartsPattern });
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !(await allowIsBoardAdminOrSiteAdmin(this.userId, board))) throw new Meteor.Error('not-authorized');
    const value = { enabled: settings.enabled, parts: cleanParts(settings.parts) };
    if (settings.listId && await ReactiveCache.getList({ _id: settings.listId, boardId })) value.listId = settings.listId;
    if (settings.swimlaneId && await ReactiveCache.getSwimlane({ _id: settings.swimlaneId, boardId })) {
      value.swimlaneId = settings.swimlaneId;
    }
    await Boards.direct.updateAsync(boardId, { $set: { emailToCard: value } });
    return value;
  },

  // Member: my own on/off and parts. `enabled: null` falls back to on.
  async setMemberEmailToCard(settings) {
    check(settings, { enabled: Match.Optional(Match.OneOf(null, Boolean)), parts: PartsPattern });
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const value = { parts: cleanParts(settings.parts) };
    if (settings.enabled === true || settings.enabled === false) value.enabled = settings.enabled;
    await Meteor.users.updateAsync(this.userId, { $set: { 'profile.emailToCard': value } });
    return value;
  },

  // Admin Panel: the inbound settings without their secrets.
  async getInboundMailSettings() {
    const user = this.userId && await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1 } });
    if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
    const view = inboundMailAdminView(await inboundMailSettings());
    const { imapAccountStatus } = require('/server/lib/imapInbound');
    const status = await imapAccountStatus();
    view.accounts = view.accounts.map(a => ({ ...a, ...(status[a.id] || {}) }));
    const sandstorm = require('/server/sandstormEmail');
    view.sandstormAddress = await sandstorm.grainAddress();
    view.webhookUrl = Meteor.absoluteUrl('api/inbound-email');
    return view;
  },

  // Admin Panel: save. A secret or password is written only when one was
  // typed; `clearWebhookSecret` removes the secret.
  async saveInboundMailSettings(input) {
    check(input, Object);
    const user = this.userId && await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1 } });
    if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    const previous = setting.inboundMail || {};
    // On Sandstorm the domain is the grain's, set by server/sandstormEmail.js.
    if (Meteor.settings?.public?.sandstorm) input = { ...input, domain: previous.domain || '' };
    let clean;
    try {
      clean = cleanInboundAdmin(input);
    } catch (e) {
      throw new Meteor.Error(e.message);
    }
    const passwords = {};
    const passwordSet = {};
    const typed = input.passwords && typeof input.passwords === 'object' ? input.passwords : {};
    for (const account of clean.accounts) {
      const newPassword = typeof typed[account.id] === 'string' ? typed[account.id] : '';
      const old = previous.passwords && previous.passwords[account.id];
      if (newPassword) passwords[account.id] = newPassword;
      else if (old) passwords[account.id] = old;
      if (passwords[account.id]) passwordSet[account.id] = true;
    }
    const value = { ...clean, passwords, passwordSet };
    if (previous.sandstormBoard) value.sandstormBoard = previous.sandstormBoard;
    const secret = typeof input.webhookSecret === 'string' ? input.webhookSecret.trim() : '';
    if (input.clearWebhookSecret === true) {
      value.webhookSecretSet = false;
    } else if (secret) {
      value.webhookSecret = secret;
      value.webhookSecretSet = true;
    } else if (previous.webhookSecret) {
      value.webhookSecret = previous.webhookSecret;
      value.webhookSecretSet = true;
    }
    await Settings.updateAsync(setting._id, { $set: { inboundMail: value } });
    try {
      require('/server/lib/imapInbound').restart();
    } catch (e) {
      console.warn('email to card: IMAP poller restart failed:', e && e.message);
    }
    return inboundMailAdminView(value);
  },
});
