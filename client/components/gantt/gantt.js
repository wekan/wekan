// Add click handler to ganttView for card titles
Template.ganttView.events({
  'click .js-gantt-card-title'(event, template) {
    event.preventDefault();
    // Get card ID from the closest row's data attribute
    const $row = template.$(event.currentTarget).closest('tr');
    const cardId = $row.data('card-id');

    if (cardId) {
      template.selectedCardId.set(cardId);
    }
  },
});
import { Template } from 'meteor/templating';

// Blaze template helpers for ganttView
function getISOWeekInfo(d) {
	const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	const dayNum = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
	const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
	return { year: date.getUTCFullYear(), week };
}
function startOfISOWeek(d) {
	const date = new Date(d);
	const day = date.getDay() || 7;
	if (day !== 1) date.setDate(date.getDate() - (day - 1));
	date.setHours(0,0,0,0);
	return date;
}

Template.ganttView.helpers({
	weeks() {
		const board = Utils.getCurrentBoard();
		if (!board) return [];
		const cards = Cards.find({ boardId: board._id }, { sort: { startAt: 1, dueAt: 1 } }).fetch();
		const weeksMap = new Map();
		const relevantCards = cards.filter(c => c.receivedAt || c.startAt || c.dueAt || c.endAt);
		relevantCards.forEach(card => {
			['receivedAt','startAt','dueAt','endAt'].forEach(field => {
				if (card[field]) {
					const dt = new Date(card[field]);
					const info = getISOWeekInfo(dt);
					const key = `${info.year}-W${info.week}`;
					if (!weeksMap.has(key)) {
						weeksMap.set(key, { year: info.year, week: info.week, start: startOfISOWeek(dt) });
					}
				}
			});
		});
		return Array.from(weeksMap.values()).sort((a,b) => a.start - b.start);
	},
	weekDays(week) {
		const weekStart = new Date(week.start);
		return Array.from({length:7}, (_,i) => {
			const d = new Date(weekStart);
			d.setDate(d.getDate() + i);
			d.setHours(0,0,0,0);
			return d;
		});
	},
	weekdayLabel(day) {
		const weekdayKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
		return TAPi18n.__(weekdayKeys[day.getDay() === 0 ? 6 : day.getDay() - 1]);
	},
	formattedDate(day) {
		const currentUser = ReactiveCache.getCurrentUser && ReactiveCache.getCurrentUser();
		const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
		return formatDateByUserPreference(day, dateFormat, false);
	},
	cardsInWeek(week) {
		const board = Utils.getCurrentBoard();
		if (!board) return [];
		const cards = Cards.find({ boardId: board._id }).fetch();
		return cards.filter(card => {
			return ['receivedAt','startAt','dueAt','endAt'].some(field => {
				if (card[field]) {
					const dt = new Date(card[field]);
					const info = getISOWeekInfo(dt);
					return info.week === week.week && info.year === week.year;
				}
				return false;
			});
		});
	},
	cardTitle(card) {
		return card.title;
	},
	cardId(card) {
		return card._id;
	},
	cardUrl(card) {
		if (!card) return '#';
		const board = ReactiveCache.getBoard(card.boardId);
		if (!board) return '#';
		return FlowRouter.path('card', {
			boardId: card.boardId,
			slug: board.slug,
			cardId: card._id,
		});
	},
	 cellContentClass(card, day) {
		 const cardDates = {
			 receivedAt: card.receivedAt ? new Date(card.receivedAt) : null,
			 startAt: card.startAt ? new Date(card.startAt) : null,
			 dueAt: card.dueAt ? new Date(card.dueAt) : null,
			 endAt: card.endAt ? new Date(card.endAt) : null,
		 };
		 if (cardDates.receivedAt && cardDates.receivedAt.toDateString() === day.toDateString()) return 'ganttview-received';
		 if (cardDates.startAt && cardDates.startAt.toDateString() === day.toDateString()) return 'ganttview-start';
		 if (cardDates.dueAt && cardDates.dueAt.toDateString() === day.toDateString()) return 'ganttview-due';
		 if (cardDates.endAt && cardDates.endAt.toDateString() === day.toDateString()) return 'ganttview-end';
		 return '';
	 },
	 cellContent(card, day) {
		 const cardDates = {
			 receivedAt: card.receivedAt ? new Date(card.receivedAt) : null,
			 startAt: card.startAt ? new Date(card.startAt) : null,
			 dueAt: card.dueAt ? new Date(card.dueAt) : null,
			 endAt: card.endAt ? new Date(card.endAt) : null,
		 };
		 if (cardDates.receivedAt && cardDates.receivedAt.toDateString() === day.toDateString()) return '📥';
		 if (cardDates.startAt && cardDates.startAt.toDateString() === day.toDateString()) return '🚀';
		 if (cardDates.dueAt && cardDates.dueAt.toDateString() === day.toDateString()) return '⏰';
		 if (cardDates.endAt && cardDates.endAt.toDateString() === day.toDateString()) return '🏁';
		 return '';
	 },
	isToday(day) {
		const today = new Date();
		return day.toDateString() === today.toDateString();
	},
	isWeekend(day) {
		const idx = day.getDay();
		return idx === 0 || idx === 6;
	},
	hasSelectedCard() {
		return Template.instance().selectedCardId.get() !== null;
	},
	selectedCard() {
		const cardId = Template.instance().selectedCardId.get();
		return cardId ? ReactiveCache.getCard(cardId) : null;
	},
	cellClasses(card, day) {
		// Get the base class from cellContentClass logic
		const cardDates = {
			receivedAt: card.receivedAt ? new Date(card.receivedAt) : null,
			startAt: card.startAt ? new Date(card.startAt) : null,
			dueAt: card.dueAt ? new Date(card.dueAt) : null,
			endAt: card.endAt ? new Date(card.endAt) : null,
		};
		let classes = '';
		if (cardDates.receivedAt && cardDates.receivedAt.toDateString() === day.toDateString()) classes = 'ganttview-received';
		else if (cardDates.startAt && cardDates.startAt.toDateString() === day.toDateString()) classes = 'ganttview-start';
		else if (cardDates.dueAt && cardDates.dueAt.toDateString() === day.toDateString()) classes = 'ganttview-due';
		else if (cardDates.endAt && cardDates.endAt.toDateString() === day.toDateString()) classes = 'ganttview-end';

		// Add conditional classes
		const today = new Date();
		if (day.toDateString() === today.toDateString()) classes += ' ganttview-today';
		const idx = day.getDay();
		if (idx === 0 || idx === 6) classes += ' ganttview-weekend';
		if (classes.trim()) classes += ' js-gantt-date-icon';

		return classes.trim();
	}
});

