RulesHelper = {
	executeRules(activity){
		const matchingRules = this.findMatchingRules(activity);
		console.log(matchingRules);
		for(let i = 0;i< matchingRules.length;i++){
			console.log(matchingRules[i]);
			const actionType = matchingRules[i].getAction().actionType;
			this.performAction(activity,actionType);
		}
	},

	performAction(activity,actionType){
		if(actionType == "moveCardToTop"){
			const card = Cards.findOne({_id:activity.cardId});
		    const minOrder = _.min(card.list().cards(card.swimlaneId).map((c) => c.sort));
		    card.move(card.swimlaneId, card.listId, minOrder - 1);
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
	}

}