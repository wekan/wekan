import { Utils } from '/client/lib/utils';

// Button "triggers" are manual: the rule runs only when a user clicks the button
// (rendered on the card detail for card buttons, or the board for board buttons).
// They are never matched against activities; the rules.runButton method runs them.

Template.buttonTriggers.events({
  'click .js-add-button-trigger'(event, tpl) {
    const datas = Template.currentData();
    const desc = Utils.getTriggerActionDesc(event, tpl);
    const boardId = Session.get('currentBoard');
    const buttonLabel = tpl.find('#button-label').value || 'Run';
    const buttonType = tpl.find('#button-type').value || 'card';
    datas.triggerVar.set({
      activityType: 'button',
      buttonType,
      buttonLabel,
      boardId,
      desc,
    });
  },
});
