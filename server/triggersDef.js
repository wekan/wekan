TriggersDef = {
  createCard:{
    matchingFields: ['boardId', 'listName'],
  },
  moveCard:{
    matchingFields: ['boardId', 'listName', 'oldListName'],
  },
  archivedCard:{
    matchingFields: ['boardId'],
  },
  restoredCard:{
    matchingFields: ['boardId'],
  },
  joinMember:{
    matchingFields: ['boardId', 'memberId'],
  },
  unjoinMember:{
    matchingFields: ['boardId', 'memberId'],
  },
  addChecklist:{
    matchingFields: ['boardId', 'checklistName'],
  },
  removeChecklist:{
    matchingFields: ['boardId', 'checklistName'],
  },
  completeChecklist:{
    matchingFields: ['boardId', 'checklistName'],
  },
  uncompleteChecklist:{
    matchingFields: ['boardId', 'checklistName'],
  },
  addedChecklistItem:{
    matchingFields: ['boardId', 'checklistItemName'],
  },
  removedChecklistItem:{
    matchingFields: ['boardId', 'checklistItemName'],
  },
  checkedItem:{
    matchingFields: ['boardId', 'checklistItemName'],
  },
  uncheckedItem:{
    matchingFields: ['boardId', 'checklistItemName'],
  },
  addAttachment:{
    matchingFields: ['boardId'],
  },
  deleteAttachment:{
    matchingFields: ['boardId'],
  },
  addedLabel:{
    matchingFields: ['boardId', 'labelId'],
  },
  removedLabel:{
    matchingFields: ['boardId', 'labelId'],
  },
};


