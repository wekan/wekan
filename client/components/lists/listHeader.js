BlazeComponent.extendComponent({
    editTitle(evt) {
        evt.preventDefault();
        const newTitle = this.childComponents('inlinedForm')[0].getValue().trim();
        const list = this.currentData();
        if (newTitle) {
            list.rename(newTitle.trim());
        }
    },

    isWatching() {
        const list = this.currentData();
        return list.findWatcher(Meteor.userId());
    },

    limitToShowCardsCount() {
        return Meteor.user().getLimitToShowCardsCount();
    },

    showCardsCountForList(count) {
        return count > this.limitToShowCardsCount();
    },

    events() {
        return [{
            'click .js-open-list-menu': Popup.open('listAction'),
            submit: this.editTitle,
        }];
    },
}).register('listHeader');

Template.listActionPopup.helpers({
    isWatching() {
        return this.findWatcher(Meteor.userId());
    },
});

Template.listActionPopup.events({
    'click .js-add-card' () {
        const listDom = document.getElementById(`js-list-${this._id}`);
        const listComponent = BlazeComponent.getComponentForElement(listDom);
        listComponent.openForm({ position: 'top' });
        Popup.close();
    },
    'click .js-list-subscribe' () {},
    'click .js-select-cards' () {
        const cardIds = this.allCards().map((card) => card._id);
        MultiSelection.add(cardIds);
        Popup.close();
    },
    'click .js-toggle-watch-list' () {
        const currentList = this;
        const level = currentList.findWatcher(Meteor.userId()) ? null : 'watching';
        Meteor.call('watch', 'list', currentList._id, level, (err, ret) => {
            if (!err && ret) Popup.close();
        });
    },
    'click .js-close-list' (evt) {
        evt.preventDefault();
        this.archive();
        Popup.close();
    },
    'click .js-more': Popup.open('listMore'),
});

Template.listMorePopup.events({
    'click .js-delete': Popup.afterConfirm('listDelete', function() {
        Popup.close();
        Lists.remove(this._id);
        Utils.goBoardId(this.boardId);
    }),
});