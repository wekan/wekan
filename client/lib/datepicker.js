DatePicker = BlazeComponent.extendComponent({
    template() {
        return 'datepicker';
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
        }).on('changeDate', function(evt) {
            this.find('#date').value = moment(evt.date).format('L');
            this.error.set('');
            this.find('#time').focus();
        }.bind(this));

        if (this.date.get().isValid()) {
            $picker.datepicker('update', this.date.get().toDate());
        }
    },

    showDate() {
        if (this.date.get().isValid())
            return this.date.get().format('L');
        return '';
    },
    showTime() {
        if (this.date.get().isValid())
            return this.date.get().format('LT');
        return '';
    },
    dateFormat() {
        return moment.localeData().longDateFormat('L');
    },
    timeFormat() {
        return moment.localeData().longDateFormat('LT');
    },

    events() {
        return [{
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
                const time = evt.target.time.value || moment(new Date().setHours(12, 0, 0)).format('LT');

                const dateString = `${evt.target.date.value} ${time}`;
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