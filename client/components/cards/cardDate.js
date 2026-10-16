import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';
import { currentUserWith } from '/client/lib/currentUserWith';
import {
  setupDatePicker,
  datePickerRendered,
  datePickerHelpers,
} from '/client/lib/datepicker';
import {
  formatDateTime,
  formatDate,
  formatTime,
  getISOWeek,
  isValidDate,
  isBefore,
  isAfter,
  isSame,
  add,
  subtract,
  startOf,
  endOf,
  format,
  parseDate,
  now,
  createDate,
  fromNow,
  calendar
} from '/imports/lib/dateUtils';
import { dueDateClass, dueCountdown } from '/client/lib/dueDateColor';
import { subscribeDateNowTicker } from '/client/lib/dateNowTicker';
import { formatDateForDisplay as formatCardDateForDisplay } from '/client/lib/dateDisplay';

// #2424: turn a due date's countdown into the badge's visible suffix, e.g.
// "Jun 15 (3 days left)" / "Jun 15 (2 days overdue)" / "Jun 15 (Due today)".
// Pure day-count math lives in dueCountdown() (client/lib/dueDateColor.js,
// shared with dueDateClass so the countdown and the badge colour always
// agree); this only turns its result into translated text.
function dueCountdownText(dueDate, nowVal) {
  const { key, days } = dueCountdown(dueDate, nowVal);
  if (key === 'due-today') {
    return TAPi18n.__('due-today');
  }
  return TAPi18n.__(key, { sprintf: [days] });
}

// --- DatePicker popups (edit date forms) ---

// editCardReceivedDatePopup
Template.editCardReceivedDatePopup.onCreated(function () {
  const card = Template.currentData();
  setupDatePicker(this, {
    defaultTime: formatDateTime(now()),
    initialDate: card.getReceived() ? card.getReceived() : undefined,
    storeDate(date, currentCard) {
      return currentCard.setReceived(date);
    },
    deleteDate(currentCard) {
      return currentCard.unsetReceived();
    },
  });
});

Template.editCardReceivedDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editCardReceivedDatePopup.helpers(datePickerHelpers());

// editCardStartDatePopup
Template.editCardStartDatePopup.onCreated(function () {
  const card = Template.currentData();
  setupDatePicker(this, {
    defaultTime: formatDateTime(now()),
    initialDate: card.getStart() ? card.getStart() : undefined,
    storeDate(date, currentCard) {
      return currentCard.setStart(date);
    },
    deleteDate(currentCard) {
      return currentCard.unsetStart();
    },
  });
});

Template.editCardStartDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editCardStartDatePopup.helpers(datePickerHelpers());

// editCardDueDatePopup
Template.editCardDueDatePopup.onCreated(function () {
  const card = Template.currentData();
  setupDatePicker(this, {
    defaultTime: '1970-01-01 17:00:00',
    initialDate: card.getDue() ? card.getDue() : undefined,
    storeDate(date, currentCard) {
      return currentCard.setDue(date);
    },
    deleteDate(currentCard) {
      return currentCard.unsetDue();
    },
  });
});

Template.editCardDueDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editCardDueDatePopup.helpers(datePickerHelpers());

// editCardEndDatePopup
Template.editCardEndDatePopup.onCreated(function () {
  const card = Template.currentData();
  setupDatePicker(this, {
    defaultTime: formatDateTime(now()),
    initialDate: card.getEnd() ? card.getEnd() : undefined,
    storeDate(date, currentCard) {
      return currentCard.setEnd(date);
    },
    deleteDate(currentCard) {
      return currentCard.unsetEnd();
    },
  });
});

Template.editCardEndDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editCardEndDatePopup.helpers(datePickerHelpers());

// --- Card date badge display helpers ---

// Passing named arguments to a Blaze inclusion replaces the included
// template's data context with the argument object. Card details passes
// `canModifyCard`, while minicards and Table view inherit the Card directly.
// Keep both call shapes explicit so reactive reruns never try Card methods on
// `{ card, canModifyCard }` (#6615).
function cardFromDateContext(data = Template.currentData()) {
  return data?.card || data;
}

