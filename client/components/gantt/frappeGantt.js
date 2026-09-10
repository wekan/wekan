import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
// roadmapView.js imports this module directly for loadGanttLib/cardsToTasks -
// so its own template has to be imported here too, or whichever module
// reaches this file first (via that import, before client/features/gantt.js
// gets to the .jade) registers Template.frappeGanttView.* against a template
// that does not exist yet (see tests/clientBundleImports.test.cjs).
import './frappeGantt.jade';
// frappe-gantt's package.json "exports" map only exposes a "style"
// CONDITION on its "." entry, not a "./dist/frappe-gantt.css" subpath, so
// `import('frappe-gantt/dist/frappe-gantt.css')` is rejected outright by
// rspack's Node exports-map enforcement. Its CSS is vendored verbatim into
// frappeGanttLib.css instead (see that file's header) and loaded statically,
// same as gantt.css/ganttCard.css already are for the view above it.
import './frappeGanttLib.css';

// Frappe Gantt (MIT, zero runtime dependencies) as an alternative Gantt
// Board View. Its JavaScript is loaded with a dynamic import() so that code
// only reaches the browser when this template actually mounts - i.e. when
// the user opens this board view - never on every page load.
let GanttLibPromise = null;
export function loadGanttLib() {
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

function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

// Turns a board's cards into Frappe Gantt's flat task list. A card needs a
// Start (or Received, as a fallback) to be placed on the timeline; the bar
// itself spans Start->Due (or their Received/End fallbacks) - the pair
// conventionally dragged in a Gantt chart - while ALL FOUR of WeKan's own
// card dates (Received, Start, Due, End) are shown in the popup and stay
// visible even when one of them fell back to the other's field. `_startField`/
// `_endField` record which underlying card field the bar's two edges
// actually represent, so dragging the bar writes back to the right one.
export function cardsToTasks(cards) {
  const today = toISODate(new Date());
  return cards
    .map(card => {
      const startField = card.startAt ? 'startAt' : (card.receivedAt ? 'receivedAt' : null);
      if (!startField) return null;
      const start = toISODate(card[startField]);
      const endField = card.dueAt ? 'dueAt' : (card.endAt ? 'endAt' : null);
      let end = endField ? toISODate(card[endField]) : null;
      if (!end || end <= start) end = addDays(start, 1);
      const overdue = card.dueAt && !card.endAt && toISODate(card.dueAt) < today;
      return {
        id: card._id,
        name: card.title || card._id,
        start,
        end,
        progress: card.endAt ? 100 : 0,
        custom_class: overdue ? 'gantt-task-overdue' : '',
        _startField: startField,
        _endField: endField || 'dueAt',
        _received: formatDate(card.receivedAt),
        _cardStart: formatDate(card.startAt),
        _due: formatDate(card.dueAt),
        _end: formatDate(card.endAt),
      };
    })
    .filter(Boolean);
}

// All four WeKan card dates, one row per date that is actually set, shown in
// the popup that opens on click - the bar geometry only ever represents two
// of the four (Start/Due, or their Received/End fallbacks), so this is what
// makes Received and End visible for a card that also has Start and Due.
export function popupDetailsHtml(task) {
  const rows = [
    [TAPi18n.__('card-received'), task._received],
    [TAPi18n.__('card-start'), task._cardStart],
    [TAPi18n.__('card-due'), task._due],
    [TAPi18n.__('card-end'), task._end],
  ].filter(([, value]) => value);
  return rows.map(([label, value]) =>
    `<div>${label}: ${value}</div>`).join('');
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
      // Matches Kanboard's Gantt: dragging/resizing bars is gated on the same
      // board-write capability the rest of WeKan uses (Utils.canModifyCard),
      // not offered as a control that the server would then refuse.
      const readonly = !Utils.currentUserCan('write', board);
      new GanttLib(container, tasks, {
        view_mode: 'Week',
        readonly_dates: readonly,
        readonly_progress: true,
        // Lets the user switch Day/Week/Month/Year from a dropdown, one of
        // Frappe Gantt's normally-used features (README "Key Features":
        // "Customizable Views").
        view_mode_select: true,
        popup({ task, set_details }) {
          set_details(popupDetailsHtml(task));
        },
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
        // Dragging or resizing the bar is a normally-used Gantt feature;
        // persist it back to whichever card field the dragged edge actually
        // represents (see cardsToTasks's _startField/_endField), the same
        // card.setStart/setDue/setReceived/setEnd calls WeKan's Calendar
        // view already uses for its own drag-to-edit (boardBody.js
        // eventDrop/eventResize).
        on_date_change(task, start, end) {
          const card = ReactiveCache.getCard(task.id);
          if (!card) return;
          if (task._startField === 'receivedAt') card.setReceived(start);
          else card.setStart(start);
          if (task._endField === 'endAt') card.setEnd(end);
          else card.setDue(end);
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
