import { DataCache } from 'meteor-reactive-cache';

// Server isn't reactive, so search for the data always.
ReactiveCacheServer = {
  getBoard(id) {
    const ret = Boards.findOne(id);
    return ret;
  },
}

// only the Client is reactive
// saving the result has a big advantage if the query is big and often searched for the same data again and again
// if the data is changed in the client, the data is saved to the server and depending code is reactive called again
ReactiveCacheClient = {
  getBoard(id) {
    if (!this.__board) {
      this.__board = new DataCache(boardId => {
        const _ret = Boards.findOne(boardId);
        return _ret;
      });
    }
    const ret = this.__board.get(id);
    return ret;
  }
}

// global Reactive Cache class to avoid big overhead while searching for the same data often again
// This class calls 2 implementation, for server and client code
//
// having this class here has several advantages:
// - The Programmer hasn't to care about in which context he call's this class
// - having all queries together in 1 class to make it possible to see which queries in Wekan happens, e.g. with console.log
ReactiveCache = {
  getBoard(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getBoard(id);
    } else {
      ret = ReactiveCacheClient.getBoard(id);
    }
    return ret;
  },
}

export { ReactiveCache };
