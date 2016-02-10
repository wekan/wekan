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
    let $picker = this.$('.js-datepicker').datepicker({
      todayHighlight: true,
      todayBtn: 'linked',
      language: TAPi18n.getLanguage()
    }).on('changeDate', function(e) {
      date.value = moment(e.date).format('L');
      this.error.set('');
      time.focus();
    }.bind(this));

    if (this.date.get().isValid()) {
      $picker.datepicker('update', this.date.get().toDate());
    }
  },

  showDate() {
    if (this.date.get().isValid())
      return this.date.get().format('L');
  },
  showTime() {
    if (this.date.get().isValid())
      return this.date.get().format('LT');
  },
  dateFormat() {
    return moment.localeData().longDateFormat('L');
  },
  timeFormat() {
    return moment.localeData().longDateFormat('LT');
  },

  events() {
    return [{
      'keyup .js-date-field'(evt) {
        // parse for localized date format in strict mode
        const dateMoment = moment(date.value, 'L', true);
        if (dateMoment.isValid()) {
          this.error.set('');
          this.$('.js-datepicker').datepicker('update', dateMoment.toDate());
        }
      },
      'keyup .js-time-field'(evt) {
        // parse for localized time format in strict mode
        const dateMoment = moment(time.value, 'LT', true);
        if (dateMoment.isValid()) {
          this.error.set('');
        }
      },
      'submit .edit-date'(evt) {
        evt.preventDefault();

        // if no time was given, init with 12:00
        var time = evt.target.time.value || moment(new Date().setHours(12,0,0)).format('LT');
        
        const dateString = evt.target.date.value + ' ' + time;
        const newDate = moment(dateString, 'L LT', true);
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

// editCardStartDatePopup
(class extends EditCardDate {
  onCreated() {
    super();
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
    super();
    this.data().dueAt && this.date.set(moment(this.data().dueAt));
  }

  onRendered() {
    super();
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
    let self = this;
    self.date = ReactiveVar();
    self.now = ReactiveVar(moment());
    Meteor.setInterval(() => {
      self.now.set(moment());
    }, 60000);
  },

  showDate() {
    // this will start working once mquandalle:moment
    // is updated to at least moment.js 2.10.5
    // until then, the date is displayed in the "L" format
    return this.date.get().calendar(null, {
      sameElse: 'llll'
    });
  },

  showISODate() {
    return this.date.get().toISOString();
  },
});

class CardStartDate extends CardDate {
  onCreated() {
    super();
    let self = this;
    this.autorun(() => {
      self.date.set(moment(this.data().startAt));
    });
  }

  classes() {
    if (this.date.get().isBefore(this.now.get(), 'minute') &&
        this.now.get().isBefore(this.data().dueAt)) {
      return 'current';
    }
  }

  showTitle() {
    return TAPi18n.__('card-start-on') + ' ' + this.date.get().format('LLLL');
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
    super();
    let self = this;
    this.autorun(() => {
      self.date.set(moment(this.data().dueAt));
    });
  }

  classes() {
    if (this.now.get().diff(this.date.get(), 'days') >= 2)
      return 'long-overdue';
    else if (this.now.get().diff(this.date.get(), 'minute') >= 0)
      return 'due';
    else if (this.now.get().diff(this.date.get(), 'days') >= -1)
      return 'almost-due';
  }

  showTitle() {
    return TAPi18n.__('card-due-on') + ' ' + this.date.get().format('LLLL');
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
    return this.date.get().format('l');
  }
}).register('minicardStartDate');

(class extends CardDueDate {
  showDate() {
    return this.date.get().format('l');
  }
}).register('minicardDueDate');
