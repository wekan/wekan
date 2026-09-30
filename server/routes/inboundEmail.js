// Reply-by-email inbound webhook (#2414): "reply to a notification email, and
// the reply becomes a comment on the card", Trello-style.
//
// SCOPE DECISION: this is the WEBHOOK-based approach, not an IMAP-polling
// mail client. WeKan currently only SENDS email (server/notifications/email.js)
// and has no infrastructure to receive it, and polling a real mailbox brings
// real operational complexity - a running mail server or account, credentials
// to manage, a polling loop to keep alive. Instead, self-hosters who want this
// feature point a transactional-email-RECEIVING provider's inbound-parse
// webhook (Mailgun Routes, SendGrid Inbound Parse, Postmark inbound) at this
// endpoint; the provider does the receiving, and POSTs the parsed email here.
// See docs/Features/Reply-By-Email.md for the provider-side setup this
// requires - it is genuinely outside WeKan's own code.
//
// Security: a mail provider, not a logged-in WeKan user, calls this endpoint.
// What authorizes a comment is the reply address WeKan itself sent
// (server/lib/inboundEmailReplyToken.js), and since ReplyBleed
// (GHSA-mc7c-cv99-64h7) that address names the card AND the one recipient it
// was sent to, and expires:
//   - the comment's author is the token's recipient - NEVER the From address,
//     which the sender controls; the From address must be one of that
//     recipient's own addresses, or the reply is refused (a reply from someone
//     else, e.g. a forwarded email, is not that recipient's comment);
//   - the recipient must still be an enabled user allowed to comment on that
//     card now, not merely when the email was sent;
//   - when INBOUND_EMAIL_WEBHOOK_SECRET is set, the provider must present it
//     (header x-wekan-inbound-secret or ?secret=), so only the provider can post.
// Refusals that only an attempt produces (forged token, spoofed sender, wrong
// webhook secret) are logged under 'authn.inbound-email'
// (models/lib/securityCategories.js); an expired or pre-fix token and a member
// who has lost access are refused quietly, since a real user replying to an
// old email reaches them.
import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import CardComments from '/models/cardComments';
import { sendJsonResult } from '/server/apiMiddleware';
const { verifyReplyToken } = require('/server/lib/inboundEmailReplyToken');
const { stripQuotedReply } = require('/server/lib/inboundEmailQuoteStrip');
const { replyAuthorDecision } = require('/server/lib/inboundEmailUserMatch');
const crypto = require('crypto');

