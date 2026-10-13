// Board View / Email (#794): the board as a Gmail-like mailbox
// (client/components/boards/emailView.*, docs/Features/Board/Email-View.md).
//
//   folders  inbox            the list email-to-card puts new cards in
//            sent             cards sent from this view
//            all              every card that came from or went out as email
//            list:<listId>    any list of the board, as a folder
//            label:<labelId>  any label of the board, as a Gmail label
//
// One page of rows at a time, newest first, as every WeKan table page does
// (docs/Features/Page/Table.md): the publication applies skip/limit on the
// server and names its card ids in the page index (models/lib/reportPageIndex.js),
// so the client renders exactly the page and never re-slices the board's cards;
// the total comes from emailViewCount.
//
// Compose and reply send From the member's own board address, so the answer
// comes back to the same board - and, by its In-Reply-To, to the same card.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { ReactiveCache } from '/imports/reactiveCache';
import Cards from '/models/cards';
import { cardCreation } from '/models/cards';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { pageInfo, TABLE_PAGE_ROWS_PER_PAGE } from '/models/lib/tablePage';
import { publishReportPage } from '/models/lib/reportPageIndex';

const { EMAIL_VIEW_PAGE_ID, emailFolderSelector, emailSearchSelector, cleanOutgoingEmail } = require('/models/lib/emailView');
const { createRateLimiter, resolveEmailToCard } = require('/models/lib/emailToCard');
const { boardAddress } = require('/server/lib/inboundBoardAddress');

const ROW_FIELDS = {
  title: 1, description: 1, createdAt: 1, receivedAt: 1, userId: 1, labelIds: 1, listId: 1,
  boardId: 1, dueAt: 1, email: 1, cardNumber: 1,
};
const allowSend = createRateLimiter({ limit: Number(process.env.EMAIL_VIEW_SENDS_PER_HOUR) || 50 });

async function readableBoard(userId, boardId) {
  check(boardId, String);
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !userId) return null;
  const user = await ReactiveCache.getUser(userId);
  return user && board.isVisibleBy(user) ? board : null;
}

// The Inbox: the list email to card puts cards in, else the first list.
export async function inboxListId(board) {
  const chosen = board.emailToCard && board.emailToCard.listId;
  if (chosen && await ReactiveCache.getList({ _id: chosen, boardId: board._id, archived: false })) return chosen;
  const lists = await ReactiveCache.getLists({ boardId: board._id, archived: false }, { sort: { sort: 1 } });
  return lists && lists[0] ? lists[0]._id : null;
}

async function selectorFor(board, folder, search) {
  return {
    ...emailFolderSelector(board._id, folder, { inboxListId: await inboxListId(board) }),
    ...emailSearchSelector(search),
  };
}

const OptionsPattern = { folder: String, page: Match.Optional(Number), search: Match.Optional(String) };

// Published manually (fetch + this.added + the page index), like the other
// table pages (server/publications/boards.js publicBoards): a sorted, limited
// live cursor would re-run the query on every card change of the board. The
// client subscribes again when the board's card count moves, so new mail
// still appears.
Meteor.publish('emailViewPage', async function emailViewPage(boardId, options) {
  check(options, OptionsPattern);
  const board = await readableBoard(this.userId, boardId);
  if (!board) return this.ready();
  const selector = await selectorFor(board, options.folder, options.search);
  const page = Math.max(1, Math.floor(options.page || 1));
  const docs = await Cards.find(selector, {
    sort: { createdAt: -1, _id: 1 },
    skip: (page - 1) * TABLE_PAGE_ROWS_PER_PAGE,
    limit: TABLE_PAGE_ROWS_PER_PAGE,
    fields: ROW_FIELDS,
  }).fetchAsync();
  for (const doc of docs) {
    const { _id, ...fields } = doc;
    this.added('cards', _id, fields);
  }
  publishReportPage(this, EMAIL_VIEW_PAGE_ID, docs);
  return this.ready();
});

