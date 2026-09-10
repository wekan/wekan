import { ReactiveCache } from '/imports/reactiveCache';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Utils } from '/client/lib/utils';
import { reconstructBoardStateAt } from '/models/lib/boardTimeline';

// Board View / Timeline (Step 2 of the maintainer's spec, Step 1 wiring):
//
//   "add there time progress from left to right. have possibility to click
//   any previous point of time, to show status of board of that time. have
//   possibility to restore from any historical status to copy it to newest
//   status. have checks that all data stays at undo history, so that this
//   does not delete any data."
//
// This view is READ-ONLY history browsing plus a "restore this card" action.
// The heavy lifting - replaying the Activities log backward to figure out
// what a card looked like at a past moment - is models/lib/boardTimeline.js's
// pure reconstructBoardStateAt(); this file only wires it to the board's
// live cards/activities subscriptions and renders the result.
//
// Deliberately OUT of scope here (left for a dedicated future pass, per the
// maintainer's task breakdown): "selective per-member change removal within
// a time period" - undoing only one member's edits within a range. That is a
// mutation feature with a much larger blast radius than "restore one card's
// fields from a past snapshot" and is not attempted.
//
// "have checks that all data stays at undo history" is satisfied by never
// writing to Cards directly here: restoreCardFromTimeline() below calls only
// the card's OWN existing setters (setTitle, setDescription, move, addLabel/
// removeLabel, assignMember/unassignMember, setDue) - the exact same calls
// the rest of the UI already makes - so every field written by a restore is
// logged as its own new Activity by the existing hooks
// (server/models/changeHistoryHooks.js and each setter's own activity
// recording). Nothing here deletes or rewrites an Activity, and the
// reconstruction itself never touches the Activities collection - see
// models/lib/boardTimeline.js's own header comment and tests/boardTimeline.test.cjs.

const MAX_MARKERS = 50;

function snippet(text, max = 160) {
  if (!text) return '';
  const trimmed = String(text).trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function formatTimestamp(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString();
  } catch (e) {
    return String(date);
  }
}

Template.timelineView.onCreated(function () {
  this.selectedTimestamp = new ReactiveVar(null); // null === live/now

  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId) {
      // #timeline: subscribe unconditionally (the 5th "showActivities" param
      // is a per-board sidebar display preference; this view is a distinct
      // history-browsing feature and should not be hidden by it). A large
      // limit is used because reconstruction needs the FULL history, not a
      // paginated recent slice like the sidebar/card activity feed.
      this.subscribe('activities', 'board', boardId, 1000000, true);
    }
  });
});

function currentBoardId() {
  return Session.get('currentBoard');
}

function boardCards() {
  const boardId = currentBoardId();
  if (!boardId) return [];
  // Non-archived cards currently on the board. Archived cards are not
  // reconstructable further back than their archive date is known from
  // (models/lib/boardTimeline.js's own stated limitation for deleteCard
  // applies in spirit here too: a card this view cannot see cannot be
  // replayed), which is acceptable for this read-only viewer.
  return ReactiveCache.getCards({ boardId, archived: false });
}

function boardActivities() {
  const boardId = currentBoardId();
  if (!boardId) return [];
  return ReactiveCache.getActivities({ boardId }) || [];
}

