import { DataCache } from 'meteor-reactive-cache';
import { Jsons } from './jsons';

// Server isn't reactive, so search for the data always.
ReactiveCacheServer = {
  getBoard(idOrFirstObjectSelector) {
    const ret = Boards.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getBoards(selector) {
    const ret = Boards.find(selector).fetch();
    return ret;
  },
  getList(idOrFirstObjectSelector) {
    const ret = Lists.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getLists(selector) {
    const ret = Lists.find(selector).fetch();
    return ret;
  },
  getSwimlane(idOrFirstObjectSelector) {
    const ret = Swimlanes.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getSwimlanes(selector) {
    const ret = Swimlanes.find(selector).fetch();
    return ret;
  },
  getChecklist(idOrFirstObjectSelector) {
    const ret = Checklists.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getChecklists(selector) {
    const ret = Checklists.find(selector).fetch();
    return ret;
  },
  getChecklistItem(idOrFirstObjectSelector) {
    const ret = ChecklistItems.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getChecklistItems(selector) {
    const ret = ChecklistItems.find(selector).fetch();
    return ret;
  },
  getCard(idOrFirstObjectSelector) {
    const ret = Cards.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getCards(selector) {
    const ret = Cards.find(selector).fetch();
    return ret;
  },
  getCardComment(idOrFirstObjectSelector) {
    const ret = CardComments.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getCardComments(selector) {
    const ret = CardComments.find(selector).fetch();
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
  getAttachments(selector) {
    const ret = Attachments.find(selector).fetch();
    return ret;
  },
  getUser(idOrFirstObjectSelector) {
    const ret = Users.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getUsers(selector) {
    const ret = Users.find(selector).fetch();
    return ret;
  },
  getOrg(idOrFirstObjectSelector) {
    const ret = Org.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getOrgs(selector) {
    const ret = Org.find(selector).fetch();
    return ret;
  },
  getTeam(idOrFirstObjectSelector) {
    const ret = Team.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getTeams(selector) {
    const ret = Team.find(selector).fetch();
    return ret;
  },
  getActivity(idOrFirstObjectSelector) {
    const ret = Activities.findOne(idOrFirstObjectSelector);
    return ret;
  },
  getActivities(selector) {
    const ret = Activities.find(selector).fetch();
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
  getBoards(selector) {
    if (!this.__boards) {
      this.__boards = new DataCache(_selector => {
        const _ret = Boards.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__boards.get(Jsons.stringify(selector));
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
  getLists(selector) {
    if (!this.__lists) {
      this.__lists = new DataCache(_selector => {
        const _ret = Lists.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__lists.get(Jsons.stringify(selector));
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
  getSwimlanes(selector) {
    if (!this.__swimlanes) {
      this.__swimlanes = new DataCache(_selector => {
        const _ret = Swimlanes.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__swimlanes.get(Jsons.stringify(selector));
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
  getChecklists(selector) {
    if (!this.__checklists) {
      this.__checklists = new DataCache(_selector => {
        const _ret = Checklists.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__checklists.get(Jsons.stringify(selector));
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
  getChecklistItems(selector) {
    if (!this.__checklistItems) {
      this.__checklistItems = new DataCache(_selector => {
        const _ret = ChecklistItems.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__checklistItems.get(Jsons.stringify(selector));
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
  getCards(selector) {
    if (!this.__cards) {
      this.__cards = new DataCache(_selector => {
        const _ret = Cards.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__cards.get(Jsons.stringify(selector));
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
  getCardComments(selector) {
    if (!this.__cardComments) {
      this.__cardComments = new DataCache(_selector => {
        const _ret = CardComments.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__cardComments.get(Jsons.stringify(selector));
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
  getAttachments(selector) {
    if (!this.__attachments) {
      this.__attachments = new DataCache(_selector => {
        const _ret = Attachments.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__attachments.get(Jsons.stringify(selector));
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
  getUsers(selector) {
    if (!this.__users) {
      this.__users = new DataCache(_selector => {
        const _ret = Users.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__users.get(Jsons.stringify(selector));
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
  getOrgs(selector) {
    if (!this.__orgs) {
      this.__orgs = new DataCache(_selector => {
        const _ret = Org.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__orgs.get(Jsons.stringify(idOrFirstObjectSelector));
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
  getTeams(selector) {
    if (!this.__teams) {
      this.__teams = new DataCache(_selector => {
        const _ret = Team.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__teams.get(Jsons.stringify(selector));
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
  getActivities(selector) {
    if (!this.__activities) {
      this.__activities = new DataCache(_selector => {
        const _ret = Activities.find(Jsons.parse(_selector)).fetch();
        return _ret;
      });
    }
    const ret = this.__activities.get(Jsons.stringify(selector));
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
  getBoards(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getBoards(selector);
    } else {
      ret = ReactiveCacheClient.getBoards(selector);
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
  getLists(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getLists(selector);
    } else {
      ret = ReactiveCacheClient.getLists(selector);
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
  getSwimlanes(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getSwimlanes(selector);
    } else {
      ret = ReactiveCacheClient.getSwimlanes(selector);
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
  getChecklists(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklists(selector);
    } else {
      ret = ReactiveCacheClient.getChecklists(selector);
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
  getChecklistItems(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklistItems(selector);
    } else {
      ret = ReactiveCacheClient.getChecklistItems(selector);
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
  getCards(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCards(selector);
    } else {
      ret = ReactiveCacheClient.getCards(selector);
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
  getCardComments(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCardComments(selector);
    } else {
      ret = ReactiveCacheClient.getCardComments(selector);
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
  getAttachments(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getAttachments(selector);
    } else {
      ret = ReactiveCacheClient.getAttachments(selector);
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
  getUsers(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getUsers(selector);
    } else {
      ret = ReactiveCacheClient.getUsers(selector);
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
  getOrgs(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getOrgs(selector);
    } else {
      ret = ReactiveCacheClient.getOrgs(selector);
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
  getTeams(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getTeams(selector);
    } else {
      ret = ReactiveCacheClient.getTeams(selector);
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
  getActivities(selector) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getActivities(selector);
    } else {
      ret = ReactiveCacheClient.getActivities(selector);
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
