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
      const localDate = moment(e.date).format('L');
      date.value = localDate;
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
        const newDate = moment.utc(dateString, 'L LT', true);
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
    if (this.data().startAt) {
      this.date.set(moment.utc(this.data().startAt));
    }
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
    if (this.data().dueAt !== undefined) {
      this.date.set(moment.utc(this.data().dueAt));
    }
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
    this.date = ReactiveVar();
  },

  showDate() {
    // this will start working once mquandalle:moment
    // is updated to at least moment.js 2.10.5
    // until then, the date is displayed in the "L" format
    return this.date.get().calendar(null, {
      sameElse: 'llll'
    });
  },

  showTitle() {
    return this.date.get().format('LLLL');
  },

  showISODate() {
    return this.date.get().toISOString();
  },
});

// cardStartDate
(class extends CardDate {
  onCreated() {
    super();
    let self = this;
    this.autorun(() => {
      self.date.set(moment.utc(this.data().startAt));
    });
  }

  events() {
    return super.events().concat({
      'click .js-edit-date': Popup.open('editCardStartDate'),
    });
  }
}).register('cardStartDate');

// cardDueDate
(class extends CardDate {
  onCreated() {
    super();
    let self = this;
    this.autorun(() => {
      self.date.set(moment.utc(this.data().dueAt));
    });
  }

  events() {
    return super.events().concat({
      'click .js-edit-date': Popup.open('editCardDueDate'),
    });
  }
}).register('cardDueDate');
