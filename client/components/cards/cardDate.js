// Edit received, start, due & end dates
BlazeComponent.extendComponent({
  template() {
    return 'editCardDate';
  },

  onCreated() {
    this.error = new ReactiveVar('');
    this.card = this.data();
    this.date = new ReactiveVar(moment.invalid());
  },

  onRendered() {
    const $picker = this.$('.js-datepicker')
      .datepicker({
        todayHighlight: true,
        todayBtn: 'linked',
        language: TAPi18n.getLanguage(),
      })
      .on(
        'changeDate',
        function(evt) {
          this.find('#date').value = moment(evt.date).format('L');
          this.error.set('');
          this.find('#time').focus();
        }.bind(this),
      );

    if (this.date.get().isValid()) {
      $picker.datepicker('update', this.date.get().toDate());
    }
  },

  showDate() {
    if (this.date.get().isValid()) return this.date.get().format('L');
    return '';
  },
  showTime() {
    if (this.date.get().isValid()) return this.date.get().format('LT');
    return '';
  },
  dateFormat() {
    return moment.localeData().longDateFormat('L');
  },
  timeFormat() {
    return moment.localeData().longDateFormat('LT');
  },

  events() {
    return [
      {
        'keyup .js-date-field'() {
          // parse for localized date format in strict mode
          const dateMoment = moment(this.find('#date').value, 'L', true);
          if (dateMoment.isValid()) {
            this.error.set('');
            this.$('.js-datepicker').datepicker('update', dateMoment.toDate());
          }
        },
        'keyup .js-time-field'() {
          // parse for localized time format in strict mode
          const dateMoment = moment(this.find('#time').value, 'LT', true);
          if (dateMoment.isValid()) {
            this.error.set('');
          }
        },
        'submit .edit-date'(evt) {
          evt.preventDefault();

          // if no time was given, init with 12:00
          const time =
            evt.target.time.value ||
            moment(new Date().setHours(12, 0, 0)).format('LT');

          const dateString = `${evt.target.date.value} ${time}`;
          const newDate = moment(dateString, 'L LT', true);
          if (newDate.isValid()) {
            this._storeDate(newDate.toDate());
            Popup.close();
          } else {
            this.error.set('invalid-date');
            evt.target.date.focus();
          }
        },
        'click .js-delete-date'(evt) {
          evt.preventDefault();
          this._deleteDate();
          Popup.close();
        },
      },
    ];
  },
});

Template.dateBadge.helpers({
  canModifyCard() {
    return (
      Meteor.user() &&
      Meteor.user().isBoardMember() &&
      !Meteor.user().isCommentOnly() &&
      !Meteor.user().isWorker()
    );
  },
});

// editCardReceivedDatePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated(moment().format('YYYY-MM-DD HH:mm'));
    this.data().getReceived() &&
      this.date.set(moment(this.data().getReceived()));
  }

  _storeDate(date) {
    this.card.setReceived(date);
  }

  _deleteDate() {
    this.card.setReceived(null);
  }
}.register('editCardReceivedDatePopup'));

// editCardStartDatePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated(moment().format('YYYY-MM-DD HH:mm'));
    this.data().getStart() && this.date.set(moment(this.data().getStart()));
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
    this.card.setStart(date);
  }

  _deleteDate() {
    this.card.setStart(null);
  }
}.register('editCardStartDatePopup'));

// editCardDueDatePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated('1970-01-01 17:00:00');
    this.data().getDue() && this.date.set(moment(this.data().getDue()));
  }

  onRendered() {
    super.onRendered();
    if (moment.isDate(this.card.getStart())) {
      this.$('.js-datepicker').datepicker('setStartDate', this.card.getStart());
    }
  }

  _storeDate(date) {
    this.card.setDue(date);
  }

  _deleteDate() {
    this.card.setDue(null);
  }
}.register('editCardDueDatePopup'));

// editCardEndDatePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated(moment().format('YYYY-MM-DD HH:mm'));
    this.data().getEnd() && this.date.set(moment(this.data().getEnd()));
  }

  onRendered() {
    super.onRendered();
    if (moment.isDate(this.card.getStart())) {
      this.$('.js-datepicker').datepicker('setStartDate', this.card.getStart());
    }
  }

  _storeDate(date) {
    this.card.setEnd(date);
  }

  _deleteDate() {
    this.card.setEnd(null);
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
    self.now = ReactiveVar(moment());
    window.setInterval(() => {
      self.now.set(moment());
    }, 60000);
  },

  showDate() {
    // this will start working once mquandalle:moment
    // is updated to at least moment.js 2.10.5
    // until then, the date is displayed in the "L" format
    return this.date.get().calendar(null, {
      sameElse: 'llll',
    });
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
      self.date.set(moment(self.data().getReceived()));
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
    return `${TAPi18n.__('card-received-on')} ${this.date
      .get()
      .format('LLLL')}`;
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
      self.date.set(moment(self.data().getStart()));
    });
  }

  classes() {
    let classes = 'start-date' + ' ';
    const dueAt = this.data().getDue();
    const endAt = this.data().getEnd();
    const theDate = this.date.get();
    const now = this.now.get();
    // if dueAt or endAt exist & are > startAt, startAt doesn't need to be flagged
    if ((endAt && theDate.isAfter(endAt)) || (dueAt && theDate.isAfter(dueAt)))
      classes += 'long-overdue';
    else if (theDate.isBefore(now, 'minute')) classes += 'almost-due';
    else classes += 'current';
    return classes;
  }

  showTitle() {
    return `${TAPi18n.__('card-start-on')} ${this.date.get().format('LLLL')}`;
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
      self.date.set(moment(self.data().getDue()));
    });
  }

  classes() {
    let classes = 'due-date' + ' ';
    const endAt = this.data().getEnd();
    const theDate = this.date.get();
    const now = this.now.get();
    // if the due date is after the end date, green - done early
    if (endAt && theDate.isAfter(endAt)) classes += 'current';
    // if there is an end date, don't need to flag the due date
    else if (endAt) classes += '';
    else if (now.diff(theDate, 'days') >= 2) classes += 'long-overdue';
    else if (now.diff(theDate, 'minute') >= 0) classes += 'due';
    else if (now.diff(theDate, 'days') >= -1) classes += 'almost-due';
    return classes;
  }

  showTitle() {
    return `${TAPi18n.__('card-due-on')} ${this.date.get().format('LLLL')}`;
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
      self.date.set(moment(self.data().getEnd()));
    });
  }

  classes() {
    let classes = 'end-date' + ' ';
    const dueAt = this.data().getDue();
    const theDate = this.date.get();
    if (!dueAt) classes += '';
    else if (theDate.isBefore(dueAt)) classes += 'current';
    else if (theDate.isAfter(dueAt)) classes += 'due';
    return classes;
  }

  showTitle() {
    return `${TAPi18n.__('card-end-on')} ${this.date.get().format('LLLL')}`;
  }

  events() {
    return super.events().concat({
      'click .js-edit-date': Popup.open('editCardEndDate'),
    });
  }
}
CardEndDate.register('cardEndDate');

(class extends CardReceivedDate {
  showDate() {
    return this.date.get().format('l');
  }
}.register('minicardReceivedDate'));

(class extends CardStartDate {
  showDate() {
    return this.date.get().format('l');
  }
}.register('minicardStartDate'));

(class extends CardDueDate {
  showDate() {
    return this.date.get().format('l');
  }
}.register('minicardDueDate'));

(class extends CardEndDate {
  showDate() {
    return this.date.get().format('l');
  }
}.register('minicardEndDate'));

class VoteEndDate extends CardDate {
  onCreated() {
    super.onCreated();
    const self = this;
    self.autorun(() => {
      self.date.set(moment(self.data().getVoteEnd()));
    });
  }
  classes() {
    const classes = 'end-date' + ' ';
    return classes;
  }
  showDate() {
    return this.date.get().format('l LT');
  }
  showTitle() {
    return `${TAPi18n.__('card-end-on')} ${this.date.get().format('LLLL')}`;
  }

  events() {
    return super.events().concat({
      'click .js-edit-date': Popup.open('editVoteEndDate'),
    });
  }
}
VoteEndDate.register('voteEndDate');
