import { TAPi18n } from '/imports/i18n';
import { DatePicker } from '/client/lib/datepicker';
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
  calendar,
  diff
} from '/imports/lib/dateUtils';

// editCardReceivedDatePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated(formatDateTime(now()));
    this.data().getReceived() &&
      this.date.set(new Date(this.data().getReceived()));
  }

  _storeDate(date) {
    this.card.setReceived(formatDateTime(date));
  }

  _deleteDate() {
    this.card.unsetReceived();
  }
}.register('editCardReceivedDatePopup'));

// editCardStartDatePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated(formatDateTime(now()));
    this.data().getStart() && this.date.set(new Date(this.data().getStart()));
  }

  onRendered() {
    super.onRendered();
    if (moment.isDate(this.card.getReceived())) {
      this.$('.js-datepicker').datepicker(
        'setStartDate',
        this.card.getReceived(),
      );
    }
  }

  _storeDate(date) {
    this.card.setStart(formatDateTime(date));
  }

  _deleteDate() {
    this.card.unsetStart();
  }
}.register('editCardStartDatePopup'));

// editCardDueDatePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated('1970-01-01 17:00:00');
    this.data().getDue() && this.date.set(new Date(this.data().getDue()));
  }

  onRendered() {
    super.onRendered();
    if (moment.isDate(this.card.getStart())) {
      this.$('.js-datepicker').datepicker('setStartDate', this.card.getStart());
    }
  }

  _storeDate(date) {
    this.card.setDue(formatDateTime(date));
  }

  _deleteDate() {
    this.card.unsetDue();
  }
}.register('editCardDueDatePopup'));

// editCardEndDatePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated(formatDateTime(now()));
    this.data().getEnd() && this.date.set(new Date(this.data().getEnd()));
  }

  onRendered() {
    super.onRendered();
    if (moment.isDate(this.card.getStart())) {
      this.$('.js-datepicker').datepicker('setStartDate', this.card.getStart());
    }
  }

  _storeDate(date) {
    this.card.setEnd(formatDateTime(date));
  }

  _deleteDate() {
    this.card.unsetEnd();
  }
}.register('editCardEndDatePopup'));

// Display received, start, due & end dates
const CardDate = BlazeComponent.extendComponent({
  template() {
    return 'dateBadge';
  },

  onCreated() {
    const self = this;
    self.date = ReactiveVar();
    self.now = ReactiveVar(now());
    window.setInterval(() => {
      self.now.set(now());
    }, 60000);
  },

  showWeek() {
    return getISOWeek(this.date.get()).toString();
  },

  showWeekOfYear() {
    return ReactiveCache.getCurrentUser().isShowWeekOfYear();
  },

  showDate() {
    return calendar(this.date.get());
  },

  showISODate() {
    return this.date.get().toISOString();
  },
});

class CardReceivedDate extends CardDate {
  onCreated() {
    super.onCreated();
    const self = this;
    self.autorun(() => {
      self.date.set(new Date(self.data().getReceived()));
    });
  }

  classes() {
    let classes = 'received-date ';
    const dueAt = this.data().getDue();
    const endAt = this.data().getEnd();
    const startAt = this.data().getStart();
    const theDate = this.date.get();
    // if dueAt, endAt and startAt exist & are > receivedAt, receivedAt doesn't need to be flagged
    if (
      (startAt && theDate.isAfter(startAt)) ||
      (endAt && theDate.isAfter(endAt)) ||
      (dueAt && theDate.isAfter(dueAt))
    )
      classes += 'long-overdue';
    else classes += 'current';
    return classes;
  }

  showTitle() {
    return `${TAPi18n.__('card-received-on')} ${format(this.date.get(), 'LLLL')}`;
  }

  events() {
    return super.events().concat({
      'click .js-edit-date': Popup.open('editCardReceivedDate'),
    });
  }
}
CardReceivedDate.register('cardReceivedDate');

class CardStartDate extends CardDate {
  onCreated() {
    super.onCreated();
    const self = this;
    self.autorun(() => {
      self.date.set(new Date(self.data().getStart()));
    });
  }

  classes() {
    let classes = 'start-date' + ' ';
    const dueAt = this.data().getDue();
    const endAt = this.data().getEnd();
    const theDate = this.date.get();
    const now = this.now.get();
    // if dueAt or endAt exist & are > startAt, startAt doesn't need to be flagged
    if ((endAt && isAfter(theDate, endAt)) || (dueAt && isAfter(theDate, dueAt)))
      classes += 'long-overdue';
    else if (isAfter(theDate, now)) classes += '';
    else classes += 'current';
    return classes;
  }

  showTitle() {
    return `${TAPi18n.__('card-start-on')} ${format(this.date.get(), 'LLLL')}`;
  }

  events() {
    return super.events().concat({
      'click .js-edit-date': Popup.open('editCardStartDate'),
    });
  }
}
CardStartDate.register('cardStartDate');

class CardDueDate extends CardDate {
  onCreated() {
    super.onCreated();
    const self = this;
    self.autorun(() => {
      self.date.set(new Date(self.data().getDue()));
    });
  }

