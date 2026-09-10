import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
// dhtmlx-gantt has no package.json "exports" map (only "main"/"module"/
// "style"), so unlike frappe-gantt its CSS resolves fine through a normal
// subpath import - no need to vendor it.
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

// DHTMLX Gantt Community Edition (MIT since v10, zero runtime dependencies)
// as an alternative Gantt Board View. It is a SINGLETON (`gantt` is one
// shared object, not a class instantiated per container, unlike Frappe
// Gantt), so it is destroyed on every re-render and on template destroy
// rather than merely cleared, or a second open would reuse state left over
// from the first.
let GanttSingletonPromise = null;
function loadDhtmlxGantt() {
  if (!GanttSingletonPromise) {
    GanttSingletonPromise = import('dhtmlx-gantt').then(mod => mod.gantt || mod.default || mod);
  }
  return GanttSingletonPromise;
}

function toISODate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

// Turns a board's cards into DHTMLX Gantt's flat task list (its own shape:
// {id, text, start_date, duration, progress}, duration in whole days). The
// bar spans Start->Due (or their Received/End fallbacks) - the pair
// conventionally dragged in a Gantt chart - while ALL FOUR of WeKan's own
// card dates (Received, Start, Due, End) are shown in the hover tooltip and
// stay visible even when one of them fell back to the other's field.
// `_startField`/`_endField` record which underlying card field the bar's two
// edges actually represent, so dragging the bar writes back to the right one.
function cardsToTasks(cards) {
  const today = new Date();
  return cards
    .map(card => {
      const startField = card.startAt ? 'startAt' : (card.receivedAt ? 'receivedAt' : null);
      if (!startField) return null;
      const start = toISODate(card[startField]);
      const endField = card.dueAt ? 'dueAt' : (card.endAt ? 'endAt' : null);
      let end = endField ? toISODate(card[endField]) : null;
      if (!end || end <= start) end = addDays(start, 1);
      const durationDays = Math.max(1, Math.round((end - start) / 86400000));
      const overdue = card.dueAt && !card.endAt && new Date(card.dueAt) < today;
      return {
        id: card._id,
        text: card.title || card._id,
        start_date: start,
        duration: durationDays,
        progress: card.endAt ? 1 : 0,
        color: overdue ? '#e74c3c' : undefined,
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
// the hover tooltip - the bar geometry only ever represents two of the four
// (Start/Due, or their Received/End fallbacks), so this is what makes
// Received and End visible for a card that also has Start and Due.
function tooltipHtml(task) {
  const rows = [
    [TAPi18n.__('card-received'), task._received],
    [TAPi18n.__('card-start'), task._cardStart],
    [TAPi18n.__('card-due'), task._due],
    [TAPi18n.__('card-end'), task._end],
  ].filter(([, value]) => value);
  return `<div><b>${task.text}</b></div>` +
    rows.map(([label, value]) => `<div>${label}: ${value}</div>`).join('');
}

Template.dhtmlxGanttView.onCreated(function() {
  this.taskCount = new ReactiveVar(0);
  this.destroyed = false;
});

Template.dhtmlxGanttView.onDestroyed(function() {
  this.destroyed = true;
  if (this.ganttLoaded) {
    loadDhtmlxGantt().then(gantt => gantt.destructor());
  }
});

Template.dhtmlxGanttView.onRendered(function() {
  const templateInstance = this;

  loadDhtmlxGantt().then(gantt => {
    if (templateInstance.destroyed) return;
    templateInstance.ganttLoaded = true;
    templateInstance.autorun(() => {
      const board = Utils.getCurrentBoard();
      const container = templateInstance.find('.js-dhtmlx-gantt-container');
      if (!board || !container) return;
      const cards = Cards.find(
        { boardId: board._id },
        { sort: { startAt: 1, dueAt: 1 } },
      ).fetch();
      const tasks = cardsToTasks(cards);
      templateInstance.taskCount.set(tasks.length);
      gantt.clearAll();
      // Matches Kanboard's Gantt: dragging/resizing bars is gated on the
      // same board-write capability the rest of WeKan uses
      // (Utils.canModifyCard), not offered as a control that the server
      // would then refuse.
      gantt.config.readonly = !Utils.currentUserCan('write', board);
      if (!tasks.length) return;
      if (!templateInstance.ganttInitialized) {
        gantt.config.date_format = '%Y-%m-%d %H:%i';
        // Editing a card's title/other fields happens on the card page, not
        // in a second edit surface here - the built-in double-click lightbox
        // is disabled so the Gantt's only interactions are click-to-open,
        // hover-for-details, and drag-to-reschedule.
        gantt.attachEvent('onBeforeLightbox', () => false);
        gantt.attachEvent('onTaskClick', id => {
          const card = ReactiveCache.getCard(id);
          if (!card) return true;
          const cardBoard = card.board();
          FlowRouter.go('card', {
            boardId: card.boardId,
            slug: (cardBoard && cardBoard.slug) || 'board',
            cardId: card._id,
          });
          return false;
        });
        // Dragging or resizing the bar is a normally-used Gantt feature;
        // persist it back to whichever card field the dragged edge actually
        // represents (see cardsToTasks's _startField/_endField), the same
        // card.setStart/setDue/setReceived/setEnd calls WeKan's Calendar
        // view already uses for its own drag-to-edit (boardBody.js
        // eventDrop/eventResize). onAfterTaskDrag (not the more generic
        // onAfterTaskUpdate, which also fires for the reactive re-render's
        // own gantt.parse() call and would otherwise write back on every
        // unrelated Cards change) fires only for an actual drag/resize.
        gantt.attachEvent('onAfterTaskDrag', (id, mode) => {
          if (mode === 'progress' || mode === 'ignore') return;
          const card = ReactiveCache.getCard(id);
          const task = gantt.getTask(id);
          if (!card || !task) return;
          const end = gantt.calculateEndDate(task.start_date, task.duration);
          if (task._startField === 'receivedAt') card.setReceived(task.start_date);
          else card.setStart(task.start_date);
          if (task._endField === 'endAt') card.setEnd(end);
          else card.setDue(end);
        });
        gantt.templates.tooltip_text = (start, end, task) => tooltipHtml(task);
        gantt.init(container);
        templateInstance.ganttInitialized = true;
      }
      gantt.parse({ data: tasks, links: [] });
    });
  }).catch(error => {
    console.error('Could not load DHTMLX Gantt:', error);
  });
});

Template.dhtmlxGanttView.helpers({
  hasNoTasks() {
    return Template.instance().taskCount.get() === 0;
  },
  // DHTMLX Gantt draws the same start/due/end task set as WeKan's own Gantt
  // view, so its export reuses the existing gantt chart export routes
  // (models/exportCharts.js, chartKey 'gantt') rather than adding a second,
  // parallel export pipeline for identical data.
  dhtmlxGanttExportUrl(format) {
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
