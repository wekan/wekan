BlazeComponent.extendComponent({
  onCreated() {

  },

  events() {
    return [
    {'click .js-add-gen-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#gen-action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "created"){
        Triggers.insert({activityType: "createCard","boardId":boardId,"listName":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "removeCard","boardId":boardId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-create-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#create-action').value;
      const listName = this.find('#create-list-name').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "created"){
        Triggers.insert({activityType: "createCard","boardId":boardId,"listName":listName},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "removeCard","boardId":boardId,"listName":listName},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-moved-trigger'(event) {
      let datas = this.data();
      const actionSelected = this.find('#move-action').value;
      const listName = this.find('#move-list-name').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "moved-to"){
        Triggers.insert({activityType: "moveCard","boardId":boardId,"listName":listName,"oldListName":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "moved-from"){
        Triggers.insert({activityType: "moveCard","boardId":boardId,"listName":"*","oldListName":listName},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-arc-trigger'(event) {
      let datas = this.data();
      const actionSelected = this.find('#arch-action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "archived"){
        Triggers.insert({activityType: "archivedCard","boardId":boardId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "unarchived"){
        Triggers.insert({activityType: "restoredCard","boardId":boardId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    }

    }];
  },

}).register('boardTriggers');