Template.ganttView.onCreated(function() {
	this.selectedCardId = new ReactiveVar(null);
	// Provide properties expected by cardDetails component
	this.showOverlay = new ReactiveVar(false);
	this.mouseHasEnterCardDetails = false;
});

// Blaze onRendered logic for ganttView
Template.ganttView.onRendered(function() {
	const self = this;
	this.autorun(() => {
		// If you have legacy imperative rendering, keep it here
		if (typeof renderGanttChart === 'function') {
			renderGanttChart();
		}
	});
	// Add click handler for date cells (Received, Start, Due, End)
	this.$('.gantt-table').on('click', '.js-gantt-date-icon', function(e) {
		e.preventDefault();
		e.stopPropagation();
		const $cell = self.$(this);
		const cardId = $cell.data('card-id');
		let dateType = $cell.data('date-type');
		// Remove 'ganttview-' prefix to match popup map
		if (typeof dateType === 'string' && dateType.startsWith('ganttview-')) {
			dateType = dateType.replace('ganttview-', '');
		}
		const popupMap = {
			received: 'editCardReceivedDate',
			start: 'editCardStartDate',
			due: 'editCardDueDate',
			end: 'editCardEndDate',
		};
		const popupName = popupMap[dateType];
		if (!popupName || typeof Popup === 'undefined' || typeof Popup.open !== 'function') return;
		const card = ReactiveCache.getCard(cardId);
		if (!card) return;
		const openFn = Popup.open(popupName);
		openFn.call({ currentData: () => card }, e, { dataContextIfCurrentDataIsUndefined: card });
	});

});

import markdownit from 'markdown-it';
import { TAPi18n } from '/imports/i18n';
import { formatDateByUserPreference } from '/imports/lib/dateUtils';
import { ReactiveCache } from '/imports/reactiveCache';

const md = markdownit({ breaks: true, linkify: true });
