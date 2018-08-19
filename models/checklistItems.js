ChecklistItems = new Mongo.Collection('checklistItems');

ChecklistItems.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  sort: {
    type: Number,
    decimal: true,
  },
  isFinished: {
    type: Boolean,
    defaultValue: false,
  },
  checklistId: {
    type: String,
  },
  cardId: {
    type: String,
  },
}));

ChecklistItems.allow({
  insert(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  update(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  remove(userId, doc) {
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));
  },
  fetch: ['userId', 'cardId'],
});

ChecklistItems.before.insert((userId, doc) => {
  if (!doc.userId) {
    doc.userId = userId;
  }
});

// Mutations
ChecklistItems.mutations({
  setTitle(title) {
    return { $set: { title } };
  },
  check(){
    return { $set: { isFinished: true } };
  },
  uncheck(){
    return { $set: { isFinished: false } };
  },
  toggleItem() {
    return { $set: { isFinished: !this.isFinished } };
  },
  move(checklistId, sortIndex) {
    const cardId = Checklists.findOne(checklistId).cardId;
    const mutatedFields = {
      cardId,
      checklistId,
      sort: sortIndex,
    };

    return {$set: mutatedFields};
  },
});

// Activities helper
function itemCreation(userId, doc) {
  const card = Cards.findOne(doc.cardId);
  const boardId = card.boardId;
  Activities.insert({
    userId,
    activityType: 'addChecklistItem',
    cardId: doc.cardId,
    boardId,
    checklistId: doc.checklistId,
    checklistItemId: doc._id,
    checklistItemName:doc.title
  });
}

function itemRemover(userId, doc) {
  const card = Cards.findOne(doc.cardId);
  const boardId = card.boardId;
  Activities.insert({
    userId,
    activityType: 'removedChecklistItem',
    cardId: doc.cardId,
    boardId,
    checklistId: doc.checklistId,
    checklistItemId: doc._id,
    checklistItemName:doc.title
  });
  Activities.remove({
    checklistItemId: doc._id,
  });
}

function publishCheckActivity(userId,doc){
  const card = Cards.findOne(doc.cardId);
  const boardId = card.boardId;
  let activityType;
  if(doc.isFinished){
    activityType = "checkedItem";
  }else{
    activityType = "uncheckedItem";
  }
  let act = {
    userId,
    activityType: activityType,
    cardId: doc.cardId,
    boardId,
    checklistId: doc.checklistId,
    checklistItemId: doc._id,
    checklistItemName:doc.title
  }
  console.log(act);
  Activities.insert(act);
}

function publishChekListCompleted(userId,doc,fieldNames,modifier){
  const card = Cards.findOne(doc.cardId);
  const boardId = card.boardId;
  const checklistId = doc.checklistId;
  const checkList = Checklists.findOne({_id:checklistId});
  if(checkList.isFinished()){
    let act = {
      userId,
      activityType: "checklistCompleted",
      cardId: doc.cardId,
      boardId,
      checklistId: doc.checklistId,
      checklistName:doc.title
    }
    Activities.insert(act);
  }
}

function publishChekListUncompleted(userId,doc,fieldNames,modifier){
  const card = Cards.findOne(doc.cardId);
  const boardId = card.boardId;
  const checklistId = doc.checklistId;
  const checkList = Checklists.findOne({_id:checklistId});
  if(checkList.isFinished()){
    let act = {
      userId,
      activityType: "checklistUncompleted",
      cardId: doc.cardId,
      boardId,
      checklistId: doc.checklistId,
      checklistName:doc.title
    }
    Activities.insert(act);
  }
}

// Activities
if (Meteor.isServer) {
  Meteor.startup(() => {
    ChecklistItems._collection._ensureIndex({ checklistId: 1 });
  });

  ChecklistItems.after.update((userId, doc, fieldNames, modifier) => {
    publishCheckActivity(userId,doc);
    publishChekListCompleted(userId,doc,fieldNames,modifier)
  });

  ChecklistItems.before.update((userId, doc, fieldNames, modifier) => {
    publishChekListUncompleted(userId,doc,fieldNames,modifier)
  });



  ChecklistItems.after.insert((userId, doc) => {
    itemCreation(userId, doc);
  });

  ChecklistItems.after.remove((userId, doc) => {
    itemRemover(userId, doc);
  });
}

if (Meteor.isServer) {
  JsonRoutes.add('GET', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramItemId = req.params.itemId;
    const checklistItem = ChecklistItems.findOne({ _id: paramItemId });
    if (checklistItem) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: checklistItem,
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 500,
      });
    }
  });

  JsonRoutes.add('PUT', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId', function (req, res) {
    Authentication.checkUserId( req.userId);

    const paramItemId = req.params.itemId;

    if (req.body.hasOwnProperty('isFinished')) {
      ChecklistItems.direct.update({_id: paramItemId}, {$set: {isFinished: req.body.isFinished}});
    }
    if (req.body.hasOwnProperty('title')) {
      ChecklistItems.direct.update({_id: paramItemId}, {$set: {title: req.body.title}});
    }

    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramItemId,
      },
    });
  });

  JsonRoutes.add('DELETE', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramItemId = req.params.itemId;
    ChecklistItems.direct.remove({ _id: paramItemId });
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramItemId,
      },
    });
  });
}
