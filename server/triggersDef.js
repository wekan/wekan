TriggersDef = {
	createCard:{
		matchingFields: ["boardId", "listId"]
	},
	moveCard:{
		matchingFields: ["boardId", "listId", "oldListId"]
	},
	archivedCard:{
		matchingFields: ["boardId"]
	},
	restoredCard:{
		matchingFields: ["boardId"]
	},
	joinMember:{
		matchingFields: ["boardId","memberId"]
	},
	unJoinMember:{
		matchingFields: ["boardId","memberId"]
	},
	addChecklist:{
		matchingFields: ["boardId","checklistId"]
	},
	addChecklistItem:{
		matchingFields: ["boardId","checklistItemId"]
	}
}



