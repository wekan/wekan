import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';
import {
  setupDatePicker,
  datePickerRendered,
  datePickerHelpers,
  datePickerEvents,
} from '/client/lib/datepicker';
import {
  formatDateTime,
  formatDate,
  formatDateByUserPreference,
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
  calendar,
  diff
} from '/imports/lib/dateUtils';

// --- DatePicker popups (edit date forms) ---

// editCardReceivedDatePopup
Template.editCardReceivedDatePopup.onCreated(function () {
  const card = Template.currentData();
  setupDatePicker(this, {
    defaultTime: formatDateTime(now()),
    initialDate: card.getReceived() ? card.getReceived() : undefined,
  });
});

Template.editCardReceivedDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editCardReceivedDatePopup.helpers(datePickerHelpers());

Template.editCardReceivedDatePopup.events(datePickerEvents({
  storeDate(date) {
    this.datePicker.card.setReceived(date);
  },
  deleteDate() {
    this.datePicker.card.unsetReceived();
  },
}));

// editCardStartDatePopup
Template.editCardStartDatePopup.onCreated(function () {
  const card = Template.currentData();
  setupDatePicker(this, {
    defaultTime: formatDateTime(now()),
    initialDate: card.getStart() ? card.getStart() : undefined,
  });
});

Template.editCardStartDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editCardStartDatePopup.helpers(datePickerHelpers());

Template.editCardStartDatePopup.events(datePickerEvents({
  storeDate(date) {
    this.datePicker.card.setStart(date);
  },
  deleteDate() {
    this.datePicker.card.unsetStart();
  },
}));

// editCardDueDatePopup
Template.editCardDueDatePopup.onCreated(function () {
  const card = Template.currentData();
  setupDatePicker(this, {
    defaultTime: '1970-01-01 17:00:00',
    initialDate: card.getDue() ? card.getDue() : undefined,
  });
});

Template.editCardDueDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editCardDueDatePopup.helpers(datePickerHelpers());

Template.editCardDueDatePopup.events(datePickerEvents({
  storeDate(date) {
    this.datePicker.card.setDue(date);
  },
  deleteDate() {
    this.datePicker.card.unsetDue();
  },
}));

// editCardEndDatePopup
Template.editCardEndDatePopup.onCreated(function () {
  const card = Template.currentData();
  setupDatePicker(this, {
    defaultTime: formatDateTime(now()),
    initialDate: card.getEnd() ? card.getEnd() : undefined,
  });
});

Template.editCardEndDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editCardEndDatePopup.helpers(datePickerHelpers());

Template.editCardEndDatePopup.events(datePickerEvents({
  storeDate(date) {
    this.datePicker.card.setEnd(date);
  },
  deleteDate() {
    this.datePicker.card.unsetEnd();
  },
}));

// --- Card date badge display helpers ---

// Shared onCreated logic for card date badge templates
function cardDateOnCreated(tpl) {
  tpl.date = new ReactiveVar();
  tpl.now = new ReactiveVar(now());
  window.setInterval(() => {
    tpl.now.set(now());
  }, 60000);
}

// Shared helpers for card date badge templates
function cardDateHelpers(extraHelpers) {
  const base = {
    showWeek() {
      return getISOWeek(Template.instance().date.get()).toString();
    },
    showWeekOfYear() {
      const user = ReactiveCache.getCurrentUser();
      if (!user) {
        return false;
      }
      return user.isShowWeekOfYear();
    },
    showDate() {
      const currentUser = ReactiveCache.getCurrentUser();
      const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
      return formatDateByUserPreference(Template.instance().date.get(), dateFormat, true);
    },
    showISODate() {
      return Template.instance().date.get().toISOString();
    },
  };
  return Object.assign(base, extraHelpers);
}

// cardReceivedDate
Template.cardReceivedDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().getReceived()));
  });
});

Template.cardReceivedDate.helpers(cardDateHelpers({
  classes() {
    const tpl = Template.instance();
    let classes = 'received-date ';
    const data = Template.currentData();
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
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(tpl.date.get(), dateFormat, true);
    return `${TAPi18n.__('card-received-on')} ${formattedDate}`;
  },
}));

Template.cardReceivedDate.events({
  'click .js-edit-date': Popup.open('editCardReceivedDate'),
});

// cardStartDate
Template.cardStartDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().getStart()));
  });
});

Template.cardStartDate.helpers(cardDateHelpers({
  classes() {
    const tpl = Template.instance();
    let classes = 'start-date ';
    const data = Template.currentData();
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
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(tpl.date.get(), dateFormat, true);
    return `${TAPi18n.__('card-start-on')} ${formattedDate}`;
  },
}));

Template.cardStartDate.events({
  'click .js-edit-date': Popup.open('editCardStartDate'),
});

// cardDueDate
Template.cardDueDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().getDue()));
  });
});

Template.cardDueDate.helpers(cardDateHelpers({
  classes() {
    const tpl = Template.instance();
    let classes = 'due-date ';
    const data = Template.currentData();
    const endAt = data.getEnd();
    const theDate = tpl.date.get();
    const nowVal = tpl.now.get();

    if (endAt && isBefore(endAt, theDate)) {
      classes += 'completed-early';
    } else if (endAt) {
      classes += 'completed';
    } else {
      const daysDiff = diff(theDate, nowVal, 'days');

      if (daysDiff < 0) {
        classes += 'overdue';
      } else if (daysDiff <= 1) {
        classes += 'due-soon';
      } else {
        classes += 'not-due';
      }
    }

    return classes;
  },
  showTitle() {
    const tpl = Template.instance();
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(tpl.date.get(), dateFormat, true);
    return `${TAPi18n.__('card-due-on')} ${formattedDate}`;
  },
}));

