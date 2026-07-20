import { DDP } from 'meteor/ddp';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { TriggersDef } from '/server/triggersDef';
import EmailLocalization from '/server/lib/emailLocalization';
import Cards from '/models/cards';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import Swimlanes from '/models/swimlanes';
import { relativeDateOffset } from '/models/lib/relativeDateOffset';
import { resolveRuleSwimlaneId, resolveRuleListId } from '/models/lib/ruleActionResolve';
import { cardTitleMatchList } from '/models/lib/ruleCardTitleFilter';

// #5536: robustly resolve a destination board's default swimlane, tolerating a
// board that lacks a swimlane literally titled 'Default' (renamed/translated) or
// has no swimlanes at all. Returns undefined instead of throwing; callers pass
// the result to resolveRuleSwimlaneId() as the fallback candidate.
async function getDestBoardDefaultSwimlane(boardId) {
  const board = await ReactiveCache.getBoard(boardId);
  if (!board) return undefined;
  try {
    if (typeof board.getDefaultSwimlineAsync === 'function') {
      return await board.getDefaultSwimlineAsync();
    }
    if (typeof board.getDefaultSwimline === 'function') {
      return board.getDefaultSwimline();
    }
  } catch (e) {
    // ignore — fall through to a title-based lookup below
  }
  return (
    (await ReactiveCache.getSwimlane({ title: 'Default', boardId })) ||
    (await ReactiveCache.getSwimlane({ boardId }))
  );
}

async function withUserId(userId, fn) {
  if (userId && typeof DDP._CurrentMethodInvocation?.withValue === 'function') {
    return DDP._CurrentMethodInvocation.withValue({ userId }, fn);
  }
  return fn();
}

// #2475: Trello-Butler-style variables. Build the value map for the current
// rule context (card / board / list / swimlane / user / date), then substitute
// `{name}` tokens in action text (email subject/body, created card/checklist
// names, etc.). Unknown tokens are left untouched.
async function buildRuleVars(activity, card) {
  const vars = {};
  const now = new Date();
  vars.date = now.toLocaleDateString();
  vars.time = now.toLocaleTimeString();
  vars.datetime = now.toLocaleString();
  if (card) {
    vars.cardname = card.title || '';
    vars.cardtitle = card.title || '';
    vars.cardnumber = card.cardNumber != null ? String(card.cardNumber) : '';
    vars.description = card.description || '';
    if (card.dueAt) vars.duedate = new Date(card.dueAt).toLocaleString();
    try {
      const list = typeof card.list === 'function' ? await card.list() : null;
      if (list) vars.listname = list.title || '';
    } catch (e) { /* ignore */ }
    if (card.swimlaneId) {
      const sw = await ReactiveCache.getSwimlane(card.swimlaneId);
      if (sw) vars.swimlanename = sw.title || '';
    }
  }
  if (activity && activity.boardId) {
    const board = await ReactiveCache.getBoard(activity.boardId);
    if (board) vars.boardname = board.title || '';
  }
  if (activity && activity.userId && activity.userId !== '*') {
    const u = await ReactiveCache.getUser(activity.userId);
    if (u) vars.username = u.username || '';
  }
  return vars;
}

function substituteVars(text, vars) {
  if (typeof text !== 'string') return text;
  return text.replace(/\{(\w+)\}/g, (m, key) => {
    const v = vars[key.toLowerCase()];
    return v !== undefined ? v : m;
  });
}

