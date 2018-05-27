// Edit start & due dates
const EditCardDate = BlazeComponent.extendComponent({
  template() {
    return 'editCardDate';
  },

  onCreated() {
    this.error = new ReactiveVar('');
    this.card = this.data();
    this.date = new ReactiveVar(moment.invalid());
  },

  onRendered() {
    const $picker = this.$('.js-datepicker').datepicker({
      todayHighlight: true,
      todayBtn: 'linked',
      language: TAPi18n.getLanguage(),
      weekStart: 1
    }).on('changeDate', function(evt) {
      this.find('#date').value = moment(evt.date).format(Features.opinions.dates.formats.date);
      this.error.set('');
      this.find('#time').focus();
    }.bind(this));

    if (this.date.get().isValid()) {
      $picker.datepicker('update', this.date.get().toDate());
    }
  },

  showDate() {
    if (this.date.get().isValid())
      return this.date.get().format(Features.opinions.dates.formats.date);
    return '';
  },
  showTime() {
    if (this.date.get().isValid())
      return this.date.get().format(Features.opinions.dates.formats.time);
    return '';
  },
  dateFormat() {
    return moment.localeData().longDateFormat(Features.opinions.dates.formats.date);
  },
  timeFormat() {
    return moment.localeData().longDateFormat(Features.opinions.dates.formats.time);
  },

  events() {
    return [{
      'keyup .js-date-field'() {
        // parse for localized date format in strict mode
        const dateMoment = moment(this.find('#date').value, Features.opinions.dates.formats.date, true);
        if (dateMoment.isValid()) {
          this.error.set('');
          this.$('.js-datepicker').datepicker('update', dateMoment.toDate());
        }
      },
      'keyup .js-time-field'() {
        // parse for localized time format in strict mode
        const dateMoment = moment(this.find('#time').value, Features.opinions.dates.formats.time, true);
        if (dateMoment.isValid()) {
          this.error.set('');
        }
      },
      'submit .edit-date'(evt) {
        evt.preventDefault();

        // if no time was given, init with 12:00
        const time = evt.target.time.value || moment(new Date().setHours(12, 0, 0)).format(Features.opinions.dates.formats.time);

        const dateString = `${evt.target.date.value} ${time}`;
        const newDate = moment(dateString, `${Features.opinions.dates.formats.date} ${Features.opinions.dates.formats.time}`, true);
        if (newDate.isValid()) {
          this._storeDate(newDate.toDate());
          Popup.close();
        }
        else {
          this.error.set('invalid-date');
          evt.target.date.focus();
        }
      },
      'click .js-delete-date'(evt) {
        evt.preventDefault();
        this._deleteDate();
        Popup.close();
      },
    }];
  },
});

Template.dateBadge.helpers({
  canModifyCard() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  },
});

// editCardStartDatePopup
(class extends EditCardDate {
  onCreated() {
    super.onCreated();
    this.data().startAt && this.date.set(moment(this.data().startAt));
  }

  _storeDate(date) {
    this.card.setStart(date);
  }

  _deleteDate() {
    this.card.unsetStart();
  }
}).register('editCardStartDatePopup');

// editCardDueDatePopup
(class extends EditCardDate {
  onCreated() {
    super.onCreated();
    this.data().dueAt && this.date.set(moment(this.data().dueAt));
  }

  onRendered() {
    super.onRendered();
    if (moment.isDate(this.card.startAt)) {
      this.$('.js-datepicker').datepicker('setStartDate', this.card.startAt);
    }
  }

  _storeDate(date) {
    this.card.setDue(date);
  }

  _deleteDate() {
    this.card.unsetDue();
  }
}).register('editCardDueDatePopup');


// Display start & due dates
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
    // return this.date.get().calendar(null, {
    //   sameElse: 'llll',
    // });

    this.date.get().format(Features.opinions.dates.formats.date);
  },

  showISODate() {
    return this.date.get().toISOString();
  },
});

class CardStartDate extends CardDate {
  onCreated() {
    super.onCreated();
    const self = this;
    self.autorun(() => {
      self.date.set(moment(self.data().startAt));
    });
  }

  classes() {
    let classes = 'start-date' + ' ';
    if (this.date.get().isBefore(this.now.get(), 'minute') &&
        this.now.get().isBefore(this.data().dueAt)) {
      classes += 'current';
    }
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
      self.date.set(moment(self.data().dueAt));
    });
  }

  classes() {
    let classes = 'due-date' + ' ';
    if (this.now.get().diff(this.date.get(), 'days') >= 2)
      classes += 'long-overdue';
    else if (this.now.get().diff(this.date.get(), 'minute') >= 0)
      classes += 'due';
    else if (this.now.get().diff(this.date.get(), 'days') >= -1)
      classes += 'almost-due';
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

(class extends CardStartDate {
  showDate() {
    return this.date.get().format(Features.opinions.dates.formats.date);
  }
}).register('minicardStartDate');

(class extends CardDueDate {
  showDate() {
    return this.date.get().format(Features.opinions.dates.formats.date);
  }
}).register('minicardDueDate');
