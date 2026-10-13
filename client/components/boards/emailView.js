import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import { Utils } from '/client/lib/utils';
import { reportPageDocs } from '/client/lib/reportPages';
import { buildHeader, docsByIds, pageInfo } from '/models/lib/tablePage';

const { EMAIL_VIEW_PAGE_ID, parseFolder, snippet } = require('/models/lib/emailView');

// Board View / Email (emailView.jade, server/emailView.js). The folder, the
// page and the search are this view's state; the rows are the page the server
// named (the page index), never a re-slice of the board's cards in minimongo.

const COLUMNS = [
  { labelKey: 'email-view-from' },
  { labelKey: 'email-view-subject' },
  { labelKey: 'email-view-date', nowrap: true },
];

const SYSTEM_FOLDERS = [
  { id: 'inbox', icon: 'fa-inbox', labelKey: 'email-view-inbox' },
  { id: 'sent', icon: 'fa-paper-plane', labelKey: 'email-view-sent' },
  { id: 'all', icon: 'fa-envelope-o', labelKey: 'email-view-all' },
];

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  // Today: the time; this year: day and month; older: the whole date.
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return d.toLocaleDateString();
}

Template.emailView.onCreated(function () {
  this.folder = new ReactiveVar('inbox');
  this.page = new ReactiveVar(1);
  this.searchTerm = new ReactiveVar('');
  this.total = new ReactiveVar(0);

  this.autorun(() => {
    const boardId = Utils.getCurrentBoardId();
    if (!boardId) return;
    const options = { folder: this.folder.get(), page: this.page.get(), search: this.searchTerm.get() };
    // New mail arrives as a new card on the board: the board's own
    // subscription moves this count, and the page and total follow it.
    Cards.find({ boardId }).count();
    this.subscribe('emailViewPage', boardId, options);
    Meteor.call('emailViewCount', boardId, options, (error, result) => {
      if (!error && result) this.total.set(result.total);
    });
  });
});

function setFolder(tpl, folder) {
  tpl.folder.set(folder);
  tpl.page.set(1);
}

Template.emailView.helpers({
  systemFolders() {
    const current = Template.instance().folder.get();
    return SYSTEM_FOLDERS.map(f => ({ ...f, active: f.id === current }));
  },
  listFolders() {
    const board = Utils.getCurrentBoard();
    const current = Template.instance().folder.get();
    if (!board) return [];
    return (ReactiveCache.getLists({ boardId: board._id, archived: false }, { sort: { sort: 1 } }) || [])
      .map(l => ({ id: `list:${l._id}`, title: l.title, active: `list:${l._id}` === current }));
  },
  labelFolders() {
    const board = Utils.getCurrentBoard();
    const current = Template.instance().folder.get();
    return ((board && board.labels) || [])
      .map(l => ({ id: `label:${l._id}`, name: l.name || l.color, color: l.color, active: `label:${l._id}` === current }));
  },
  // Email to card off for this board: the Inbox only ever has what is put in
  // the list by hand, and compose would be refused - say where to turn it on.
  receiving() {
    const board = Utils.getCurrentBoard();
    return !!(board && board.emailToCard && board.emailToCard.enabled);
  },
  tablePageData() {
    const tpl = Template.instance();
    const info = pageInfo(tpl.total.get(), tpl.page.get());
    const board = Utils.getCurrentBoard();
    const labels = (board && board.labels) || [];
    const cards = reportPageDocs(Cards, EMAIL_VIEW_PAGE_ID, docsByIds);
    const docs = cards.map(card => {
      const email = card.email || {};
      const outgoing = email.direction === 'out';
      const author = !email.from && card.userId ? ReactiveCache.getUser(card.userId) : null;
      const sender = outgoing
        ? (email.to || []).join(', ')
        : (email.from && (email.from.name || email.from.address))
          || (author && (author.profile && author.profile.fullname || author.username)) || '';
      return {
        _id: card._id,
        title: card.title,
        snippet: snippet(card.description),
        outgoing,
        sender,
        date: formatDate(card.receivedAt || card.createdAt),
        labels: (card.labelIds || []).map(id => labels.find(l => l._id === id)).filter(Boolean),
      };
    });
    return {
      header: buildHeader(COLUMNS),
      rowTemplate: 'emailViewRow',
      docs,
      rowCount: docs.length,
      total: tpl.total.get(),
      searchTerm: tpl.searchTerm.get(),
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
      emptyKey: 'email-view-empty',
    };
  },
});

