Template.cardLabelsPopup.events({
  'click .js-select-label': function(evt) {
    var cardId = Template.parentData(2).data._id;
    var labelId = this._id;
    var operation;
    if (Cards.find({ _id: cardId, labelIds: labelId}).count() === 0)
      operation = '$addToSet';
    else
      operation = '$pull';

    var query = {};
    query[operation] = {
      labelIds: labelId
    };
    Cards.update(cardId, query);
    evt.preventDefault();
  },
  'click .js-edit-label': Popup.open('editLabel'),
  'click .js-add-label': Popup.open('createLabel')
});

Template.formLabel.events({
  'click .js-palette-color': function(evt) {
    var $this = $(evt.currentTarget);

    // hide selected ll colors
    $('.js-palette-select').addClass('hide');

    // show select color
    $this.find('.js-palette-select').removeClass('hide');
  }
});

Template.createLabelPopup.events({
  // Create the new label
  'submit .create-label': function(evt, tpl) {
    var name = tpl.$('#labelName').val().trim();
    var boardId = Session.get('currentBoard');
    var selectLabelDom = tpl.$('.js-palette-select').get(0);
    var selectLabel = Blaze.getData(selectLabelDom);
    Boards.update(boardId, {
      $push: {
        labels: {
          _id: Random.id(6),
          name: name,
          color: selectLabel.color
        }
      }
    });
    Popup.back();
    evt.preventDefault();
  }
});

Template.editLabelPopup.events({
  'click .js-delete-label': Popup.afterConfirm('deleteLabel', function() {
    var boardId = Session.get('currentBoard');
    Boards.update(boardId, {
      $pull: {
        labels: {
          _id: this._id
        }
      }
    });
    Popup.back(2);
  }),
  'submit .edit-label': function(evt, tpl) {
    var name = tpl.$('#labelName').val().trim();
    var boardId = Session.get('currentBoard');
    var getLabel = Utils.getLabelIndex(boardId, this._id);
    var selectLabelDom = tpl.$('.js-palette-select').get(0);
    var selectLabel = Blaze.getData(selectLabelDom);
    var $set = {};

    // set label index
    $set[getLabel.key('name')] = name;

    // set color
    $set[getLabel.key('color')] = selectLabel.color;

    // update
    Boards.update(boardId, { $set: $set });

    // return to the previous popup view trigger
    Popup.back();

    evt.preventDefault();
  },
  'click .js-select-label': function() {
    Cards.remove(this.cardId);

    // redirect board
    Utils.goBoardId(this.boardId);
  }
});

Template.cardLabelsPopup.helpers({
  isLabelSelected: function(cardId) {
    return _.contains(Cards.findOne(cardId).labelIds, this._id);
  }
});

var labelColors;
Meteor.startup(function() {
  labelColors = Boards.simpleSchema()._schema['labels.$.color'].allowedValues;
});

Template.createLabelPopup.helpers({
  // This is the default color for a new label. We search the first color that
  // is not already used in the board (although it's not a problem if two
  // labels have the same color).
  defaultColor: function() {
    var labels = this.labels || this.card.board().labels;
    var usedColors = _.pluck(labels, 'color');
    var availableColors = _.difference(labelColors, usedColors);
    return availableColors.length > 1 ? availableColors[0] : labelColors[0];
  }
});

Template.formLabel.helpers({
  labels: function() {
    return _.map(labelColors, function(color) {
      return { color: color, name: '' };
    });
  }
});
