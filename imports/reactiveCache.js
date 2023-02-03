import { DataCache } from 'meteor-reactive-cache';
import { Jsons } from './jsons';

// Server isn't reactive, so search for the data always.
ReactiveCacheServer = {
  getBoard(id) {
    const ret = Boards.findOne(id);
    return ret;
  },
  getList(id) {
    const ret = Lists.findOne(id);
    return ret;
  },
  getSwimlane(id) {
    const ret = Swimlanes.findOne(id);
    return ret;
  },
  getChecklist(id) {
    const ret = Checklists.findOne(id);
    return ret;
  },
  getChecklistItem(id) {
    const ret = ChecklistItems.findOne(id);
    return ret;
  },
  getCard(id) {
    const ret = Cards.findOne(id);
    return ret;
  },
  getCardComment(id) {
    const ret = CardComments.findOne(id);
    return ret;
  },
  getCustomField(id) {
    const ret = CustomFields.findOne(id);
    return ret;
  },
  getCustomFields(selector) {
    const ret = CustomFields.find(selector).fetch();
    return ret;
  },
  getUser(id) {
    const ret = Users.findOne(id);
    return ret;
  },
  getOrg(id) {
    const ret = Org.findOne(id);
    return ret;
  },
  getActivity(id) {
    const ret = Activities.findOne(id);
    return ret;
  },
  getCurrentSetting() {
    const ret = Settings.findOne();
    return ret;
  },
  getCurrentUser() {
    const ret =  Meteor.user();
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
  },
  getList(id) {
    if (!this.__list) {
      this.__list = new DataCache(listId => {
        const _ret = Lists.findOne(listId);
        return _ret;
      });
    }
    const ret = this.__list.get(id);
    return ret;
  },
  getSwimlane(id) {
    if (!this.__swimlane) {
      this.__swimlane = new DataCache(swimlaneId => {
        const _ret = Swimlanes.findOne(swimlaneId);
        return _ret;
      });
    }
    const ret = this.__swimlane.get(id);
    return ret;
  },
  getChecklist(id) {
    if (!this.__checklist) {
      this.__checklist = new DataCache(checklistId => {
        const _ret = Checklists.findOne(checklistId);
        return _ret;
      });
    }
    const ret = this.__checklist.get(id);
    return ret;
  },
  getChecklistItem(id) {
    if (!this.__checklistItem) {
      this.__checklistItem = new DataCache(_id => {
        const _ret = ChecklistItems.findOne(_id);
        return _ret;
      });
    }
    const ret = this.__checklistItem.get(id);
    return ret;
  },
  getCard(id) {
    if (!this.__card) {
      this.__card = new DataCache(cardId => {
        const _ret = Cards.findOne(cardId);
        return _ret;
      });
    }
    const ret = this.__card.get(id);
    return ret;
  },
  getCardComment(id) {
    if (!this.__cardComment) {
      this.__cardComment = new DataCache(_id => {
        const _ret = CardComments.findOne(_id);
        return _ret;
      });
    }
    const ret = this.__cardComment.get(id);
    return ret;
  },
  getCustomField(id) {
    if (!this.__customField) {
      this.__customField = new DataCache(customFieldId => {
        const _ret = CustomFields.findOne(customFieldId);
        return _ret;
      });
    }
    const ret = this.__customField.get(id);
    return ret;
  },
  getCustomFields(selector) {
    if (!this.__customFields) {
      this.__customFields = new DataCache(sel => {
        const _ret = CustomFields.find(Jsons.parse(sel)).fetch();
        return _ret;
      });
    }
    const ret = this.__customFields.get(Jsons.stringify(selector));
    return ret;
  },
  getUser(id) {
    if (!this.__user) {
      this.__user = new DataCache(userId => {
        const _ret = Users.findOne(userId);
        return _ret;
      });
    }
    const ret = this.__user.get(id);
    return ret;
  },
  getOrg(id) {
    if (!this.__org) {
      this.__org = new DataCache(_id => {
        const _ret = Org.findOne(_id);
        return _ret;
      });
    }
    const ret = this.__org.get(id);
    return ret;
  },
  getActivity(id) {
    if (!this.__activity) {
      this.__activity = new DataCache(_id => {
        const _ret = Activities.findOne(_id);
        return _ret;
      });
    }
    const ret = this.__activity.get(id);
    return ret;
  },
  getCurrentSetting() {
    if (!this.__currentSetting || !this.__currentSetting.get()) {
      this.__currentSetting = new DataCache(() => {
        const _ret = Settings.findOne();
        return _ret;
      });
    }
    const ret = this.__currentSetting.get();
    return ret;
  },
  getCurrentUser() {
    if (!this.__currentUser || !this.__currentUser.get()) {
      this.__currentUser = new DataCache(() => {
        const _ret = Meteor.user();
        return _ret;
      });
    }
    const ret = this.__currentUser.get();
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
  getList(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getList(id);
    } else {
      ret = ReactiveCacheClient.getList(id);
    }
    return ret;
  },
  getSwimlane(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getSwimlane(id);
    } else {
      ret = ReactiveCacheClient.getSwimlane(id);
    }
    return ret;
  },
  getChecklist(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklist(id);
    } else {
      ret = ReactiveCacheClient.getChecklist(id);
    }
    return ret;
  },
  getChecklistItem(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklistItem(id);
    } else {
      ret = ReactiveCacheClient.getChecklistItem(id);
    }
    return ret;
  },
  getCard(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCard(id);
    } else {
      ret = ReactiveCacheClient.getCard(id);
    }
    return ret;
  },
  getCardComment(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCardComment(id);
    } else {
      ret = ReactiveCacheClient.getCardComment(id);
    }
    return ret;
  },
  getCustomField(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCustomField(id);
    } else {
      ret = ReactiveCacheClient.getCustomField(id);
    }
    return ret;
  },
  getCustomFields(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCustomFields(selector);
    } else {
      ret = ReactiveCacheClient.getCustomFields(selector);
    }
    return ret;
  },
  getUser(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getUser(id);
    } else {
      ret = ReactiveCacheClient.getUser(id);
    }
    return ret;
  },
  getOrg(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getOrg(id);
    } else {
      ret = ReactiveCacheClient.getOrg(id);
    }
    return ret;
  },
  getActivity(id) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getActivity(id);
    } else {
      ret = ReactiveCacheClient.getActivity(id);
    }
    return ret;
  },
  getCurrentSetting() {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCurrentSetting();
    } else {
      ret = ReactiveCacheClient.getCurrentSetting();
    }
    return ret;
  },
  getCurrentUser() {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCurrentUser();
    } else {
      ret = ReactiveCacheClient.getCurrentUser();
    }
    return ret;
  },
}

export { ReactiveCache };
