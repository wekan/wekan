RulesHelper = {
	executeRules(activity){
		const matchingRules = this.findMatchingRules(activity);
		for(let i = 0;i< matchingRules.length;i++){
			const action = matchingRules[i].getAction();
			this.performAction(activity,action);
		}
	},
	findMatchingRules(activity){
		const activityType = activity.activityType;
		if(TriggersDef[activityType] == undefined){
			return [];
		}
		const matchingFields = TriggersDef[activityType].matchingFields;
		const matchingMap = this.buildMatchingFieldsMap(activity,matchingFields);
		let matchingTriggers = Triggers.find(matchingMap);
		let matchingRules = [];
		matchingTriggers.forEach(function(trigger){
			matchingRules.push(trigger.getRule());
		});
		return matchingRules;
	},
	buildMatchingFieldsMap(activity, matchingFields){
		let matchingMap = {"activityType":activity.activityType};
		for(let i = 0;i< matchingFields.length;i++){
			// Creating a matching map with the actual field of the activity
			// and with the wildcard (for example: trigger when a card is added
			// in any [*] board
			matchingMap[matchingFields[i]] = { $in: [activity[matchingFields[i]],"*"]};
		}
		return matchingMap;
	},
	performAction(activity,action){
		const card = Cards.findOne({_id:activity.cardId});
		const boardId = activity.boardId;
		if(action.actionType == "moveCardToTop"){
			let listId;
			let list;
			if(activity.listTitle == "*"){
				listId = card.swimlaneId;
				list = card.list();
			}else{
				list = Lists.findOne({title: action.listTitle, boardId:boardId });;
				listId = list._id;
			}
			const minOrder = _.min(list.cards(card.swimlaneId).map((c) => c.sort));
			card.move(card.swimlaneId, listId, minOrder - 1);
		}
		if(action.actionType == "moveCardToBottom"){
			let listId;
			let list;
			if(activity.listTitle == "*"){
				listId = card.swimlaneId;
				list = card.list();
			}else{
				list = Lists.findOne({title: action.listTitle, boardId:boardId});
				listId = list._id;
			}
			const maxOrder = _.max(list.cards(card.swimlaneId).map((c) => c.sort));
    		card.move(card.swimlaneId, listId, maxOrder + 1);
		}
		if(action.actionType == "sendEmail"){
			const emailTo = action.emailTo;
			const emailMsg = action.emailMsg;
			const emailSubject = action.emailSubject;
			try {
				Email.send({
					to: to,
					from: Accounts.emailTemplates.from,
					subject: subject,
					text,
				});
			} catch (e) {
				return;
			}
		}
		if(action.actionType == "archive"){
			card.archive();
		}
		if(action.actionType == "unarchive"){
			card.restore();
		}
		if(action.actionType == "addLabel"){
			card.addLabel(action.labelId);
		}
		if(action.actionType == "removeLabel"){
			card.removeLabel(action.labelId);
		}
		if(action.actionType == "addMember"){
			const memberId = Users.findOne({username:action.memberName})._id;
			card.assignMember(memberId);
		}
		if(action.actionType == "removeMember"){
			if(action.memberName == "*"){
				const members = card.members;
				for(let i = 0;i< members.length;i++){
					card.unassignMember(members[i]);
				}
			}else{
				const memberId = Users.findOne({username:action.memberName})._id;
				card.unassignMember(memberId);
			}
		}
		if(action.actionType == "checkAll"){
			const checkList = Checklists.findOne({"title":action.checklistName,"cardId":card._id});
			checkList.checkAllItems();
		}
		if(action.actionType == "uncheckAll"){
			const checkList = Checklists.findOne({"title":action.checklistName,"cardId":card._id});
			checkList.uncheckAllItems();
		}
		if(action.actionType == "checkItem"){
			const checkList = Checklists.findOne({"title":action.checklistName,"cardId":card._id});
			const checkItem = ChecklistItems.findOne({"title":action.checkItemName,"checkListId":checkList._id})
			checkItem.check();
		}
		if(action.actionType == "uncheckItem"){
			const checkList = Checklists.findOne({"title":action.checklistName,"cardId":card._id});
			const checkItem = ChecklistItems.findOne({"title":action.checkItemName,"checkListId":checkList._id})
			checkItem.uncheck();
		}
		if(action.actionType == "addChecklist"){
			Checklists.insert({"title":action.checklistName,"cardId":card._id,"sort":0});
		}
		if(action.actionType == "removeChecklist"){
			Checklists.remove({"title":action.checklistName,"cardId":card._id,"sort":0});
		}

	},

}