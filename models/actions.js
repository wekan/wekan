Actions = new Mongo.Collection('actions');


Actions.allow({
	insert(userId, doc) {
		return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
	},
	update(userId, doc) {
		return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
	},
	remove(userId, doc) {
		return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
	}
});


Actions.helpers({
	description() {
		if(this.actionType == "moveCardToTop"){
			if(this.listTitle == "*"){
				return TAPi18n.__('r-d-move-to-top-gen');
			}else{
				return TAPi18n.__('r-d-move-to-top-spec') + " " + this.listTitle;
			}
		}
		if(this.actionType == "moveCardToBottom"){
			if(this.listTitle == "*"){
				return TAPi18n.__('r-d-move-to-bottom-gen');
			}else{
				return TAPi18n.__('r-d-move-to-bottom-spec') + " " + this.listTitle;
			}
		}
		if(this.actionType == "sendEmail"){
			const to = " " + TAPi18n.__('r-d-send-email-to') + ": " + this.emailTo + ", ";
			const subject = TAPi18n.__('r-d-send-email-subject') + ": " + this.emailSubject + ", ";
			const message = TAPi18n.__('r-d-send-email-message') + ": " + this.emailMsg;
			const total = TAPi18n.__('r-d-send-email') + to + subject + message;
			return total;
		}
		if(this.actionType == "archive"){
			return TAPi18n.__('r-d-archive');
		}
		if(this.actionType == "unarchive"){
			return TAPi18n.__('r-d-unarchive');
		}
		if(this.actionType == "addLabel"){
			const board = Boards.findOne(Session.get('currentBoard'));
			const label = board.getLabelById(this.labelId);
			let name;
			if(label.name == "" || label.name == undefined){
        		name = label.color.toUpperCase();
      		}else{
      			name = label.name;
      		}
    		
			return TAPi18n.__('r-d-add-label') + ": "+name;
		}
		if(this.actionType == "removeLabel"){
			const board = Boards.findOne(Session.get('currentBoard'));
			const label = board.getLabelById(this.labelId);
			let name;
			if(label.name == "" || label.name == undefined){
        		name = label.color.toUpperCase();
      		}else{
      			name = label.name;
      		}
			return TAPi18n.__('r-d-remove-label') + ": " + name;
		}
		if(this.actionType == "addMember"){
			return TAPi18n.__('r-d-add-member') + ": " + this.memberName;
		}
		if(this.actionType == "removeMember"){
			if(this.memberName == "*"){
				return TAPi18n.__('r-d-remove-all-member');
			}
			return TAPi18n.__('r-d-remove-member') + ": "+ this.memberName;
		}
		if(this.actionType == "checkAll"){
			return TAPi18n.__('r-d-check-all') + ": " + this.checklistName;
		}
		if(this.actionType == "uncheckAll"){
			return TAPi18n.__('r-d-uncheck-all') + ": "+ this.checklistName;
		}
		if(this.actionType == "checkItem"){
			return TAPi18n.__('r-d-check-one') + ": "+ this.checkItemName + " " + TAPi18n.__('r-d-check-of-list') + ": " +this.checklistName;
		}
		if(this.actionType == "uncheckItem"){
			return TAPi18n.__('r-d-check-one') + ": "+ this.checkItemName + " " + TAPi18n.__('r-d-check-of-list') + ": " +this.checklistName;
		}
		if(this.actionType == "addChecklist"){
			return TAPi18n.__('r-d-add-checklist') + ": "+ this.checklistName;
		}
		if(this.actionType == "removeChecklist"){
			return TAPi18n.__('r-d-remove-checklist') + ": "+ this.checklistName;
		}

	 return "Ops not trigger description";
	}
});











