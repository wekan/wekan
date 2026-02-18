import { ReactiveCache } from '/imports/reactiveCache';

RulesHelper = {
  async executeRules(activity) {
    const matchingRules = await this.findMatchingRules(activity);
    for (let i = 0; i < matchingRules.length; i++) {
      const action = await matchingRules[i].getAction();
      if (action !== undefined) {
        await this.performAction(activity, action);
      }
    }
  },
  async findMatchingRules(activity) {
    const activityType = activity.activityType;
    if (TriggersDef[activityType] === undefined) {
      return [];
    }
    const matchingFields = TriggersDef[activityType].matchingFields;
    const matchingMap = await this.buildMatchingFieldsMap(activity, matchingFields);
    const matchingTriggers = await ReactiveCache.getTriggers(matchingMap);
    const matchingRules = [];
    for (const trigger of matchingTriggers) {
      const rule = await trigger.getRule();
      // Check that for some unknown reason there are some leftover triggers
      // not connected to any rules
      if (rule !== undefined) {
        matchingRules.push(rule);
      }
    }
    return matchingRules;
  },
  async buildMatchingFieldsMap(activity, matchingFields) {
    const matchingMap = { activityType: activity.activityType };
    for (const field of matchingFields) {
      // Creating a matching map with the actual field of the activity
      // and with the wildcard (for example: trigger when a card is added
      // in any [*] board
      let value = activity[field];
      if (field === 'oldListName') {
        const oldList = await ReactiveCache.getList(activity.oldListId);
        if (oldList) {
          value = oldList.title;
        }
      } else if (field === 'oldSwimlaneName') {
        const oldSwimlane = await ReactiveCache.getSwimlane(activity.oldSwimlaneId);
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
    }
    return matchingMap;
  },
  async performAction(activity, action) {
    const card = await ReactiveCache.getCard(activity.cardId);
    const boardId = activity.boardId;
    if (
      action.actionType === 'moveCardToTop' ||
      action.actionType === 'moveCardToBottom'
    ) {
      let list;
      let listId;
      if (action.listName === '*') {
        list = await card.list();
        if (boardId !== action.boardId) {
          list = await ReactiveCache.getList({ title: list.title, boardId: action.boardId });
        }
      } else {
        list = await ReactiveCache.getList({
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
        swimlane = await ReactiveCache.getSwimlane(card.swimlaneId);
        if (boardId !== action.boardId) {
          swimlane = await ReactiveCache.getSwimlane({
            title: swimlane.title,
            boardId: action.boardId,
          });
        }
      } else {
        swimlane = await ReactiveCache.getSwimlane({
          title: action.swimlaneName,
          boardId: action.boardId,
        });
      }
      if (swimlane === undefined) {
        swimlaneId = (await ReactiveCache.getSwimlane({
          title: 'Default',
          boardId: action.boardId,
        }))._id;
      } else {
        swimlaneId = swimlane._id;
      }

      if (action.actionType === 'moveCardToTop') {
        const minOrder = _.min(
          (await list.cardsUnfiltered(swimlaneId)).map(c => c.sort),
        );
        await card.move(action.boardId, swimlaneId, listId, minOrder - 1);
      } else {
        const maxOrder = _.max(
          (await list.cardsUnfiltered(swimlaneId)).map(c => c.sort),
        );
        await card.move(action.boardId, swimlaneId, listId, maxOrder + 1);
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
          recipientUser = await ReactiveCache.getUser({ 'emails.address': to.toLowerCase() });
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
      await card.archive();
    }
    if (action.actionType === 'unarchive') {
      await card.restore();
    }
    if (action.actionType === 'setColor') {
      await card.setColor(action.selectedColor);
    }
    if (action.actionType === 'addLabel') {
      card.addLabel(action.labelId);
    }
    if (action.actionType === 'removeLabel') {
      card.removeLabel(action.labelId);
    }
    if (action.actionType === 'addMember') {
      const memberId = (await ReactiveCache.getUser({ username: action.username }))._id;
      card.assignMember(memberId);
    }
    if (action.actionType === 'removeMember') {
      if (action.username === '*') {
        const members = card.members;
        for (let i = 0; i < members.length; i++) {
          card.unassignMember(members[i]);
        }
      } else {
        const memberId = (await ReactiveCache.getUser({ username: action.username }))._id;
        card.unassignMember(memberId);
      }
    }
    if (action.actionType === 'checkAll') {
      const checkList = await ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      await checkList.checkAllItems();
    }
    if (action.actionType === 'uncheckAll') {
      const checkList = await ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      await checkList.uncheckAllItems();
    }
    if (action.actionType === 'checkItem') {
      const checkList = await ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      const checkItem = await ReactiveCache.getChecklistItem({
        title: action.checkItemName,
        checkListId: checkList._id,
      });
      await checkItem.check();
    }
    if (action.actionType === 'uncheckItem') {
      const checkList = await ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      const checkItem = await ReactiveCache.getChecklistItem({
        title: action.checkItemName,
        checkListId: checkList._id,
      });
      await checkItem.uncheck();
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
      const existingItems = await ReactiveCache.getChecklistItems({ checklistId: checkListId });
      const sortBase = existingItems.length;
      for (let i = 0; i < itemsArray.length; i++) {
        ChecklistItems.insert({
          title: itemsArray[i],
          checklistId: checkListId,
          cardId: card._id,
          sort: sortBase + i,
        });
      }
    }
    if (action.actionType === 'createCard') {
      const list = await ReactiveCache.getList({ title: action.listName, boardId });
      let listId = '';
      let swimlaneId = '';
      const swimlane = await ReactiveCache.getSwimlane({
        title: action.swimlaneName,
        boardId,
      });
      if (list === undefined) {
        listId = '';
      } else {
        listId = list._id;
      }
      if (swimlane === undefined) {
        swimlaneId = (await ReactiveCache.getSwimlane({ title: 'Default', boardId }))._id;
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
      const list = await ReactiveCache.getList({ title: action.listName, boardId: action.boardId });
      const card = await ReactiveCache.getCard(activity.cardId);
      let listId = '';
      let swimlaneId = '';
      const swimlane = await ReactiveCache.getSwimlane({
        title: action.swimlaneName,
        boardId: action.boardId,
      });
      if (list === undefined) {
        listId = '';
      } else {
        listId = list._id;
      }
      if (swimlane === undefined) {
        swimlaneId = (await ReactiveCache.getSwimlane({ title: 'Default', boardId: action.boardId }))._id;
      } else {
        swimlaneId = swimlane._id;
      }
      card.link(action.boardId, swimlaneId, listId);
    }
  },
};
