// The Kanban flow policies of the lists (models/lib/boardFlowPolicies.js,
// docs/Features/Lists/Flow-Policies.md): Board Settings / List, the marks at
// a list's header, the list's policy popup and the opened card's warning.
import { Template } from 'meteor/templating';
import { ReactiveCache } from '/imports/reactiveCache';
import { allowFeature } from '/client/lib/instanceFeatures';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import Lists from '/models/lists';

const { normalizePolicy, overPersonWip } = require('/models/lib/boardFlowPolicies');

const board = () => Utils.getCurrentBoard();
const isBoardAdmin = () => Boolean(ReactiveCache.getCurrentUser()?.isBoardAdmin?.());

Template.boardFlowListSettings.helpers({
  allowsListPolicies() { return board()?.allowsListPolicies === true; },
  notBoardAdmin() { return !isBoardAdmin(); },
  personWipLimit() { return board()?.personWipLimit || ''; },
  commitmentOptions() {
    const current = board();
    if (!current) return [];
    const lists = ReactiveCache.getLists({ boardId: current._id, archived: false }, { sort: { sort: 1 } }) || [];
    const chosen = current.commitmentListId || '';
    return [{ value: '', title: '-', selected: !chosen },
      ...lists.map(list => ({ value: list._id, title: list.title, selected: list._id === chosen }))];
  },
});

Template.boardFlowListSettings.events({
  'click .js-toggle-list-policies'(event) {
    event.preventDefault();
    const current = board();
    if (current && isBoardAdmin()) current.setAllowsListPolicies(current.allowsListPolicies !== true);
  },
  'change .js-commitment-list'(event) {
    const current = board();
    if (current && isBoardAdmin()) current.setCommitmentListId(event.currentTarget.value);
  },
  'change .js-person-wip-limit'(event) {
    const current = board();
    if (!current || !isBoardAdmin()) return;
    current.setPersonWipLimit(event.currentTarget.value.trim()).catch(() => {
      window.alert(TAPi18n.__('person-wip-limit'));
    });
  },
  'submit .board-flow-list-settings'(event) { event.preventDefault(); },
});

// The list header's marks; the data context is the list.
Template.listFlowMarks.helpers({
  showPolicy() {
    const current = ReactiveCache.getBoard(this.boardId);
    return Boolean(current?.allowsListPolicies === true && this.policy && allowFeature('list-policies'));
  },
  isCommitmentPoint() {
    const current = ReactiveCache.getBoard(this.boardId);
    return Boolean(current?.commitmentListId && current.commitmentListId === this._id && allowFeature('commitment-point'));
  },
});
Template.listFlowMarks.events({
  'click .js-open-list-policy': Popup.open('listPolicy'),
});

Template.listPolicyPopup.helpers({
  // Whoever may write to the list's board (models/lib/boardRoleCapabilities.js),
  // the same as the server's Lists allow rule.
  canEdit() {
    return Utils.currentUserCan('write', ReactiveCache.getBoard(this.boardId));
  },
});
Template.listPolicyPopup.events({
  async 'submit .js-list-policy-form'(event, tpl) {
    event.preventDefault();
    let policy;
    try {
      policy = normalizePolicy(tpl.find('.js-list-policy-text').value);
    } catch (e) {
      return;
    }
    const modifier = policy ? { $set: { policy } } : { $unset: { policy: '' } };
    await Lists.updateAsync(this._id, modifier);
    Popup.back();
  },
});

// The opened card's people over the WIP limit per person; the data is the card.
Template.cardPersonWipWarnings.helpers({
  warnings() {
    const card = this.card;
    const current = card && ReactiveCache.getBoard(card.boardId);
    if (!current || !current.personWipLimit || !allowFeature('person-wip-limit')) return [];
    const cards = ReactiveCache.getCards({ boardId: card.boardId, archived: false },
      { fields: { assignees: 1, members: 1, dueComplete: 1, archived: 1, type: 1 } }) || [];
    return overPersonWip(card, cards, current.personWipLimit).map(row => {
      const user = ReactiveCache.getUser(row.userId);
      return { ...row, name: (user && (user.profile?.fullname || user.username)) || row.userId };
    });
  },
});
