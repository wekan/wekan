// The Scrum meeting helpers of the board menu (models/lib/scrumMeetings.js,
// docs/Features/Scrum/Meetings.md): the daily standup timer, kept in this
// browser only, and the button that makes a retrospective board.
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import getSlug from 'limax';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { allowFeature } from '/client/lib/instanceFeatures';
import Lists from '/models/lists';

const meetings = require('/models/lib/scrumMeetings');
const { DEFAULT_SCRUM_SETTINGS } = require('/models/lib/scrum');

const settingsOf = board => ({ ...DEFAULT_SCRUM_SETTINGS, ...(board && board.scrum) });

// Whether the board menu offers each: the instance's feature AND the board's
// Scrum setting.
export function showsStandupTimer(board) {
  return Boolean(board) && allowFeature('standup-timer') && settingsOf(board).standupTimer !== false;
}
export function showsRetrospectiveBoard(board) {
  return Boolean(board) && allowFeature('retrospective-board') && settingsOf(board).retrospectiveBoard !== false;
}

const nameOf = userId => {
  const user = ReactiveCache.getUser(userId);
  return (user && (user.profile?.fullname || user.username)) || userId;
};

Template.dailyStandupPopup.onCreated(function () {
  const board = Utils.getCurrentBoard();
  const people = (board?.activeMembers?.() || board?.members || []).filter(m => m.isActive !== false).map(m => m.userId);
  this.order = new ReactiveVar(meetings.shuffle(people));
  this.state = new ReactiveVar(null);
  this.now = new ReactiveVar(Date.now());
  this.minutes = meetings.standupMinutes(settingsOf(board).standupMinutes);
  this.timer = Meteor.setInterval(() => this.now.set(Date.now()), 1000);
});
Template.dailyStandupPopup.onDestroyed(function () {
  Meteor.clearInterval(this.timer);
});

Template.dailyStandupPopup.helpers({
  order() { return Template.instance().order.get().map(userId => ({ userId, name: nameOf(userId) })); },
  noPeople() { return !Template.instance().order.get().length; },
  minutes() { return Template.instance().minutes; },
  running() { return Boolean(Template.instance().state.get()); },
  view() {
    const tpl = Template.instance();
    const view = meetings.standupView(tpl.state.get(), tpl.now.get());
    return view && { ...view, speakerName: view.speaker ? nameOf(view.speaker) : '' };
  },
  clockOf(seconds) { return meetings.clock(seconds); },
});

Template.dailyStandupPopup.events({
  'click .js-standup-shuffle'(event, tpl) { tpl.order.set(meetings.shuffle(tpl.order.get())); },
  'click .js-standup-start'(event, tpl) {
    tpl.now.set(Date.now());
    tpl.state.set(meetings.startStandup(tpl.order.get(), tpl.minutes, Date.now()));
  },
  'click .js-standup-next'(event, tpl) {
    tpl.now.set(Date.now());
    tpl.state.set(meetings.nextSpeaker(tpl.state.get(), Date.now()));
  },
  'click .js-standup-reset'(event, tpl) { tpl.state.set(null); },
});

// A new private board of the reader's for one retrospective: its lists Start
// doing, Stop doing, Keep doing and Action items. Board creation is the
// server's (createBoardWithInitialSwimlanes, with its "who may create
// boards" check); the lists are the new board admin's own inserts.
export async function createRetrospectiveBoard(board) {
  const plan = meetings.retrospectivePlan(board.title, new Date(), (key, fallback, options) => {
    const text = TAPi18n.__(key, options);
    return text && text !== key ? text : fallback;
  });
  const slug = getSlug(plan.title) || 'board';
  const boardId = await Meteor.callAsync('createBoardWithInitialSwimlanes', {
    title: plan.title, slug, permission: 'private', type: 'board', migrationVersion: 1,
    swimlanes: [{ title: TAPi18n.__('default'), sort: 0 }],
  });
  for (const [sort, title] of plan.lists.entries()) {
    await Lists.insertAsync({ title, boardId, sort, swimlaneId: '' });
  }
  FlowRouter.go('board', { id: boardId, slug });
  return boardId;
}
