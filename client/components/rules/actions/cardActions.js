let cardColors;
Meteor.startup(() => {
  cardColors = Cards.simpleSchema()._schema.color.allowedValues;
});

BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
    this.cardColorButtonValue = new ReactiveVar('green');
  },

  cardColorButton() {
    return this.cardColorButtonValue.get();
  },

  cardColorButtonText() {
    return `color-${this.cardColorButtonValue.get()}`;
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
    return [
      {
        'click .js-set-date-action'(event) {
          const ruleName = this.data().ruleName.get();
          const trigger = this.data().triggerVar.get();
          const triggerId = Triggers.insert(trigger);
          const actionSelected = this.find('#setdate-action').value;
          const dateFieldSelected = this.find('#setdate-datefield').value;
          const boardId = Session.get('currentBoard');
          const desc = Utils.getTriggerActionDesc(event, this);

          const actionId = Actions.insert({
            actionType: actionSelected,
            dateField: dateFieldSelected,
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
        },

        'click .js-remove-datevalue-action'(event) {
          const ruleName = this.data().ruleName.get();
          const trigger = this.data().triggerVar.get();
          const triggerId = Triggers.insert(trigger);
          const dateFieldSelected = this.find('#setdate-removedatefieldvalue')
            .value;
          const boardId = Session.get('currentBoard');
          const desc = Utils.getTriggerActionDesc(event, this);

          const actionId = Actions.insert({
            actionType: 'removeDate',
            dateField: dateFieldSelected,
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
        },
        'click .js-add-label-action'(event) {
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
        'click .js-add-member-action'(event) {
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
        'click .js-add-removeall-action'(event) {
          const ruleName = this.data().ruleName.get();
          const trigger = this.data().triggerVar.get();
          const triggerId = Triggers.insert(trigger);
          const desc = Utils.getTriggerActionDesc(event, this);
          const boardId = Session.get('currentBoard');
          const actionId = Actions.insert({
            actionType: 'removeMember',
            //  deepcode ignore NoHardcodedCredentials: it's no credential
            username: '*',
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
        'click .js-show-color-palette'(event) {
          const funct = Popup.open('setCardActionsColor');
          const colorButton = this.find('#color-action');
          if (colorButton.value === '') {
            colorButton.value = 'green';
          }
          funct.call(this, event);
        },
        'click .js-set-color-action'(event) {
          const ruleName = this.data().ruleName.get();
          const trigger = this.data().triggerVar.get();
          const selectedColor = this.cardColorButtonValue.get();
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
      },
    ];
  },
}).register('cardActions');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentAction = this.currentData();
    this.colorButtonValue = Popup.getOpenerComponent().cardColorButtonValue;
    this.currentColor = new ReactiveVar(this.colorButtonValue.get());
  },

  colors() {
    return cardColors.map(color => ({ color, name: '' }));
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
          this.colorButtonValue.set(this.currentColor.get());
          Popup.close();
        },
      },
    ];
  },
}).register('setCardActionsColorPopup');
