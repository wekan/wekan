import { DataCache } from 'meteor-reactive-cache';

// global Reactive Cache class to avoid big overhead while searching for the same data often again
ReactiveCache = {
  getBoard(id) {
    if (!this.__board) {
      this.__board = new DataCache(boardId => {
        return Boards.findOne(boardId);
      });
    }
    const ret = this.__board.get(id);
    return ret;
  }
}
