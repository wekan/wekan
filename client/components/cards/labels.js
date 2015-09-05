let labelColors;
Meteor.startup(() => {
  labelColors = Boards.simpleSchema()._schema['labels.$.color'].allowedValues;
});

BlazeComponent.extendComponent({
  template() {
    return 'formLabel';
  },

  onCreated() {
    this.currentColor = new ReactiveVar(this.data().color);
  },

  labels() {
    return _.map(labelColors, (color) => {
      return { color, name: '' };
    });
  },

  isSelected(color) {
    return this.currentColor.get() === color;
  },

  events() {
    return [{
      'click .js-palette-color'() {
        this.currentColor.set(this.currentData().color);
      },
    }];
  },
}).register('formLabel');

Template.createLabelPopup.helpers({
  // This is the default color for a new label. We search the first color that
  // is not already used in the board (although it's not a problem if two
  // labels have the same color).
  defaultColor() {
    const labels = Boards.findOne(Session.get('currentBoard')).labels;
    const usedColors = _.pluck(labels, 'color');
    const availableColors = _.difference(labelColors, usedColors);
    return availableColors.length > 1 ? availableColors[0] : labelColors[0];
  },
});

Template.cardLabelsPopup.events({
  'click .js-select-label'(evt) {
    const cardId = Template.parentData(2).data._id;
    const labelId = this._id;
    let operation;
    if (Cards.find({ _id: cardId, labelIds: labelId}).count() === 0)
      operation = '$addToSet';
    else
      operation = '$pull';

    Cards.update(cardId, {
      [operation]: {
        labelIds: labelId,
      },
    });
    evt.preventDefault();
  },
  'click .js-edit-label': Popup.open('editLabel'),
  'click .js-add-label': Popup.open('createLabel'),
});

Template.formLabel.events({
  'click .js-palette-color'(evt) {
    const $this = $(evt.currentTarget);

    // hide selected ll colors
    $('.js-palette-select').addClass('hide');

    // show select color
    $this.find('.js-palette-select').removeClass('hide');
  },
});

Template.createLabelPopup.events({
  // Create the new label
  'submit .create-label'(evt, tpl) {
    const name = tpl.$('#labelName').val().trim();
    const boardId = Session.get('currentBoard');
    const color = Blaze.getData(tpl.find('.fa-check')).color;

    Boards.update(boardId, {
      $push: {
        labels: {
          name,
          color,
          _id: Random.id(6),
        },
      },
    });

    Popup.back();
    evt.preventDefault();
  },
});

Template.editLabelPopup.events({
  'click .js-delete-label': Popup.afterConfirm('deleteLabel', function() {
    const boardId = Session.get('currentBoard');
    Boards.update(boardId, {
      $pull: {
        labels: {
          _id: this._id,
        },
      },
    });

    Popup.back(2);
  }),
  'submit .edit-label'(evt, tpl) {
    evt.preventDefault();
    const name = tpl.$('#labelName').val().trim();
    const boardId = Session.get('currentBoard');
    const getLabel = Utils.getLabelIndex(boardId, this._id);
    const color = Blaze.getData(tpl.find('.fa-check')).color;

    Boards.update(boardId, {
      $set: {
        [getLabel.key('name')]: name,
        [getLabel.key('color')]: color,
      },
    });

    Popup.back();
  },
});

Template.cardLabelsPopup.helpers({
  isLabelSelected(cardId) {
    return _.contains(Cards.findOne(cardId).labelIds, this._id);
  },
});
