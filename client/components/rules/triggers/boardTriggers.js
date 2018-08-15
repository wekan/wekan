BlazeComponent.extendComponent({
  onCreated() {

  },

  events() {
    return [
    {'click .js-add-gen-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "created"){
        Triggers.insert({activityType: "createCard","boardId":boardId,"listId":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "removeCard","boardId":boardId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }

    },
    }];
  },

}).register('boardTriggers');