Meteor.methods({
  async emailViewCount(boardId, options) {
    check(options, OptionsPattern);
    const board = await readableBoard(this.userId, boardId);
    if (!board) throw new Meteor.Error('not-authorized');
    const total = await Cards.find(await selectorFor(board, options.folder, options.search)).countAsync();
    return { total, inboxListId: await inboxListId(board), pages: pageInfo(total, 1).totalPages };
  },

  // Compose, or reply on a card (cardId). From is the member's board
  // address; the email is recorded on the board - a new card in the Inbox
  // (Sent shows it), or a comment on the card replied to.
  async sendBoardEmail(boardId, input) {
    check(boardId, String);
    check(input, { to: [String], cc: Match.Optional([String]), subject: String, text: String,
      cardId: Match.Optional(String) });
    const userId = this.userId;
    const board = await ReactiveCache.getBoard(boardId);
    if (!userId || !board || !allowIsBoardMemberWithWriteAccess(userId, board)) throw new Meteor.Error('not-authorized');
    let email;
    try {
      email = cleanOutgoingEmail(input);
    } catch (e) {
      throw new Meteor.Error(e.message);
    }
    const { inboundMailSettings, addressRow } = require('/server/emailToCard');
    const inboundMail = await inboundMailSettings();
    const user = await Meteor.users.findOneAsync(userId, { fields: { profile: 1, username: 1 } });
    const resolved = resolveEmailToCard({
      admin: { enabled: inboundMail.enabled === true, domain: inboundMail.domain || '' },
      board: board.emailToCard || {},
      member: (user.profile && user.profile.emailToCard) || {},
    });
    // Without a board address a reply would have nowhere to come back to.
    if (!resolved.enabled) throw new Meteor.Error(`email-to-card-off-${resolved.reason}`);
    if (!allowSend(userId)) throw new Meteor.Error('email-view-too-many');

    const row = await addressRow(board._id, userId);
    const sandstorm = !!Meteor.settings?.public?.sandstorm;
    const from = boardAddress(row.token, inboundMail.domain);
    const name = (user.profile && user.profile.fullname) || user.username || '';
    // On Sandstorm From is the grain's own address; the token in the subject
    // brings the reply back to this member's board (server/sandstormEmail.js).
    const subject = sandstorm ? `${email.subject} [board+${row.token}]` : email.subject;
    const messageId = `<${Random.id(24)}@${inboundMail.domain || 'wekan.invalid'}>`;

    let card = null;
    if (input.cardId) {
      card = await ReactiveCache.getCard({ _id: input.cardId, boardId: board._id });
      if (!card) throw new Meteor.Error('not-found');
    }
    const thread = card && card.email && Array.isArray(card.email.threadIds) ? card.email.threadIds : [];

    const { Email } = require('meteor/email');
    try {
      await Email.sendAsync({
      from: name ? `"${name.replace(/["\\\r\n]/g, '')}" <${from}>` : from,
      replyTo: from,
      to: email.to,
      cc: email.cc,
      subject,
      text: email.text,
      messageId,
      inReplyTo: thread.length ? thread[thread.length - 1] : undefined,
      references: thread.length ? thread.slice(-20) : undefined,
      });
    } catch (error) {
      // The mail server said no, or could not be reached: the member sees
      // that it was not sent, and the administrator sees why.
      require('/server/lib/mailProblems').recordMailProblem('send-failed', {
        source: 'email-view', userId,
        detail: `${(error && (error.responseCode || error.code)) || ''} ${(error && (error.response || error.message)) || error}`.trim(),
      });
      throw new Meteor.Error('email-view-send-failed');
    }

    const { addEmailComment } = require('/server/emailToCard');
    if (card) {
      await addEmailComment(card, userId, email.text);
      await Cards.direct.updateAsync(card._id, { $addToSet: { 'email.threadIds': messageId } });
      return { cardId: card._id };
    }
    const listId = await inboxListId(board);
    const swimlane = await board.getDefaultSwimlineAsync();
    if (!listId || !swimlane) throw new Meteor.Error('email-view-no-list');
    const siblings = await ReactiveCache.getCards({ listId, archived: false });
    const cardId = await Cards.direct.insertAsync({
      title: email.subject,
      description: email.text,
      boardId: board._id,
      listId,
      swimlaneId: swimlane._id,
      userId,
      sort: (siblings || []).length,
      cardNumber: await board.getNextCardNumber(),
      email: {
        direction: 'out', from: { name, address: from }, to: email.to, cc: email.cc,
        subject: email.subject, messageId, threadIds: [messageId], at: new Date(),
      },
    });
    const created = await ReactiveCache.getCard(cardId);
    if (created) await cardCreation(userId, created);
    return { cardId };
  },
});
