RulesHelper = {
  executeRules(activity){
    const matchingRules = this.findMatchingRules(activity);
    for(let i = 0; i< matchingRules.length; i++){
      const action = matchingRules[i].getAction();
      if(action !== undefined){
        this.performAction(activity, action);
      }
    }
  },
  findMatchingRules(activity){
    const activityType = activity.activityType;
    if(TriggersDef[activityType] === undefined){
      return [];
    }
    const matchingFields = TriggersDef[activityType].matchingFields;
    const matchingMap = this.buildMatchingFieldsMap(activity, matchingFields);
    const matchingTriggers = Triggers.find(matchingMap);
    const matchingRules = [];
    matchingTriggers.forEach(function(trigger){
      const rule = trigger.getRule();
      // Check that for some unknown reason there are some leftover triggers
      // not connected to any rules
      if(rule !== undefined){
        matchingRules.push(trigger.getRule());
      }
    });
    return matchingRules;
  },
  buildMatchingFieldsMap(activity, matchingFields){
    const matchingMap = {'activityType':activity.activityType};
    for(let i = 0; i< matchingFields.length; i++){
      // Creating a matching map with the actual field of the activity
      // and with the wildcard (for example: trigger when a card is added
      // in any [*] board
      matchingMap[matchingFields[i]] = { $in: [activity[matchingFields[i]], '*']};
    }
    return matchingMap;
  },
  performAction(activity, action){
    const card = Cards.findOne({_id:activity.cardId});
    const boardId = activity.boardId;
    if(action.actionType === 'moveCardToTop'){
      let listId;
      let list;
      if(action.listTitle === '*'){
        listId = card.listId;
        list = card.list();
      }else{
        list = Lists.findOne({title: action.listTitle, boardId });
        listId = list._id;
      }
      const minOrder = _.min(list.cardsUnfiltered(card.swimlaneId).map((c) => c.sort));
      card.move(card.swimlaneId, listId, minOrder - 1);
    }
    if(action.actionType === 'moveCardToBottom'){
      let listId;
      let list;
      if(action.listTitle === '*'){
        listId = card.listId;
        list = card.list();
      }else{
        list = Lists.findOne({title: action.listTitle, boardId});
        listId = list._id;
      }
      const maxOrder = _.max(list.cardsUnfiltered(card.swimlaneId).map((c) => c.sort));
      card.move(card.swimlaneId, listId, maxOrder + 1);
    }
    if(action.actionType === 'sendEmail'){
      const emailTo = action.emailTo;
      const emailMsg = action.emailMsg;
      const emailSubject = action.emailSubject;
      try {
        Email.send({
          emailTo,
          from: Accounts.emailTemplates.from,
          emailSubject,
          emailMsg,
        });
      } catch (e) {
        return;
      }
    }
    if(action.actionType === 'archive'){
      card.archive();
    }
    if(action.actionType === 'unarchive'){
      card.restore();
    }
    if(action.actionType === 'addLabel'){
      card.addLabel(action.labelId);
    }
    if(action.actionType === 'removeLabel'){
      card.removeLabel(action.labelId);
    }
    if(action.actionType === 'addMember'){
      const memberId = Users.findOne({username:action.username})._id;
      card.assignMember(memberId);
    }
    if(action.actionType === 'removeMember'){
      if(action.username === '*'){
        const members = card.members;
        for(let i = 0; i< members.length; i++){
          card.unassignMember(members[i]);
        }
      }else{
        const memberId = Users.findOne({username:action.username})._id;
        card.unassignMember(memberId);
      }
    }
    if(action.actionType === 'checkAll'){
      const checkList = Checklists.findOne({'title':action.checklistName, 'cardId':card._id});
      checkList.checkAllItems();
    }
    if(action.actionType === 'uncheckAll'){
      const checkList = Checklists.findOne({'title':action.checklistName, 'cardId':card._id});
      checkList.uncheckAllItems();
    }
    if(action.actionType === 'checkItem'){
      const checkList = Checklists.findOne({'title':action.checklistName, 'cardId':card._id});
      const checkItem = ChecklistItems.findOne({'title':action.checkItemName, 'checkListId':checkList._id});
      checkItem.check();
    }
    if(action.actionType === 'uncheckItem'){
      const checkList = Checklists.findOne({'title':action.checklistName, 'cardId':card._id});
      const checkItem = ChecklistItems.findOne({'title':action.checkItemName, 'checkListId':checkList._id});
      checkItem.uncheck();
    }
    if(action.actionType === 'addChecklist'){
      Checklists.insert({'title':action.checklistName, 'cardId':card._id, 'sort':0});
    }
    if(action.actionType === 'removeChecklist'){
      Checklists.remove({'title':action.checklistName, 'cardId':card._id, 'sort':0});
    }
    if(action.actionType === 'addSwimlane'){
      Swimlanes.insert({
        title: action.swimlaneName,
        boardId,
      });
    }
    if(action.actionType === 'addChecklistWithItems'){
      const checkListId = Checklists.insert({'title':action.checklistName, 'cardId':card._id, 'sort':0});
      const itemsArray = action.checklistItems.split(',');
      for(let i = 0; i <itemsArray.length; i++){
        ChecklistItems.insert({title:itemsArray[i], checklistId:checkListId, cardId:card._id, 'sort':0});
      }
    }
    if(action.actionType === 'createCard'){
      const list = Lists.findOne({title:action.listName, boardId});
      let listId = '';
      let swimlaneId = '';
      const swimlane = Swimlanes.findOne({title:action.swimlaneName, boardId});
      if(list === undefined){
        listId = '';
      }else{
        listId = list._id;
      }
      if(swimlane === undefined){
        swimlaneId = Swimlanes.findOne({title:'Default', boardId})._id;
      }else{
        swimlaneId = swimlane._id;
      }
      Cards.insert({title:action.cardName, listId, swimlaneId, sort:0, boardId});
    }

  },

};
