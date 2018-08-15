BlazeComponent.extendComponent({
  onCreated() {

  },



  events() {
    return [
    {'click .js-add-move-action'(event) {

      console.log(this.data());
      console.log(this.data().triggerIdVar.get());
      const ruleName = this.data().ruleName.get();
      const triggerId = this.data().triggerIdVar.get();
      const actionSelected = this.find('#action').value;

      if(actionSelected == "top"){
       Actions.insert({actionType: "moveCardToTop"},function(err,id){
        Rules.insert({title: ruleName, triggerId: triggerId, actionId: id});  
      });
     }
     if(actionSelected == "bottom"){
       Actions.insert({actionType: "moveCardToBottom"},function(err,id){
       Rules.insert({title: ruleName, triggerId: triggerId, actionId: id});  
      });
     }
   },
 }];
},

}).register('boardActions');