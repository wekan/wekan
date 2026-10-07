import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { currentUserWith } from '/client/lib/currentUserWith';
import { Utils } from '/client/lib/utils';
import { normalizeDependency } from '/models/metadata/dependencies';
const { canEditBoardDependencies, canEditCardDependency, normalizeMyDependencies } = require('/models/lib/dependencyAccess');

// #6732: the two dependency layers as THIS user sees them
// (docs/Features/Editor/RedStrings/Board-And-My-Dependencies.md). Both are off
// until the user turns them on in Member Settings, and turning one on changes
// only their own view.

export function dependencyVisibility() {
  // #6745: read per minicard (newLineLayer), so only these two fields.
  const user = currentUserWith(['profile.showBoardDependencies', 'profile.showMyDependencies']);
  const profile = (user || {}).profile || {};
  return { board: profile.showBoardDependencies === true, mine: profile.showMyDependencies === true };
}

export function canEditBoardDependenciesHere(board) {
  return !!board && canEditBoardDependencies(board, Meteor.userId());
}

// Where a line drawn on the board goes: the Board Dependencies when they are
// shown and this user may edit them, otherwise My Dependencies when those are
// shown. With neither, nothing is drawn and no connect handle appears.
export function newLineLayer(board) {
  const shown = dependencyVisibility();
  if (shown.board && canEditBoardDependenciesHere(board)) return 'board';
  if (shown.mine && Meteor.userId()) return 'mine';
  return null;
}

// This user's own lines on one board.
export function myDependencyLines(boardId) {
  const profile = (ReactiveCache.getCurrentUser() || {}).profile || {};
  return normalizeMyDependencies(profile.myDependencies, normalizeDependency).filter(row => row.boardId === boardId);
}

// May this user edit this card's Board Dependencies? A linked card's live on
// the card it points at, as the server resolves them.
export function canEditCardDependenciesHere(card) {
  const real = card && typeof card.getRealCard === 'function' ? card.getRealCard() : card;
  const board = real && ReactiveCache.getBoard(real.boardId);
  return !!(board && real && canEditCardDependency(board, Meteor.userId(), real));
}

// The open card's (card details).
Template.registerHelper('canEditBoardDependencies', () =>
  canEditCardDependenciesHere(ReactiveCache.getCard(Utils.getCurrentCardId())));

Template.registerHelper('showAnyDependencies', () => {
  const shown = dependencyVisibility();
  return shown.board || shown.mine;
});
