let cardColors;
Meteor.startup(() => {
  cardColors = Cards.simpleSchema()._schema.color.allowedValues;
});

BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },

  labels() {
    const labels = Boards.findOne(Session.get('currentBoard')).labels;
    for (let i = 0; i < labels.length; i++) {
      if (labels[i].name === '' || labels[i].name === undefined) {
        labels[i].name = labels[i].color.toUpperCase();
      }
    }
    return labels;
  },

  events() {
    return [{
      'click .js-add-label-action' (event) {
        const ruleName = this.data().ruleName.get();
        const trigger = this.data().triggerVar.get();
        const actionSelected = this.find('#label-action').value;
        const labelId = this.find('#label-id').value;
        const boardId = Session.get('currentBoard');
        const desc = Utils.getTriggerActionDesc(event, this);
        if (actionSelected === 'add') {
          const triggerId = Triggers.insert(trigger);
          const actionId = Actions.insert({
            actionType: 'addLabel',
            labelId,
            boardId,
            desc,
          });
          Rules.insert({
            title: ruleName,
            triggerId,
            actionId,
            boardId,
          });
        }
        if (actionSelected === 'remove') {
          const triggerId = Triggers.insert(trigger);
          const actionId = Actions.insert({
            actionType: 'removeLabel',
            labelId,
            boardId,
            desc,
          });
          Rules.insert({
            title: ruleName,
            triggerId,
            actionId,
            boardId,
          });
        }

      },
      'click .js-add-member-action' (event) {
        const ruleName = this.data().ruleName.get();
        const trigger = this.data().triggerVar.get();
        const actionSelected = this.find('#member-action').value;
        const username = this.find('#member-name').value;
        const boardId = Session.get('currentBoard');
        const desc = Utils.getTriggerActionDesc(event, this);
        if (actionSelected === 'add') {
          const triggerId = Triggers.insert(trigger);
          const actionId = Actions.insert({
            actionType: 'addMember',
            username,
            boardId,
            desc,
          });
          Rules.insert({
            title: ruleName,
            triggerId,
            actionId,
            boardId,
            desc,
          });
        }
        if (actionSelected === 'remove') {
          const triggerId = Triggers.insert(trigger);
          const actionId = Actions.insert({
            actionType: 'removeMember',
            username,
            boardId,
            desc,
          });
          Rules.insert({
            title: ruleName,
            triggerId,
            actionId,
            boardId,
          });
        }
      },
      'click .js-add-removeall-action' (event) {
        const ruleName = this.data().ruleName.get();
        const trigger = this.data().triggerVar.get();
        const triggerId = Triggers.insert(trigger);
        const desc = Utils.getTriggerActionDesc(event, this);
        const boardId = Session.get('currentBoard');
        const actionId = Actions.insert({
          actionType: 'removeMember',
          'username': '*',
          boardId,
          desc,
        });
        Rules.insert({
          title: ruleName,
          triggerId,
          actionId,
          boardId,
        });
      },
      'click .js-show-color-palette'(event){
        const funct = Popup.open('setCardActionsColor');
        const colorButton = this.find('#color-action');
        if (colorButton.value === '') {
          colorButton.value = 'green';
        }
        funct.call(this, event);
      },
      'click .js-set-color-action' (event) {
        const ruleName = this.data().ruleName.get();
        const trigger = this.data().triggerVar.get();
        const colorButton = this.find('#color-action');
        if (colorButton.value === '') {
          colorButton.value = 'green';
        }
        const selectedColor = colorButton.value;
        const boardId = Session.get('currentBoard');
        const desc = Utils.getTriggerActionDesc(event, this);
        const triggerId = Triggers.insert(trigger);
        const actionId = Actions.insert({
          actionType: 'setColor',
          selectedColor,
          boardId,
          desc,
        });
        Rules.insert({
          title: ruleName,
          triggerId,
          actionId,
          boardId,
        });
      },
    }];
  },

}).register('cardActions');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentAction = this.currentData();
    this.colorButton = Popup.getOpenerComponent().find('#color-action');
    this.currentColor = new ReactiveVar(this.colorButton.value);
  },

  colors() {
    return cardColors.map((color) => ({ color, name: '' }));
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
        this.colorButton.classList.remove(`card-details-${ this.colorButton.value }`);
        this.colorButton.value = this.currentColor.get();
        this.colorButton.innerText = `${TAPi18n.__(`color-${ this.currentColor.get() }`)}`;
        this.colorButton.classList.add(`card-details-${ this.colorButton.value }`);
        Popup.close();
      },
    }];
  },
}).register('setCardActionsColorPopup');
