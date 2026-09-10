import { ReactiveCache } from '/imports/reactiveCache';
import { ReactiveVar } from 'meteor/reactive-var';
const { notHelperBoardTitle } = require('/models/lib/helperBoards');

// #4223: Kanboard's BigBoard plugin shows every board the user can access,
// stacked on one page, each as its own mini kanban board - no manual setup,
// automatic based on board membership. This mirrors that: the same
// membership query the All Boards page already uses (boardsList.js), minus
// templates and the archive, each board's lists/cards published via the same
// 'board' composite subscription a normal single-board page uses so the
// existing swimlanes/listsGroup + list/card templates (and their
// drag-and-drop) work unmodified per board.
function bigboardQuery() {
  return {
    archived: false,
    type: 'board',
    'members.userId': Meteor.userId(),
    title: notHelperBoardTitle(),
  };
}

Template.bigboardView.onCreated(function () {
  const instance = this;
  instance.subsReady = new ReactiveVar(false);
  // The metadata-only 'boards' subscription is already kept alive app-wide
  // (client/components/main/header.js), so the board list itself is
  // available immediately. What is still missing per board is its lists,
  // swimlanes and cards, which normally only get subscribed to when that
  // one board is opened - so subscribe to each visible board's own 'board'
  // composite here.
  instance.autorun(() => {
    const boards = ReactiveCache.getBoards(bigboardQuery(), {
      sort: { sort: 1 },
    });
    let allReady = true;
    boards.forEach((board) => {
      const handle = instance.subscribe('board', board._id, false);
      if (!handle.ready()) allReady = false;
    });
    instance.subsReady.set(allReady);
  });
});

Template.bigboardView.helpers({
  isLoading() {
    return !Template.instance().subsReady.get();
  },
  bigboardBoards() {
    return ReactiveCache.getBoards(bigboardQuery(), { sort: { sort: 1 } });
  },
  hasBoards() {
    return ReactiveCache.getBoards(bigboardQuery(), {}).length > 0;
  },
});

Template.bigboardView.events({
  // See statsView.js: stop the board canvas's drag-to-scroll from swallowing
  // the pointer/touch events a board section's own controls need.
  'mousedown .bigboard-board-title'(event) {
    event.stopPropagation();
  },
});
