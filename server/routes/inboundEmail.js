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
// Security: this endpoint is UNAUTHENTICATED BY DESIGN (a mail provider, not
// a logged-in WeKan user, calls it) - see CLAUDE.md's security-logging
// discipline. The HMAC token embedded in the recipient ("to") address by
// server/notifications/email.js (via inboundEmailReplyToken.js) is the sole
// guard standing between an arbitrary POST and a new card comment:
//   - a missing/malformed/forged/tampered token is rejected;
//   - a sender address that matches no WeKan user is rejected - no
//     anonymous/unauthenticated comment is ever created;
// both paths are logged via server/lib/securityLog with the
// 'authn.inbound-email' catalog key, wrapped so logging can never break the
// guard (models/lib/securityCategories.js).
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import CardComments from '/models/cardComments';
import { sendJsonResult } from '/server/apiMiddleware';
const { verifyReplyToken } = require('/server/lib/inboundEmailReplyToken');
const { stripQuotedReply } = require('/server/lib/inboundEmailQuoteStrip');
const { matchSenderToUser } = require('/server/lib/inboundEmailUserMatch');

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

    const body = req.body || {};
    const { from, to, text } = extractInboundFields(body);

    if (!to) {
      logRejectedInboundEmail(req, 'missing recipient field');
      sendJsonResult(res, { code: 400, data: { error: 'Missing recipient' } });
      return;
    }

    const verification = verifyReplyToken(to, secret);
    if (!verification.valid) {
      logRejectedInboundEmail(req, `invalid reply token (${verification.reason})`);
      sendJsonResult(res, { code: 403, data: { error: 'Invalid or expired reply address' } });
      return;
    }

    const card = await ReactiveCache.getCard(verification.cardId);
    if (!card) {
      logRejectedInboundEmail(req, 'reply token references a missing card');
      sendJsonResult(res, { code: 404, data: { error: 'Card not found' } });
      return;
    }

    const users = await ReactiveCache.getUsers({});
    const user = matchSenderToUser(from, users);
    if (!user) {
      // Never create an anonymous/unauthenticated comment - an unmatched
      // sender is rejected outright.
      logRejectedInboundEmail(req, 'sender address matches no WeKan user');
      sendJsonResult(res, { code: 403, data: { error: 'Unrecognized sender' } });
      return;
    }

    const commentText = stripQuotedReply(text);
    if (!commentText) {
      sendJsonResult(res, { code: 400, data: { error: 'Empty reply' } });
      return;
    }

    // Note on authorization: assertCanMutateComment (imported above) is
    // written for editing/deleting an EXISTING comment by its author, not for
    // creating a new one, so it is not called here. A new comment's
    // permission is "may this user comment on this board at all", which is
    // exactly what matching the sender to an existing WeKan user (above)
    // stands in for: only a real account can receive the notification email
    // whose Reply-To this endpoint is validating in the first place.
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