  classes() {
    let classes = 'due-date' + ' ';
    const endAt = this.data().getEnd();
    const theDate = this.date.get();
    const now = this.now.get();
    // if the due date is after the end date, green - done early
    if (endAt && isAfter(theDate, endAt)) classes += 'current';
    // if there is an end date, don't need to flag the due date
    else if (endAt) classes += '';
    else if (diff(now, theDate, 'days') >= 2) classes += 'long-overdue';
    else if (diff(now, theDate, 'minute') >= 0) classes += 'due';
    else if (diff(now, theDate, 'days') >= -1) classes += 'almost-due';
    return classes;
  }

  showTitle() {
    return `${TAPi18n.__('card-due-on')} ${format(this.date.get(), 'LLLL')}`;
  }

  events() {
    return super.events().concat({
      'click .js-edit-date': Popup.open('editCardDueDate'),
    });
  }
}
CardDueDate.register('cardDueDate');

class CardEndDate extends CardDate {
  onCreated() {
    super.onCreated();
    const self = this;
    self.autorun(() => {
      self.date.set(new Date(self.data().getEnd()));
    });
  }

  classes() {
    let classes = 'end-date' + ' ';
    const dueAt = this.data().getDue();
    const theDate = this.date.get();
    if (!dueAt) classes += '';
    else if (isBefore(theDate, dueAt)) classes += 'current';
    else if (isAfter(theDate, dueAt)) classes += 'due';
    return classes;
  }

  showTitle() {
    return `${TAPi18n.__('card-end-on')} ${format(this.date.get(), 'LLLL')}`;
  }

  events() {
    return super.events().concat({
      'click .js-edit-date': Popup.open('editCardEndDate'),
    });
  }
}
CardEndDate.register('cardEndDate');

class CardCustomFieldDate extends CardDate {
  template() {
    return 'dateCustomField';
  }

  onCreated() {
    super.onCreated();
    const self = this;
    self.autorun(() => {
      self.date.set(new Date(self.data().value));
    });
  }

  showWeek() {
    return getISOWeek(this.date.get()).toString();
  }

  showWeekOfYear() {
    return ReactiveCache.getCurrentUser().isShowWeekOfYear();
  }

  showDate() {
    // this will start working once mquandalle:moment
    // is updated to at least moment.js 2.10.5
    // until then, the date is displayed in the "L" format
    return this.date.get().calendar(null, {
      sameElse: 'llll',
    });
  }

  showTitle() {
    return `${format(this.date.get(), 'LLLL')}`;
  }

  classes() {
    return 'customfield-date';
  }

  events() {
    return [];
  }
}
CardCustomFieldDate.register('cardCustomFieldDate');

(class extends CardReceivedDate {
  template() {
    return 'minicardReceivedDate';
  }
  
  showDate() {
    return format(this.date.get(), 'L');
  }
}.register('minicardReceivedDate'));

(class extends CardStartDate {
  template() {
    return 'minicardStartDate';
  }
  
  showDate() {
    return format(this.date.get(), 'YYYY-MM-DD HH:mm');
  }
}.register('minicardStartDate'));

(class extends CardDueDate {
  template() {
    return 'minicardDueDate';
  }
  
  showDate() {
    return format(this.date.get(), 'YYYY-MM-DD HH:mm');
  }
}.register('minicardDueDate'));

(class extends CardEndDate {
  template() {
    return 'minicardEndDate';
  }
  
  showDate() {
    return format(this.date.get(), 'YYYY-MM-DD HH:mm');
  }
}.register('minicardEndDate'));

(class extends CardCustomFieldDate {
  template() {
    return 'minicardCustomFieldDate';
  }
  
  showDate() {
    return format(this.date.get(), 'L');
  }
}.register('minicardCustomFieldDate'));

class VoteEndDate extends CardDate {
  onCreated() {
    super.onCreated();
    const self = this;
    self.autorun(() => {
      self.date.set(new Date(self.data().getVoteEnd()));
    });
  }
  classes() {
    const classes = 'end-date' + ' ';
    return classes;
  }
  showDate() {
    return format(this.date.get(), 'L') + ' ' + format(this.date.get(), 'HH:mm');
  }
  showTitle() {
    return `${TAPi18n.__('card-end-on')} ${this.date.get().toLocaleString()}`;
  }

  events() {
    return super.events().concat({
      'click .js-edit-date': Popup.open('editVoteEndDate'),
    });
  }
}
VoteEndDate.register('voteEndDate');

class PokerEndDate extends CardDate {
  onCreated() {
    super.onCreated();
    const self = this;
    self.autorun(() => {
      self.date.set(new Date(self.data().getPokerEnd()));
    });
  }
  classes() {
    const classes = 'end-date' + ' ';
    return classes;
  }
  showDate() {
    return format(this.date.get(), 'l LT');
  }
  showTitle() {
    return `${TAPi18n.__('card-end-on')} ${format(this.date.get(), 'LLLL')}`;
  }

  events() {
    return super.events().concat({
      'click .js-edit-date': Popup.open('editPokerEndDate'),
    });
  }
}
PokerEndDate.register('pokerEndDate');
