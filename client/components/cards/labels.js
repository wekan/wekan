
var labelColors;
Meteor.startup(function() {
  labelColors = Boards.simpleSchema()._schema['labels.$.color'].allowedValues;
});

BlazeComponent.extendComponent({
  template: function() {
    return 'formLabel';
  },

  onCreated: function() {
    this.currentColor = new ReactiveVar(this.data().color);
  },

  labels: function() {
    return _.map(labelColors, function(color) {
      return { color: color, name: '' };
    });
  },

  isSelected: function(color) {
    return this.currentColor.get() === color;
  },

  events: function() {
    return [{
      'click .js-palette-color': function() {
        this.currentColor.set(this.currentData().color);
      }
    }];
  }
}).register('formLabel');

Template.createLabelPopup.helpers({
  // This is the default color for a new label. We search the first color that
  // is not already used in the board (although it's not a problem if two
  // labels have the same color).
  defaultColor: function() {
    var labels = Boards.findOne(Session.get('currentBoard')).labels;
    var usedColors = _.pluck(labels, 'color');
    var availableColors = _.difference(labelColors, usedColors);
    return availableColors.length > 1 ? availableColors[0] : labelColors[0];
  }
});

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
    var color = Blaze.getData(tpl.find('.fa-check')).color;

    Boards.update(boardId, {
      $push: {
        labels: {
          _id: Random.id(6),
          name: name,
          color: color
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
    evt.preventDefault();
    var name = tpl.$('#labelName').val().trim();
    var boardId = Session.get('currentBoard');
    var getLabel = Utils.getLabelIndex(boardId, this._id);
    var color = Blaze.getData(tpl.find('.fa-check')).color;

    var $set = {};
    $set[getLabel.key('name')] = name;
    $set[getLabel.key('color')] = color;

    Boards.update(boardId, { $set: $set });

    Popup.back();
  }
});

Template.cardLabelsPopup.helpers({
  isLabelSelected: function(cardId) {
    return _.contains(Cards.findOne(cardId).labelIds, this._id);
  }
});