export const RulesHelper = {
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
      if (field === 'cardTitle') {
        // #2345: archivedCard/restoredCard activities carry no cardTitle, so a
        // "when a card is archived" trigger with a title filter could never be
        // enforced. Resolve the title from the activity's card instead.
        if (value === undefined && activity.cardId) {
          const card = await ReactiveCache.getCard(activity.cardId);
          if (card) {
            value = card.title;
          }
        }
        // #2345: cardTitleMatchList() matches the exact title, its single
        // words, the '*' wildcard, and null — the latter also matches trigger
        // documents saved WITHOUT a cardTitle field (the old wizard's generic
        // "when a card is moved" / archive triggers), which otherwise never
        // satisfy a $in query and made those rules fire for nothing.
        matchingMap[field] = {
          $in: cardTitleMatchList(value),
        };
        continue;
      }
      // #6491: a trigger that OMITS a field (or stores it as null) means "any value"
      // for it — the user did not restrict it. A moveCard trigger, for example, has no
      // `oldListName` (the wizard chooses a destination list, not a source), so the
      // matching map's `{ oldListName: { $in: [value, '*'] } }` never matched it and
      // the rule silently never fired. A `$in` that includes `null` ALSO matches a
      // document missing that field, so add `null` here — exactly like the cardTitle
      // handling above (#2345) does via cardTitleMatchList().
      const matchesList = [value, '*', null];
      matchingMap[field] = {
        $in: matchesList,
      };
    }
    return matchingMap;
  },
  async performAction(activity, action) {
    const card = await ReactiveCache.getCard(activity.cardId);
    // Most actions operate on a card. Scheduled / button rules may run a
    // board-level action with no card context (e.g. create a card every Monday),
    // so allow those specific action types to proceed without a card.
    const boardLevelActions = ['createCard', 'addSwimlane', 'moveAllCardsInList'];
    if (!card && !boardLevelActions.includes(action.actionType)) return;
    const boardId = activity.boardId;
    // #2475: variables available for substitution in action text fields.
    const ruleVars = await buildRuleVars(activity, card);
    if (
      action.actionType === 'moveCardToTop' ||
      action.actionType === 'moveCardToBottom'
    ) {
      let list;
      let listId;
      if (action.listName === '*' || !action.listName) {
        // #6472: rules created by the classic wizard's generic "move to
        // top/bottom" action stored the field as listTitle (never read here),
        // so action.listName was undefined and the exact-title lookup below
        // always failed. An unset listName means "the card's current list".
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
      // #6472: an unresolved list (typo'd/renamed/case-mismatched listName, or
      // the list only exists on another board) crashed below on
      // list.cardsUnfiltered — the error was swallowed by the activity hook, so
      // the rule silently "did nothing". Fall back to the card's own list so
      // moveCardToTop/Bottom still does the sensible thing within the card's
      // current list.
      let fellBackToCardList = false;
      if (!list) {
        console.warn(
          `WeKan rule action ${action.actionType}: list "${action.listName}" not found on board ${action.boardId}; using the card's current list instead.`,
        );
        list = await card.list();
        if (!list) return;
        fellBackToCardList = true;
      }
      listId = list._id;

      let swimlane;
      let swimlaneId;
      if (action.swimlaneName === '*') {
        swimlane = await ReactiveCache.getSwimlane(card.swimlaneId);
        // #5536: only re-resolve by title across boards when we actually have a
        // source swimlane — dereferencing `swimlane.title` on undefined crashed.
        if (boardId !== action.boardId && swimlane) {
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
      // #5536: never dereference `._id` on a possibly-undefined 'Default'
      // swimlane (destination boards can have a renamed/translated default, or
      // none). Fall back to the board's real default swimlane; resolveRuleSwimlaneId
      // returns '' rather than throwing an "Internal Server Error".
      swimlaneId = resolveRuleSwimlaneId(
        swimlane,
        await getDestBoardDefaultSwimlane(action.boardId),
      );

      // #6472: the fallback list is on the CARD's board, so the move must stay
      // there too — an action.boardId/swimlaneId from a different board would
      // produce an inconsistent card. Also move within the card's own swimlane.
      let destBoardId = action.boardId;
      if (fellBackToCardList) {
        destBoardId = list.boardId;
        swimlaneId = card.swimlaneId;
      }

      // #6472: an empty destination (no cards in that list+swimlane yet) made
      // Math.min()/Math.max() of no arguments return ±Infinity, writing a
      // corrupt sort value; a non-finite stored sort would poison it again.
      const destSorts = (await list.cardsUnfiltered(swimlaneId))
        .map(c => c.sort)
        .filter(Number.isFinite);

      if (action.actionType === 'moveCardToTop') {
        const minOrder = destSorts.length ? Math.min(...destSorts) : 0;
        await withUserId(activity.userId, () => card.move(destBoardId, swimlaneId, listId, minOrder - 1));
      } else {
        const maxOrder = destSorts.length ? Math.max(...destSorts) : 0;
        await withUserId(activity.userId, () => card.move(destBoardId, swimlaneId, listId, maxOrder + 1));
      }
    }
    if (action.actionType === 'sendEmail') {
      const to = substituteVars(action.emailTo, ruleVars);
      const text = substituteVars(action.emailMsg || '', ruleVars);
      const subject = substituteVars(action.emailSubject || '', ruleVars);
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
          await EmailLocalization.sendEmail({
            to,
            from: Accounts.emailTemplates.from,
            subject,
            text,
            language: recipientLang,
            userId: recipientUser ? recipientUser._id : null
          });
        } else {
          // Fallback to standard Email.send
          await Email.sendAsync({
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
      if (!card.archived) {
        await card.archive();
      }
    }
    if (action.actionType === 'unarchive') {
      if (card.archived) {
        await card.restore();
      }
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
    // #2674: resolve the username defensively for the member actions. A rule
    // whose username no longer resolves (user renamed/deleted, or a typo in an
    // API-created rule) crashed here on `undefined._id`; the activity hook
    // swallows the error, so the rule silently "did nothing" — the classic
    // "member is added on move-to but never removed on move-from" report. Warn
    // instead of crashing, and await the writes so failures are not lost.
    if (action.actionType === 'addMember') {
      const member = await ReactiveCache.getUser({ username: action.username });
      if (member) {
        await card.assignMember(member._id);
      } else {
        console.warn(
          `WeKan rule action addMember: user "${action.username}" not found; skipping.`,
        );
      }
    }
    if (action.actionType === 'removeMember') {
      if (action.username === '*') {
        const members = card.members || [];
        for (let i = 0; i < members.length; i++) {
          await card.unassignMember(members[i]);
        }
      } else {
        const member = await ReactiveCache.getUser({ username: action.username });
        if (member) {
          await card.unassignMember(member._id);
        } else {
          console.warn(
            `WeKan rule action removeMember: user "${action.username}" not found; skipping.`,
          );
        }
      }
    }
    // #5283: the checklist (and checklist item) may not exist on the card — guard
    // against undefined so the rule does not crash with "Cannot read property
    // 'uncheckAllItems' of undefined".
    if (action.actionType === 'checkAll') {
      const checkList = await ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      if (checkList) await checkList.checkAllItems();
    }
    if (action.actionType === 'uncheckAll') {
      const checkList = await ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      if (checkList) await checkList.uncheckAllItems();
    }
    if (action.actionType === 'checkItem') {
      const checkList = await ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      const checkItem = checkList && await ReactiveCache.getChecklistItem({
        title: action.checkItemName,
        checkListId: checkList._id,
      });
      if (checkItem) await checkItem.check();
    }
    if (action.actionType === 'uncheckItem') {
      const checkList = await ReactiveCache.getChecklist({
        title: action.checklistName,
        cardId: card._id,
      });
      const checkItem = checkList && await ReactiveCache.getChecklistItem({
        title: action.checkItemName,
        checkListId: checkList._id,
      });
      if (checkItem) await checkItem.uncheck();
    }
    if (action.actionType === 'addChecklist') {
      await Checklists.insertAsync({
        title: substituteVars(action.checklistName, ruleVars),
        cardId: card._id,
        sort: 0,
      });
    }
    if (action.actionType === 'removeChecklist') {
      await Checklists.removeAsync({
        title: action.checklistName,
        cardId: card._id,
        sort: 0,
      });
    }
    if (action.actionType === 'addSwimlane') {
      await Swimlanes.insertAsync({
        title: substituteVars(action.swimlaneName, ruleVars),
        boardId,
        sort: 0,
      });
    }
    if (action.actionType === 'addChecklistWithItems') {
      const checkListId = await Checklists.insertAsync({
        title: substituteVars(action.checklistName, ruleVars),
        cardId: card._id,
        sort: 0,
      });
      const itemsArray = substituteVars(action.checklistItems, ruleVars).split(',');
      const existingItems = await ReactiveCache.getChecklistItems({ checklistId: checkListId });
      const sortBase = existingItems.length;
      for (let i = 0; i < itemsArray.length; i++) {
        await ChecklistItems.insertAsync({
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
      listId = resolveRuleListId(list);
      // #5536: guard the 'Default'-swimlane fallback against undefined ._id.
      swimlaneId = resolveRuleSwimlaneId(
        swimlane,
        await getDestBoardDefaultSwimlane(boardId),
      );
      await Cards.insertAsync({
        title: substituteVars(action.cardName, ruleVars),
        listId,
        swimlaneId,
        sort: 0,
        boardId
      });
    }
    if (action.actionType === 'linkCard') {
      const list = await ReactiveCache.getList({ title: action.listName, boardId: action.boardId });
      const card = await ReactiveCache.getCard(activity.cardId);
      const swimlane = await ReactiveCache.getSwimlane({
        title: action.swimlaneName,
        boardId: action.boardId,
      });
      const listId = resolveRuleListId(list);
      // #5536: guard the 'Default'-swimlane fallback against undefined ._id so a
      // link-to-another-board rule cannot crash with an "Internal Server Error".
      const swimlaneId = resolveRuleSwimlaneId(
        swimlane,
        await getDestBoardDefaultSwimlane(action.boardId),
      );
      card.link(action.boardId, swimlaneId, listId);
    }
    if (
      action.actionType === 'markCardComplete' ||
      action.actionType === 'markCardIncomplete'
    ) {
      await card.setDueComplete(action.actionType === 'markCardComplete');
    }
    if (action.actionType === 'setDateRelative') {
      // The numeric amount is stored in `days` (kept as the field name for
      // backward compatibility with rules created before the unit selector).
      // `unit` is optional: when absent (old rules) it defaults to days.
      const target = relativeDateOffset(new Date(), action.days, action.unit);
      switch (action.dateField) {
        case 'startAt': card.setStart(target); break;
        case 'endAt': card.setEnd(target); break;
        case 'dueAt': card.setDue(target); break;
        case 'receivedAt': card.setReceived(target); break;
      }
    }
    if (action.actionType === 'sortList') {
      // Resort the cards of the card's current list (or the named list) by the
      // chosen field, rewriting their `sort` index.
      let list = await card.list();
      if (action.listName && action.listName !== '*') {
        list = await ReactiveCache.getList({ title: action.listName, boardId });
      }
      if (list) {
        const cards = await list.cardsUnfiltered(card.swimlaneId);
        const keyOf = c => {
          switch (action.sortField) {
            case 'name': return (c.title || '').toLowerCase();
            case 'created': return c.createdAt ? new Date(c.createdAt).getTime() : 0;
            case 'modified': return c.modifiedAt ? new Date(c.modifiedAt).getTime() : 0;
            case 'due':
            default: return c.dueAt ? new Date(c.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
          }
        };
        const sorted = [...cards].sort((a, b) => (keyOf(a) > keyOf(b) ? 1 : keyOf(a) < keyOf(b) ? -1 : 0));
        for (let i = 0; i < sorted.length; i++) {
          await Cards.updateAsync(sorted[i]._id, { $set: { sort: i } });
        }
      }
    }
    if (action.actionType === 'moveAllCardsInList') {
      const fromList = await ReactiveCache.getList({ title: action.fromListName, boardId });
      const toList = await ReactiveCache.getList({ title: action.listName, boardId: action.boardId || boardId });
      if (fromList && toList) {
        const cards = await fromList.cardsUnfiltered();
        for (const c of cards) {
          await withUserId(activity.userId, () =>
            c.move(action.boardId || boardId, c.swimlaneId, toList._id),
          );
        }
      }
    }
  },
};
