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
    'click .js-configure-custom-fields'(evt) {
        EscapeActions.executeUpTo('detailsPane');
        Sidebar.setView('customFields');
        evt.preventDefault();
    }
});

const CardCustomField = BlazeComponent.extendComponent({
    template() {
        return 'cardCustomFieldText';
    },

    onCreated() {
        const self = this;
        self.date = ReactiveVar();
        self.now = ReactiveVar(moment());
    },

    value() {
        return this.data().value;
    },

    showISODate() {
        return this.date.get().toISOString();
    },

    events() {
        return [{
            'submit .js-card-customfield-text'(evt) {
                evt.preventDefault();
                const card = Cards.findOne(Session.get('currentCard'));
                const customFieldId = this.data()._id;
                const value = this.currentComponent().getValue();
                card.setCustomField(customFieldId,value);
            },
            'click .js-edit-date': Popup.open('editCardStartDate'),
        }];
    },

    canModifyCard() {
        return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
    },
});

CardCustomField.register('cardCustomField');