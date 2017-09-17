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

const CardCustomField = BlazeComponent.extendComponent({

    getTemplate() {
        return 'cardCustomField-' + this.data().definition.type;
    },

    onCreated() {
        const self = this;
    },

    canModifyCard() {
        return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
    },
});
CardCustomField.register('cardCustomField');

(class extends CardCustomField {

    onCreated() {
    }

    events() {
        return [{
            'submit .js-card-customfield-text'(evt) {
                evt.preventDefault();
                const card = Cards.findOne(Session.get('currentCard'));
                const customFieldId = this.data()._id;
                const value = this.currentComponent().getValue();
                card.setCustomField(customFieldId,value);
            },
        }];
    }

}).register('cardCustomField-text');

(class extends CardCustomField {

    onCreated() {
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
                const card = Cards.findOne(Session.get('currentCard'));
                const customFieldId = this.data()._id;
                const value = this.find('select').value;
                card.setCustomField(customFieldId,value);
            },
        }];
    }

}).register('cardCustomField-dropdown');