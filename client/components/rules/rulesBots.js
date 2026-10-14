import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Integrations from '/models/integrations';
import BotRuns from '/models/botRuns';
import { Utils } from '/client/lib/utils';

const runs = require('/models/lib/botRuns');

// Board Settings / Bots (rulesBots.jade, server/bots.js, models/lib/botRuns.js).
// The board's lists as kanbots' columns, each card with its bot run; the rail
// lists the bots, the live runs and their activity; the drawer is a card's
// thread - its comments and its run's events - and the reply box.

const selectedCardId = new ReactiveVar(null);
const addError = new ReactiveVar('');
let dragged = null;

const boardId = () => Session.get('currentBoard');

function boardBots() {
  return ReactiveCache.getIntegrations({ boardId: boardId(), bot: true }) || [];
}

function host(url) {
  try { return new URL(url).host; } catch (e) { return ''; }
}

function age(date) {
  if (!date) return '';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 60 * 48) return `${Math.round(minutes / 60)} h`;
  return `${Math.round(minutes / 1440)} d`;
}

// The newest run of a card, shaped for the card and the drawer.
function runOf(cardId) {
  const run = BotRuns.findOne({ cardId }, { sort: { updatedAt: -1 } });
  if (!run) return null;
  const last = (run.events || [])[run.events.length - 1] || {};
  const cost = [run.tokens ? `${run.tokens} tokens` : '', Number.isFinite(run.costUsd) ? `$${run.costUsd.toFixed(2)}` : ''].filter(Boolean).join(' · ');
  return {
    ...run,
    statusKey: `bots-status-${run.status}`,
    active: runs.ACTIVE.includes(run.status),
    ticker: run.status === 'running' ? [last.tool, last.text].filter(Boolean).join(': ') : '',
    options: (run.options || []).map(o => ({ ...o, runId: run._id })),
    costText: cost,
  };
}

Template.rulesBots.onCreated(function () {
  selectedCardId.set(null);
  this.autorun(() => {
    if (boardId()) this.subscribe('botRuns', boardId());
  });
});

Template.rulesBots.helpers({
  boardTitle() {
    const board = Utils.getCurrentBoard();
    return board ? board.title : '';
  },
  bots() {
    return boardBots().map(b => ({ _id: b._id, title: b.title || host(b.url), host: host(b.url), enabled: b.enabled !== false }));
  },
  addError() { return addError.get(); },
  liveRuns() {
    return BotRuns.find({ boardId: boardId(), status: { $in: runs.ACTIVE } }, { sort: { updatedAt: -1 } }).fetch().map((run) => {
      const card = ReactiveCache.getCard(run.cardId);
      const last = (run.events || [])[run.events.length - 1] || {};
      return { cardId: run.cardId, status: run.status, statusKey: `bots-status-${run.status}`, cardTitle: card ? card.title : '',
        ticker: [last.tool, last.text].filter(Boolean).join(': ') };
    });
  },
  activity() {
    const bots = new Map(boardBots().map(b => [b._id, b.title || host(b.url)]));
    return BotRuns.find({ boardId: boardId() }, { sort: { updatedAt: -1 }, limit: 20 }).fetch()
      .flatMap(run => (run.events || []).map(e => ({ botTitle: bots.get(run.integrationId) || '', text: [e.tool, e.text].filter(Boolean).join(': '), at: e.at })))
      .sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 30);
  },
  runningCount() { return BotRuns.find({ boardId: boardId(), status: 'running' }).count(); },
  waitingCount() { return BotRuns.find({ boardId: boardId(), status: 'awaiting_input' }).count(); },
  columns() {
    const board = Utils.getCurrentBoard();
    if (!board) return [];
    const labels = board.labels || [];
    return (ReactiveCache.getLists({ boardId: board._id, archived: false }, { sort: { sort: 1 } }) || []).map(list => ({
      _id: list._id,
      title: list.title,
      cards: (ReactiveCache.getCards({ boardId: board._id, listId: list._id, archived: false }, { sort: { sort: 1 } }) || []).map(card => ({
        _id: card._id,
        title: card.title,
        number: card.cardNumber ? `#${card.cardNumber}` : '',
        tag: labels.find(l => (card.labelIds || []).includes(l._id)) || null,
        run: runOf(card._id),
        members: [...new Set([...(card.assignees || []), ...(card.members || [])])],
        age: age(card.createdAt),
        selected: selectedCardId.get() === card._id,
      })),
    }));
  },
  selectedCard() {
    const card = selectedCardId.get() && ReactiveCache.getCard(selectedCardId.get());
    if (!card) return null;
    const run = runOf(card._id);
    const userName = (id) => { const u = ReactiveCache.getUser(id); return u ? u.username : ''; };
    const comments = CardComments.find({ cardId: card._id }, { sort: { createdAt: 1 } }).fetch()
      .map(c => ({ kind: 'comment', isEvent: false, who: userName(c.userId), at: c.createdAt, text: c.text }));
    const events = (run ? run.events || [] : []).map(e => ({ kind: 'event', isEvent: true, who: TAPi18n.__('bots'), at: e.at,
      text: [e.tool ? `\`${e.tool}\`` : '', e.text].filter(Boolean).join(' ') }));
    return {
      _id: card._id,
      title: card.title,
      run,
      botsList: boardBots().filter(b => b.enabled !== false),
      thread: [...comments, ...events].sort((a, b) => new Date(a.at) - new Date(b.at))
        .map(x => ({ ...x, when: x.at ? new Date(x.at).toLocaleString() : '' })),
    };
  },
});

