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
    {'click .js-add-gen-label-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#label-action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        Triggers.insert({activityType: "addedLabel","boardId":boardId,"labelId":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "removedLabel","boardId":boardId,"labelId":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-spec-label-trigger'(event) {
      let datas = this.data();
      const actionSelected = this.find('#spec-label-action').value;
      const labelId = this.find('#spec-label').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        Triggers.insert({activityType: "addedLabel","boardId":boardId,"labelId":labelId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "removedLabel","boardId":boardId,"labelId":labelId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-gen-member-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#gen-member-action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        Triggers.insert({activityType: "joinMember","boardId":boardId,"memberId":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "unjoinMember","boardId":boardId,"memberId":"*"},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-spec-member-trigger'(event) {
      let datas = this.data();
      const actionSelected = this.find('#spec-member-action').value;
      const memberId = this.find('#spec-member').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        Triggers.insert({activityType: "joinMember","boardId":boardId,"memberId":memberId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "unjoinMember","boardId":boardId,"memberId":memberId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    'click .js-add-attachment-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#attach-action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        Triggers.insert({activityType: "addAttachment","boardId":boardId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
      if(actionSelected == "removed"){
        Triggers.insert({activityType: "deleteAttachment","boardId":boardId},function(error,id){
          datas.triggerIdVar.set(id);
        });
      }
    },
    }];
  },

}).register('cardTriggers');


