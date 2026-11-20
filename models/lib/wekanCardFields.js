'use strict';

// The fields of a WeKan card that a WeKan JSON import writes besides the ones
// models/wekanCreator.js sets itself (title, dates, members, labels, ...).
// Pure - no Meteor - so tests/wekanCardFields.test.cjs can hold the list to
// the card schema (models/cards.js): every field there is either copied here,
// written by the creator, or named in NOT_COPIED with the reason.
//
// A user id inside a field is the exporting WeKan's: it is mapped to the new
// board's user (`members`, the creator's map), and dropped when it has none -
// a vote is not cast for somebody who is not on the board.

// Copied as they are: values, not references.
export const COPIED = [
  'dueComplete', 'email',
  'cardKind', 'mapX', 'mapY', 'subtaskSort', 'lastMoveReason', 'listEnteredAt',
  'stickers', 'locations', 'locationName', 'locationAddress', 'locationLatitude', 'locationLongitude',
  'showActivities', 'showListOnMinicard', 'showListOnCard', 'shownFields', 'hiddenFields',
  'showChecklistAtMinicard', 'hideFinishedChecklistIfItemsAreHidden',
  // Keyed by the board's column sets, which the board import copies with
  // their ids (models/wekanCreator.js createBoardAndLabels).
  'columnSetValues',
];

// Written by models/wekanCreator.js createSubtasks, by the new parents' ids
// (models/lib/cardParents.js parentFields).
export const WRITTEN_ELSEWHERE = ['parentId', 'parentIds'];

// The card fields a WeKan import does not write, and why.
export const NOT_COPIED = {
  deletedAt: 'trash state: an imported card is not in the trash',
  deletedBy: 'trash state',
  deleteBatchId: 'trash state',
  syncSourceKey: 'external sync bookkeeping of the exporting WeKan',
  syncLabelIds: 'external sync bookkeeping',
  syncIssueState: 'external sync bookkeeping',
  syncLastSource: 'external sync bookkeeping',
  syncClosedByWeKan: 'external sync bookkeeping',
  syncExternalId: 'external sync bookkeeping',
  syncSourceType: 'external sync bookkeeping',
  pomodoroStartAt: 'a running Pomodoro timer',
  pomodoroPhase: 'a running Pomodoro timer',
  pomodoroCount: 'a running Pomodoro timer',
  pomodoroUserId: 'a running Pomodoro timer',
  pomodoroWorkMinutes: 'a running Pomodoro timer',
  flowStartAt: 'a running flow timer',
  flowInterruptions: 'a running flow timer',
  flowUserId: 'a running flow timer',
  linkedId: 'a card or board of the exporting WeKan, not of this board',
  customFieldLinks: 'cards of the exporting WeKan, not of this board',
  targetId_gantt: 'Gantt links: card ids of the exporting WeKan',
  linkType_gantt: 'Gantt links',
  linkId_gantt: 'Gantt links',
  scrumRevision: 'the Scrum import (server/lib/scrumTransferImport.js) writes the Scrum data',
  scrum: 'the Scrum import (server/lib/scrumTransferImport.js) writes the Scrum data',
};

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const mapIds = (ids, members) => [...new Set((Array.isArray(ids) ? ids : []).map(id => members[id]).filter(Boolean))];
const date = value => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const POKER_CARDS = ['one', 'two', 'three', 'five', 'eight', 'thirteen', 'twenty', 'forty', 'oneHundred', 'unsure'];

// card: the exported card. members: exported user id -> new user id.
// attachmentIds: exported attachment id -> new one.
export function wekanCardFields(card, { members = {}, attachmentIds = {} } = {}) {
  if (!isObject(card)) return {};
  const out = {};
  for (const field of COPIED) {
    if (card[field] === undefined || card[field] === null) continue;
    out[field] = field === 'listEnteredAt' ? date(card[field]) : card[field];
    if (out[field] === undefined) delete out[field];
  }
  if (card.archived && date(card.archivedAt)) out.archivedAt = date(card.archivedAt);
  // A card template stays one. A linked card or board points at the exporting
  // WeKan (linkedId is not imported), so it comes as an ordinary card.
  if (card.type === 'template-card') out.type = 'template-card';

  // The Kanban and Scrum flow fields (models/lib/cardFlow.js); who marked it
  // blocked is a user.
  if (isObject(card.flow)) {
    const flow = { ...card.flow };
    if (flow.blockedBy) {
      if (members[flow.blockedBy]) flow.blockedBy = members[flow.blockedBy];
      else delete flow.blockedBy;
    }
    if (flow.blockedAt) flow.blockedAt = date(flow.blockedAt);
    if (!flow.blockedAt) delete flow.blockedAt;
    out.flow = flow;
  }

  // A vote and planning poker: who voted what is users.
  if (isObject(card.vote) && card.vote.question) {
    out.vote = {
      question: String(card.vote.question),
      positive: mapIds(card.vote.positive, members),
      negative: mapIds(card.vote.negative, members),
      ...(date(card.vote.end) ? { end: date(card.vote.end) } : {}),
      ...(card.vote.public !== undefined ? { public: Boolean(card.vote.public) } : {}),
      ...(card.vote.allowNonBoardMembers !== undefined ? { allowNonBoardMembers: Boolean(card.vote.allowNonBoardMembers) } : {}),
    };
  }
  if (isObject(card.poker) && card.poker.question !== undefined) {
    const poker = { question: Boolean(card.poker.question) };
    for (const cardName of POKER_CARDS) poker[cardName] = mapIds(card.poker[cardName], members);
    if (date(card.poker.end)) poker.end = date(card.poker.end);
    if (card.poker.allowNonBoardMembers !== undefined) poker.allowNonBoardMembers = Boolean(card.poker.allowNonBoardMembers);
    if (card.poker.estimation !== undefined && card.poker.estimation !== null) poker.estimation = card.poker.estimation;
    out.poker = poker;
  }

  // Drawings: the strokes are the drawing; its PNG is an attachment, by the
  // new attachment id when the attachment came along.
  if (Array.isArray(card.drawings) && card.drawings.length) {
    out.drawings = card.drawings.filter(isObject).map(drawing => {
      const copy = { ...drawing };
      if (copy.pngAttachmentId) {
        if (attachmentIds[copy.pngAttachmentId]) copy.pngAttachmentId = attachmentIds[copy.pngAttachmentId];
        else delete copy.pngAttachmentId;
      }
      return copy;
    });
  }
  return out;
}
