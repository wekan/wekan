import { DataCache } from 'meteor-reactive-cache';
import { Jsons } from './jsons';

// Server isn't reactive, so search for the data always.
ReactiveCacheServer = {
  getBoard(idOrFirstObjectSelector, options) {
    const ret = Boards.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getBoards(selector, options) {
    const ret = Boards.find(selector, options).fetch();
    return ret;
  },
  getList(idOrFirstObjectSelector, options) {
    const ret = Lists.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getLists(selector, options) {
    const ret = Lists.find(selector, options).fetch();
    return ret;
  },
  getSwimlane(idOrFirstObjectSelector, options) {
    const ret = Swimlanes.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getSwimlanes(selector, options) {
    const ret = Swimlanes.find(selector, options).fetch();
    return ret;
  },
  getChecklist(idOrFirstObjectSelector, options) {
    const ret = Checklists.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getChecklists(selector, options) {
    const ret = Checklists.find(selector, options).fetch();
    return ret;
  },
  getChecklistItem(idOrFirstObjectSelector, options) {
    const ret = ChecklistItems.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getChecklistItems(selector, options) {
    const ret = ChecklistItems.find(selector, options).fetch();
    return ret;
  },
  getCard(idOrFirstObjectSelector, options) {
    const ret = Cards.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getCards(selector, options) {
    const ret = Cards.find(selector, options).fetch();
    return ret;
  },
  getCardComment(idOrFirstObjectSelector, options) {
    const ret = CardComments.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getCardComments(selector, options) {
    const ret = CardComments.find(selector, options).fetch();
    return ret;
  },
  getCustomField(idOrFirstObjectSelector, options) {
    const ret = CustomFields.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getCustomFields(selector, options) {
    const ret = CustomFields.find(selector, options).fetch();
    return ret;
  },
  getAttachment(idOrFirstObjectSelector, options) {
    const ret = Attachments.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getAttachments(selector, options) {
    const ret = Attachments.find(selector, options).fetch();
    return ret;
  },
  getUser(idOrFirstObjectSelector, options) {
    const ret = Users.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getUsers(selector, options) {
    const ret = Users.find(selector, options).fetch();
    return ret;
  },
  getOrg(idOrFirstObjectSelector, options) {
    const ret = Org.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getOrgs(selector, options) {
    const ret = Org.find(selector, options).fetch();
    return ret;
  },
  getTeam(idOrFirstObjectSelector, options) {
    const ret = Team.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getTeams(selector, options) {
    const ret = Team.find(selector, options).fetch();
    return ret;
  },
  getActivity(idOrFirstObjectSelector, options) {
    const ret = Activities.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getActivities(selector, options) {
    const ret = Activities.find(selector, options).fetch();
    return ret;
  },
  getRule(idOrFirstObjectSelector, options) {
    const ret = Rules.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getRules(selector, options) {
    const ret = Rules.find(selector, options).fetch();
    return ret;
  },
  getAction(idOrFirstObjectSelector, options) {
    const ret = Actions.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getActions(selector, options) {
    const ret = Actions.find(selector, options).fetch();
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
  getBoard(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__board) {
      this.__board = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Boards.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__board.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getBoards(selector, options) {
    const select = {selector, options}
    if (!this.__boards) {
      this.__boards = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Boards.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__boards.get(Jsons.stringify(select));
    return ret;
  },
  getList(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__list) {
      this.__list = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Lists.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__list.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getLists(selector, options) {
    const select = {selector, options}
    if (!this.__lists) {
      this.__lists = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Lists.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__lists.get(Jsons.stringify(select));
    return ret;
  },
  getSwimlane(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__swimlane) {
      this.__swimlane = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Swimlanes.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__swimlane.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getSwimlanes(selector, options) {
    const select = {selector, options}
    if (!this.__swimlanes) {
      this.__swimlanes = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Swimlanes.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__swimlanes.get(Jsons.stringify(select));
    return ret;
  },
  getChecklist(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__checklist) {
      this.__checklist = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Checklists.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__checklist.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getChecklists(selector, options) {
    const select = {selector, options}
    if (!this.__checklists) {
      this.__checklists = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Checklists.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__checklists.get(Jsons.stringify(select));
    return ret;
  },
  getChecklistItem(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__checklistItem) {
      this.__checklistItem = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = ChecklistItems.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__checklistItem.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getChecklistItems(selector, options) {
    const select = {selector, options}
    if (!this.__checklistItems) {
      this.__checklistItems = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = ChecklistItems.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__checklistItems.get(Jsons.stringify(select));
    return ret;
  },
  getCard(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__card) {
      this.__card = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Cards.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__card.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getCards(selector, options) {
    const select = {selector, options}
    if (!this.__cards) {
      this.__cards = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Cards.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__cards.get(Jsons.stringify(select));
    return ret;
  },
  getCardComment(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__cardComment) {
      this.__cardComment = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = CardComments.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__cardComment.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getCardComments(selector, options) {
    const select = {selector, options}
    if (!this.__cardComments) {
      this.__cardComments = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = CardComments.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__cardComments.get(Jsons.stringify(select));
    return ret;
  },
  getCustomField(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__customField) {
      this.__customField = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = CustomFields.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__customField.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getCustomFields(selector, options) {
    const select = {selector, options}
    if (!this.__customFields) {
      this.__customFields = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = CustomFields.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__customFields.get(Jsons.stringify(select));
    return ret;
  },
  getAttachment(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__attachment) {
      this.__attachment = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Attachments.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__attachment.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getAttachments(selector, options) {
    const select = {selector, options}
    if (!this.__attachments) {
      this.__attachments = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Attachments.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__attachments.get(Jsons.stringify(select));
    return ret;
  },
  getUser(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__user) {
      this.__user = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Users.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__user.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getUsers(selector, options) {
    const select = {selector, options}
    if (!this.__users) {
      this.__users = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Users.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__users.get(Jsons.stringify(select));
    return ret;
  },
  getOrg(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__org) {
      this.__org = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Org.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__org.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getOrgs(selector, options) {
    const select = {selector, options}
    if (!this.__orgs) {
      this.__orgs = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Org.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__orgs.get(Jsons.stringify(select));
    return ret;
  },
  getTeam(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__team) {
      this.__team = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Team.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__team.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getTeams(selector, options) {
    const select = {selector, options}
    if (!this.__teams) {
      this.__teams = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Team.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__teams.get(Jsons.stringify(select));
    return ret;
  },
  getActivity(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__activity) {
      this.__activity = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Activities.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__activity.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getActivities(selector, options) {
    const select = {selector, options}
    if (!this.__activities) {
      this.__activities = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Activities.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__activities.get(Jsons.stringify(select));
    return ret;
  },
  getRule(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__rule) {
      this.__rule = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Rules.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__rule.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getRules(selector, options) {
    const select = {selector, options}
    if (!this.__rules) {
      this.__rules = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Rules.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__rules.get(Jsons.stringify(select));
    return ret;
  },
  getAction(idOrFirstObjectSelector, options) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__action) {
      this.__action = new DataCache(_idOrFirstObjectSelect => {
        const __select = Jsons.parse(_idOrFirstObjectSelect);
        const _ret = Actions.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__action.get(Jsons.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getActions(selector, options) {
    const select = {selector, options}
    if (!this.__actions) {
      this.__actions = new DataCache(_select => {
        const __select = Jsons.parse(_select);
        const _ret = Actions.find(__select.selector, __select.options).fetch();
        return _ret;
      });
    }
    const ret = this.__actions.get(Jsons.stringify(select));
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
  getBoard(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getBoard(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getBoard(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getBoards(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getBoards(selector, options);
    } else {
      ret = ReactiveCacheClient.getBoards(selector, options);
    }
    return ret;
  },
  getList(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getList(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getList(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getLists(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getLists(selector, options);
    } else {
      ret = ReactiveCacheClient.getLists(selector, options);
    }
    return ret;
  },
  getSwimlane(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getSwimlane(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getSwimlane(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getSwimlanes(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getSwimlanes(selector, options);
    } else {
      ret = ReactiveCacheClient.getSwimlanes(selector, options);
    }
    return ret;
  },
  getChecklist(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklist(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getChecklist(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getChecklists(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklists(selector, options);
    } else {
      ret = ReactiveCacheClient.getChecklists(selector, options);
    }
    return ret;
  },
  getChecklistItem(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklistItem(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getChecklistItem(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getChecklistItems(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklistItems(selector, options);
    } else {
      ret = ReactiveCacheClient.getChecklistItems(selector, options);
    }
    return ret;
  },
  getCard(idOrFirstObjectSelector, options, noCache = false) {
    let ret;
    if (Meteor.isServer || noCache === true) {
      ret = ReactiveCacheServer.getCard(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getCard(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getCards(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCards(selector, options);
    } else {
      ret = ReactiveCacheClient.getCards(selector, options);
    }
    return ret;
  },
  getCardComment(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCardComment(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getCardComment(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getCardComments(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCardComments(selector, options);
    } else {
      ret = ReactiveCacheClient.getCardComments(selector, options);
    }
    return ret;
  },
  getCustomField(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCustomField(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getCustomField(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getCustomFields(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCustomFields(selector, options);
    } else {
      ret = ReactiveCacheClient.getCustomFields(selector, options);
    }
    return ret;
  },
  getAttachment(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getAttachment(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getAttachment(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getAttachments(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getAttachments(selector, options);
    } else {
      ret = ReactiveCacheClient.getAttachments(selector, options);
    }
    return ret;
  },
  getUser(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getUser(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getUser(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getUsers(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getUsers(selector, options);
    } else {
      ret = ReactiveCacheClient.getUsers(selector, options);
    }
    return ret;
  },
  getOrg(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getOrg(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getOrg(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getOrgs(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getOrgs(selector, options);
    } else {
      ret = ReactiveCacheClient.getOrgs(selector, options);
    }
    return ret;
  },
  getTeam(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getTeam(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getTeam(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getTeams(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getTeams(selector, options);
    } else {
      ret = ReactiveCacheClient.getTeams(selector, options);
    }
    return ret;
  },
  getActivity(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getActivity(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getActivity(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getActivities(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getActivities(selector, options);
    } else {
      ret = ReactiveCacheClient.getActivities(selector, options);
    }
    return ret;
  },
  getRule(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getRule(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getRule(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getRules(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getRules(selector, options);
    } else {
      ret = ReactiveCacheClient.getRules(selector, options);
    }
    return ret;
  },
  getAction(idOrFirstObjectSelector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getAction(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getAction(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getActions(selector, options) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getActions(selector, options);
    } else {
      ret = ReactiveCacheClient.getActions(selector, options);
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
