import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';
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
  collapsed(check = undefined) {
    const swimlane = Template.currentData();
    const status = swimlane.isCollapsed();
    if (check === undefined) {
      // just check
      return status;
    } else {
      swimlane.collapse(!status);
      return !status;
    }
  },

  events() {
    return [
      {
        'click .js-collapse-swimlane'(event) {
          event.preventDefault();
          this.collapsed(!this.collapsed());
        },
        'click .js-open-swimlane-menu': Popup.open('swimlaneAction'),
        'click .js-open-add-swimlane-menu': Popup.open('swimlaneAdd'),
        submit: this.editTitle,
      },
    ];
  },
}).register('swimlaneHeader');

Template.swimlaneFixedHeader.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  isTitleDefault(title) {
    // https://github.com/wekan/wekan/issues/4763
    // https://github.com/wekan/wekan/issues/4742
    // Translation text for "default" does not work, it returns an object.
    // When that happens, try use translation "defaultdefault" that has same content of default, or return text "Default".
    // This can happen, if swimlane does not have name.
    // Yes, this is fixing the symptom (Swimlane title does not have title)
    // instead of fixing the problem (Add Swimlane title when creating swimlane)
    // because there could be thousands of swimlanes, adding name Default to all of them
    // would be very slow.
    if (title.startsWith("key 'default") && title.endsWith('returned an object instead of string.')) {
      if (`${TAPi18n.__('defaultdefault')}`.startsWith("key 'default") && `${TAPi18n.__('defaultdefault')}`.endsWith('returned an object instead of string.')) {
        return 'Default';
      } else  {
        return `${TAPi18n.__('defaultdefault')}`;
      }
    } else if (title === 'Default') {
      return `${TAPi18n.__('defaultdefault')}`;
    } else  {
      return title;
    }
  },
});

Template.editSwimlaneTitleForm.helpers({
  isTitleDefault(title) {
    // https://github.com/wekan/wekan/issues/4763
    // https://github.com/wekan/wekan/issues/4742
    // Translation text for "default" does not work, it returns an object.
    // When that happens, try use translation "defaultdefault" that has same content of default, or return text "Default".
    // This can happen, if swimlane does not have name.
    // Yes, this is fixing the symptom (Swimlane title does not have title)
    // instead of fixing the problem (Add Swimlane title when creating swimlane) 
    // because there could be thousands of swimlanes, adding name Default to all of them
    // would be very slow.
    if (title.startsWith("key 'default") && title.endsWith('returned an object instead of string.')) {
      if (`${TAPi18n.__('defaultdefault')}`.startsWith("key 'default") && `${TAPi18n.__('defaultdefault')}`.endsWith('returned an object instead of string.')) {
        return 'Default';
      } else  {
        return `${TAPi18n.__('defaultdefault')}`;
      }
    } else if (title === 'Default') {
      return `${TAPi18n.__('defaultdefault')}`;
    } else  {
      return title;
    }
  },
});

Template.swimlaneActionPopup.events({
  'click .js-set-swimlane-color': Popup.open('setSwimlaneColor'),
  'click .js-set-swimlane-height': Popup.open('setSwimlaneHeight'),
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
    return ReactiveCache.getCurrentUser().isCommentOnly();
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
          const currentBoard = Utils.getCurrentBoard();
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
              sort: sortValue.base || 0,
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

BlazeComponent.extendComponent({
  onCreated() {
    this.currentSwimlane = this.currentData();
  },

  applySwimlaneHeight() {
    const swimlane = this.currentData();
    const board = swimlane.boardId;
    const height = parseInt(
      Template.instance()
        .$('.swimlane-height-value')
        .val(),
      10,
    );

    // FIXME(mark-i-m): where do we put constants?
    //                  also in imports/i18n/data/en.i18n.json
    if (height != -1 && (height < 100 || !height)) {
      Template.instance()
        .$('.swimlane-height-error')
        .click();
    } else {
      Meteor.call('applySwimlaneHeight', board, swimlane._id, height);
      Popup.back();
    }
  },

  swimlaneHeightValue() {
    const swimlane = this.currentData();
    const board = swimlane.boardId;
    return ReactiveCache.getCurrentUser().getSwimlaneHeight(board, swimlane._id);
  },

  events() {
    return [
      {
        'click .swimlane-height-apply': this.applySwimlaneHeight,
        'click .swimlane-height-error': Popup.open('swimlaneHeightError'),
      },
    ];
  },
}).register('setSwimlaneHeightPopup');
