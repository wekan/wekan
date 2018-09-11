BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },

  labels(){
    const labels = Boards.findOne(Session.get('currentBoard')).labels;
    console.log(labels);
    for(let i = 0;i<labels.length;i++){
      if(labels[i].name == "" || labels[i].name == undefined){
        labels[i].name = labels[i].color.toUpperCase();
      }
    }
    console.log(labels);
    return labels;
  },



  events() {
    return [
    {'click .js-add-label-action'(event) {
      const ruleName = this.data().ruleName.get();
      const trigger = this.data().triggerVar.get();
      const actionSelected = this.find('#label-action').value;
      const labelId = this.find('#label-id').value;
      const boardId = Session.get('currentBoard');

      if(actionSelected == "add"){
       const triggerId = Triggers.insert(trigger);
       const actionId = Actions.insert({actionType: "addLabel","labelId":labelId,"boardId":boardId});
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
     }
     if(actionSelected == "remove"){
       const triggerId = Triggers.insert(trigger);
       const actionId = Actions.insert({actionType: "removeLabel","labelId":labelId,"boardId":boardId});
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
     }

   },
   'click .js-add-member-action'(event) {
      const ruleName = this.data().ruleName.get();
      const trigger = this.data().triggerVar.get();
      const actionSelected = this.find('#member-action').value;
      const memberName = this.find('#member-name').value;
      const boardId = Session.get('currentBoard');
      if(actionSelected == "add"){
       const triggerId = Triggers.insert(trigger);
       const actionId = Actions.insert({actionType: "addMember","memberName":memberName,"boardId":boardId});
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
     }
     if(actionSelected == "remove"){
       const triggerId = Triggers.insert(trigger);
       const actionId = Actions.insert({actionType: "removeMember","memberName":memberName,"boardId":boardId});
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});  
     }
   },
   'click .js-add-removeall-action'(event) {
      const ruleName = this.data().ruleName.get();
      const trigger = this.data().triggerVar.get();
      const triggerId = Triggers.insert(trigger);
      const boardId = Session.get('currentBoard');
      const actionId = Actions.insert({actionType: "removeMember","memberName":"*","boardId":boardId});
      Rules.insert({title: ruleName, triggerId: triggerId, actionId: actionId,"boardId":boardId});
   },
 }];
},

}).register('cardActions');