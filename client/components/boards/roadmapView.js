import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
import Cards from '/models/cards';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
// Reuse Frappe Gantt's dynamic-import loader, task mapping and popup-detail
// HTML verbatim - a Roadmap row IS a Frappe Gantt chart, just scoped to the
// cards that share one custom-field value, so this deliberately does not
// re-implement any of the timeline-rendering code the Gantt board view
// already has (see client/components/gantt/frappeGantt.js).
import { loadGanttLib, cardsToTasks, popupDetailsHtml } from '/client/components/gantt/frappeGantt.js';
const {
  computeCardsByCustomFieldGroup,
  translateGroupLabel,
} = require('/models/lib/chartCalculations');

// Board view "Roadmap" (#627: "a Roadmap view organizing/summarizing cards
// by version or release milestone in a timeline layout, similar in spirit
// to a ProductPlan-style release roadmap chart"). Structurally this is the
// Frappe Gantt view (client/components/gantt/frappeGantt.js) grouped by the
// VALUE of a board custom field (a "Version"/"Release"-style text or
// dropdown field) instead of one flat list of cards: one row/lane per
// distinct value, each row its own small Frappe Gantt timeline built from
// the SAME cardsToTasks()/loadGanttLib() the plain Gantt views use, plotted
// over the same startAt/dueAt/endAt card dates. A board with no custom
// fields yet gets a clear empty-state message instead of a chart, since a
// "Version"-style field is what this view needs to have something to group
// by - custom fields themselves are already fully managed in Board Settings,
// so this view only ever consumes them, never creates or edits them.
Template.roadmapView.onCreated(function() {
  const self = this;
  self.selectedFieldId = new ReactiveVar(null);
  self._ganttInstances = {};
  self._defaultApplied = false;
});

Template.roadmapView.onDestroyed(function() {
  this._ganttInstances = {};
});

Template.roadmapView.events({
  'change .js-roadmap-field-select'(event, template) {
    template.selectedFieldId.set(event.currentTarget.value);
  },
  // See statsView.js/groupByAssigneeView.js: stop the board canvas's
  // drag-to-scroll from swallowing the pointer/touch events that native
  // text selection and the field-picker <select> need.
  'mousedown .roadmap-view'(event) {
    event.stopPropagation();
  },
  'touchstart .roadmap-view'(event) {
    event.stopPropagation();
  },
});

Template.roadmapView.helpers({
  customFieldOptions() {
    const board = Utils.getCurrentBoard();
    if (!board) return [];
    const fields = ReactiveCache.getCustomFields(
      { boardIds: { $in: [board._id] }, type: { $in: ['text', 'dropdown'] } },
      { sort: { name: 1 } },
    ) || [];
    const template = Template.instance();
    if (fields.length && !template._defaultApplied) {
      template._defaultApplied = true;
      template.selectedFieldId.set(fields[0]._id);
    }
    return fields;
  },
  hasCustomFields() {
    const board = Utils.getCurrentBoard();
    if (!board) return false;
    const fields = ReactiveCache.getCustomFields(
      { boardIds: { $in: [board._id] }, type: { $in: ['text', 'dropdown'] } },
    ) || [];
    return fields.length > 0;
  },
  isSelected(fieldId) {
    return Template.instance().selectedFieldId.get() === fieldId ? 'selected' : '';
  },
  hasGroups() {
    const groups = Template.instance().groups ? Template.instance().groups.get() : null;
    return !!(groups && groups.length);
  },
  groups() {
    const template = Template.instance();
    return (template.groups && template.groups.get()) || [];
  },
});

Template.roadmapView.onRendered(function() {
  const templateInstance = this;
  templateInstance.groups = new ReactiveVar([]);

  templateInstance.autorun(() => {
    const board = Utils.getCurrentBoard();
    const fieldId = templateInstance.selectedFieldId.get();
    if (!board || !fieldId) {
      templateInstance.groups.set([]);
      return;
    }
    const cards = Cards.find(
      { boardId: board._id },
      { sort: { startAt: 1, dueAt: 1 } },
    ).fetch();
    const resolveValue = card => {
      const entries = typeof card.customFieldsWD === 'function' ? card.customFieldsWD() : [];
      const entry = (entries || []).find(cf => cf._id === fieldId);
      return entry && entry.trueValue ? entry.trueValue : null;
    };
    const groups = computeCardsByCustomFieldGroup(cards, resolveValue).map(group => ({
      key: group.key,
      label: translateGroupLabel(group.label, key => TAPi18n.__(key)),
      cards: group.cards,
    }));
    templateInstance.groups.set(groups);
  });

  // Renders one small Frappe Gantt chart per group row, after Blaze has
  // painted the `.js-roadmap-gantt-container` elements the `groups` helper
  // above produced - same dynamic-import + task list Frappe Gantt itself
  // uses (see frappeGantt.js onRendered), just called once per row instead
  // of once for the whole board.
  templateInstance.autorun(() => {
    const groups = templateInstance.groups.get();
    Tracker.afterFlush(() => {
      if (templateInstance.view.isDestroyed) return;
      const board = Utils.getCurrentBoard();
      const readonly = !board || !Utils.currentUserCan('write', board);
      loadGanttLib().then(GanttLib => {
        if (templateInstance.view.isDestroyed) return;
        const seenKeys = new Set();
        groups.forEach(group => {
          seenKeys.add(group.key);
          const container = templateInstance.find(
            `.js-roadmap-gantt-container[data-group-key="${group.key}"]`,
          );
          if (!container) return;
          const tasks = cardsToTasks(group.cards);
          container.innerHTML = '';
          if (!tasks.length) return;
          // eslint-disable-next-line no-new -- the instance manages its own
          // DOM, like frappeGantt.js's own chart instance.
          new GanttLib(container, tasks, {
            view_mode: 'Week',
            readonly_dates: readonly,
            readonly_progress: true,
            view_mode_select: false,
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
        Object.keys(templateInstance._ganttInstances || {}).forEach(key => {
          if (!seenKeys.has(key)) delete templateInstance._ganttInstances[key];
        });
      }).catch(error => {
        console.error('Could not load Frappe Gantt for Roadmap view:', error);
      });
    });
  });
});
