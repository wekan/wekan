import { formatDateForDisplay } from '/client/lib/dateDisplay';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
const { originalPositionGroups } = require('/models/lib/originalPositions');

// Board menu → Original positions: where each swimlane, list and card was put
// when it was made (positionHistory, recorded on creation), with the names it
// has now, and whether it has moved since.

Template.originalPositionsSidebar.onCreated(function () {
  this.history = new ReactiveVar([]);
  this.isLoading = new ReactiveVar(false);
  this.load = () => {
    const boardId = Session.get('currentBoard');
    if (!boardId) return;
    this.isLoading.set(true);
    Meteor.call('positionHistory.getBoardHistory', boardId, (error, result) => {
      this.isLoading.set(false);
      if (error && process.env.DEBUG === 'true') console.warn('original positions:', error);
      this.history.set(error || !Array.isArray(result) ? [] : result);
    });
  };
  this.load();
});

Template.originalPositionsSidebar.helpers({
  isLoading() {
    return Template.instance().isLoading.get();
  },

  groups() {
    return originalPositionGroups(Template.instance().history.get(), {
      current: (type, id) => (type === 'swimlane' ? ReactiveCache.getSwimlane(id)
        : type === 'list' ? ReactiveCache.getList(id) : ReactiveCache.getCard(id)),
      titleOf: (type, id) => {
        const doc = type === 'swimlane' ? ReactiveCache.getSwimlane(id) : ReactiveCache.getList(id);
        return doc ? doc.title : '';
      },
      label: key => TAPi18n.__(key),
      formatDate: date => formatDateForDisplay(date, true, value => value.toLocaleString()),
    });
  },
});

Template.originalPositionsSidebar.events({
  'click .js-refresh-history'(evt, tpl) {
    tpl.load();
  },
});
