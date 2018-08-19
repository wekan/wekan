BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },
  events() {
    return [
    {'click .js-add-checklist-action'(event) {
      const ruleName = this.data().ruleName.get();
      const trigger = this.data().triggerVar.get();
      const actionSelected = this.find('#check-action').value;
      const checklistName = this.find('#checklist-name').value;

      if(actionSelected == "add"){
       const triggerId = Triggers.insert(trigger);
       const actionId = Actions.insert({actionType: "addChecklist","checklistName":checklistName});
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId});  
     }
     if(actionSelected == "remove"){
       const triggerId = Triggers.insert(trigger);
       const actionId = Actions.insert({actionType: "removeChecklist","checklistName":checklistName});
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId});  
     }

   },
   'click .js-add-checkall-action'(event) {
    const ruleName = this.data().ruleName.get();
    const trigger = this.data().triggerVar.get();
    const actionSelected = this.find('#checkall-action').value;
    const checklistName = this.find('#checklist-name2').value;
    if(actionSelected == "check"){
     const triggerId = Triggers.insert(trigger);
     const actionId = Actions.insert({actionType: "checkAll","checklistName":checklistName});
     Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId});  
   }
   if(actionSelected == "uncheck"){
     const triggerId = Triggers.insert(trigger);
     const actionId = Actions.insert({actionType: "uncheckAll","checklistName":checklistName});
     Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId});  
   }
 },
 'click .js-add-check-item-action'(event) {
  const ruleName = this.data().ruleName.get();
  const trigger = this.data().triggerVar.get();
  const checkItemName = this.find("#checkitem-name");
  const checklistName = this.find("#checklist-name3");
  const actionSelected = this.find('#check-item-action').value;
  if(actionSelected == "check"){
    const triggerId = Triggers.insert(trigger);
    const actionId = Actions.insert({actionType: "checkItem","checklistName":checklistName,"checkItemName":checkItemName});
    Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId});  
  }
  if(actionSelected == "uncheck"){
    const triggerId = Triggers.insert(trigger);
    const actionId = Actions.insert({actionType: "uncheckItem","checklistName":checklistName,"checkItemName":checkItemName});
    Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId});  
  }
},
}];
},

}).register('checklistActions');