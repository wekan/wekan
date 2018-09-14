BlazeComponent.extendComponent({
  onCreated() {

  },



  events() {
    return [
    {'click .js-add-spec-move-action'(event) {
      const ruleName = this.data().ruleName.get();
      const trigger = this.data().triggerVar.get();
      const actionSelected = this.find('#move-spec-action').value;
      const listTitle = this.find('#listName').value;
      const boardId = Session.get('currentBoard');
      const desc = Utils.getTriggerActionDesc(event,this);
      if(actionSelected == "top"){
       const triggerId = Triggers.insert(trigger);
       const actionId = Actions.insert({actionType: "moveCardToTop","listTitle":listTitle,"boardId":boardId,"desc":desc});
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
     }
     if(actionSelected == "bottom"){
       const triggerId = Triggers.insert(trigger);
       const actionId = Actions.insert({actionType: "moveCardToBottom","listTitle":listTitle,"boardId":boardId,"desc":desc});
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
     }
   },
   'click .js-add-gen-move-action'(event) {
    const desc = Utils.getTriggerActionDesc(event,this);
    const boardId = Session.get('currentBoard');
    const ruleName = this.data().ruleName.get();
    const trigger = this.data().triggerVar.get();
    const actionSelected = this.find('#move-gen-action').value;
    if(actionSelected == "top"){
     const triggerId = Triggers.insert(trigger);
     const actionId = Actions.insert({actionType: "moveCardToTop","listTitle":"*","boardId":boardId,"desc":desc});
     Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
   }
   if(actionSelected == "bottom"){
     const triggerId = Triggers.insert(trigger);
     const actionId = Actions.insert({actionType: "moveCardToBottom","listTitle":"*","boardId":boardId,"desc":desc});
     Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
   }
 },
 'click .js-add-arch-action'(event) {
  const desc = Utils.getTriggerActionDesc(event,this);
  const boardId = Session.get('currentBoard');
  const ruleName = this.data().ruleName.get();
  const trigger = this.data().triggerVar.get();
  const actionSelected = this.find('#arch-action').value;
  if(actionSelected == "archive"){
   const triggerId = Triggers.insert(trigger);
   const actionId = Actions.insert({actionType: "archive","boardId":boardId,"desc":desc});
   Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
 }
 if(actionSelected == "unarchive"){
   const triggerId = Triggers.insert(trigger);
   const actionId = Actions.insert({actionType: "unarchive","boardId":boardId,"desc":desc});
   Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
 }
},
}];
},

}).register('boardActions');