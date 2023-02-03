import { DataCache } from 'meteor-reactive-cache';
import { Jsons } from './jsons';

// Server isn't reactive, so search for the data always.
ReactiveCacheServer = {
  getBoard(idOrFirstObjectSelector) {
    const ret = Boards.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getList(idOrFirstObjectSelector) {
    const ret = Lists.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getSwimlane(idOrFirstObjectSelector) {
    const ret = Swimlanes.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getChecklist(idOrFirstObjectSelector) {
    const ret = Checklists.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getChecklistItem(idOrFirstObjectSelector) {
    const ret = ChecklistItems.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getCard(idOrFirstObjectSelector) {
    const ret = Cards.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getCardComment(idOrFirstObjectSelector) {
    const ret = CardComments.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getCustomField(idOrFirstObjectSelector) {
    const ret = CustomFields.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getCustomFields(selector) {
    const ret = CustomFields.find(selector).fetch();
    return ret;
  },
  getAttachment(idOrFirstObjectSelector) {
    const ret = Attachments.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getUser(idOrFirstObjectSelector) {
    const ret = Users.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getOrg(idOrFirstObjectSelector) {
    const ret = Org.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getTeam(idOrFirstObjectSelector) {
    const ret = Team.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getActivity(idOrFirstObjectSelector) {
    const ret = Activities.findOne(idOrFirstObjectSelector);
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
  getBoard(idOrFirstObjectSelector) {
    if (!this.__board) {
      this.__board = new DataCache(_idOrFirstObjectSelector => {
        const _ret = Boards.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__board.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getList(idOrFirstObjectSelector) {
    if (!this.__list) {
      this.__list = new DataCache(_idOrFirstObjectSelector => {
        const _ret = Lists.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__list.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getSwimlane(idOrFirstObjectSelector) {
    if (!this.__swimlane) {
      this.__swimlane = new DataCache(_idOrFirstObjectSelector => {
        const _ret = Swimlanes.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__swimlane.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getChecklist(idOrFirstObjectSelector) {
    if (!this.__checklist) {
      this.__checklist = new DataCache(_idOrFirstObjectSelector => {
        const _ret = Checklists.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__checklist.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getChecklistItem(idOrFirstObjectSelector) {
    if (!this.__checklistItem) {
      this.__checklistItem = new DataCache(_idOrFirstObjectSelector => {
        const _ret = ChecklistItems.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__checklistItem.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getCard(idOrFirstObjectSelector) {
    if (!this.__card) {
      this.__card = new DataCache(_idOrFirstObjectSelector => {
        const _ret = Cards.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__card.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getCardComment(idOrFirstObjectSelector) {
    if (!this.__cardComment) {
      this.__cardComment = new DataCache(_idOrFirstObjectSelector => {
        const _ret = CardComments.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__cardComment.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getCustomField(idOrFirstObjectSelector) {
    if (!this.__customField) {
      this.__customField = new DataCache(_idOrFirstObjectSelector => {
        const _ret = CustomFields.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__customField.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getCustomFields(selector) {
    if (!this.__customFields) {
      this.__customFields = new DataCache(_selector => {
        const _ret = CustomFields.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__customFields.get(Jsons.stringify(selector));
    return ret;
  },
  getAttachment(idOrFirstObjectSelector) {
    if (!this.__attachment) {
      this.__attachment = new DataCache(_idOrFirstObjectSelector => {
        const _ret = Attachments.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__attachment.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getUser(idOrFirstObjectSelector) {
    if (!this.__user) {
      this.__user = new DataCache(_idOrFirstObjectSelector => {
        const _ret = Users.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__user.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getOrg(idOrFirstObjectSelector) {
    if (!this.__org) {
      this.__org = new DataCache(_idOrFirstObjectSelector => {
        const _ret = Org.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__org.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getTeam(idOrFirstObjectSelector) {
    if (!this.__team) {
      this.__team = new DataCache(_idOrFirstObjectSelector => {
        const _ret = Team.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__team.get(Jsons.stringify(idOrFirstObjectSelector));
    return ret;
  },
  getActivity(idOrFirstObjectSelector) {
    if (!this.__activity) {
      this.__activity = new DataCache(_idOrFirstObjectSelector => {
        const _ret = Activities.findOne(Jsons.parse(_idOrFirstObjectSelector));
        return _ret;
      });
    }
    const ret = this.__activity.get(Jsons.stringify(idOrFirstObjectSelector));
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
  getBoard(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getBoard(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getBoard(idOrFirstObjectSelector);
    }
    return ret;
  },
  getList(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getList(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getList(idOrFirstObjectSelector);
    }
    return ret;
  },
  getSwimlane(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getSwimlane(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getSwimlane(idOrFirstObjectSelector);
    }
    return ret;
  },
  getChecklist(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklist(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getChecklist(idOrFirstObjectSelector);
    }
    return ret;
  },
  getChecklistItem(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklistItem(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getChecklistItem(idOrFirstObjectSelector);
    }
    return ret;
  },
  getCard(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCard(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getCard(idOrFirstObjectSelector);
    }
    return ret;
  },
  getCardComment(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCardComment(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getCardComment(idOrFirstObjectSelector);
    }
    return ret;
  },
  getCustomField(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCustomField(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getCustomField(idOrFirstObjectSelector);
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
  getAttachment(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getAttachment(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getAttachment(idOrFirstObjectSelector);
    }
    return ret;
  },
  getUser(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getUser(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getUser(idOrFirstObjectSelector);
    }
    return ret;
  },
  getOrg(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getOrg(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getOrg(idOrFirstObjectSelector);
    }
    return ret;
  },
  getTeam(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getTeam(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getTeam(idOrFirstObjectSelector);
    }
    return ret;
  },
  getActivity(idOrFirstObjectSelector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getActivity(idOrFirstObjectSelector);
    } else {
      ret = ReactiveCacheClient.getActivity(idOrFirstObjectSelector);
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
