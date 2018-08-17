BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },
  events() {
    return [
    {'click .js-add-gen-check-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#gen-check-action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "created"){
        Triggers.insert({activityType: "addChecklist","boardId":boardId,"checklistName":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "removeChecklist","boardId":boardId,"checklistName":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-spec-check-trigger'(event) {
      let datas = this.data();
      const actionSelected = this.find('#spec-check-action').value;
      const checklistId = this.find('#check-name').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "created"){
        Triggers.insert({activityType: "addChecklist","boardId":boardId,"checklistName":checklistId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "removeChecklist","boardId":boardId,"checklistName":checklistId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-gen-comp-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#gen-comp-check-action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "completed"){
        Triggers.insert({activityType: "completeChecklist","boardId":boardId,"checklistName":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "uncompleted"){
        Triggers.insert({activityType: "uncompleteChecklist","boardId":boardId,"checklistName":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-spec-comp-trigger'(event) {
      let datas = this.data();
      const actionSelected = this.find('#spec-comp-check-action').value;
      const checklistId = this.find('#spec-comp-check-name').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        Triggers.insert({activityType: "joinMember","boardId":boardId,"checklistName":checklistId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "unjoinMember","boardId":boardId,"checklistName":checklistId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-gen-check-item-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#check-item-gen-action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "checked"){
        Triggers.insert({activityType: "checkedItem","boardId":boardId,"checklistItemName":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "unchecked"){
        Triggers.insert({activityType: "uncheckedItem","boardId":boardId,"checklistItemName":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-spec-check-item-trigger'(event) {
      let datas = this.data();
      const actionSelected = this.find('#check-item-spec-action').value;
      const checklistItemId = this.find('#check-item-name').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        Triggers.insert({activityType: "joinMember","boardId":boardId,"checklistItemName":checklistItemId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "unjoinMember","boardId":boardId,"checklistItemName":checklistItemId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    }];
  },

}).register('checklistTriggers');


