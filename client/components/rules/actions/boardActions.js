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

      if(actionSelected == "top"){
       const triggerId = Triggers.insert(trigger);
       const actionId = Actions.insert({actionType: "moveCardToTop","listTitle":listTitle,"boardId":boardId});
       console.log("Action inserted");
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
     }
     if(actionSelected == "bottom"){
       const triggerId = Triggers.insert(trigger);
       const actionId = Actions.insert({actionType: "moveCardToBottom","listTitle":listTitle,"boardId":boardId});
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
     }
   },
   'click .js-add-gen-move-action'(event) {
    const boardId = Session.get('currentBoard');
    const ruleName = this.data().ruleName.get();
    const trigger = this.data().triggerVar.get();
    const actionSelected = this.find('#move-gen-action').value;
    if(actionSelected == "top"){
     const triggerId = Triggers.insert(trigger);
     const actionId = Actions.insert({actionType: "moveCardToTop","listTitle":"*","boardId":boardId});
     Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
   }
   if(actionSelected == "bottom"){
     const triggerId = Triggers.insert(trigger);
     const actionId = Actions.insert({actionType: "moveCardToBottom","listTitle":"*","boardId":boardId});
     Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
   }
 },
 'click .js-add-arch-action'(event) {
  const boardId = Session.get('currentBoard');
  const ruleName = this.data().ruleName.get();
  const trigger = this.data().triggerVar.get();
  const actionSelected = this.find('#arch-action').value;
  if(actionSelected == "archive"){
   const triggerId = Triggers.insert(trigger);
   const actionId = Actions.insert({actionType: "archive"});
   Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
 }
 if(actionSelected == "unarchive"){
   const triggerId = Triggers.insert(trigger);
   const actionId = Actions.insert({actionType: "unarchive"});
   Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
 }
},
}];
},

}).register('boardActions');