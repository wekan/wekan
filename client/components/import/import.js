/// Abstract root for all import popup screens.
/// Descendants must define:
/// - getMethodName(): return the Meteor method to call for import, passing json
/// data decoded as object and additional data (see below);
/// - getAdditionalData(): return object containing additional data passed to
/// Meteor method (like list ID and position for a card import);
/// - getLabel(): i18n key for the text displayed in the popup, usually to
/// explain how to get the data out of the source system.
const ImportPopup = BlazeComponent.extendComponent({
  template() {
    return 'importPopup';
  },

  events() {
    return [{
      'submit': (evt) => {
        evt.preventDefault();
        const dataJson = $(evt.currentTarget).find('.js-import-json').val();
        let dataObject;
        try {
          dataObject = JSON.parse(dataJson);
        } catch (e) {
          this.setError('error-json-malformed');
          return;
        }
        Meteor.call(this.getMethodName(), dataObject, this.getAdditionalData(),
          (error, response) => {
            if (error) {
              this.setError(error.error);
            } else {
              Filter.addException(response);
              this.onFinish(response);
            }
          }
        );
      },
    }];
  },

  onCreated() {
    this.error = new ReactiveVar('');
  },

  setError(error) {
    this.error.set(error);
  },

  onFinish() {
    Popup.close();
  },
});

ImportPopup.extendComponent({
  getAdditionalData() {
    const listId = this.data()._id;
    const selector = `#js-list-${this.currentData()._id} .js-minicard:first`;
    const firstCardDom = $(selector).get(0);
    const sortIndex = Utils.calculateIndex(null, firstCardDom).base;
    const result = {listId, sortIndex};
    return result;
  },

  getMethodName() {
    return 'importTrelloCard';
  },

  getLabel() {
    return 'import-card-trello-instruction';
  },
}).register('listImportCardPopup');

ImportPopup.extendComponent({
  getAdditionalData() {
    const result = {};
    return result;
  },

  getMethodName() {
    return 'importTrelloBoard';
  },

  getLabel() {
    return 'import-board-trello-instruction';
  },

  onFinish(response) {
    Utils.goBoardId(response);
  },
}).register('boardImportBoardPopup');