Template.rulesBots.events({
  'click .js-bots-select'(event) {
    event.preventDefault();
    selectedCardId.set(event.currentTarget.dataset.cardId);
  },
  'click .js-bots-close'(event) {
    event.preventDefault();
    selectedCardId.set(null);
  },
  // A bot is an outgoing webhook marked as a bot, saved the way every
  // outgoing webhook is (board admins only, server/permissions/integrations.js),
  // subscribed to dispatches only.
  async 'submit .js-bots-add'(event, tpl) {
    event.preventDefault();
    addError.set('');
    const title = String(tpl.$('.js-bots-title').val() || '').trim();
    const url = String(tpl.$('.js-bots-url').val() || '').trim();
    const token = String(tpl.$('.js-bots-token').val() || '');
    try {
      await Integrations.insertAsync({ boardId: boardId(), title, url, ...(token ? { token } : {}), type: 'outgoing-webhooks',
        activities: [runs.BOT_ACTIVITY], bot: true, enabled: true, userId: Meteor.userId() });
      tpl.$('.js-bots-add')[0].reset();
    } catch (error) {
      addError.set(error.reason || error.message);
    }
  },
  async 'click .js-bots-remove'(event) {
    event.preventDefault();
    await Integrations.removeAsync(event.currentTarget.dataset.id);
  },
  'click .js-bots-dispatch'(event, tpl) {
    event.preventDefault();
    const integrationId = tpl.$('.js-bots-choose').val();
    if (integrationId && selectedCardId.get()) Meteor.call('botDispatch', selectedCardId.get(), integrationId);
  },
  'click .js-bots-stop'(event) {
    event.preventDefault();
    Meteor.call('botStop', event.currentTarget.dataset.runId);
  },
  'click .js-bots-answer'(event) {
    event.preventDefault();
    Meteor.call('botAnswer', event.currentTarget.dataset.runId, event.currentTarget.dataset.value);
  },
  'submit .js-bots-reply'(event, tpl) {
    event.preventDefault();
    const input = tpl.$('.js-bots-reply-text');
    const text = String(input.val() || '').trim();
    if (!text) return;
    Meteor.call('botReply', event.currentTarget.dataset.runId, text, (error) => { if (!error) input.val(''); });
  },
  // Drag a card to another column: the ordinary card move, with the
  // member's own rights - the same as on the board.
  'dragstart .js-bots-card'(event) {
    dragged = event.currentTarget.dataset.cardId;
    const dt = event.originalEvent && event.originalEvent.dataTransfer;
    if (dt) { dt.effectAllowed = 'move'; dt.setData('text/plain', dragged); }
  },
  'dragend .js-bots-card'() { dragged = null; },
  'dragover .js-bots-drop'(event) {
    if (!dragged) return;
    event.preventDefault();
    event.currentTarget.classList.add('is-drop-target');
  },
  'dragleave .js-bots-drop'(event) { event.currentTarget.classList.remove('is-drop-target'); },
  async 'drop .js-bots-drop'(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('is-drop-target');
    const card = dragged && Cards.findOne(dragged);
    dragged = null;
    const listId = event.currentTarget.dataset.listId;
    if (!card || !listId || card.listId === listId) return;
    const last = Cards.find({ boardId: card.boardId, listId, archived: false }, { sort: { sort: -1 }, limit: 1 }).fetch()[0];
    await card.move(card.boardId, card.swimlaneId, listId, last ? (last.sort || 0) + 1 : 0);
  },
});
