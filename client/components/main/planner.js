import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import { formatDate, formatDateTime, formatTime } from '/imports/lib/dateUtils';
const {
  PLANNER_RANGES,
  normalizePlannerRange,
  cardIsPlannerRelevant,
  startsWithinDay,
} = require('/models/lib/plannerWork');

const SLOT_HOURS = [9, 13, 16];

function currentUserPlanning() {
  const user = ReactiveCache.getCurrentUser();
  return user?.profile || {};
}

function localInputValue(date) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function plannerCards(boardId = '') {
  const userId = Meteor.userId();
  return Cards.find({ archived: false, type: 'cardType-card' })
    .fetch()
    .filter(card =>
      cardIsPlannerRelevant(card, userId) &&
      (!boardId || card.boardId === boardId) &&
      !ReactiveCache.getBoard(card.boardId)?.personalInboxOwnerId)
    .map(card => {
      const board = ReactiveCache.getBoard(card.boardId);
      return {
        ...card,
        boardTitle: board?.title || '',
        dueLabel: card.dueAt ? formatDateTime(card.dueAt) : '',
        url: board ? `/b/${board._id}/${board.slug}/${card._id}` : '#',
      };
    });
}

function cardSlot(cardId) {
  return currentUserPlanning().plannerCardSlots?.[cardId] || null;
}

function buildPlannerDays(range, boardId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cards = plannerCards(boardId);
  const focusBlocks = currentUserPlanning().plannerFocusBlocks || [];
  return Array.from({ length: range }, (_, index) => {
    const day = new Date(today.getTime() + index * 24 * 60 * 60 * 1000);
    return {
      key: day.toISOString(),
      label: index === 0 ? TAPi18n.__('today') : formatDate(day),
      dateLabel: formatDate(day),
      focusBlocks: focusBlocks
        .filter(block => startsWithinDay(block.startsAt, day))
        .map(block => ({
          ...block,
          timeLabel: formatTime(block.startsAt),
        }))
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
      slots: SLOT_HOURS.map(hour => {
        const start = new Date(day);
        start.setHours(hour, 0, 0, 0);
        const scheduled = cards.filter(card => {
          const slot = cardSlot(card._id);
          return slot && new Date(slot.startsAt).getTime() === start.getTime();
        });
        return {
          startISO: start.toISOString(),
          timeLabel: formatTime(start),
          ariaLabel: `${formatDate(start)} ${formatTime(start)}`,
          cards: scheduled,
        };
      }),
    };
  });
}

Template.planner.onCreated(function () {
  this.draggedCardId = null;
  this.range = new ReactiveVar(3);
  this.boardId = new ReactiveVar('');
  this.status = new ReactiveVar('');
  this.subscribe('planner');
  Meteor.subscribe('setting');
});

Template.planner.helpers({
  rangeOptions() {
    const current = Template.instance().range.get();
    return PLANNER_RANGES.map(value => ({ value, active: value === current }));
  },
  rangeClass() {
    return `is-range-${Template.instance().range.get()}`;
  },
  plannerBoards() {
    const current = Template.instance().boardId.get();
    const seen = new Map();
    plannerCards().forEach(card => {
      const board = ReactiveCache.getBoard(card.boardId);
      if (board) seen.set(board._id, board);
    });
    return [...seen.values()]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map(board => ({ ...board, selected: board._id === current }));
  },
  focusDefaultStart() {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
    return localInputValue(start);
  },
  plannerDayRows() {
    const instance = Template.instance();
    return buildPlannerDays(instance.range.get(), instance.boardId.get());
  },
  unscheduledCards() {
    return plannerCards(Template.instance().boardId.get())
      .filter(card => !cardSlot(card._id));
  },
  hasUnscheduledCards() {
    return plannerCards(Template.instance().boardId.get())
      .some(card => !cardSlot(card._id));
  },
  statusMessage() {
    return Template.instance().status.get();
  },
});

Template.planner.events({
  'click .js-planner-range'(event, instance) {
    instance.range.set(normalizePlannerRange(event.currentTarget.dataset.range));
  },
  'change .js-planner-board'(event, instance) {
    instance.boardId.set(event.currentTarget.value || '');
  },
  async 'submit .js-planner-focus-form'(event, instance) {
    event.preventDefault();
    const startsAt = new Date(event.currentTarget.querySelector('.js-planner-focus-start').value);
    const payload = {
      title: event.currentTarget.querySelector('.js-planner-focus-title').value,
      startsAt,
      durationMinutes: Number(
        event.currentTarget.querySelector('.js-planner-focus-duration').value,
      ),
    };
    try {
      await Meteor.callAsync('planner.addFocusBlock', payload);
      event.currentTarget.querySelector('.js-planner-focus-title').value = '';
      instance.status.set(TAPi18n.__('planner-focus-added'));
    } catch (error) {
      instance.status.set(error.reason || error.error || TAPi18n.__('error-undefined'));
    }
  },
  async 'click .js-planner-remove-focus'(event, instance) {
    event.preventDefault();
    await Meteor.callAsync(
      'planner.removeFocusBlock',
      event.currentTarget.dataset.blockId,
    );
    instance.status.set(TAPi18n.__('planner-focus-removed'));
  },
  'dragstart .planner-card'(event, instance) {
    instance.draggedCardId = event.currentTarget.dataset.cardId || '';
    if (event.originalEvent && event.originalEvent.dataTransfer) {
      event.originalEvent.dataTransfer.effectAllowed = 'move';
      event.originalEvent.dataTransfer.setData(
        'text/plain',
        instance.draggedCardId,
      );
    }
  },
  'dragover .planner-time-slot'(event) {
    event.preventDefault();
    if (event.originalEvent && event.originalEvent.dataTransfer) {
      event.originalEvent.dataTransfer.dropEffect = 'move';
    }
  },
  async 'drop .planner-time-slot'(event, instance) {
    event.preventDefault();
    const transfer = event.originalEvent && event.originalEvent.dataTransfer;
    const cardId =
      (transfer && transfer.getData('text/plain')) || instance.draggedCardId;
    const startsAt = new Date(event.currentTarget.dataset.start);
    if (!cardId || Number.isNaN(startsAt.getTime())) return;
    try {
      await Meteor.callAsync('planner.assignCardSlot', cardId, startsAt, 60);
      instance.draggedCardId = null;
      instance.status.set(TAPi18n.__('planner-slot-saved'));
    } catch (error) {
      instance.status.set(error.reason || error.error || TAPi18n.__('error-undefined'));
    }
  },
  async 'click .js-planner-clear-slot'(event, instance) {
    event.preventDefault();
    event.stopPropagation();
    await Meteor.callAsync(
      'planner.clearCardSlot',
      event.currentTarget.dataset.cardId,
    );
    instance.status.set(TAPi18n.__('planner-slot-cleared'));
  },
  async 'click .js-planner-schedule-next'(event, instance) {
    event.preventDefault();
    event.stopPropagation();
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 1);
    startsAt.setHours(9, 0, 0, 0);
    try {
      await Meteor.callAsync(
        'planner.assignCardSlot',
        event.currentTarget.dataset.cardId,
        startsAt,
        60,
      );
      instance.status.set(TAPi18n.__('planner-slot-saved'));
    } catch (error) {
      instance.status.set(error.reason || error.error || TAPi18n.__('error-undefined'));
    }
  },
});
