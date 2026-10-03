import { canReadBoard } from '/models/lib/boardVisibility';
import { copyRuleCard } from '/server/lib/ruleCopyCard';
import { requireButtonRuleContext } from '/models/lib/buttonRulePermission';
import { DDP } from 'meteor/ddp';
import { Meteor } from 'meteor/meteor';

// BypassBleed, its denial-of-service part (2026-10-02): a rule's action writes
// a card, the write inserts an activity, and the activity runs the rules
// again - in the same awaited chain. Two rules like "label added -> remove it"
// and "label removed -> add it" recursed without end and took the server
// down. Rules started by a rule are counted, and a chain deeper than this
// stops (and is reported) instead of looping.
const ruleDepth = new Meteor.EnvironmentVariable();
export const MAX_RULE_DEPTH = 5;
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
import { cardTitleMatchList, cardTitleFilterMatches } from '/models/lib/ruleCardTitleFilter';
import { triggerMatchesWithVars } from '/models/lib/ruleTriggerVars';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { tripCanary } from '/server/lib/canary';
import { substituteVars, recipientVars } from '/models/lib/ruleVarsSubstitute';
const { sortListOrder } = require('/models/lib/ruleSortList');
import { buildCustomFieldsWD, filterAdminOnlyDefinitions } from '/models/lib/customFieldsWD';
import { cardMatchesAdvancedFilter } from '/server/lib/advancedFilterMatch';
import { cardTextContainsMatch } from '/models/lib/ruleTextContainsMatch';
import { RULE_ACTING_USER_SENTINEL, resolveActingUserId } from '/models/lib/ruleActingUser';
import { ruleActionIds, uniqueRules } from '/models/lib/ruleParts';

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
  let board;
  if (activity && activity.boardId) {
    board = await ReactiveCache.getBoard(activity.boardId);
    if (board) vars.boardname = board.title || '';
  }
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
    // #3301: a direct link to the card, built from the same helper the card
    // activity notification emails already use (models/lib/cardUrl.js via
    // Card.absoluteUrl()), so it needs no URL-building code of its own.
    try {
      if (typeof card.absoluteUrl === 'function') {
        const link = card.absoluteUrl(board);
        if (link) vars.cardlink = link;
      }
    } catch (e) { /* ignore */ }
  }
  // #3304: {member} - the member relevant to the trigger context (the one
  // added/removed/assigned/etc.), falling back to whoever performed the
  // action when the activity records no specific member.
  const memberId = (activity && (activity.memberId || activity.userId)) || null;
  if (memberId && memberId !== '*') {
    const u = await ReactiveCache.getUser(memberId);
    if (u) vars.membername = u.username || '';
  }
  // #2522: reuse the same acting-user resolution the "add member" action's
  // acting-user option resolves to below, so {username} and that option
  // never disagree about who triggered the rule.
  const actingUserId = resolveActingUserId(activity);
  if (actingUserId) {
    const u = await ReactiveCache.getUser(actingUserId);
    if (u) vars.username = u.username || '';
  }
  // #3304: short, memorable aliases for the tokens documented in the "send
  // email" action's UI hint (r-email-vars-hint): {card} {cardLink} {list}
  // {board} {member}. The longer cardname/listname/boardname/username names
  // above stay for backward compatibility with rules already using them.
  if (vars.cardname !== undefined) vars.card = vars.cardname;
  if (vars.listname !== undefined) vars.list = vars.listname;
  if (vars.boardname !== undefined) vars.board = vars.boardname;
  if (vars.membername !== undefined) vars.member = vars.membername;
  if (card) await addCardPeopleAndFields(vars, card);
  return vars;
}

// #4278 / #4294 / #3195 (maintainer decision 2026-09-29): {creator},
// {assignees} and {members} name the card's people - by username in text, by
// email address in the send-email recipient (see recipientVars) - and
// {customField:Name} reads a custom field's displayed value. Admin-only custom
// fields are left out: a rule must not copy them into mail or card text.
// The usernames a member action names, after variable substitution. A literal
// username is returned unchanged, so existing rules behave exactly as before.
function ruleUsernames(value, vars) {
  if (typeof value !== 'string' || !value.includes('{')) return value ? [value] : [];
  return [...new Set(String(substituteVars(value, vars)).split(',')
    .map(name => name.trim()).filter(name => name && !/[{}]/.test(name)))];
}

