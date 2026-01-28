import { TAPi18n } from '/imports/i18n';
import { DatePicker } from '/client/lib/datepicker';
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
    const user = ReactiveCache.getCurrentUser();
    if (!user) {
      // For non-logged-in users, week of year is not shown
      return false;
    }
    return user.isShowWeekOfYear();
  },

  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(this.date.get(), dateFormat, true);
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
    const now = this.now.get();
    
    // Received date logic: if received date is after start, due, or end dates, it's overdue
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
  }

  showTitle() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(this.date.get(), dateFormat, true);
    return `${TAPi18n.__('card-received-on')} ${formattedDate}`;
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
    let classes = 'start-date ';
    const dueAt = this.data().getDue();
    const endAt = this.data().getEnd();
    const theDate = this.date.get();
    const now = this.now.get();
    
    // Start date logic: if start date is after due or end dates, it's overdue
    if ((endAt && isAfter(theDate, endAt)) || (dueAt && isAfter(theDate, dueAt))) {
      classes += 'overdue';
    } else if (isAfter(theDate, now)) {
      // Start date is in the future - not due yet
      classes += 'not-due';
    } else {
      // Start date is today or in the past - current/active
      classes += 'current';
    }
    return classes;
  }

  showTitle() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(this.date.get(), dateFormat, true);
    return `${TAPi18n.__('card-start-on')} ${formattedDate}`;
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
    let classes = 'due-date ';
    const endAt = this.data().getEnd();
    const theDate = this.date.get();
    const now = this.now.get();
    
    // If there's an end date and it's before the due date, task is completed early
    if (endAt && isBefore(endAt, theDate)) {
      classes += 'completed-early';
    }
    // If there's an end date, don't show due date status since task is completed
    else if (endAt) {
      classes += 'completed';
    }
    // Due date logic based on current time
    else {
      const daysDiff = diff(theDate, now, 'days');
      
      if (daysDiff < 0) {
        // Due date is in the past - overdue
        classes += 'overdue';
      } else if (daysDiff <= 1) {
        // Due today or tomorrow - due soon
        classes += 'due-soon';
      } else {
        // Due date is more than 1 day away - not due yet
        classes += 'not-due';
      }
    }
    
    return classes;
  }

  showTitle() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(this.date.get(), dateFormat, true);
    return `${TAPi18n.__('card-due-on')} ${formattedDate}`;
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
    let classes = 'end-date ';
    const dueAt = this.data().getDue();
    const theDate = this.date.get();
    
    if (!dueAt) {
      // No due date set - just show as completed
      classes += 'completed';
    } else if (isBefore(theDate, dueAt)) {
      // End date is before due date - completed early
      classes += 'completed-early';
    } else if (isAfter(theDate, dueAt)) {
      // End date is after due date - completed late
      classes += 'completed-late';
    } else {
      // End date equals due date - completed on time
      classes += 'completed-on-time';
    }
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
    const user = ReactiveCache.getCurrentUser();
    if (!user) {
      // For non-logged-in users, week of year is not shown
      return false;
    }
    return user.isShowWeekOfYear();
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
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    const formattedDate = formatDateByUserPreference(this.date.get(), dateFormat, true);
    return `${formattedDate}`;
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
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(this.date.get(), dateFormat, true);
  }
}.register('minicardReceivedDate'));

(class extends CardStartDate {
  template() {
    return 'minicardStartDate';
  }
  
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(this.date.get(), dateFormat, true);
  }
}.register('minicardStartDate'));

(class extends CardDueDate {
  template() {
    return 'minicardDueDate';
  }
  
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(this.date.get(), dateFormat, true);
  }
}.register('minicardDueDate'));

(class extends CardEndDate {
  template() {
    return 'minicardEndDate';
  }
  
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(this.date.get(), dateFormat, true);
  }
}.register('minicardEndDate'));

(class extends CardCustomFieldDate {
  template() {
    return 'minicardCustomFieldDate';
  }
  
  showDate() {
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(this.date.get(), dateFormat, true);
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
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(this.date.get(), dateFormat, true);
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
    const currentUser = ReactiveCache.getCurrentUser();
    const dateFormat = currentUser ? currentUser.getDateFormat() : 'YYYY-MM-DD';
    return formatDateByUserPreference(this.date.get(), dateFormat, true);
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
