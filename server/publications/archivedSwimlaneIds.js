// #6927: the ids of one board's archived swimlanes, for the client's
// first-swimlane orphan rule (models/lib/archivedSwimlaneIds.js). Only ids, in
// one document per board in a client-only collection; read access as for the
// board itself.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Boards from '/models/boards';
import Swimlanes from '/models/swimlanes';
import { canReadBoard } from '/models/lib/boardVisibility';
const { COLLECTION } = require('/models/lib/archivedSwimlaneIds');

Meteor.publish('boardArchivedSwimlaneIds', async function (boardId) {
  check(boardId, Match.Any);
  if (!Match.test(boardId, String) || !boardId) return this.ready();
  const board = await Boards.findOneAsync(boardId);
  if (!canReadBoard(this.userId, board)) return this.ready();

  const ids = new Set();
  let initializing = true;
  const send = () => {
    if (initializing) return;
    this.changed(COLLECTION, boardId, { ids: [...ids] });
  };
  const handle = await Swimlanes.find({ boardId, archived: true }, { fields: { _id: 1 } }).observeChangesAsync({
    added: id => { ids.add(id); send(); },
    removed: id => { ids.delete(id); send(); },
  });
  initializing = false;
  this.added(COLLECTION, boardId, { ids: [...ids] });
  this.onStop(() => handle.stop());
  this.ready();
});
