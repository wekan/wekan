BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },
  labels() {
    const labels = Boards.findOne(Session.get('currentBoard')).labels;
    console.log(labels);
    for (let i = 0; i < labels.length; i++) {
      if (labels[i].name == "" || labels[i].name == undefined) {
        labels[i].name = labels[i].color.toUpperCase();
      }
    }
    console.log(labels);
    return labels;
  },
  events() {
    return [{
      'click .js-add-gen-label-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        let datas = this.data();
        const actionSelected = this.find('#label-action').value;
        const boardId = Session.get('currentBoard')
        if (actionSelected == "added") {
          datas.triggerVar.set({
            activityType: "addedLabel",
            "boardId": boardId,
            "labelId": "*",
            "desc": desc
          });
        }
        if (actionSelected == "removed") {
          datas.triggerVar.set({
            activityType: "removedLabel",
            "boardId": boardId,
            "labelId": "*",
            "desc": desc
          });
        }
      },
      'click .js-add-spec-label-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        let datas = this.data();
        const actionSelected = this.find('#spec-label-action').value;
        const labelId = this.find('#spec-label').value;
        const boardId = Session.get('currentBoard')
        if (actionSelected == "added") {
          datas.triggerVar.set({
            activityType: "addedLabel",
            "boardId": boardId,
            "labelId": labelId,
            "desc": desc
          });
        }
        if (actionSelected == "removed") {
          datas.triggerVar.set({
            activityType: "removedLabel",
            "boardId": boardId,
            "labelId": labelId,
            "desc": desc
          });
        }
      },
      'click .js-add-gen-member-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        let datas = this.data();
        const actionSelected = this.find('#gen-member-action').value;
        const boardId = Session.get('currentBoard')
        if (actionSelected == "added") {
          datas.triggerVar.set({
            activityType: "joinMember",
            "boardId": boardId,
            "memberId": "*",
            "desc": desc
          });
        }
        if (actionSelected == "removed") {
          datas.triggerVar.set({
            activityType: "unjoinMember",
            "boardId": boardId,
            "memberId": "*",
            "desc": desc
          });
        }
      },
      'click .js-add-spec-member-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        let datas = this.data();
        const actionSelected = this.find('#spec-member-action').value;
        const memberId = this.find('#spec-member').value;
        const boardId = Session.get('currentBoard')
        if (actionSelected == "added") {
          datas.triggerVar.set({
            activityType: "joinMember",
            "boardId": boardId,
            "memberId": memberId,
            "desc": desc
          });
        }
        if (actionSelected == "removed") {
          datas.triggerVar.set({
            activityType: "unjoinMember",
            "boardId": boardId,
            "memberId": memberId,
            "desc": desc
          });
        }
      },
      'click .js-add-attachment-trigger' (event) {
        const desc = Utils.getTriggerActionDesc(event, this);
        let datas = this.data();
        const actionSelected = this.find('#attach-action').value;
        const boardId = Session.get('currentBoard')
        if (actionSelected == "added") {
          datas.triggerVar.set({
            activityType: "addAttachment",
            "boardId": boardId,
            "desc": desc
          });
        }
        if (actionSelected == "removed") {
          datas.triggerVar.set({
            activityType: "deleteAttachment",
            "boardId": boardId,
            "desc": desc
          });
        }
      },
    }];
  },
}).register('cardTriggers');