// dateBadgeBody is a child template whose data is only display arguments. An
// event handled by the surrounding card/minicard date template therefore must
// open the popup with THAT surrounding template's Card, not with the event's
// `this`. The plus buttons do not need this because they already live directly
// in cardDetails with the Card as their data context.
function openDateEditor(name) {
  return function (event, templateInstance) {
    event.preventDefault();
    event.stopPropagation();
    Popup.open(name).call(
      cardFromDateContext(templateInstance.data),
      event,
      templateInstance,
    );
  };
}

// Shared onCreated logic for card date badge templates
function cardDateOnCreated(tpl) {
  tpl.date = new ReactiveVar();
  const dateNowTicker = subscribeDateNowTicker();
  tpl.now = dateNowTicker.now;
  tpl.view.onViewDestroyed(dateNowTicker.unsubscribe);
}

// Shared helpers for card date badge templates
function cardDateHelpers(extraHelpers) {
  const base = {
    showWeek() {
      return getISOWeek(Template.instance().date.get()).toString();
    },
    showWeekOfYear() {
      // #6745: one field, so a card open (a user write) leaves every date badge alone.
      const user = currentUserWith(['profile.showWeekOfYear']);
      if (!user) return window.localStorage.getItem('showWeekOfYear') === 'true';
      return user.isShowWeekOfYear();
    },
    showDate() {
      return formatCardDateForDisplay(Template.instance().date.get(), true);
    },
    showISODate() {
      return Template.instance().date.get().toISOString();
    },
  };
  return Object.assign(base, extraHelpers);
}

// The four card dates - Received, Start, Due, End - each drawn twice: in the
// opened card (card*Date) and on the minicard (minicard*Date). Both badges of a
// date read the same field, colour themselves the same way and open the same
// editor, so each date is described once here and both templates are built
// from it.
const CARD_DATE_KINDS = {
  Received: {
    read: card => card.getReceived(),
    editor: 'editCardReceivedDate',
    helpers: {
      classes() {
        const tpl = Template.instance();
        let classes = 'received-date ';
        const data = cardFromDateContext();
        const dueAt = data.getDue();
        const endAt = data.getEnd();
        const startAt = data.getStart();
        const theDate = tpl.date.get();

        if (
          (startAt && isAfter(theDate, startAt)) ||
          (endAt && isAfter(theDate, endAt)) ||
          (dueAt && isAfter(theDate, dueAt))
        ) {
          classes += 'overdue';
        } else {
          classes += 'not-due';
        }
        return classes;
      },
      showTitle() {
        const tpl = Template.instance();
        const formattedDate = formatCardDateForDisplay(tpl.date.get(), true);
        return `${TAPi18n.__('card-received-on')} ${formattedDate}`;
      },
    },
  },
  Start: {
    read: card => card.getStart(),
    editor: 'editCardStartDate',
    helpers: {
      classes() {
        const tpl = Template.instance();
        let classes = 'start-date ';
        const data = cardFromDateContext();
        const dueAt = data.getDue();
        const endAt = data.getEnd();
        const theDate = tpl.date.get();
        const nowVal = tpl.now.get();

        if ((endAt && isAfter(theDate, endAt)) || (dueAt && isAfter(theDate, dueAt))) {
          classes += 'overdue';
        } else if (isAfter(theDate, nowVal)) {
          classes += 'not-due';
        } else {
          classes += 'current';
        }
        return classes;
      },
      showTitle() {
        const tpl = Template.instance();
        const formattedDate = formatCardDateForDisplay(tpl.date.get(), true);
        return `${TAPi18n.__('card-start-on')} ${formattedDate}`;
      },
    },
  },
  // Only the due date counts down (dueCountdownText), and only until the card
  // has an end date.
  Due: {
    read: card => card.getDue(),
    editor: 'editCardDueDate',
    helpers: {
      classes() {
        const tpl = Template.instance();
        const data = cardFromDateContext();
        const endAt = data.getEnd();
        const theDate = tpl.date.get();
        const nowVal = tpl.now.get();

        return `due-date ${dueDateClass(theDate, nowVal, endAt)}`;
      },
      showTitle() {
        const tpl = Template.instance();
        const formattedDate = formatCardDateForDisplay(tpl.date.get(), true);
        const data = cardFromDateContext();
        const endAt = data.getEnd();
        const title = `${TAPi18n.__('card-due-on')} ${formattedDate}`;
        if (endAt) return title;
        return `${title} (${dueCountdownText(tpl.date.get(), tpl.now.get())})`;
      },
      showDate() {
        const tpl = Template.instance();
        const formattedDate = formatCardDateForDisplay(tpl.date.get(), true);
        const data = cardFromDateContext();
        const endAt = data.getEnd();
        if (endAt) return formattedDate;
        return `${formattedDate} (${dueCountdownText(tpl.date.get(), tpl.now.get())})`;
      },
    },
  },
  End: {
    read: card => card.getEnd(),
    editor: 'editCardEndDate',
    helpers: {
      classes() {
        const tpl = Template.instance();
        let classes = 'end-date ';
        const data = cardFromDateContext();
        const dueAt = data.getDue();
        const theDate = tpl.date.get();

        if (!dueAt) {
          classes += 'completed';
        } else if (isBefore(theDate, dueAt)) {
          classes += 'completed-early';
        } else if (isAfter(theDate, dueAt)) {
          classes += 'completed-late';
        } else {
          classes += 'completed-on-time';
        }
        return classes;
      },
      showTitle() {
        const tpl = Template.instance();
        return `${TAPi18n.__('card-end-on')} ${formatCardDateForDisplay(tpl.date.get(), true, date => format(date, 'LLLL'))}`;
      },
    },
  },
};

