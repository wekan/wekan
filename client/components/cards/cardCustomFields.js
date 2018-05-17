Template.cardCustomFieldsPopup.helpers({
    hasCustomField() {
        const card = Cards.findOne(Session.get('currentCard'));
        const customFieldId = this._id;
        return card.customFieldIndex(customFieldId) > -1;
    },
});

Template.cardCustomFieldsPopup.events({
    'click .js-select-field'(evt) {
        const card = Cards.findOne(Session.get('currentCard'));
        const customFieldId = this._id;
        card.toggleCustomField(customFieldId);
        evt.preventDefault();
    },
    'click .js-settings'(evt) {
        EscapeActions.executeUpTo('detailsPane');
        Sidebar.setView('customFields');
        evt.preventDefault();
    }
});

// cardCustomField
const CardCustomField = BlazeComponent.extendComponent({

    getTemplate() {
        return 'cardCustomField-' + this.data().definition.type;
    },

    onCreated() {
        const self = this;
        self.card = Cards.findOne(Session.get('currentCard'));
        self.customFieldId = this.data()._id;
    },

    canModifyCard() {
        return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
    },
});
CardCustomField.register('cardCustomField');

// cardCustomField-text
(class extends CardCustomField {

    onCreated() {
        super.onCreated();
    }

    events() {
        return [{
            'submit .js-card-customfield-text'(evt) {
                evt.preventDefault();
                const value = this.currentComponent().getValue();
                this.card.setCustomField(this.customFieldId, value);
            },
        }];
    }

}).register('cardCustomField-text');

// cardCustomField-number
(class extends CardCustomField {

    onCreated() {
        super.onCreated();
    }

    events() {
        return [{
            'submit .js-card-customfield-number'(evt) {
                evt.preventDefault();
                const value = parseInt(this.find('input').value);
                this.card.setCustomField(this.customFieldId, value);
            },
        }];
    }

}).register('cardCustomField-number');

// cardCustomField-date
(class extends CardCustomField {

    onCreated() {
        super.onCreated();
        const self = this;
        self.date = ReactiveVar();
        self.now = ReactiveVar(moment());
        window.setInterval(() => {
            self.now.set(moment());
        }, 60000);

        self.autorun(() => {
            self.date.set(moment(self.data().value));
        });
    }

    showDate() {
        // this will start working once mquandalle:moment
        // is updated to at least moment.js 2.10.5
        // until then, the date is displayed in the "L" format
        return this.date.get().calendar(null, {
            sameElse: 'llll',
        });
    }

    showISODate() {
        return this.date.get().toISOString();
    }

    classes() {
        if (this.date.get().isBefore(this.now.get(), 'minute') &&
            this.now.get().isBefore(this.data().value)) {
            return 'current';
        }
        return '';
    }

    showTitle() {
        return `${TAPi18n.__('card-start-on')} ${this.date.get().format('LLLL')}`;
    }

    events() {
        return [{
            'click .js-edit-date': Popup.open('cardCustomField-date'),
        }];
    }

}).register('cardCustomField-date');

// cardCustomField-datePopup
(class extends DatePicker {
    onCreated() {
        super.onCreated();
        const self = this;
        self.card = Cards.findOne(Session.get('currentCard'));
        self.customFieldId = this.data()._id;
        this.data().value && this.date.set(moment(this.data().value));
    }

    _storeDate(date) {
        this.card.setCustomField(this.customFieldId, date);
    }

    _deleteDate() {
        this.card.setCustomField(this.customFieldId, '');
    }
}).register('cardCustomField-datePopup');

// cardCustomField-dropdown
(class extends CardCustomField {

    onCreated() {
        super.onCreated();
        this._items = this.data().definition.settings.dropdownItems;
        this.items = this._items.slice(0);
        this.items.unshift({
            _id: "",
            name: TAPi18n.__('custom-field-dropdown-none')
        });
    }

    selectedItem() {
        const selected = this._items.find((item) => {
            return item._id == this.data().value;
        });
        return (selected) ? selected.name : TAPi18n.__('custom-field-dropdown-unknown');
    }

    events() {
        return [{
            'submit .js-card-customfield-dropdown'(evt) {
                evt.preventDefault();
                const value = this.find('select').value;
                this.card.setCustomField(this.customFieldId, value);
            },
        }];
    }

}).register('cardCustomField-dropdown');