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
        return "this is the value";
    },

    showISODate() {
        return this.date.get().toISOString();
    },

    events() {
        return [{
            'click .js-edit-date': Popup.open('editCardStartDate'),
        }];
    },
});

CardCustomField.register('cardCustomField');