for (const [kind, spec] of Object.entries(CARD_DATE_KINDS)) {
  for (const name of [`card${kind}Date`, `minicard${kind}Date`]) {
    Template[name].onCreated(function () {
      cardDateOnCreated(this);
      this.autorun(() => {
        this.date.set(new Date(spec.read(cardFromDateContext())));
      });
    });
    Template[name].helpers(cardDateHelpers(spec.helpers));
    Template[name].events({
      'click .js-edit-date': openDateEditor(spec.editor),
    });
  }
}

// minicardCustomFieldDate
Template.minicardCustomFieldDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().value));
  });
});

Template.minicardCustomFieldDate.helpers(cardDateHelpers({
  showDate() {
    return formatCardDateForDisplay(Template.instance().date.get(), true);
  },
  showTitle() {
    const tpl = Template.instance();
    const formattedDate = formatCardDateForDisplay(tpl.date.get(), true);
    return `${formattedDate}`;
  },
  classes() {
    return 'customfield-date';
  },
}));

// --- Vote and Poker end date badge templates ---

// voteEndDate
Template.voteEndDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(cardFromDateContext().getVoteEnd()));
  });
});

Template.voteEndDate.helpers(cardDateHelpers({
  classes() {
    return 'end-date ';
  },
  showDate() {
    return formatCardDateForDisplay(Template.instance().date.get(), true);
  },
  showTitle() {
    const tpl = Template.instance();
    return `${TAPi18n.__('card-end-on')} ${formatCardDateForDisplay(tpl.date.get(), true, date => date.toLocaleString())}`;
  },
}));

Template.voteEndDate.events({
  'click .js-edit-date': openDateEditor('editVoteEndDate'),
});

// pokerEndDate
Template.pokerEndDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(cardFromDateContext().getPokerEnd()));
  });
});

Template.pokerEndDate.helpers(cardDateHelpers({
  classes() {
    return 'end-date ';
  },
  showDate() {
    return formatCardDateForDisplay(Template.instance().date.get(), true);
  },
  showTitle() {
    const tpl = Template.instance();
    return `${TAPi18n.__('card-end-on')} ${formatCardDateForDisplay(tpl.date.get(), true, date => format(date, 'LLLL'))}`;
  },
}));

Template.pokerEndDate.events({
  'click .js-edit-date': openDateEditor('editPokerEndDate'),
});
