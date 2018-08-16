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
	unjoinMember:{
		matchingFields: ["boardId","memberId"]
	},
	addChecklist:{
		matchingFields: ["boardId","checklistId"]
	},
	removeChecklist:{
		matchingFields: ["boardId","checklistId"]
	},
	completeChecklist:{
		matchingFields: ["boardId","checklistId"]
	},
	uncompleteChecklist:{
		matchingFields: ["boardId","checklistId"]
	},
	addedChecklistItem:{
		matchingFields: ["boardId","checklistItemId"]
	},
	removedChecklistItem:{
		matchingFields: ["boardId","checklistItemId"]
	},
	checkedItem:{
		matchingFields: ["boardId","checklistItemId"]
	},
	uncheckedItem:{
		matchingFields: ["boardId","checklistItemId"]
	},
	addAttachment:{
		matchingFields: ["boardId"]
	},
	deleteAttachment:{
		matchingFields: ["boardId"]
	},
	addedLabel:{
		matchingFields: ["boardId","labelId"]
	},
	removedLabel:{
		matchingFields: ["boardId","labelId"]
	}
}



