import { ReactiveVar } from 'meteor/reactive-var';

// Board view "Time" - split out of "Statistics" so time tracking has its own
// place in the board-view menu. Counts come from the server `boardStatus`
// method, same subscription pattern as statsView.js.
Template.timeView.onCreated(function() {
  this.status = new ReactiveVar(null);
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId) {
      Meteor.call('boardStatus', boardId, (err, res) => {
        if (!err && res) this.status.set(res);
      });
    }
  });
});

function statsNum(key) {
  const s = Template.instance().status.get();
  return s ? (s[key] || 0) : '…';
}

Template.timeView.events({
  // See statsView.js: stop the board canvas's drag-to-scroll from swallowing
  // the pointer/touch events that native text selection needs.
  'mousedown .stats-view'(event) {
    event.stopPropagation();
  },
  'touchstart .stats-view'(event) {
    event.stopPropagation();
  },
});

Template.timeView.helpers({
  cardsWithTimeSpent() { return statsNum('cardsWithTimeSpent'); },
  overtimeCards() { return statsNum('overtimeCards'); },
  timeSpentTotal() {
    const s = Template.instance().status.get();
    if (!s) return '…';
    const n = Number(s.timeSpentTotal) || 0;
    return `${n} h`;
  },
});