Template.timelineView.helpers({
  selectedTimestamp() {
    return Template.instance().selectedTimestamp.get();
  },
  formattedSelectedTimestamp() {
    return formatTimestamp(Template.instance().selectedTimestamp.get());
  },
  isSelectedMarker(time) {
    const sel = Template.instance().selectedTimestamp.get();
    return sel && Number(sel.getTime()) === Number(time);
  },
  timelineMarkers() {
    const activities = boardActivities();
    const times = Array.from(
      new Set(
        activities
          .map(a => a && a.createdAt && new Date(a.createdAt).getTime())
          .filter(t => !!t),
      ),
    ).sort((a, b) => a - b);

    let sampled = times;
    if (times.length > MAX_MARKERS) {
      const step = times.length / MAX_MARKERS;
      sampled = [];
      for (let i = 0; i < MAX_MARKERS; i++) {
        sampled.push(times[Math.floor(i * step)]);
      }
    }
    return sampled.map(t => ({ time: t, label: formatTimestamp(t) }));
  },
  timelineLists() {
    const boardId = currentBoardId();
    if (!boardId) return [];
    const selected = Template.instance().selectedTimestamp.get();
    const cards = boardCards();
    const activities = boardActivities();

    // Live (no timestamp selected): show cards as they are right now, same
    // grouping shape as the historical branch below, but with no restore
    // button (selectedTimestamp() helper returns null in the template).
    const projections = selected
      ? reconstructBoardStateAt(cards, activities, selected).cards
      : cards.map(c => ({
          _id: c._id,
          existed: true,
          title: c.title || '',
          description: c.description || '',
          listId: c.listId,
          swimlaneId: c.swimlaneId,
          labelIds: c.labelIds || [],
          members: c.members || [],
          dueAt: c.dueAt || null,
          archived: !!c.archived,
        }));

    const board = ReactiveCache.getBoard(boardId);
    const byList = new Map();
    projections
      .filter(p => p.existed)
      .forEach(p => {
        const list = ReactiveCache.getList(p.listId);
        const listTitle = list ? list.title : '?';
        if (!byList.has(p.listId)) byList.set(p.listId, { title: listTitle, cards: [] });
        const labelNames = (p.labelIds || [])
          .map(id => board && board.getLabelById(id))
          .filter(Boolean)
          .map(l => l.name || l.color);
        const memberNames = (p.members || [])
          .map(id => ReactiveCache.getUser(id))
          .filter(Boolean)
          .map(u => u.profile?.fullname || u.username)
          .join(', ');
        byList.get(p.listId).cards.push({
          cardId: p._id,
          title: p.title,
          description: p.description,
          descriptionSnippet: snippet(p.description),
          archived: p.archived,
          labelNames,
          memberNames,
          dueAt: p.dueAt,
          formattedDueAt: p.dueAt ? formatTimestamp(p.dueAt) : '',
          // The exact values a restore would apply - kept separate from the
          // display-only fields above (labelNames/memberNames are for
          // rendering, not for writing back).
          fields: {
            title: p.title,
            description: p.description,
            listId: p.listId,
            swimlaneId: p.swimlaneId,
            labelIds: p.labelIds || [],
            members: p.members || [],
            dueAt: p.dueAt,
          },
        });
      });
    return Array.from(byList.values());
  },
});

// Applies RECONSTRUCTED field values to a card's CURRENT document, using
// only the card's own existing setters - never a direct Cards.update /
// Cards.updateAsync from here. Each setter already records its own Activity
// (server/models/changeHistoryHooks.js and the setter itself), so the
// restore becomes new, fully visible history and nothing is deleted -
// satisfying "have checks that all data stays at undo history".
export async function restoreCardFromTimeline(cardId, fields) {
  const card = ReactiveCache.getCard(cardId);
  if (!card || !fields) return;

  if (typeof fields.title === 'string' && fields.title !== card.title) {
    await card.setTitle(fields.title);
  }
  if (
    typeof fields.description === 'string' &&
    fields.description !== (card.description || '')
  ) {
    await card.setDescription(fields.description);
  }
  if (
    fields.listId &&
    (fields.listId !== card.listId || fields.swimlaneId !== card.swimlaneId)
  ) {
    await card.move(card.boardId, fields.swimlaneId || card.swimlaneId, fields.listId);
  }

  const currentLabelIds = card.labelIds || [];
  const targetLabelIds = fields.labelIds || [];
  for (const labelId of targetLabelIds) {
    if (!currentLabelIds.includes(labelId)) await card.addLabel(labelId);
  }
  for (const labelId of currentLabelIds) {
    if (!targetLabelIds.includes(labelId)) await card.removeLabel(labelId);
  }

  const currentMembers = card.members || [];
  const targetMembers = fields.members || [];
  for (const memberId of targetMembers) {
    if (!currentMembers.includes(memberId)) await card.assignMember(memberId);
  }
  for (const memberId of currentMembers) {
    if (!targetMembers.includes(memberId)) await card.unassignMember(memberId);
  }

  if ((fields.dueAt || null) !== (card.dueAt || null)) {
    await card.setDue(fields.dueAt || '');
  }
}

Template.timelineView.events({
  // See statsView.js/timeView.js: stop the board canvas's drag-to-scroll from
  // swallowing the pointer/touch events native selection/clicks need.
  'mousedown .stats-view'(event) {
    event.stopPropagation();
  },
  'touchstart .stats-view'(event) {
    event.stopPropagation();
  },
  'click .js-timeline-live'(event, instance) {
    instance.selectedTimestamp.set(null);
  },
  'click .js-timeline-marker'(event, instance) {
    const ts = $(event.currentTarget).data('ts');
    instance.selectedTimestamp.set(ts ? new Date(Number(ts)) : null);
  },
  'click .js-restore-card-timeline': Popup.afterConfirm('cardRestoreToTimeline', function () {
    const cardContext = this;
    if (cardContext && cardContext.cardId) {
      restoreCardFromTimeline(cardContext.cardId, cardContext.fields);
    }
  }),
});
