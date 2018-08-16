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
    {'click .js-add-gen-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#gen-action').value;
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
    'click .js-add-create-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#create-action').value;
      const listName = this.find('#create-list-name').value;
      const boardId = Session.get('currentBoard')
      const list = Lists.findOne({title:listName});
      let listId;
      if(list == undefined){
        listId = "*"
      }else{
        listId = list._id;
      }
      if(actionSelected == "created"){
        Triggers.insert({activityType: "createCard","boardId":boardId,"listId":listId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "removeCard","boardId":boardId,"listId":listId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-moved-trigger'(event) {
      let datas = this.data();
      const actionSelected = this.find('#move-action').value;
      const listName = this.find('#move-list-name').value;
      const boardId = Session.get('currentBoard')
      const list = Lists.findOne({title:listName});
      console.log(list);
      let listId;
      if(list == undefined){
        listId = "*"
      }else{
        listId = list._id;
      }
      console.log(listId);
      if(actionSelected == "moved-to"){
        Triggers.insert({activityType: "moveCard","boardId":boardId,"listId":listId,"oldListId":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "moved-from"){
        Triggers.insert({activityType: "moveCard","boardId":boardId,"listId":"*","oldListId":listId},function(error,id){
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

}).register('cardTriggers');


