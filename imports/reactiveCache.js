import { DataCache } from '@wekanteam/meteor-reactive-cache';

// Server isn't reactive, so search for the data always.
ReactiveCacheServer = {
  getBoard(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Boards.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getBoards(selector = {}, options = {}, getQuery = false) {
    let ret = Boards.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getList(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Lists.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getLists(selector = {}, options = {}, getQuery = false) {
    let ret = Lists.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getSwimlane(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Swimlanes.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getSwimlanes(selector = {}, options = {}, getQuery = false) {
    let ret = Swimlanes.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getChecklist(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Checklists.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getChecklists(selector = {}, options = {}, getQuery = false) {
    let ret = Checklists.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getChecklistItem(idOrFirstObjectSelector = {}, options = {}) {
    const ret = ChecklistItems.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getChecklistItems(selector = {}, options = {}, getQuery = false) {
    let ret = ChecklistItems.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getCard(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Cards.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getCards(selector = {}, options = {}, getQuery = false) {
    let ret = Cards.find(selector, options, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getCardComment(idOrFirstObjectSelector = {}, options = {}) {
    const ret = CardComments.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getCardComments(selector = {}, options = {}, getQuery = false) {
    let ret = CardComments.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getCardCommentReaction(idOrFirstObjectSelector = {}, options = {}) {
    const ret = CardCommentReactions.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getCardCommentReactions(selector = {}, options = {}, getQuery = false) {
    let ret = CardCommentReactions.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getCustomField(idOrFirstObjectSelector = {}, options = {}) {
    const ret = CustomFields.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getCustomFields(selector = {}, options = {}, getQuery = false) {
    let ret = CustomFields.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getAttachment(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Attachments.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getAttachments(selector = {}, options = {}, getQuery = false) {
    let ret = Attachments.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getAvatar(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Avatars.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getAvatars(selector = {}, options = {}, getQuery = false) {
    let ret = Avatars.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getUser(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Users.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getUsers(selector = {}, options = {}, getQuery = false) {
    let ret = Users.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getOrg(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Org.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getOrgs(selector = {}, options = {}, getQuery = false) {
    let ret = Org.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getTeam(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Team.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getTeams(selector = {}, options = {}, getQuery = false) {
    let ret = Team.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getActivity(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Activities.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getActivities(selector = {}, options = {}, getQuery = false) {
    let ret = Activities.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getRule(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Rules.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getRules(selector = {}, options = {}, getQuery = false) {
    let ret = Rules.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getAction(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Actions.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getActions(selector = {}, options = {}, getQuery = false) {
    let ret = Actions.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getTrigger(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Triggers.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getTriggers(selector = {}, options = {}, getQuery = false) {
    let ret = Triggers.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getImpersonatedUser(idOrFirstObjectSelector = {}, options = {}) {
    const ret = ImpersonatedUsers.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getImpersonatedUsers(selector = {}, options = {}, getQuery = false) {
    let ret = ImpersonatedUsers.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getIntegration(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Integrations.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getIntegrations(selector = {}, options = {}, getQuery = false) {
    let ret = Integrations.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getSessionData(idOrFirstObjectSelector = {}, options = {}) {
    const ret = SessionData.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getSessionDatas(selector = {}, options = {}, getQuery = false) {
    let ret = SessionData.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  },
  getInvitationCode(idOrFirstObjectSelector = {}, options = {}) {
    const ret = InvitationCodes.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getInvitationCodes(selector = {}, options = {}, getQuery = false) {
    let ret = InvitationCodes.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
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
  getTranslation(idOrFirstObjectSelector = {}, options = {}) {
    const ret = Translation.findOne(idOrFirstObjectSelector, options);
    return ret;
  },
  getTranslations(selector = {}, options = {}, getQuery = false) {
    let ret = Translation.find(selector, options);
    if (getQuery !== true) {
      ret = ret.fetch();
    }
    return ret;
  }
}

// only the Client is reactive
// saving the result has a big advantage if the query is big and often searched for the same data again and again
// if the data is changed in the client, the data is saved to the server and depending code is reactive called again
ReactiveCacheClient = {
  getBoard(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__board) {
      this.__board = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Boards.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__board.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getBoards(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__boards) {
      this.__boards = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Boards.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__boards.get(EJSON.stringify(select));
    return ret;
  },
  getList(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__list) {
      this.__list = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Lists.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__list.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getLists(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__lists) {
      this.__lists = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Lists.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__lists.get(EJSON.stringify(select));
    return ret;
  },
  getSwimlane(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__swimlane) {
      this.__swimlane = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Swimlanes.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__swimlane.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getSwimlanes(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__swimlanes) {
      this.__swimlanes = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Swimlanes.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__swimlanes.get(EJSON.stringify(select));
    return ret;
  },
  getChecklist(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__checklist) {
      this.__checklist = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Checklists.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__checklist.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getChecklists(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__checklists) {
      this.__checklists = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Checklists.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__checklists.get(EJSON.stringify(select));
    return ret;
  },
  getChecklistItem(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__checklistItem) {
      this.__checklistItem = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = ChecklistItems.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__checklistItem.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getChecklistItems(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__checklistItems) {
      this.__checklistItems = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = ChecklistItems.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__checklistItems.get(EJSON.stringify(select));
    return ret;
  },
  getCard(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__card) {
      this.__card = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Cards.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__card.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getCards(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__cards) {
      this.__cards = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Cards.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__cards.get(EJSON.stringify(select));
    return ret;
  },
  getCardComment(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__cardComment) {
      this.__cardComment = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = CardComments.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__cardComment.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getCardComments(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__cardComments) {
      this.__cardComments = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = CardComments.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__cardComments.get(EJSON.stringify(select));
    return ret;
  },
  getCardCommentReaction(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__cardCommentReaction) {
      this.__cardCommentReaction = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = CardCommentReactions.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__cardCommentReaction.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getCardCommentReactions(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__cardCommentReactions) {
      this.__cardCommentReactions = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = CardCommentReactions.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__cardCommentReactions.get(EJSON.stringify(select));
    return ret;
  },
  getCustomField(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__customField) {
      this.__customField = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = CustomFields.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__customField.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getCustomFields(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__customFields) {
      this.__customFields = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = CustomFields.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__customFields.get(EJSON.stringify(select));
    return ret;
  },
  getAttachment(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__attachment) {
      this.__attachment = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Attachments.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__attachment.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getAttachments(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__attachments) {
      this.__attachments = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Attachments.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__attachments.get(EJSON.stringify(select));
    return ret;
  },
  getAvatar(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__avatar) {
      this.__avatar = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Avatars.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__avatar.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getAvatars(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__avatars) {
      this.__avatars = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Avatars.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__avatars.get(EJSON.stringify(select));
    return ret;
  },
  getUser(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__user) {
      this.__user = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Users.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__user.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getUsers(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__users) {
      this.__users = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Users.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__users.get(EJSON.stringify(select));
    return ret;
  },
  getOrg(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__org) {
      this.__org = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Org.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__org.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getOrgs(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__orgs) {
      this.__orgs = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Org.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__orgs.get(EJSON.stringify(select));
    return ret;
  },
  getTeam(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__team) {
      this.__team = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Team.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__team.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getTeams(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__teams) {
      this.__teams = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Team.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__teams.get(EJSON.stringify(select));
    return ret;
  },
  getActivity(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__activity) {
      this.__activity = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Activities.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__activity.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getActivities(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__activities) {
      this.__activities = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Activities.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__activities.get(EJSON.stringify(select));
    return ret;
  },
  getRule(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__rule) {
      this.__rule = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Rules.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__rule.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getRules(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__rules) {
      this.__rules = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Rules.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__rules.get(EJSON.stringify(select));
    return ret;
  },
  getAction(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__action) {
      this.__action = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Actions.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__action.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getActions(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__actions) {
      this.__actions = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Actions.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__actions.get(EJSON.stringify(select));
    return ret;
  },
  getTrigger(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__trigger) {
      this.__trigger = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Triggers.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__trigger.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getTriggers(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__triggers) {
      this.__triggers = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Triggers.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__triggers.get(EJSON.stringify(select));
    return ret;
  },
  getImpersonatedUser(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__impersonatedUser) {
      this.__impersonatedUser = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = ImpersonatedUsers.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__impersonatedUser.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getImpersonatedUsers(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__impersonatedUsers) {
      this.__impersonatedUsers = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = ImpersonatedUsers.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__impersonatedUsers.get(EJSON.stringify(select));
    return ret;
  },
  getIntegration(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__integration) {
      this.__integration = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Integrations.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__integration.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getIntegrations(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__integrations) {
      this.__integrations = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Integrations.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__integrations.get(EJSON.stringify(select));
    return ret;
  },
  getInvitationCode(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__invitationCode) {
      this.__invitationCode = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = InvitationCodes.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__invitationCode.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getInvitationCodes(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__invitationCodes) {
      this.__invitationCodes = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = InvitationCodes.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__invitationCodes.get(EJSON.stringify(select));
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
  },
  getTranslation(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = {idOrFirstObjectSelector, options}
    if (!this.__translation) {
      this.__translation = new DataCache(_idOrFirstObjectSelect => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Translation.findOne(__select.idOrFirstObjectSelector, __select.options);
        return _ret;
      });
    }
    const ret = this.__translation.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getTranslations(selector = {}, options = {}, getQuery = false) {
    const select = {selector, options, getQuery}
    if (!this.__translations) {
      this.__translations = new DataCache(_select => {
        const __select = EJSON.parse(_select);
        let _ret = Translation.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
        }
        return _ret;
      });
    }
    const ret = this.__translations.get(EJSON.stringify(select));
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
  getBoard(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getBoard(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getBoard(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getBoards(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getBoards(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getBoards(selector, options, getQuery);
    }
    return ret;
  },
  getList(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getList(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getList(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getLists(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getLists(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getLists(selector, options, getQuery);
    }
    return ret;
  },
  getSwimlane(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getSwimlane(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getSwimlane(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getSwimlanes(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getSwimlanes(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getSwimlanes(selector, options, getQuery);
    }
    return ret;
  },
  getChecklist(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklist(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getChecklist(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getChecklists(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklists(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getChecklists(selector, options, getQuery);
    }
    return ret;
  },
  getChecklistItem(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklistItem(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getChecklistItem(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getChecklistItems(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getChecklistItems(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getChecklistItems(selector, options, getQuery);
    }
    return ret;
  },
  getCard(idOrFirstObjectSelector = {}, options = {}, noCache = false) {
    let ret;
    if (Meteor.isServer || noCache === true) {
      ret = ReactiveCacheServer.getCard(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getCard(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getCards(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCards(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getCards(selector, options, getQuery);
    }
    return ret;
  },
  getCardComment(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCardComment(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getCardComment(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getCardComments(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCardComments(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getCardComments(selector, options, getQuery);
    }
    return ret;
  },
  getCardCommentReaction(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCardCommentReaction(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getCardCommentReaction(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getCardCommentReactions(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCardCommentReactions(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getCardCommentReactions(selector, options, getQuery);
    }
    return ret;
  },
  getCustomField(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCustomField(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getCustomField(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getCustomFields(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getCustomFields(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getCustomFields(selector, options, getQuery);
    }
    return ret;
  },
  getAttachment(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getAttachment(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getAttachment(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getAttachments(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getAttachments(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getAttachments(selector, options, getQuery);
    }
    return ret;
  },
  getAvatar(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getAvatar(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getAvatar(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getAvatars(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getAvatars(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getAvatars(selector, options, getQuery);
    }
    return ret;
  },
  getUser(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getUser(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getUser(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getUsers(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getUsers(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getUsers(selector, options, getQuery);
    }
    return ret;
  },
  getOrg(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getOrg(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getOrg(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getOrgs(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getOrgs(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getOrgs(selector, options, getQuery);
    }
    return ret;
  },
  getTeam(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getTeam(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getTeam(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getTeams(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getTeams(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getTeams(selector, options, getQuery);
    }
    return ret;
  },
  getActivity(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getActivity(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getActivity(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getActivities(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getActivities(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getActivities(selector, options, getQuery);
    }
    return ret;
  },
  getRule(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getRule(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getRule(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getRules(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getRules(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getRules(selector, options, getQuery);
    }
    return ret;
  },
  getAction(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getAction(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getAction(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getActions(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getActions(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getActions(selector, options, getQuery);
    }
    return ret;
  },
  getTrigger(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getTrigger(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getTrigger(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getTriggers(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getTriggers(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getTriggers(selector, options, getQuery);
    }
    return ret;
  },
  getImpersonatedUser(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getImpersonatedUser(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getImpersonatedUser(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getImpersonatedUsers(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getImpersonatedUsers(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getImpersonatedUsers(selector, options, getQuery);
    }
    return ret;
  },
  getIntegration(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getIntegration(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getIntegration(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getIntegrations(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getIntegrations(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getIntegrations(selector, options, getQuery);
    }
    return ret;
  },
  getSessionData(idOrFirstObjectSelector = {}, options = {}) {
    // no reactive cache, otherwise global search will not work anymore
    let ret = ReactiveCacheServer.getSessionData(idOrFirstObjectSelector, options);
    return ret;
  },
  getSessionDatas(selector = {}, options = {}, getQuery = false) {
    // no reactive cache, otherwise global search will not work anymore
    let ret = ReactiveCacheServer.getSessionDatas(selector, options, getQuery);
    return ret;
  },
  getInvitationCode(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getInvitationCode(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getInvitationCode(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getInvitationCodes(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getInvitationCodes(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getInvitationCodes(selector, options, getQuery);
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
  getTranslation(idOrFirstObjectSelector = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getTranslation(idOrFirstObjectSelector, options);
    } else {
      ret = ReactiveCacheClient.getTranslation(idOrFirstObjectSelector, options);
    }
    return ret;
  },
  getTranslations(selector = {}, options = {}, getQuery = false) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveCacheServer.getTranslations(selector, options, getQuery);
    } else {
      ret = ReactiveCacheClient.getTranslations(selector, options, getQuery);
    }
    return ret;
  },
}

// Server isn't reactive, so search for the data always.
ReactiveMiniMongoIndexServer = {
  getSubTasksWithParentId(parentId, addSelect = {}, options = {}) {
    let ret = []
    if (parentId) {
      ret = ReactiveCache.getCards(
        { parentId,
          ...addSelect,
        }, options);
    }
    return ret;
  },
  getChecklistsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret = []
    if (cardId) {
      ret = ReactiveCache.getChecklists(
        { cardId,
          ...addSelect,
        }, options);
    }
    return ret;
  },
  getChecklistItemsWithChecklistId(checklistId, addSelect = {}, options = {}) {
    let ret = []
    if (checklistId) {
      ret = ReactiveCache.getChecklistItems(
        { checklistId,
          ...addSelect,
        }, options);
    }
    return ret;
  },
  getCardCommentsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret = []
    if (cardId) {
      ret = ReactiveCache.getCardComments(
        { cardId,
          ...addSelect,
        }, options);
    }
    return ret;
  },
  getActivityWithId(activityId, addSelect = {}, options = {}) {
    let ret = []
    if (activityId) {
      ret = ReactiveCache.getActivities(
        { _id: activityId,
          ...addSelect,
        }, options);
    }
    return ret;
  }
}

// Client side little MiniMongo DB "Index"
ReactiveMiniMongoIndexClient = {
  getSubTasksWithParentId(parentId, addSelect = {}, options = {}) {
    let ret = []
    if (parentId) {
      const select = {addSelect, options}
      if (!this.__subTasksWithId) {
        this.__subTasksWithId = new DataCache(_select => {
          const __select = EJSON.parse(_select);
          const _subTasks = ReactiveCache.getCards(
            { parentId: { $exists: true },
              ...__select.addSelect,
            }, __select.options);
          const _ret = _.groupBy(_subTasks, 'parentId')
          return _ret;
        });
      }
      ret = this.__subTasksWithId.get(EJSON.stringify(select));
      if (ret) {
        ret = ret[parentId] || [];
      }
    }
    return ret;
  },
  getChecklistsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret = []
    if (cardId) {
      const select = {addSelect, options}
      if (!this.__checklistsWithId) {
        this.__checklistsWithId = new DataCache(_select => {
          const __select = EJSON.parse(_select);
          const _checklists = ReactiveCache.getChecklists(
            { cardId: { $exists: true },
              ...__select.addSelect,
            }, __select.options);
          const _ret = _.groupBy(_checklists, 'cardId')
          return _ret;
        });
      }
      ret = this.__checklistsWithId.get(EJSON.stringify(select));
      if (ret) {
        ret = ret[cardId] || [];
      }
    }
    return ret;
  },
  getChecklistItemsWithChecklistId(checklistId, addSelect = {}, options = {}) {
    let ret = []
    if (checklistId) {
      const select = {addSelect, options}
      if (!this.__checklistItemsWithId) {
        this.__checklistItemsWithId = new DataCache(_select => {
          const __select = EJSON.parse(_select);
          const _checklistItems = ReactiveCache.getChecklistItems(
            { checklistId: { $exists: true },
              ...__select.addSelect,
            }, __select.options);
          const _ret = _.groupBy(_checklistItems, 'checklistId')
          return _ret;
        });
      }
      ret = this.__checklistItemsWithId.get(EJSON.stringify(select));
      if (ret) {
        if (Meteor.isServer) {
          ret[checklistId] = ReactiveCache.getChecklistItems(
            {checklistId: checklistId,
              ...addSelect
            }, options);
        }
        ret = ret[checklistId] || [];
      }
    }
    return ret;
  },
  getCardCommentsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret = []
    if (cardId) {
      const select = {addSelect, options}
      if (!this.__cardCommentsWithId) {
        this.__cardCommentsWithId = new DataCache(_select => {
          const __select = EJSON.parse(_select);
          const _cardComments = ReactiveCache.getCardComments(
            { cardId: { $exists: true },
              ...__select.addSelect,
            }, __select.options);
          const _ret = _.groupBy(_cardComments, 'cardId')
          return _ret;
        });
      }
      ret = this.__cardCommentsWithId.get(EJSON.stringify(select));
      if (ret) {
        ret = ret[cardId] || [];
      }
    }
    return ret;
  },
  getActivityWithId(activityId, addSelect = {}, options = {}) {
    let ret = []
    if (activityId) {
      const select = {addSelect, options}
      if (!this.__activityWithId) {
        this.__activityWithId = new DataCache(_select => {
          const __select = EJSON.parse(_select);
          const _activities = ReactiveCache.getActivities(
            { _id: { $exists: true },
              ...__select.addSelect,
            }, __select.options);
          const _ret = _.indexBy(_activities, '_id')
          return _ret;
        });
      }
      ret = this.__activityWithId.get(EJSON.stringify(select));
      if (ret) {
        ret = ret[activityId];
      }
    }
    return ret;
  }
}

// global Reactive MiniMongo Index Cache class to avoid big overhead while searching for the same data often again
// This class calls 2 implementation, for server and client code
//
// having this class here has several advantages:
// - The Programmer hasn't to care about in which context he call's this class
// - having all queries together in 1 class to make it possible to see which queries in Wekan happens, e.g. with console.log
ReactiveMiniMongoIndex = {
  getSubTasksWithParentId(parentId, addSelect = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveMiniMongoIndexServer.getSubTasksWithParentId(parentId, addSelect, options);
    } else {
      ret = ReactiveMiniMongoIndexClient.getSubTasksWithParentId(parentId, addSelect, options);
    }
    return ret;
  },
  getChecklistsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveMiniMongoIndexServer.getChecklistsWithCardId(cardId, addSelect, options);
    } else {
      ret = ReactiveMiniMongoIndexClient.getChecklistsWithCardId(cardId, addSelect, options);
    }
    return ret;
  },
  getChecklistItemsWithChecklistId(checklistId, addSelect = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveMiniMongoIndexServer.getChecklistItemsWithChecklistId(checklistId, addSelect, options);
    } else {
      ret = ReactiveMiniMongoIndexClient.getChecklistItemsWithChecklistId(checklistId, addSelect, options);
    }
    return ret;
  },
  getCardCommentsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveMiniMongoIndexServer.getCardCommentsWithCardId(cardId, addSelect, options);
    } else {
      ret = ReactiveMiniMongoIndexClient.getCardCommentsWithCardId(cardId, addSelect, options);
    }
    return ret;
  },
  getActivityWithId(activityId, addSelect = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveMiniMongoIndexServer.getActivityWithId(activityId, addSelect, options);
    } else {
      ret = ReactiveMiniMongoIndexClient.getActivityWithId(activityId, addSelect, options);
    }
    return ret;
  }
}

export { ReactiveCache, ReactiveMiniMongoIndex };
