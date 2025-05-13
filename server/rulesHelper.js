import { ReactiveCache } from '/imports/reactiveCache';

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
    const matchingTriggers = ReactiveCache.getTriggers(matchingMap);
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
        const oldList = ReactiveCache.getList(activity.oldListId);
        if (oldList) {
          value = oldList.title;
        }
      } else if (field === 'oldSwimlaneName') {
        const oldSwimlane = ReactiveCache.getSwimlane(activity.oldSwimlaneId);
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
    const card = ReactiveCache.getCard(activity.cardId);
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
          list = ReactiveCache.getList({ title: list.title, boardId: action.boardId });
        }
      } else {
        list = ReactiveCache.getList({
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
        swimlane = ReactiveCache.getSwimlane(card.swimlaneId);
        if (boardId !== action.boardId) {
          swimlane = ReactiveCache.getSwimlane({
            title: swimlane.title,
            boardId: action.boardId,
          });
        }
      } else {
        swimlane = ReactiveCache.getSwimlane({
          title: action.swimlaneName,
          boardId: action.boardId,
        });
      }
      if (swimlane === undefined) {
        swimlaneId = ReactiveCache.getSwimlane({
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
        // Try to detect the recipient's language preference if it's a Wekan user
        // Otherwise, use the default language for the rule-triggered emails
        let recipientUser = null;
        let recipientLang = TAPi18n.getLanguage() || 'en';

        // Check if recipient is a Wekan user to get their language
        if (to && to.includes('@')) {
          recipientUser = ReactiveCache.getUser({ 'emails.address': to.toLowerCase() });
          if (recipientUser && typeof recipientUser.getLanguage === 'function') {
            recipientLang = recipientUser.getLanguage();
          }
        }

        // Use EmailLocalization if available
        if (typeof EmailLocalization !== 'undefined') {
          EmailLocalization.sendEmail({
            to,
            from: Accounts.emailTemplates.from,
            subject,
            text,
            language: recipientLang,
            userId: recipientUser ? recipientUser._id : null
          });
        } else {
          // Fallback to standard Email.send
          Email.send({
            to,
            from: Accounts.emailTemplates.from,
            subject,
            text,
          });
        }
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
      const memberId = ReactiveCache.getUser({ username: action.username })._id;
      card.assignMember(memberId);
    }
    if (action.actionType === 'removeMember') {
      if (action.username === '*') {
        const members = card.members;
        for (let i = 0; i < members.length; i++) {
          card.unassignMember(members[i]);
        }
      } else {
        const memberId = ReactiveCache.getUser({ username: action.username })._id;
        card.unassignMember(memberId);
      }
    }
    if (action.actionType === 'checkAll') {
      const checkList = ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      checkList.checkAllItems();
    }
    if (action.actionType === 'uncheckAll') {
      const checkList = ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      checkList.uncheckAllItems();
    }
    if (action.actionType === 'checkItem') {
      const checkList = ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      const checkItem = ReactiveCache.getChecklistItem({
        title: action.checkItemName,
        checkListId: checkList._id,
      });
      checkItem.check();
    }
    if (action.actionType === 'uncheckItem') {
      const checkList = ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      const checkItem = ReactiveCache.getChecklistItem({
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
      const checkList = ReactiveCache.getChecklist(checkListId);
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
      const list = ReactiveCache.getList({ title: action.listName, boardId });
      let listId = '';
      let swimlaneId = '';
      const swimlane = ReactiveCache.getSwimlane({
        title: action.swimlaneName,
        boardId,
      });
      if (list === undefined) {
        listId = '';
      } else {
        listId = list._id;
      }
      if (swimlane === undefined) {
        swimlaneId = ReactiveCache.getSwimlane({ title: 'Default', boardId })._id;
      } else {
        swimlaneId = swimlane._id;
      }
      Cards.insert({
        title: action.cardName,
        listId,
        swimlaneId,
        sort: 0,
        boardId
      });
    }
    if (action.actionType === 'linkCard') {
      const list = ReactiveCache.getList({ title: action.listName, boardId: action.boardId });
      const card = ReactiveCache.getCard(activity.cardId);
      let listId = '';
      let swimlaneId = '';
      const swimlane = ReactiveCache.getSwimlane({
        title: action.swimlaneName,
        boardId: action.boardId,
      });
      if (list === undefined) {
        listId = '';
      } else {
        listId = list._id;
      }
      if (swimlane === undefined) {
        swimlaneId = ReactiveCache.getSwimlane({ title: 'Default', boardId: action.boardId })._id;
      } else {
        swimlaneId = swimlane._id;
      }
      card.link(action.boardId, swimlaneId, listId);
    }
  },
};
