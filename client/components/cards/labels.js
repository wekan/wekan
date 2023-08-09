import { ReactiveCache } from '/imports/reactiveCache';

let labelColors;
Meteor.startup(() => {
  labelColors = Boards.simpleSchema()._schema['labels.$.color'].allowedValues;
});

BlazeComponent.extendComponent({
  onCreated() {
    this.currentColor = new ReactiveVar(this.data().color);
  },

  labels() {
    return labelColors.map(color => ({ color, name: '' }));
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
      },
    ];
  },
}).register('formLabel');

Template.createLabelPopup.helpers({
  // This is the default color for a new label. We search the first color that
  // is not already used in the board (although it's not a problem if two
  // labels have the same color).
  defaultColor() {
    const labels = Utils.getCurrentBoard().labels;
    const usedColors = _.pluck(labels, 'color');
    const availableColors = _.difference(labelColors, usedColors);
    return availableColors.length > 1 ? availableColors[0] : labelColors[0];
  },
});

BlazeComponent.extendComponent({
  onRendered() {
    const itemsSelector = 'li.js-card-label-item:not(.placeholder)';
    const $labels = this.$('.edit-labels-pop-over');

    $labels.sortable({
      connectWith: '.edit-labels-pop-over',
      tolerance: 'pointer',
      appendTo: '.edit-labels-pop-over',
      helper(element, currentItem) {
        let ret = currentItem.clone();
        if (currentItem.closest('.popup-container-depth-0').length == 0)
        { // only set css transform at every sub-popup, not at the main popup
          const content = currentItem.closest('.content')[0]
          const offsetLeft = content.offsetLeft;
          const offsetTop = $('.pop-over > .header').height() * -1;
          ret.css("transform", `translate(${offsetLeft}px, ${offsetTop}px)`);
        }
        return ret;
      },
      distance: 7,
      items: itemsSelector,
      placeholder: 'card-label-wrapper placeholder',
      start(evt, ui) {
        ui.helper.css('z-index', 1000);
        ui.placeholder.height(ui.helper.height());
        EscapeActions.clickExecute(evt.target, 'inlinedForm');
      },
      stop(evt, ui) {
        const newLabelOrderOnlyIds = ui.item.parent().children().toArray().map(_element => Blaze.getData(_element)._id)
        const card = Blaze.getData(this);
        card.board().setNewLabelOrder(newLabelOrderOnlyIds);
      },
    });

    // Disable drag-dropping if the current user is not a board member or is comment only
    this.autorun(() => {
      if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
        $labels.sortable({
          handle: '.label-handle',
        });
      }
    });
  },
  events() {
    return [
      {
        'click .js-select-label'(event) {
          const card = this.data();
          const labelId = this.currentData()._id;
          card.toggleLabel(labelId);
          event.preventDefault();
        },
        'click .js-edit-label': Popup.open('editLabel'),
        'click .js-add-label': Popup.open('createLabel'),
      }
    ];
  }
}).register('cardLabelsPopup');

Template.cardLabelsPopup.events({
});

Template.formLabel.events({
  'click .js-palette-color'(event) {
    const $this = $(event.currentTarget);

    // hide selected ll colors
    $('.js-palette-select').addClass('hide');

    // show select color
    $this.find('.js-palette-select').removeClass('hide');
  },
});

Template.createLabelPopup.events({
  // Create the new label
  'submit .create-label'(event, templateInstance) {
    event.preventDefault();
    const board = Utils.getCurrentBoard();
    const name = templateInstance
      .$('#labelName')
      .val()
      .trim();
    const color = Blaze.getData(templateInstance.find('.fa-check')).color;
    board.addLabel(name, color);
    Popup.back();
  },
});

Template.editLabelPopup.events({
  'click .js-delete-label': Popup.afterConfirm('deleteLabel', function () {
    const board = Utils.getCurrentBoard();
    board.removeLabel(this._id);
    Popup.back(2);
  }),
  'submit .edit-label'(event, templateInstance) {
    event.preventDefault();
    const board = Utils.getCurrentBoard();
    const name = templateInstance
      .$('#labelName')
      .val()
      .trim();
    const color = Blaze.getData(templateInstance.find('.fa-check')).color;
    board.editLabel(this._id, name, color);
    Popup.back();
  },
});

Template.cardLabelsPopup.helpers({
  isLabelSelected(cardId) {
    return _.contains(ReactiveCache.getCard(cardId).labelIds, this._id);
  },
});
