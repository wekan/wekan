//var nodemailer = require('nodemailer');

RulesHelper = {
  executeRules(activity) {
    const matchingRules = this.findMatchingRules(activity);
    for (let i = 0; i < matchingRules.length; i++) {
      const action = matchingRules[i].getAction();
      if (action !== undefined) {
        this.performAction(activity, action);
      }
    }
  },
  findMatchingRules(activity) {
    const activityType = activity.activityType;
    if (TriggersDef[activityType] === undefined) {
      return [];
    }
    const matchingFields = TriggersDef[activityType].matchingFields;
    const matchingMap = this.buildMatchingFieldsMap(activity, matchingFields);
    const matchingTriggers = Triggers.find(matchingMap);
    const matchingRules = [];
    matchingTriggers.forEach(function(trigger) {
      const rule = trigger.getRule();
      // Check that for some unknown reason there are some leftover triggers
      // not connected to any rules
      if (rule !== undefined) {
        matchingRules.push(trigger.getRule());
      }
    });
    return matchingRules;
  },
  buildMatchingFieldsMap(activity, matchingFields) {
    const matchingMap = { activityType: activity.activityType };
    matchingFields.forEach(field => {
      // Creating a matching map with the actual field of the activity
      // and with the wildcard (for example: trigger when a card is added
      // in any [*] board
      let value = activity[field];
      if (field === 'oldListName') {
        const oldList = Lists.findOne({ _id: activity.oldListId });
        if (oldList) {
          value = oldList.title;
        }
      } else if (field === 'oldSwimlaneName') {
        const oldSwimlane = Swimlanes.findOne({ _id: activity.oldSwimlaneId });
        if (oldSwimlane) {
          value = oldSwimlane.title;
        }
      }
      let matchesList = [value, '*'];
      if ((field === 'cardTitle') && (value !== undefined)) {
        matchesList = value.split(/\W/).concat(matchesList);
      }
      matchingMap[field] = {
        $in: matchesList,
      };
    });
    return matchingMap;
  },
  performAction(activity, action) {
    const card = Cards.findOne({ _id: activity.cardId });
    const boardId = activity.boardId;
    if (
      action.actionType === 'moveCardToTop' ||
      action.actionType === 'moveCardToBottom'
    ) {
      let list;
      let listId;
      if (action.listName === '*') {
        list = card.list();
        if (boardId !== action.boardId) {
          list = Lists.findOne({ title: list.title, boardId: action.boardId });
        }
      } else {
        list = Lists.findOne({
          title: action.listName,
          boardId: action.boardId,
        });
      }
      if (list === undefined) {
        listId = '';
      } else {
        listId = list._id;
      }

      let swimlane;
      let swimlaneId;
      if (action.swimlaneName === '*') {
        swimlane = Swimlanes.findOne(card.swimlaneId);
        if (boardId !== action.boardId) {
          swimlane = Swimlanes.findOne({
            title: swimlane.title,
            boardId: action.boardId,
          });
        }
      } else {
        swimlane = Swimlanes.findOne({
          title: action.swimlaneName,
          boardId: action.boardId,
        });
      }
      if (swimlane === undefined) {
        swimlaneId = Swimlanes.findOne({
          title: 'Default',
          boardId: action.boardId,
        })._id;
      } else {
        swimlaneId = swimlane._id;
      }

      if (action.actionType === 'moveCardToTop') {
        const minOrder = _.min(
          list.cardsUnfiltered(swimlaneId).map(c => c.sort),
        );
        card.move(action.boardId, swimlaneId, listId, minOrder - 1);
      } else {
        const maxOrder = _.max(
          list.cardsUnfiltered(swimlaneId).map(c => c.sort),
        );
        card.move(action.boardId, swimlaneId, listId, maxOrder + 1);
      }
    }
    if (action.actionType === 'sendEmail') {
      const to = action.emailTo;
      const text = action.emailMsg || '';
      const subject = action.emailSubject || '';
      try {
/*
        if (process.env.MAIL_SERVICE !== '') {
          let transporter = nodemailer.createTransport({
            service: process.env.MAIL_SERVICE,
            auth: {
              user: process.env.MAIL_SERVICE_USER,
              pass: process.env.MAIL_SERVICE_PASSWORD
            },
          })
          let info = transporter.sendMail({
            to,
            from: Accounts.emailTemplates.from,
            subject,
            text,
          })
        } else {
          Email.send({
            to,
            from: Accounts.emailTemplates.from,
            subject,
            text,
          });
        }
*/
        Email.send({
          to,
          from: Accounts.emailTemplates.from,
          subject,
          text,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        return;
      }
    }

    if (action.actionType === 'setDate') {
      try {
        const currentDateTime = new Date();
        switch (action.dateField) {
          case 'startAt': {
            const resStart = card.getStart();
            if (typeof resStart === 'undefined') {
              card.setStart(currentDateTime);
            }
            break;
          }
          case 'endAt': {
            const resEnd = card.getEnd();
            if (typeof resEnd === 'undefined') {
              card.setEnd(currentDateTime);
            }
            break;
          }
          case 'dueAt': {
            const resDue = card.getDue();
            if (typeof resDue === 'undefined') {
              card.setDue(currentDateTime);
            }
            break;
          }
          case 'receivedAt': {
            const resReceived = card.getReceived();
            if (typeof resReceived === 'undefined') {
              card.setReceived(currentDateTime);
            }
            break;
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        return;
      }
    }

    if (action.actionType === 'updateDate') {
      const currentDateTimeUpdate = new Date();
      switch (action.dateField) {
        case 'startAt': {
          card.setStart(currentDateTimeUpdate);
          break;
        }
        case 'endAt': {
          card.setEnd(currentDateTimeUpdate);
          break;
        }
        case 'dueAt': {
          card.setDue(currentDateTimeUpdate);
          break;
        }
        case 'receivedAt': {
          card.setReceived(currentDateTimeUpdate);
          break;
        }
      }
    }

    if (action.actionType === 'removeDate') {
      switch (action.dateField) {
        case 'startAt': {
          card.unsetStart();
          break;
        }
        case 'endAt': {
          card.unsetEnd();
          break;
        }
        case 'dueAt': {
          card.unsetDue();
          break;
        }
        case 'receivedAt': {
          card.unsetReceived();
          break;
        }
      }
    }
    if (action.actionType === 'archive') {
      card.archive();
    }
    if (action.actionType === 'unarchive') {
      card.restore();
    }
    if (action.actionType === 'setColor') {
      card.setColor(action.selectedColor);
    }
    if (action.actionType === 'addLabel') {
      card.addLabel(action.labelId);
    }
    if (action.actionType === 'removeLabel') {
      card.removeLabel(action.labelId);
    }
    if (action.actionType === 'addMember') {
      const memberId = Users.findOne({ username: action.username })._id;
      card.assignMember(memberId);
    }
    if (action.actionType === 'removeMember') {
      if (action.username === '*') {
        const members = card.members;
        for (let i = 0; i < members.length; i++) {
          card.unassignMember(members[i]);
        }
      } else {
        const memberId = Users.findOne({ username: action.username })._id;
        card.unassignMember(memberId);
      }
    }
    if (action.actionType === 'checkAll') {
      const checkList = Checklists.findOne({
        title: action.checklistName,
        cardId: card._id,
      });
      checkList.checkAllItems();
    }
    if (action.actionType === 'uncheckAll') {
      const checkList = Checklists.findOne({
        title: action.checklistName,
        cardId: card._id,
      });
      checkList.uncheckAllItems();
    }
    if (action.actionType === 'checkItem') {
      const checkList = Checklists.findOne({
        title: action.checklistName,
        cardId: card._id,
      });
      const checkItem = ChecklistItems.findOne({
        title: action.checkItemName,
        checkListId: checkList._id,
      });
      checkItem.check();
    }
    if (action.actionType === 'uncheckItem') {
      const checkList = Checklists.findOne({
        title: action.checklistName,
        cardId: card._id,
      });
      const checkItem = ChecklistItems.findOne({
        title: action.checkItemName,
        checkListId: checkList._id,
      });
      checkItem.uncheck();
    }
    if (action.actionType === 'addChecklist') {
      Checklists.insert({
        title: action.checklistName,
        cardId: card._id,
        sort: 0,
      });
    }
    if (action.actionType === 'removeChecklist') {
      Checklists.remove({
        title: action.checklistName,
        cardId: card._id,
        sort: 0,
      });
    }
    if (action.actionType === 'addSwimlane') {
      Swimlanes.insert({
        title: action.swimlaneName,
        boardId,
        sort: 0,
      });
    }
    if (action.actionType === 'addChecklistWithItems') {
      const checkListId = Checklists.insert({
        title: action.checklistName,
        cardId: card._id,
        sort: 0,
      });
      const itemsArray = action.checklistItems.split(',');
      const checkList = Checklists.findOne({ _id: checkListId });
      for (let i = 0; i < itemsArray.length; i++) {
        ChecklistItems.insert({
          title: itemsArray[i],
          checklistId: checkListId,
          cardId: card._id,
          sort: checkList.itemCount(),
        });
      }
    }
    if (action.actionType === 'createCard') {
      const list = Lists.findOne({ title: action.listName, boardId });
      let listId = '';
      let swimlaneId = '';
      const swimlane = Swimlanes.findOne({
        title: action.swimlaneName,
        boardId,
      });
      if (list === undefined) {
        listId = '';
      } else {
        listId = list._id;
      }
      if (swimlane === undefined) {
        swimlaneId = Swimlanes.findOne({ title: 'Default', boardId })._id;
      } else {
        swimlaneId = swimlane._id;
      }
      Cards.insert({
        title: action.cardName,
        listId,
        swimlaneId,
        sort: 0,
        boardId,
      });
    }
  },
};