async function addCardPeopleAndFields(vars, card) {
  const people = {};
  const load = async ids => {
    const list = [];
    for (const id of [...new Set((ids || []).filter(Boolean))]) {
      const user = await ReactiveCache.getUser(id);
      if (user) list.push({ username: user.username || '', email: user.emails?.[0]?.address || '' });
    }
    return list;
  };
  people.creator = await load([card.userId]);
  people.assignees = await load(card.assignees);
  people.members = await load(card.members);
  for (const [token, list] of Object.entries(people)) {
    vars[token] = list.map(p => p.username).filter(Boolean).join(', ');
  }
  vars.people = people;
  const definitions = await ReactiveCache.getCustomFields({ boardIds: { $in: [card.boardId] } });
  const visible = filterAdminOnlyDefinitions(definitions || [], false);
  const fields = {};
  for (const field of buildCustomFieldsWD(card.customFields, visible)) {
    const value = field.trueValue;
    if (value === undefined || value === null || value === '') continue;
    fields[String(field.definition.name).toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  vars.customfield = fields;
}

// The rule a matching trigger belongs to, on the activity's own board
// (2026-10-03). Trigger.getRule() returned whichever rule named the trigger
// first, and a board admin elsewhere could save a rule naming another board's
// trigger (refused since, server/permissions/rules.js), so that board's own
// rule might never be found; only this board's rules may run here anyway.
async function ruleOnBoard(trigger, boardId) {
  const { ruleForTriggerSelector } = require('/models/lib/ruleParts');
  return (await ReactiveCache.getRule({ ...ruleForTriggerSelector(trigger._id), boardId })) || undefined;
}

export const RulesHelper = {
  // The checklist title an addChecklist action names, resolved exactly as
  // performAction does below: for the durable rule checklist lifecycle
  // command (server/lib/syncRuleChecklistLifecycleCommand.js).
  async ruleChecklistTitle(activity, card, action) {
    return substituteVars(action.checklistName, await buildRuleVars(activity, card));
  },
  // Where a createCard action puts its card, and its title: the list and
  // swimlane named on the rule's board (#5536: the board's default swimlane
  // when the named one is gone), the card name with the rule variables
  // substituted. For the durable rule card creation command too
  // (server/lib/syncRuleCreateCardCommand.js).
  async createCardTarget(activity, card, action) {
    const boardId = activity.boardId;
    const list = await ReactiveCache.getList({ title: action.listName, boardId });
    const swimlane = await ReactiveCache.getSwimlane({ title: action.swimlaneName, boardId });
    return {
      boardId,
      listId: resolveRuleListId(list),
      swimlaneId: resolveRuleSwimlaneId(swimlane, await getDestBoardDefaultSwimlane(boardId)),
      title: substituteVars(action.cardName, await buildRuleVars(activity, card)),
    };
  },
  // Where a linkCard action puts the linked card: the list and swimlane named
  // on the action's board (#5536: its default swimlane when the named one is
  // gone, so a link-to-another-board rule cannot crash). For the durable rule
  // link command too (server/lib/syncRuleLinkCardCommand.js).
  async linkCardTarget(action) {
    const list = await ReactiveCache.getList({ title: action.listName, boardId: action.boardId });
    const swimlane = await ReactiveCache.getSwimlane({ title: action.swimlaneName, boardId: action.boardId });
    return {
      listId: resolveRuleListId(list),
      swimlaneId: resolveRuleSwimlaneId(swimlane, await getDestBoardDefaultSwimlane(action.boardId)),
    };
  },
  // The title an addSwimlane action gives its swimlane, for the durable rule
  // command (server/lib/syncRuleAddSwimlaneCommand.js).
  async ruleSwimlaneTitle(activity, card, action) {
    return substituteVars(action.swimlaneName, await buildRuleVars(activity, card));
  },
  // Where a moveCardToTop/Bottom action puts the card, as { boardId,
  // swimlaneId, listId, sort }, or null when the card has no list to fall back
  // to. For the ordinary action below and the durable rule move command
  // (server/lib/syncRuleMoveCommand.js), so the two cannot pick different places.
  // Which board a rule action resolves on (maintainer decision of
  // 2026-10-03): `here` is the board the card is on now - the activity's,
  // unless an earlier action of the rule moved it to another board - and
  // `target` is where the action works: `here` when the action names the
  // rule's own board (or none), the named board otherwise. So a move, a sort
  // or a move-all after a move to another board resolves its list and
  // swimlane names on the board the card went to, in this engine and in
  // durable Sync alike.
  ruleBoards(activity, card, action) {
    const here = card && typeof card.boardId === 'string' && card.boardId ? card.boardId : activity.boardId;
    const named = (action && action.boardId) || activity.boardId;
    return { here, target: named === activity.boardId ? here : named };
  },
  async moveCardTarget(activity, card, action) {
    const { here: boardId, target: targetBoardId } = this.ruleBoards(activity, card, action);
    action = Object.assign(Object.create(Object.getPrototypeOf(action)), action, { boardId: targetBoardId });
    const ruleVars = await buildRuleVars(activity, card);
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
      // #3195 / #4294: a list name may use {customField:Name} and the other
      // rule variables, resolved against the triggering card.
      list = await ReactiveCache.getList({
        title: substituteVars(action.listName, ruleVars),
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
      if (!list) return null;
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
        title: substituteVars(action.swimlaneName, ruleVars),
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

    const minOrder = destSorts.length ? Math.min(...destSorts) : 0;
    const maxOrder = destSorts.length ? Math.max(...destSorts) : 0;
    return { boardId: destBoardId, swimlaneId, listId,
      sort: action.actionType === 'moveCardToTop' ? minOrder - 1 : maxOrder + 1 };
  },
  // ...and the item titles an addChecklistWithItems action names.
  async ruleChecklistItemTitles(activity, card, action) {
    return String(substituteVars(action.checklistItems, await buildRuleVars(activity, card))).split(',');
  },
  // The people a member action names, resolved exactly as performAction does
  // below (#2522 acting user, #4294 tokens, #2674 "remove every member" reads
  // the card's assignees): for the durable rule card command
  // (server/lib/syncRuleCardCommand.js), which saves them once at capture.
  async resolveMemberTargets(activity, card, action) {
    const ids = [];
    const byUsername = async () => {
      const vars = await buildRuleVars(activity, card);
      for (const username of ruleUsernames(action.username, vars)) {
        const member = await ReactiveCache.getUser({ username });
        if (member) ids.push(member._id);
      }
    };
    // Written without the performAction branch text, which source guards locate.
    const type = action.actionType;
    if (type === 'addMember') {
      if (action.username === RULE_ACTING_USER_SENTINEL) {
        const memberId = resolveActingUserId(activity);
        if (memberId) ids.push(memberId);
      } else await byUsername();
    } else if (type === 'removeMember') {
      if (action.username === '*') ids.push(...(card.assignees || []));
      else await byUsername();
    }
    const targets = [];
    for (const userId of ids) {
      const user = await ReactiveCache.getUser(userId);
      targets.push({ userId, username: user?.username ?? null });
    }
    return targets;
  },

  async executeRules(activity) {
    const depth = ruleDepth.get() || 0;
    if (depth >= MAX_RULE_DEPTH) {
      try {
        require('/server/lib/securityLog').record({
          key: 'dos.rule-loop', action: 'detected', source: 'rules',
          detail: `rules started by rules ${depth} deep on board ${activity && activity.boardId}; stopped`,
        });
      } catch (e) { /* logging must never break the guard */ }
      return;
    }
    await ruleDepth.withValue(depth + 1, () => this.executeRulesAtDepth(activity));
  },

  async executeRulesAtDepth(activity) {
    const matchingRules = await this.findMatchingRules(activity);
    for (let i = 0; i < matchingRules.length; i++) {
      const rule = matchingRules[i];
      // One run of one rule: where its own moves took the card (emailActivity).
      const ruleRun = {};
      const action = await rule.getAction();
      if (action !== undefined) {
        await this.performAction(activity, action, ruleRun);
      }
      // #4294: further actions run in order after the rule's own action.
      for (const extraId of ruleActionIds(rule).slice(1)) {
        const extra = await ReactiveCache.getAction(extraId);
        if (extra !== undefined) {
          await this.performAction(activity, extra, ruleRun);
        }
      }
    }
  },
  // The activity a rule's email reads its card through (maintainer decision
  // of 2026-10-03). The source check (server/lib/ruleEmailSource.js) refuses
  // a card that left the activity's board; when THIS run of the rule moved it
  // to another board that opted into Sync effects, and it is still there, the
  // email follows it: the activity placed on that board, and the board it
  // left. Any other card off the board - moved by someone else, or by this
  // rule to a board that did not opt in - is refused as before.
  async emailActivity(activity, card, ruleRun) {
    if (!card || !card.boardId || card.boardId === activity.boardId || !ruleRun?.movedTo || ruleRun.movedTo !== card.boardId) {
      return { activity, followedFrom: null };
    }
    const destination = await ReactiveCache.getBoard(card.boardId);
    if (!destination || destination.syncEffectsEnabled !== true) return { activity, followedFrom: null };
    return { activity: { ...activity, boardId: card.boardId }, followedFrom: activity.boardId };
  },
  async findMatchingRules(activity) {
    const activityType = activity.activityType;
    const matchingRules = [];
    if (TriggersDef[activityType] !== undefined) {
      const matchingFields = TriggersDef[activityType].matchingFields;
      const matchingMap = await this.buildMatchingFieldsMap(activity, matchingFields);
      const matchingTriggers = await ReactiveCache.getTriggers(matchingMap);
      for (const trigger of matchingTriggers) {
        const rule = await ruleOnBoard(trigger, activity.boardId);
        // Check that for some unknown reason there are some leftover triggers
        // not connected to any rules
        if (rule !== undefined) {
          matchingRules.push(rule);
        }
      }
      // #4294 / #3195: a trigger value may hold a {token} (models/lib/
      // ruleTriggerVars.js). Such a value never equals what an activity
      // carries, so the query above cannot find it; fetch this board's
      // triggers of this kind that hold one, and resolve them for the card.
      const tokenFields = matchingFields.filter(field => field !== 'boardId');
      const tokenTriggers = tokenFields.length ? await ReactiveCache.getTriggers({
        activityType,
        boardId: { $in: [activity.boardId, '*', null] },
        $or: tokenFields.map(field => ({ [field]: { $regex: '\\{\\w+(?::[^{}]+)?\\}' } })),
      }) : [];
      if (tokenTriggers.length) {
        const actualValues = await this.resolveMatchingValues(activity, matchingFields);
        const card = activity.cardId ? await ReactiveCache.getCard(activity.cardId) : null;
        const vars = await buildRuleVars(activity, card);
        // People tokens resolve to usernames, and the activity names the
        // acting user by id: compare a "by {assignees}" trigger by username.
        const tokenValues = { ...actualValues };
        if (actualValues.userId) {
          const actor = await ReactiveCache.getUser(actualValues.userId);
          tokenValues.userId = actor ? actor.username : undefined;
        }
        const plainMatches = (field, expected) => (field === 'cardTitle'
          ? cardTitleFilterMatches(expected, actualValues.cardTitle)
          : expected === undefined || expected === null || expected === '*' || expected === actualValues[field]);
        for (const trigger of tokenTriggers) {
          if (!triggerMatchesWithVars(trigger, matchingFields, tokenValues, vars, plainMatches)) continue;
          // eslint-disable-next-line no-await-in-loop
          const rule = await ruleOnBoard(trigger, activity.boardId);
          if (rule !== undefined) matchingRules.push(rule);
        }
      }
    }
    // #3092: "card matches advanced filter" triggers are not tied to one
    // activity field like the TriggersDef-driven ones above — they reuse the
    // Filter sidebar's whole Advanced Filter criteria language against the
    // card's CURRENT state. Any card activity can reach these rules, including
    // custom-field changes which have no TriggersDef entry. Value-change hooks
    // insert their activities after successful writes and suppress no-ops.
    if (activity.cardId && activity.boardId) {
      const advancedTriggers = await ReactiveCache.getTriggers({
        boardId: activity.boardId,
        activityType: 'advancedFilterTrigger',
      });
      if (advancedTriggers.length) {
        const card = await ReactiveCache.getCard(activity.cardId);
        if (card) {
          for (const trigger of advancedTriggers) {
            // eslint-disable-next-line no-await-in-loop
            const matches = await cardMatchesAdvancedFilter(card, trigger.advancedFilter);
            if (matches) {
              // eslint-disable-next-line no-await-in-loop
              const rule = await ruleOnBoard(trigger, activity.boardId);
              if (rule !== undefined) {
                matchingRules.push(rule);
              }
            }
          }
        }
      }
    }
    // #2194: "card title/description contains {value}" trigger. Like the
    // advancedFilterTrigger block above, this is not one of the simple
    // exact/wildcard TriggersDef matches - it re-reads the card's CURRENT
    // title/description and does a case-insensitive substring test
    // (cardTextContainsMatch, shared with the unit tests). It only needs to
    // run on activities that actually change the text a card is matched
    // against: card creation, and a title/description edit (the
    // 'a-changedTitle'/'a-changedDescription' activities server/models/cards.js
    // already logs for the outgoing-webhook hook) - not on every unrelated
    // card activity.
    const textContainsActivityTypes = [
      'createCard',
      'a-changedTitle',
      'a-changedDescription',
    ];
    if (activity.cardId && activity.boardId && textContainsActivityTypes.includes(activityType)) {
      const textContainsTriggers = await ReactiveCache.getTriggers({
        boardId: activity.boardId,
        activityType: 'textContainsTrigger',
      });
      if (textContainsTriggers.length) {
        const card = await ReactiveCache.getCard(activity.cardId);
        if (card) {
          for (const trigger of textContainsTriggers) {
            if (cardTextContainsMatch(card, trigger.textContains)) {
              // eslint-disable-next-line no-await-in-loop
              const rule = await ruleOnBoard(trigger, activity.boardId);
              if (rule !== undefined) {
                matchingRules.push(rule);
              }
            }
          }
        }
      }
    }
    // #2322: a disabled rule keeps its trigger/action documents and
    // configuration intact so it can be re-enabled later, but it must never
    // fire while disabled. `enabled` defaults to `true` in the schema, so
    // only an explicit `false` is skipped here. A rule matched through more
    // than one of its triggers runs once (#4294: any trigger fires it).
    // RepointBleed: a rule acts only on its own board's activity. A trigger's
    // boardId may be '*' or missing (legacy "any board" triggers, or one an
    // attacker moved there), which the queries above match on EVERY board;
    // the rule it belongs to is configured on one board, and its creator need
    // not be able to see any other.
    return uniqueRules(matchingRules.filter(rule => rule.enabled !== false && rule.boardId === activity.boardId));
  },
  // The value each matching field has for this activity, resolved the way
  // buildMatchingFieldsMap compares it (list and swimlane names looked up,
  // an archived card's title read from the card).
  async resolveMatchingValues(activity, matchingFields) {
    const values = {};
    for (const field of matchingFields) {
      let value = activity[field];
      if (field === 'oldListName') {
        const oldList = await ReactiveCache.getList(activity.oldListId);
        if (oldList) value = oldList.title;
      } else if (field === 'oldSwimlaneName') {
        const oldSwimlane = await ReactiveCache.getSwimlane(activity.oldSwimlaneId);
        if (oldSwimlane) value = oldSwimlane.title;
      } else if (field === 'cardTitle' && value === undefined && activity.cardId) {
        const card = await ReactiveCache.getCard(activity.cardId);
        if (card) value = card.title;
      }
      values[field] = value;
    }
    return values;
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
  // Shared preparation for ordinary sends and immutable stored commands.
  // This method performs reads only; it never sends or queues mail.
  async prepareEmailAction(activity, action, ruleVars, sourceContext) {
    if (action?.actionType !== 'sendEmail') throw new Error('rule-email-action-required');
    const wrapperActivity = activity;
    const card = await ReactiveCache.getCard(activity.cardId);
    if (!card) throw new Error('rule-email-card-unavailable');
    let emailSource = sourceContext;
    if (emailSource || action.includeCardDetails === true || action.includeChecklistsAndComments === true || ['cardType-linkedCard', 'cardType-linkedBoard'].includes(card.type)) {
      const { resolveRuleEmailSource } = require('/server/lib/ruleEmailSource');
      emailSource = emailSource || await resolveRuleEmailSource({ activity, cache: ReactiveCache, canReadBoard });
      activity = emailSource.activity;
      ruleVars = await buildRuleVars(activity, emailSource.card);
    } else if (!ruleVars) {
      ruleVars = await buildRuleVars(activity, card);
    }
    // People tokens in the recipient are email addresses; empty entries left
    // by a token nobody matched are dropped.
    const to = String(substituteVars(action.emailTo, recipientVars(ruleVars, ruleVars.people)) || '')
      .split(',').map(address => address.trim()).filter(Boolean).join(', ');
    const body = substituteVars(action.emailMsg || '', ruleVars);
    const subject = substituteVars(action.emailSubject || '', ruleVars);
    // #3301: the email used to carry no reference to the card that
    // triggered it at all - not even its title, let alone a link. Append
    // the card's title and a direct link automatically, even when the
    // user's configured body/subject uses none of the {card}/{cardLink}
    // tokens, so the recipient always has enough context to find the card.
    // #2713: also carry the card's description automatically - the title
    // and link were already appended unconditionally (#3301); the
    // description is the other piece of "full card content" the rule
    // action was missing without the user typing {description} by hand.
    const cardFooterLines = [];
    if (ruleVars.cardname) cardFooterLines.push(`Card: ${ruleVars.cardname}`);
    if (ruleVars.description) cardFooterLines.push(`Description: ${ruleVars.description}`);
    if (ruleVars.cardlink) cardFooterLines.push(`Link: ${ruleVars.cardlink}`);
    const text = cardFooterLines.length
      ? `${body}${body ? '\n\n' : ''}-- \n${cardFooterLines.join('\n')}`
      : body;
    let recipientUser = null;
    let recipientLang = TAPi18n.getLanguage() || 'en';
    if (to && to.includes('@')) {
      recipientUser = await ReactiveCache.getUser({ 'emails.address': to.toLowerCase() });
      if (recipientUser && typeof recipientUser.getLanguage === 'function') {
        recipientLang = recipientUser.getLanguage();
      }
    }
    const options = { to, from: Accounts.emailTemplates.from, subject, text,
      language: recipientLang, userId: recipientUser ? recipientUser._id : null };
    if (action.includeCardDetails === true) {
      const { prepareRuleCardDetails } = require('/server/lib/ruleCardDetails');
      const readScrumRecord = (kind, id, boardId) => {
        const collection = kind === 'sprint' ? require('/models/scrumSprints').default : require('/models/scrumReleases').default;
        return collection.findOneAsync({ _id: id, boardId }, { fields: { _id: 1, boardId: 1, name: 1, deletedAt: 1 } });
      };
      const details = await prepareRuleCardDetails({ activity, cache: ReactiveCache, canReadBoard, readScrumRecord,
        onRelatedSource: binding => emailSource.addRelatedSource(binding),
        onCustomFieldPolicy: (boardId, definitions) => emailSource.addCustomFieldPolicy(boardId, definitions) });
      if (details) options.text += `\n\n${details}`;
      const { prepareRuleCardWrapper } = require('/server/lib/ruleCardWrapper');
      const wrapper = await prepareRuleCardWrapper({ activity: wrapperActivity, cache: ReactiveCache, canReadBoard, readScrumRecord,
        onRelatedSource: binding => emailSource.addRelatedSource(binding),
        onCustomFieldPolicy: (boardId, definitions) => emailSource.addCustomFieldPolicy(boardId, definitions) });
      if (wrapper) options.text += `\n\n${wrapper}`;
    }
    if (action.includeChecklistsAndComments === true) {
      const { prepareRuleCardDiscussion } = require('/server/lib/ruleCardDiscussion');
      const discussion = await prepareRuleCardDiscussion({ activity, cache: ReactiveCache, canReadBoard,
        onRelatedSource: binding => emailSource.addRelatedSource(binding) });
      if (discussion) options.text += `\n\n${discussion}`;
      const { prepareRuleBoardDiscussion } = require('/server/lib/ruleBoardDiscussion');
      const boardDiscussion = await prepareRuleBoardDiscussion({ activity, cache: ReactiveCache, canReadBoard,
        onRelatedSource: binding => emailSource.addRelatedSource(binding) });
      if (boardDiscussion) options.text += `\n\n${boardDiscussion}`;
    }
    if (action.includeAttachments === true) {
      const { prepareRuleCardAttachments } = require('/server/lib/ruleCardAttachments');
      const { fileStoreStrategyFactory } = require('/models/attachments.server');
      const attachments = await prepareRuleCardAttachments({ activity, cache: ReactiveCache, canReadBoard,
        onManifest: text => { if (text) options.text += `\n\n${text}`; },
        openStream: file => fileStoreStrategyFactory.getFileStrategy(file, 'original').getReadStream() });
      if (attachments.length) options.attachments = attachments;
    }
    if (emailSource) await emailSource.assertCurrent();
    return options;
  },

  // `followedFrom`: the board the plan's own move took the card from, when
  // the caller proved that move (storedRulePlans.js ruleEmailActivity).
  async prepareEmailCommand(activity, action, { followedFrom = null } = {}) {
    const { resolveRuleEmailSource } = require('/server/lib/ruleEmailSource');
    const source = await resolveRuleEmailSource({ activity, cache: ReactiveCache, canReadBoard, followedFrom });
    const mail = await EmailLocalization.prepareEmail(await this.prepareEmailAction(activity, action, undefined, source));
    await source.assertCurrent();
    return { mail, sourceBinding: source.binding };
  },

  async performAction(activity, action, ruleRun) {
    const card = await ReactiveCache.getCard(activity.cardId);
    if (activity.activityType === 'button') {
      const sourceBoard = await ReactiveCache.getBoard(activity.boardId);
      requireButtonRuleContext(activity.userId, sourceBoard, activity.cardId, card, Meteor);
    }
    // Most actions operate on a card. Scheduled / button rules may run a
    // board-level action with no card context (e.g. create a card every Monday),
    // so allow those specific action types to proceed without a card.
    const boardLevelActions = ['createCard', 'addSwimlane', 'moveAllCardsInList'];
    if (!card && !boardLevelActions.includes(action.actionType)) return;
    const boardId = activity.boardId;
    // A legacy or imported action without a boardId acts on the activity's own
    // board - once, here, so no later lookup can query { boardId: undefined }
    // (which matches lists and swimlanes on ANY board by title) and skip the
    // cross-board check below (2026-10-02). A copy: the cached document is not
    // changed.
    if (!action.boardId) {
      action = Object.assign(Object.create(Object.getPrototypeOf(action)), action, { boardId });
    }
    // RuleBleed (GHSA-9w4x-hf2r-hc9v): server-side rule actions bypass the
    // Cards collection deny hooks. Check the destination before resolving any
    // of its list/swimlane names, both to block writes and to remove the old
    // private-board structure oracle. This execution-time gate also protects
    // legacy, imported and directly stored actions that predate validation.
    const crossBoardActions = [
      'moveCardToTop',
      'moveCardToBottom',
      'linkCard',
      'copyCard',
      'moveAllCardsInList',
      'sortList',
    ];
    // Where it works: the board the card is on now when the action names
    // this board and an earlier action moved the card (ruleBoards).
    const { here, target: actionBoardId } = this.ruleBoards(activity, card, action);
    if (crossBoardActions.includes(action.actionType) && actionBoardId !== boardId) {
      const destination = await ReactiveCache.getBoard(actionBoardId);
      if (!allowIsBoardMemberWithWriteAccess(activity.userId, destination)) {
        tripCanary('rule.cross-board-write', { userId: activity.userId });
        return;
      }
    }
    // #2475: variables available for substitution in action text fields.
    const ruleVars = await buildRuleVars(activity, card);
    if (
      action.actionType === 'moveCardToTop' ||
      action.actionType === 'moveCardToBottom'
    ) {
      const target = await this.moveCardTarget(activity, card, action);
      if (target) {
        await withUserId(activity.userId, () => card.move(target.boardId, target.swimlaneId, target.listId, target.sort));
        if (ruleRun && target.boardId !== here) ruleRun.movedTo = target.boardId;
      }
    }
    if (action.actionType === 'sendEmail') {
      try {
        const placed = await this.emailActivity(activity, card, ruleRun);
        let options;
        if (placed.followedFrom) {
          const { resolveRuleEmailSource } = require('/server/lib/ruleEmailSource');
          const source = await resolveRuleEmailSource({ activity: placed.activity, cache: ReactiveCache, canReadBoard,
            followedFrom: placed.followedFrom });
          options = await this.prepareEmailAction(placed.activity, action, undefined, source);
        } else {
          options = await this.prepareEmailAction(activity, action, ruleVars);
        }
        if (typeof EmailLocalization !== 'undefined') {
          await EmailLocalization.sendEmail(options);
        } else {
          const { to, from, subject, text, attachments } = options;
          await Email.sendAsync({ to, from, subject, text, ...(attachments ? { attachments } : {}) });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        throw e;
      }
    }

    if (action.actionType === 'setDate') {
      try {
        const currentDateTime = new Date();
        switch (action.dateField) {
          case 'startAt': {
            const resStart = card.getStart();
            if (typeof resStart === 'undefined') {
              await card.setStart(currentDateTime);
            }
            break;
          }
          case 'endAt': {
            const resEnd = card.getEnd();
            if (typeof resEnd === 'undefined') {
              await card.setEnd(currentDateTime);
            }
            break;
          }
          case 'dueAt': {
            const resDue = card.getDue();
            if (typeof resDue === 'undefined') {
              await card.setDue(currentDateTime);
            }
            break;
          }
          case 'receivedAt': {
            const resReceived = card.getReceived();
            if (typeof resReceived === 'undefined') {
              await card.setReceived(currentDateTime);
            }
            break;
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        throw e;
      }
    }

    if (action.actionType === 'updateDate') {
      const currentDateTimeUpdate = new Date();
      switch (action.dateField) {
        case 'startAt': {
          await card.setStart(currentDateTimeUpdate);
          break;
        }
        case 'endAt': {
          await card.setEnd(currentDateTimeUpdate);
          break;
        }
        case 'dueAt': {
          await card.setDue(currentDateTimeUpdate);
          break;
        }
        case 'receivedAt': {
          await card.setReceived(currentDateTimeUpdate);
          break;
        }
      }
    }

    if (action.actionType === 'removeDate') {
      switch (action.dateField) {
        case 'startAt': {
          await card.unsetStart();
          break;
        }
        case 'endAt': {
          await card.unsetEnd();
          break;
        }
        case 'dueAt': {
          await card.unsetDue();
          break;
        }
        case 'receivedAt': {
          await card.unsetReceived();
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
      await card.addLabel(action.labelId);
    }
    if (action.actionType === 'removeLabel') {
      await card.removeLabel(action.labelId);
    }
    if (action.actionType === 'removeAllLabels') {
      await card.removeAllLabels();
    }
    // #2674: resolve the username defensively for the member actions. A rule
    // whose username no longer resolves (user renamed/deleted, or a typo in an
    // API-created rule) crashed here on `undefined._id`; the activity hook
    // swallows the error, so the rule silently "did nothing" — the classic
    // "member is added on move-to but never removed on move-from" report. Warn
    // instead of crashing, and await the writes so failures are not lost.
    if (action.actionType === 'addMember') {
      // #2522: "add member" gained an acting-user option (issue #2522) - a
      // sentinel `username` meaning "whoever triggered this rule" instead of
      // a fixed board member, resolved via the same resolveActingUserId()
      // buildRuleVars() above already uses for {username}.
      if (action.username === RULE_ACTING_USER_SENTINEL) {
        const memberId = resolveActingUserId(activity);
        if (memberId) {
          await card.assignMember(memberId);
        } else {
          console.warn(
            'WeKan rule action addMember: no acting user available for this activity; skipping.',
          );
        }
      } else {
        // #4294: {creator}, {assignees}, {members} and {customField:Name} name
        // people by username; a token naming several acts on each of them.
        for (const username of ruleUsernames(action.username, ruleVars)) {
          const member = await ReactiveCache.getUser({ username });
          if (member) {
            await card.assignMember(member._id);
          } else {
            console.warn(
              `WeKan rule action addMember: user "${username}" not found; skipping.`,
            );
          }
        }
      }
    }
    if (action.actionType === 'removeMember') {
      if (action.username === '*') {
        // #2674: "remove every member" must iterate the card's ASSIGNEES — the
        // same collection assignMember/unassignMember act on (addMember above
        // uses card.assignMember). It previously read card.members, so it never
        // removed anyone the rule had added and "remove all" appeared to do
        // nothing. Snapshot the ids first: unassignMember $pulls from assignees.
        const assignees =
          (typeof card.getAssignees === 'function' ? card.getAssignees() : card.assignees) || [];
        for (let i = 0; i < assignees.length; i++) {
          await card.unassignMember(assignees[i]);
        }
      } else {
        for (const username of ruleUsernames(action.username, ruleVars)) {
          const member = await ReactiveCache.getUser({ username });
          if (member) {
            await card.unassignMember(member._id);
          } else {
            console.warn(
              `WeKan rule action removeMember: user "${username}" not found; skipping.`,
            );
          }
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
      // The same title the durable command captures (ruleChecklistTitle).
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
      // The same title the durable command captures (ruleSwimlaneTitle).
      await Swimlanes.insertAsync({
        title: substituteVars(action.swimlaneName, ruleVars),
        boardId,
        sort: 0,
      });
    }
    if (action.actionType === 'addChecklistWithItems') {
      // The same titles the durable command captures (ruleChecklistTitle,
      // ruleChecklistItemTitles).
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
      // The same target the durable command captures (createCardTarget).
      const target = await this.createCardTarget(activity, card, action);
      await Cards.insertAsync({
        title: target.title,
        listId: target.listId,
        swimlaneId: target.swimlaneId,
        sort: 0,
        boardId: target.boardId,
      });
    }
    if (action.actionType === 'copyCard') {
      return await copyRuleCard({ activity, action, cache: ReactiveCache, canWrite: allowIsBoardMemberWithWriteAccess });
    }
    if (action.actionType === 'linkCard') {
      const card = await ReactiveCache.getCard(activity.cardId);
      // The same target the durable command captures (linkCardTarget).
      const { listId, swimlaneId } = await this.linkCardTarget(action);
      await card.link(action.boardId, swimlaneId, listId);
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
        case 'startAt': await card.setStart(target); break;
        case 'endAt': await card.setEnd(target); break;
        case 'dueAt': await card.setDue(target); break;
        case 'receivedAt': await card.setReceived(target); break;
      }
    }
    if (action.actionType === 'sortList') {
      // Resort the cards of the card's current list (or the named list) by the
      // chosen field, rewriting their `sort` index.
      let list = await card.list();
      if (action.listName && action.listName !== '*') {
        list = await ReactiveCache.getList({ title: action.listName, boardId: here });
      }
      if (list) {
        const cards = await list.cardsUnfiltered(card.swimlaneId);
        // The same order the durable command captures (models/lib/ruleSortList.js).
        const sorted = sortListOrder(cards, action.sortField);
        for (let i = 0; i < sorted.length; i++) {
          await Cards.updateAsync(sorted[i]._id, { $set: { sort: i } });
        }
      }
    }
    if (action.actionType === 'moveAllCardsInList') {
      const fromList = await ReactiveCache.getList({ title: action.fromListName, boardId: here });
      const toList = await ReactiveCache.getList({ title: action.listName, boardId: actionBoardId });
      if (fromList && toList) {
        const cards = await fromList.cardsUnfiltered();
        for (const c of cards) {
          await withUserId(activity.userId, () =>
            c.move(actionBoardId, c.swimlaneId, toList._id),
          );
          if (ruleRun && card && c._id === card._id && actionBoardId !== here) ruleRun.movedTo = actionBoardId;
        }
      }
    }
  },
};