// Timing-safe comparison of the optional provider secret.
function secretMatches(given, expected) {
  if (typeof given !== 'string' || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Every common transactional-email-receiving provider's inbound webhook is
// covered by reading a handful of alternative field names, rather than
// requiring one provider's exact payload shape:
//   - Mailgun Routes (form-encoded or JSON): `sender`/`from`, `recipient`/`to`,
//     `stripped-text`/`body-plain`
//   - SendGrid Inbound Parse (multipart, but also accepts JSON relays): `from`,
//     `to`, `text`
//   - Postmark inbound webhook (JSON): `From`, `To` (or `OriginalRecipient`),
//     `TextBody`
function extractField(body, names) {
  for (const name of names) {
    if (body && typeof body[name] === 'string' && body[name]) {
      return body[name];
    }
  }
  return '';
}

function extractInboundFields(body) {
  return {
    from: extractField(body, ['from', 'From', 'sender', 'Sender']),
    to: extractField(body, [
      'to', 'To', 'recipient', 'Recipient', 'OriginalRecipient',
    ]),
    text: extractField(body, [
      'text', 'Text', 'TextBody', 'stripped-text', 'body-plain',
    ]),
  };
}

async function commentCreationActivity(userId, doc) {
  // Mirrors server/models/cardComments.js's own commentCreation() - kept
  // local (rather than imported) because that module's copy is not exported,
  // and duplicating this small activity-insert is simpler and safer than
  // widening that module's public surface for one caller.
  const Activities = require('/models/activities').default;
  const card = await ReactiveCache.getCard(doc.cardId);
  if (!card) return;
  await Activities.insertAsync({
    userId,
    activityType: 'addComment',
    boardId: doc.boardId,
    cardId: doc.cardId,
    commentId: doc._id,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
}

function logRejectedInboundEmail(req, detail) {
  try {
    const { record } = require('/server/lib/securityLog');
    record({
      key: 'authn.inbound-email',
      action: 'blocked',
      source: (req.headers && req.headers['x-forwarded-for']) || req.socket?.remoteAddress,
      detail,
    });
  } catch (e) {
    // logging must never break the guard
  }
}

WebApp.handlers.post('/api/inbound-email', async function inboundEmailHandler(req, res) {
  try {
    const secret = process.env.INBOUND_EMAIL_HMAC_SECRET;
    if (!secret) {
      // Feature is opt-in; with no secret configured there is nothing valid
      // to verify against, so every call is refused the same way.
      logRejectedInboundEmail(req, 'INBOUND_EMAIL_HMAC_SECRET not configured');
      sendJsonResult(res, { code: 404, data: { error: 'Not found' } });
      return;
    }

    const webhookSecret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
    if (webhookSecret) {
      const given = (req.headers && req.headers['x-wekan-inbound-secret']) || (req.query && req.query.secret);
      if (!secretMatches(given, webhookSecret)) {
        logRejectedInboundEmail(req, 'inbound webhook secret missing or wrong');
        sendJsonResult(res, { code: 401, data: { error: 'Unauthorized' } });
        return;
      }
    }

    const body = req.body || {};
    const { from, to, text } = extractInboundFields(body);

    if (!to) {
      logRejectedInboundEmail(req, 'missing recipient field');
      sendJsonResult(res, { code: 400, data: { error: 'Missing recipient' } });
      return;
    }

    const verification = verifyReplyToken(to, secret);
    if (!verification.valid) {
      // A genuine but expired token, or the card-only form sent before
      // ReplyBleed was fixed, is a real user replying to an old email.
      if (!['expired', 'legacy-token'].includes(verification.reason)) {
        logRejectedInboundEmail(req, `invalid reply token (${verification.reason})`);
      }
      sendJsonResult(res, { code: 403, data: { error: 'Invalid or expired reply address' } });
      return;
    }

    const card = await ReactiveCache.getCard(verification.cardId);
    if (!card) {
      logRejectedInboundEmail(req, 'reply token references a missing card');
      sendJsonResult(res, { code: 404, data: { error: 'Card not found' } });
      return;
    }

    // The author is the recipient the reply address was minted for, never the
    // From address; replyAuthorDecision says whether that recipient sent it
    // and may still comment here.
    const user = await Meteor.users.findOneAsync(verification.userId,
      { fields: { _id: 1, emails: 1, loginDisabled: 1 } });
    const board = await ReactiveCache.getBoard(card.boardId);
    const decision = replyAuthorDecision({ user, fromAddress: from, card, board });
    if (!decision.ok) {
      if (decision.log) logRejectedInboundEmail(req, decision.detail);
      sendJsonResult(res, { code: decision.code, data: { error: decision.error } });
      return;
    }

    const commentText = stripQuotedReply(text);
    if (!commentText) {
      sendJsonResult(res, { code: 400, data: { error: 'Empty reply' } });
      return;
    }

    const commentId = await CardComments.direct.insertAsync({
      userId: user._id,
      text: commentText,
      cardId: card._id,
      boardId: card.boardId,
    });

    sendJsonResult(res, { code: 200, data: { _id: commentId } });

    const commentDoc = await ReactiveCache.getCardComment({ _id: commentId });
    if (commentDoc) {
      await commentCreationActivity(user._id, commentDoc);
    }
  } catch (error) {
    logRejectedInboundEmail(req, `unexpected error: ${error && error.message}`);
    sendJsonResult(res, { code: 500, data: { error: 'Internal error' } });
  }
});
