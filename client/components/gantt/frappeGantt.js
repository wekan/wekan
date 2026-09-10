import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveVar } from 'meteor/reactive-var';
import Cards from '/models/cards';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
// frappe-gantt's package.json "exports" map only exposes a "style"
// CONDITION on its "." entry, not a "./dist/frappe-gantt.css" subpath, so
// `import('frappe-gantt/dist/frappe-gantt.css')` is rejected outright by
// rspack's Node exports-map enforcement. Its CSS is vendored verbatim into
// frappeGanttLib.css instead (see that file's header) and loaded statically,
// same as gantt.css/ganttCard.css already are for the view above it.
import './frappeGanttLib.css';

// Frappe Gantt (MIT, zero runtime dependencies) rendered below WeKan's own
// Gantt view. Its JavaScript is loaded with a dynamic import() so that code
// only reaches the browser when this template actually mounts - i.e. when
// the user opens the Gantt board view - never on every page load.
let GanttLibPromise = null;
function loadGanttLib() {
  if (!GanttLibPromise) {
    GanttLibPromise = import('frappe-gantt').then(mod => mod.default || mod);
  }
  return GanttLibPromise;
}

function toISODate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Turns a board's cards into Frappe Gantt's flat task list. Only cards with
// at least a start date can be placed on a timeline; a card with no due/end
// date gets a one-day bar rather than being silently dropped.
function cardsToTasks(cards) {
  const today = toISODate(new Date());
  return cards
    .map(card => {
      const start = toISODate(card.startAt || card.receivedAt);
      if (!start) return null;
      let end = toISODate(card.dueAt || card.endAt);
      if (!end || end <= start) end = addDays(start, 1);
      const overdue = card.dueAt && !card.endAt && toISODate(card.dueAt) < today;
      return {
        id: card._id,
        name: card.title || card._id,
        start,
        end,
        progress: card.endAt ? 100 : 0,
        custom_class: overdue ? 'gantt-task-overdue' : '',
      };
    })
    .filter(Boolean);
}

Template.frappeGanttView.onCreated(function() {
  this.taskCount = new ReactiveVar(0);
  this.destroyed = false;
});

Template.frappeGanttView.onDestroyed(function() {
  this.destroyed = true;
});

Template.frappeGanttView.onRendered(function() {
  const templateInstance = this;

  loadGanttLib().then(GanttLib => {
    if (templateInstance.destroyed) return;
    templateInstance.autorun(() => {
      const board = Utils.getCurrentBoard();
      const container = templateInstance.find('.js-frappe-gantt-container');
      if (!board || !container) return;
      const cards = Cards.find(
        { boardId: board._id },
        { sort: { startAt: 1, dueAt: 1 } },
      ).fetch();
      const tasks = cardsToTasks(cards);
      templateInstance.taskCount.set(tasks.length);
      container.innerHTML = '';
      if (!tasks.length) return;
      // eslint-disable-next-line no-new -- the instance manages its own DOM;
      // nothing outside this render pass needs to reference it further.
      new GanttLib(container, tasks, {
        view_mode: 'Week',
        on_click(task) {
          const card = ReactiveCache.getCard(task.id);
          if (!card) return;
          const cardBoard = card.board();
          FlowRouter.go('card', {
            boardId: card.boardId,
            slug: (cardBoard && cardBoard.slug) || 'board',
            cardId: card._id,
          });
        },
      });
    });
  }).catch(error => {
    console.error('Could not load Frappe Gantt:', error);
  });
});

Template.frappeGanttView.helpers({
  hasNoTasks() {
    return Template.instance().taskCount.get() === 0;
  },
  // Frappe Gantt draws the same start/due/end task set as WeKan's own Gantt
  // view, so its export reuses the existing gantt chart export routes
  // (models/exportCharts.js, chartKey 'gantt') rather than adding a second,
  // parallel export pipeline for identical data.
  frappeGanttExportUrl(format) {
    const board = Utils.getCurrentBoard();
    if (!board) return '';
    const path = format === 'PDF' ? 'exportPDF' : 'exportExcel';
    const params = new URLSearchParams({
      authToken: Accounts._storedLoginToken() || '',
      lang: TAPi18n.getLanguage ? TAPi18n.getLanguage() : 'en',
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      dateFormat: (Meteor.user() && Meteor.user().profile && Meteor.user().profile.dateFormat) || 'YYYY-MM-DD',
    });
    return `/api/boards/${board._id}/charts/gantt/${path}?${params.toString()}`;
  },
});
