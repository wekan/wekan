const { calculateIndexData } = Utils;

let swimlaneColors;
Meteor.startup(() => {
  swimlaneColors = Swimlanes.simpleSchema()._schema.color.allowedValues;
});

BlazeComponent.extendComponent({
  editTitle(evt) {
    evt.preventDefault();
    const newTitle = this.childComponents('inlinedForm')[0].getValue().trim();
    const swimlane = this.currentData();
    if (newTitle) {
      swimlane.rename(newTitle.trim());
    }
  },

  events() {
    return [{
      'click .js-open-swimlane-menu': Popup.open('swimlaneAction'),
      'click .js-open-add-swimlane-menu': Popup.open('swimlaneAdd'),
      submit: this.editTitle,
    }];
  },
}).register('swimlaneHeader');

Template.swimlaneActionPopup.events({
  'click .js-set-swimlane-color': Popup.open('setSwimlaneColor'),
  'click .js-close-swimlane' (evt) {
    evt.preventDefault();
    this.archive();
    Popup.close();
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.currentSwimlane = this.currentData();
  },

  events() {
    return [{
      submit(evt) {
        evt.preventDefault();
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        const nextSwimlane = currentBoard.nextSwimlane(this.currentSwimlane);
        const titleInput = this.find('.swimlane-name-input');
        const title = titleInput.value.trim();
        const sortValue = calculateIndexData(this.currentSwimlane, nextSwimlane, 1);
        const swimlaneType = (currentBoard.isTemplatesBoard())?'template-swimlane':'swimlane';

        if (title) {
          Swimlanes.insert({
            title,
            boardId: Session.get('currentBoard'),
            sort: sortValue.base,
            type: swimlaneType,
          });

          titleInput.value = '';
          titleInput.focus();
        }
        // XXX ideally, we should move the popup to the newly
        // created swimlane so a user can add more than one swimlane
        // with a minimum of interactions
        Popup.close();
      },
      'click .js-swimlane-template': Popup.open('searchElement'),
    }];
  },
}).register('swimlaneAddPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentSwimlane = this.currentData();
    this.currentColor = new ReactiveVar(this.currentSwimlane.color);
  },

  colors() {
    return swimlaneColors.map((color) => ({ color, name: '' }));
  },

  isSelected(color) {
    return this.currentColor.get() === color;
  },

  events() {
    return [{
      'click .js-palette-color'() {
        this.currentColor.set(this.currentData().color);
      },
      'click .js-submit' () {
        this.currentSwimlane.setColor(this.currentColor.get());
        Popup.close();
      },
      'click .js-remove-color'() {
        this.currentSwimlane.setColor(null);
        Popup.close();
      },
    }];
  },
}).register('setSwimlaneColorPopup');
