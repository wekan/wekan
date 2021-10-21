const { calculateIndexData } = Utils;

let swimlaneColors;
Meteor.startup(() => {
  swimlaneColors = Swimlanes.simpleSchema()._schema.color.allowedValues;
});

BlazeComponent.extendComponent({
  editTitle(event) {
    event.preventDefault();
    const newTitle = this.childComponents('inlinedForm')[0]
      .getValue()
      .trim();
    const swimlane = this.currentData();
    if (newTitle) {
      swimlane.rename(newTitle.trim());
    }
  },

  events() {
    return [
      {
        'click .js-open-swimlane-menu': Popup.open('swimlaneAction'),
        'click .js-open-add-swimlane-menu': Popup.open('swimlaneAdd'),
        submit: this.editTitle,
      },
    ];
  },
}).register('swimlaneHeader');

Template.swimlaneFixedHeader.helpers({
  isBoardAdmin() {
    return Meteor.user().isBoardAdmin();
  },
});

Template.swimlaneActionPopup.events({
  'click .js-set-swimlane-color': Popup.open('setSwimlaneColor'),
  'click .js-close-swimlane'(event) {
    event.preventDefault();
    this.archive();
    Popup.back();
  },
  'click .js-move-swimlane': Popup.open('moveSwimlane'),
  'click .js-copy-swimlane': Popup.open('copySwimlane'),
});

Template.swimlaneActionPopup.events({
  isCommentOnly() {
    return Meteor.user().isCommentOnly();
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.currentSwimlane = this.currentData();
  },

  events() {
    return [
      {
        submit(event) {
          event.preventDefault();
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          const nextSwimlane = currentBoard.nextSwimlane(this.currentSwimlane);
          const titleInput = this.find('.swimlane-name-input');
          const title = titleInput.value.trim();
          const sortValue = calculateIndexData(
            this.currentSwimlane,
            nextSwimlane,
            1,
          );
          const swimlaneType = currentBoard.isTemplatesBoard()
            ? 'template-swimlane'
            : 'swimlane';

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
          Popup.back();
        },
        'click .js-swimlane-template': Popup.open('searchElement'),
      },
    ];
  },
}).register('swimlaneAddPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentSwimlane = this.currentData();
    this.currentColor = new ReactiveVar(this.currentSwimlane.color);
  },

  colors() {
    return swimlaneColors.map(color => ({ color, name: '' }));
  },

  isSelected(color) {
    return this.currentColor.get() === color;
  },

  events() {
    return [
      {
        'click .js-palette-color'() {
          this.currentColor.set(this.currentData().color);
        },
        'click .js-submit'() {
          this.currentSwimlane.setColor(this.currentColor.get());
          Popup.back();
        },
        'click .js-remove-color'() {
          this.currentSwimlane.setColor(null);
          Popup.back();
        },
      },
    ];
  },
}).register('setSwimlaneColorPopup');
