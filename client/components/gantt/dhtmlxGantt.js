import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveVar } from 'meteor/reactive-var';
import Cards from '/models/cards';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
// dhtmlx-gantt has no package.json "exports" map (only "main"/"module"/
// "style"), so unlike frappe-gantt its CSS resolves fine through a normal
// subpath import - no need to vendor it.
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

// DHTMLX Gantt Community Edition (MIT since v10, zero runtime dependencies)
// as an alternative Gantt view, offered alongside Frappe Gantt below WeKan's
// own hand-rolled Gantt view in the Board View menu. It is a SINGLETON
// (`gantt` is one shared object, not a class instantiated per container,
// unlike Frappe Gantt), so it is destroyed on every re-render and on
// template destroy rather than merely cleared, or a second open would reuse
// state left over from the first.
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

// Turns a board's cards into DHTMLX Gantt's flat task list (its own shape:
// {id, text, start_date, duration, progress}, duration in whole days).
function cardsToTasks(cards) {
  const today = new Date();
  return cards
    .map(card => {
      const start = toISODate(card.startAt || card.receivedAt);
      if (!start) return null;
      let end = toISODate(card.dueAt || card.endAt);
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
      };
    })
    .filter(Boolean);
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
      if (!tasks.length) return;
      if (!templateInstance.ganttInitialized) {
        gantt.config.date_format = '%Y-%m-%d %H:%i';
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
