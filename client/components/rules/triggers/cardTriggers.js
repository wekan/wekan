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
        datas.triggerVar.set({activityType: "addedLabel","boardId":boardId,"labelId":"*"});
      }
      if(actionSelected == "removed"){
        datas.triggerVar.set({activityType: "removedLabel","boardId":boardId,"labelId":"*"});
      }
    },
    'click .js-add-spec-label-trigger'(event) {
      let datas = this.data();
      const actionSelected = this.find('#spec-label-action').value;
      const labelId = this.find('#spec-label').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        datas.triggerVar.set({activityType: "addedLabel","boardId":boardId,"labelId":labelId});
      }
      if(actionSelected == "removed"){
        datas.triggerVar.set({activityType: "removedLabel","boardId":boardId,"labelId":labelId});
      }
    },
    'click .js-add-gen-member-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#gen-member-action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        datas.triggerVar.set({activityType: "joinMember","boardId":boardId,"memberId":"*"});
      }
      if(actionSelected == "removed"){
        datas.triggerVar.set({activityType: "unjoinMember","boardId":boardId,"memberId":"*"});
      }
    },
    'click .js-add-spec-member-trigger'(event) {
      let datas = this.data();
      const actionSelected = this.find('#spec-member-action').value;
      const memberId = this.find('#spec-member').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        datas.triggerVar.set({activityType: "joinMember","boardId":boardId,"memberId":memberId});
      }
      if(actionSelected == "removed"){
        datas.triggerVar.set({activityType: "unjoinMember","boardId":boardId,"memberId":memberId});
      }
    },
    'click .js-add-attachment-trigger'(event) {

      let datas = this.data();
      const actionSelected = this.find('#attach-action').value;
      const boardId = Session.get('currentBoard')
      if(actionSelected == "added"){
        datas.triggerVar.set({activityType: "addAttachment","boardId":boardId});
      }
      if(actionSelected == "removed"){
        datas.triggerVar.set({activityType: "deleteAttachment","boardId":boardId});
      }
    },
    }];
  },

}).register('cardTriggers');