Template.emailView.events({
  'click .js-email-folder'(event, tpl) {
    event.preventDefault();
    setFolder(tpl, parseFolder(event.currentTarget.dataset.folder).kind === 'inbox'
      ? 'inbox' : event.currentTarget.dataset.folder);
  },
  'keydown .js-table-page-search'(event, tpl) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    tpl.searchTerm.set(event.currentTarget.value || '');
    tpl.page.set(1);
  },
  'click .js-table-page-prev'(event, tpl) {
    event.preventDefault();
    tpl.page.set(Math.max(1, tpl.page.get() - 1));
  },
  'click .js-table-page-next'(event, tpl) {
    event.preventDefault();
    const info = pageInfo(tpl.total.get(), tpl.page.get());
    if (info.hasNext) tpl.page.set(tpl.page.get() + 1);
  },
  // A message opens as the card popup - its comments are the conversation.
  'click .js-email-open'(event) {
    if ($(event.target).closest('.js-email-reply').length) return;
    const cardId = event.currentTarget.dataset.cardId;
    const boardId = Utils.getCurrentBoardId();
    if (!cardId) return;
    event.preventDefault();
    Meteor.subscribe('popupCardData', cardId, {
      onReady() {
        Session.set('popupCardId', cardId);
        Session.set('popupCardBoardId', boardId);
        if (!Popup.isOpen()) Popup.open('cardDetails')(event);
      },
    });
  },
  'click .js-email-compose'(event) {
    Popup.open('emailCompose').call({}, event);
  },
  'click .js-email-reply'(event) {
    event.preventDefault();
    event.stopPropagation();
    const card = ReactiveCache.getCard(event.currentTarget.dataset.cardId);
    if (!card) return;
    Popup.open('emailCompose').call({ currentData: () => ({ cardId: card._id }) }, event);
  },
});

// --- Compose ---------------------------------------------------------

function replyCard() {
  const data = Template.currentData() || {};
  return data.cardId ? ReactiveCache.getCard(data.cardId) : null;
}

Template.emailComposePopup.onCreated(function () {
  this.error = new ReactiveVar('');
  this.sending = new ReactiveVar(false);
  this.cardId = (Template.currentData() || {}).cardId || null;
});

Template.emailComposePopup.helpers({
  error() { return Template.instance().error.get(); },
  sending() { return Template.instance().sending.get(); },
  replyTitle() {
    const card = replyCard();
    return card ? card.title : '';
  },
  // A reply goes back to whoever wrote, under "Re: ".
  to() {
    const card = replyCard();
    const email = card && card.email;
    if (!email) return '';
    return email.direction === 'out' ? (email.to || []).join(', ') : ((email.from && email.from.address) || '');
  },
  subject() {
    const card = replyCard();
    if (!card) return '';
    const subject = (card.email && card.email.subject) || card.title || '';
    return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
  },
});

Template.emailComposePopup.events({
  'submit .js-email-compose-form'(event, tpl) {
    event.preventDefault();
    const split = value => String(value || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
    const input = {
      to: split(tpl.$('.js-email-to').val()),
      cc: split(tpl.$('.js-email-cc').val()),
      subject: String(tpl.$('.js-email-subject').val() || ''),
      text: String(tpl.$('.js-email-text').val() || ''),
    };
    if (tpl.cardId) input.cardId = tpl.cardId;
    tpl.sending.set(true);
    tpl.error.set('');
    Meteor.call('sendBoardEmail', Utils.getCurrentBoardId(), input, error => {
      tpl.sending.set(false);
      if (error) {
        tpl.error.set(TAPi18n.__(String(error.error || error.reason || 'email-view-send-failed')));
        return;
      }
      Popup.back();
    });
  },
});