Template.cardDueDate.events({
  'click .js-edit-date': Popup.open('editCardDueDate'),
});

// cardEndDate
Template.cardEndDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().getEnd()));
  });
});

Template.cardEndDate.helpers(cardDateHelpers({
  classes() {
    const tpl = Template.instance();
    let classes = 'end-date ';
    const data = Template.currentData();
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
    return `${TAPi18n.__('card-end-on')} ${format(tpl.date.get(), 'LLLL')}`;
  },
}));

Template.cardEndDate.events({
  'click .js-edit-date': Popup.open('editCardEndDate'),
});

// cardCustomFieldDate
Template.cardCustomFieldDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().value));
  });
});

Template.cardCustomFieldDate.helpers(cardDateHelpers({
  showDate() {
    const tpl = Template.instance();
    // this will start working once mquandalle:moment
    // is updated to at least moment.js 2.10.5
    // until then, the date is displayed in the "L" format
    return tpl.date.get().calendar(null, {
      sameElse: 'llll',
    });
  },
  showTitle() {
    const tpl = Template.instance();
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(tpl.date.get(), dateFormat, true);
    return `${formattedDate}`;
  },
  classes() {
    return 'customfield-date';
  },
}));

// --- Minicard date templates ---

// minicardReceivedDate
Template.minicardReceivedDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().getReceived()));
  });
});

Template.minicardReceivedDate.helpers(cardDateHelpers({
  classes() {
    const tpl = Template.instance();
    let classes = 'received-date ';
    const data = Template.currentData();
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
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(tpl.date.get(), dateFormat, true);
    return `${TAPi18n.__('card-received-on')} ${formattedDate}`;
  },
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(Template.instance().date.get(), dateFormat, true);
  },
}));

Template.minicardReceivedDate.events({
  'click .js-edit-date': Popup.open('editCardReceivedDate'),
});

// minicardStartDate
Template.minicardStartDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().getStart()));
  });
});

Template.minicardStartDate.helpers(cardDateHelpers({
  classes() {
    const tpl = Template.instance();
    let classes = 'start-date ';
    const data = Template.currentData();
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
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(tpl.date.get(), dateFormat, true);
    return `${TAPi18n.__('card-start-on')} ${formattedDate}`;
  },
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(Template.instance().date.get(), dateFormat, true);
  },
}));

Template.minicardStartDate.events({
  'click .js-edit-date': Popup.open('editCardStartDate'),
});

// minicardDueDate
Template.minicardDueDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().getDue()));
  });
});

Template.minicardDueDate.helpers(cardDateHelpers({
  classes() {
    const tpl = Template.instance();
    let classes = 'due-date ';
    const data = Template.currentData();
    const endAt = data.getEnd();
    const theDate = tpl.date.get();
    const nowVal = tpl.now.get();

    if (endAt && isBefore(endAt, theDate)) {
      classes += 'completed-early';
    } else if (endAt) {
      classes += 'completed';
    } else {
      const daysDiff = diff(theDate, nowVal, 'days');

      if (daysDiff < 0) {
        classes += 'overdue';
      } else if (daysDiff <= 1) {
        classes += 'due-soon';
      } else {
        classes += 'not-due';
      }
    }

    return classes;
  },
  showTitle() {
    const tpl = Template.instance();
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(tpl.date.get(), dateFormat, true);
    return `${TAPi18n.__('card-due-on')} ${formattedDate}`;
  },
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(Template.instance().date.get(), dateFormat, true);
  },
}));

Template.minicardDueDate.events({
  'click .js-edit-date': Popup.open('editCardDueDate'),
});

// minicardEndDate
Template.minicardEndDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().getEnd()));
  });
});

Template.minicardEndDate.helpers(cardDateHelpers({
  classes() {
    const tpl = Template.instance();
    let classes = 'end-date ';
    const data = Template.currentData();
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
    return `${TAPi18n.__('card-end-on')} ${format(tpl.date.get(), 'LLLL')}`;
  },
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(Template.instance().date.get(), dateFormat, true);
  },
}));

Template.minicardEndDate.events({
  'click .js-edit-date': Popup.open('editCardEndDate'),
});

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
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(Template.instance().date.get(), dateFormat, true);
  },
  showTitle() {
    const tpl = Template.instance();
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(tpl.date.get(), dateFormat, true);
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
    self.date.set(new Date(Template.currentData().getVoteEnd()));
  });
});

Template.voteEndDate.helpers(cardDateHelpers({
  classes() {
    return 'end-date ';
  },
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(Template.instance().date.get(), dateFormat, true);
  },
  showTitle() {
    const tpl = Template.instance();
    return `${TAPi18n.__('card-end-on')} ${tpl.date.get().toLocaleString()}`;
  },
}));

Template.voteEndDate.events({
  'click .js-edit-date': Popup.open('editVoteEndDate'),
});

// pokerEndDate
Template.pokerEndDate.onCreated(function () {
  cardDateOnCreated(this);
  const self = this;
  self.autorun(() => {
    self.date.set(new Date(Template.currentData().getPokerEnd()));
  });
});

Template.pokerEndDate.helpers(cardDateHelpers({
  classes() {
    return 'end-date ';
  },
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(Template.instance().date.get(), dateFormat, true);
  },
  showTitle() {
    const tpl = Template.instance();
    return `${TAPi18n.__('card-end-on')} ${format(tpl.date.get(), 'LLLL')}`;
  },
}));

Template.pokerEndDate.events({
  'click .js-edit-date': Popup.open('editPokerEndDate'),
});
