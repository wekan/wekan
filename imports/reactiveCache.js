import { DataCache } from '@wekanteam/meteor-reactive-cache';
import Settings from '../models/settings';

// Server isn't reactive, so search for the data always.
// All methods are async for Meteor 3.0 compatibility.
ReactiveCacheServer = {
  async getBoard(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Boards.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getBoards(selector = {}, options = {}, getQuery = false) {
    let ret = Boards.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getList(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Lists.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getLists(selector = {}, options = {}, getQuery = false) {
    let ret = Lists.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getSwimlane(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Swimlanes.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getSwimlanes(selector = {}, options = {}, getQuery = false) {
    let ret = Swimlanes.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getChecklist(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Checklists.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getChecklists(selector = {}, options = {}, getQuery = false) {
    let ret = Checklists.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getChecklistItem(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await ChecklistItems.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getChecklistItems(selector = {}, options = {}, getQuery = false) {
    let ret = ChecklistItems.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getCard(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Cards.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getCards(selector = {}, options = {}, getQuery = false) {
    let ret = Cards.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getCardComment(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await CardComments.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getCardComments(selector = {}, options = {}, getQuery = false) {
    let ret = CardComments.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getCardCommentReaction(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await CardCommentReactions.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getCardCommentReactions(selector = {}, options = {}, getQuery = false) {
    let ret = CardCommentReactions.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getCustomField(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await CustomFields.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getCustomFields(selector = {}, options = {}, getQuery = false) {
    let ret = CustomFields.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getAttachment(idOrFirstObjectSelector = {}, options = {}) {
    // Try new structure first
    let ret = await Attachments.findOneAsync(idOrFirstObjectSelector, options);
    if (!ret && typeof idOrFirstObjectSelector === 'string') {
      // Fall back to old structure for single attachment lookup
      ret = await Attachments.getAttachmentWithBackwardCompatibility(
        idOrFirstObjectSelector,
      );
    }
    return ret;
  },
  async getAttachments(selector = {}, options = {}, getQuery = false) {
    // Try new structure first
    let ret = Attachments.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
      // If no results and we have a cardId selector, try old structure
      if (ret.length === 0 && selector['meta.cardId']) {
        ret = await Attachments.getAttachmentsWithBackwardCompatibility(selector);
      }
    }
    return ret;
  },
  async getAvatar(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Avatars.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getAvatars(selector = {}, options = {}, getQuery = false) {
    let ret = Avatars.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getUser(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Users.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getUsers(selector = {}, options = {}, getQuery = false) {
    let ret = Users.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getOrg(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Org.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getOrgs(selector = {}, options = {}, getQuery = false) {
    let ret = Org.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getTeam(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Team.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getTeams(selector = {}, options = {}, getQuery = false) {
    let ret = Team.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getActivity(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Activities.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getActivities(selector = {}, options = {}, getQuery = false) {
    let ret = Activities.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getRule(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Rules.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getRules(selector = {}, options = {}, getQuery = false) {
    let ret = Rules.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getAction(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Actions.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getActions(selector = {}, options = {}, getQuery = false) {
    let ret = Actions.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getTrigger(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Triggers.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getTriggers(selector = {}, options = {}, getQuery = false) {
    let ret = Triggers.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getImpersonatedUser(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await ImpersonatedUsers.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getImpersonatedUsers(selector = {}, options = {}, getQuery = false) {
    let ret = ImpersonatedUsers.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getIntegration(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Integrations.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getIntegrations(selector = {}, options = {}, getQuery = false) {
    let ret = Integrations.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getSessionData(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await SessionData.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getSessionDatas(selector = {}, options = {}, getQuery = false) {
    let ret = SessionData.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getInvitationCode(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await InvitationCodes.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getInvitationCodes(selector = {}, options = {}, getQuery = false) {
    let ret = InvitationCodes.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
  async getCurrentSetting() {
    const ret = await Settings.findOneAsync();
    return ret;
  },
  async getCurrentUser() {
    const ret = await Meteor.userAsync();
    return ret;
  },
  async getTranslation(idOrFirstObjectSelector = {}, options = {}) {
    const ret = await Translation.findOneAsync(idOrFirstObjectSelector, options);
    return ret;
  },
  async getTranslations(selector = {}, options = {}, getQuery = false) {
    let ret = Translation.find(selector, options);
    if (getQuery !== true) {
      ret = await ret.fetchAsync();
    }
    return ret;
  },
};

// only the Client is reactive
// saving the result has a big advantage if the query is big and often searched for the same data again and again
// if the data is changed in the client, the data is saved to the server and depending code is reactive called again
ReactiveCacheClient = {
  getBoard(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__board) {
      this.__board = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Boards.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__board.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getBoards(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__boards) {
      this.__boards = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__list) {
      this.__list = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Lists.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__list.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getLists(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__lists) {
      this.__lists = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__swimlane) {
      this.__swimlane = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Swimlanes.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__swimlane.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getSwimlanes(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__swimlanes) {
      this.__swimlanes = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__checklist) {
      this.__checklist = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Checklists.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__checklist.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getChecklists(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__checklists) {
      this.__checklists = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__checklistItem) {
      this.__checklistItem = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = ChecklistItems.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__checklistItem.get(
      EJSON.stringify(idOrFirstObjectSelect),
    );
    return ret;
  },
  getChecklistItems(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__checklistItems) {
      this.__checklistItems = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__card) {
      this.__card = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Cards.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__card.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getCards(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__cards) {
      this.__cards = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__cardComment) {
      this.__cardComment = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = CardComments.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__cardComment.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getCardComments(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__cardComments) {
      this.__cardComments = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__cardCommentReaction) {
      this.__cardCommentReaction = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = CardCommentReactions.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__cardCommentReaction.get(
      EJSON.stringify(idOrFirstObjectSelect),
    );
    return ret;
  },
  getCardCommentReactions(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__cardCommentReactions) {
      this.__cardCommentReactions = new DataCache((_select) => {
        const __select = EJSON.parse(_select);
        let _ret = CardCommentReactions.find(
          __select.selector,
          __select.options,
        );
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__customField) {
      this.__customField = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = CustomFields.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__customField.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getCustomFields(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__customFields) {
      this.__customFields = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__attachment) {
      this.__attachment = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        // Try new structure first
        let _ret = Attachments.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        if (!_ret && typeof __select.idOrFirstObjectSelector === 'string') {
          // Fall back to old structure for single attachment lookup
          _ret = Attachments.getAttachmentWithBackwardCompatibility(
            __select.idOrFirstObjectSelector,
          );
        }
        return _ret;
      });
    }
    const ret = this.__attachment.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getAttachments(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__attachments) {
      this.__attachments = new DataCache((_select) => {
        const __select = EJSON.parse(_select);
        // Try new structure first
        let _ret = Attachments.find(__select.selector, __select.options);
        if (__select.getQuery !== true) {
          _ret = _ret.fetch();
          // If no results and we have a cardId selector, try old structure
          if (_ret.length === 0 && __select.selector['meta.cardId']) {
            _ret = Attachments.getAttachmentsWithBackwardCompatibility(
              __select.selector,
            );
          }
        }
        return _ret;
      });
    }
    const ret = this.__attachments.get(EJSON.stringify(select));
    return ret;
  },
  getAvatar(idOrFirstObjectSelector = {}, options = {}) {
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__avatar) {
      this.__avatar = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Avatars.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__avatar.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getAvatars(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__avatars) {
      this.__avatars = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__user) {
      this.__user = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Users.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__user.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getUsers(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__users) {
      this.__users = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__org) {
      this.__org = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Org.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__org.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getOrgs(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__orgs) {
      this.__orgs = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__team) {
      this.__team = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Team.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__team.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getTeams(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__teams) {
      this.__teams = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__activity) {
      this.__activity = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Activities.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__activity.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getActivities(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__activities) {
      this.__activities = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__rule) {
      this.__rule = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Rules.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__rule.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getRules(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__rules) {
      this.__rules = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__action) {
      this.__action = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Actions.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__action.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getActions(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__actions) {
      this.__actions = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__trigger) {
      this.__trigger = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Triggers.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__trigger.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getTriggers(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__triggers) {
      this.__triggers = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__impersonatedUser) {
      this.__impersonatedUser = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = ImpersonatedUsers.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__impersonatedUser.get(
      EJSON.stringify(idOrFirstObjectSelect),
    );
    return ret;
  },
  getImpersonatedUsers(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__impersonatedUsers) {
      this.__impersonatedUsers = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__integration) {
      this.__integration = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Integrations.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__integration.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getIntegrations(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__integrations) {
      this.__integrations = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__invitationCode) {
      this.__invitationCode = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = InvitationCodes.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__invitationCode.get(
      EJSON.stringify(idOrFirstObjectSelect),
    );
    return ret;
  },
  getInvitationCodes(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__invitationCodes) {
      this.__invitationCodes = new DataCache((_select) => {
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
    const idOrFirstObjectSelect = { idOrFirstObjectSelector, options };
    if (!this.__translation) {
      this.__translation = new DataCache((_idOrFirstObjectSelect) => {
        const __select = EJSON.parse(_idOrFirstObjectSelect);
        const _ret = Translation.findOne(
          __select.idOrFirstObjectSelector,
          __select.options,
        );
        return _ret;
      });
    }
    const ret = this.__translation.get(EJSON.stringify(idOrFirstObjectSelect));
    return ret;
  },
  getTranslations(selector = {}, options = {}, getQuery = false) {
    const select = { selector, options, getQuery };
    if (!this.__translations) {
      this.__translations = new DataCache((_select) => {
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
  },
};

// global Reactive Cache class to avoid big overhead while searching for the same data often again
// This class calls 2 implementation, for server and client code
//
// having this class here has several advantages:
// - The Programmer hasn't to care about in which context he call's this class
// - having all queries together in 1 class to make it possible to see which queries in Wekan happens, e.g. with console.log
//
// Methods are NOT async - they return a Promise on server (from async ReactiveCacheServer)
// and synchronous data on client (from ReactiveCacheClient).
// Server callers must await; client code uses the return value directly.
ReactiveCache = {
  getBoard(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getBoard(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getBoard(idOrFirstObjectSelector, options);
    }
  },
  getBoards(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getBoards(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getBoards(selector, options, getQuery);
    }
  },
  getList(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getList(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getList(idOrFirstObjectSelector, options);
    }
  },
  getLists(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getLists(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getLists(selector, options, getQuery);
    }
  },
  getSwimlane(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getSwimlane(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getSwimlane(idOrFirstObjectSelector, options);
    }
  },
  getSwimlanes(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getSwimlanes(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getSwimlanes(selector, options, getQuery);
    }
  },
  getChecklist(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getChecklist(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getChecklist(idOrFirstObjectSelector, options);
    }
  },
  getChecklists(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getChecklists(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getChecklists(selector, options, getQuery);
    }
  },
  getChecklistItem(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getChecklistItem(
        idOrFirstObjectSelector,
        options,
      );
    } else {
      return ReactiveCacheClient.getChecklistItem(
        idOrFirstObjectSelector,
        options,
      );
    }
  },
  getChecklistItems(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getChecklistItems(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getChecklistItems(selector, options, getQuery);
    }
  },
  getCard(idOrFirstObjectSelector = {}, options = {}, noCache = false) {
    if (Meteor.isServer || noCache === true) {
      return ReactiveCacheServer.getCard(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getCard(idOrFirstObjectSelector, options);
    }
  },
  getCards(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getCards(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getCards(selector, options, getQuery);
    }
  },
  getCardComment(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getCardComment(
        idOrFirstObjectSelector,
        options,
      );
    } else {
      return ReactiveCacheClient.getCardComment(
        idOrFirstObjectSelector,
        options,
      );
    }
  },
  getCardComments(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getCardComments(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getCardComments(selector, options, getQuery);
    }
  },
  getCardCommentReaction(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getCardCommentReaction(
        idOrFirstObjectSelector,
        options,
      );
    } else {
      return ReactiveCacheClient.getCardCommentReaction(
        idOrFirstObjectSelector,
        options,
      );
    }
  },
  getCardCommentReactions(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getCardCommentReactions(
        selector,
        options,
        getQuery,
      );
    } else {
      return ReactiveCacheClient.getCardCommentReactions(
        selector,
        options,
        getQuery,
      );
    }
  },
  getCustomField(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getCustomField(
        idOrFirstObjectSelector,
        options,
      );
    } else {
      return ReactiveCacheClient.getCustomField(
        idOrFirstObjectSelector,
        options,
      );
    }
  },
  getCustomFields(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getCustomFields(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getCustomFields(selector, options, getQuery);
    }
  },
  getAttachment(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getAttachment(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getAttachment(idOrFirstObjectSelector, options);
    }
  },
  getAttachments(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getAttachments(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getAttachments(selector, options, getQuery);
    }
  },
  getAvatar(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getAvatar(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getAvatar(idOrFirstObjectSelector, options);
    }
  },
  getAvatars(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getAvatars(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getAvatars(selector, options, getQuery);
    }
  },
  getUser(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getUser(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getUser(idOrFirstObjectSelector, options);
    }
  },
  getUsers(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getUsers(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getUsers(selector, options, getQuery);
    }
  },
  getOrg(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getOrg(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getOrg(idOrFirstObjectSelector, options);
    }
  },
  getOrgs(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getOrgs(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getOrgs(selector, options, getQuery);
    }
  },
  getTeam(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getTeam(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getTeam(idOrFirstObjectSelector, options);
    }
  },
  getTeams(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getTeams(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getTeams(selector, options, getQuery);
    }
  },
  getActivity(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getActivity(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getActivity(idOrFirstObjectSelector, options);
    }
  },
  getActivities(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getActivities(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getActivities(selector, options, getQuery);
    }
  },
  getRule(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getRule(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getRule(idOrFirstObjectSelector, options);
    }
  },
  getRules(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getRules(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getRules(selector, options, getQuery);
    }
  },
  getAction(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getAction(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getAction(idOrFirstObjectSelector, options);
    }
  },
  getActions(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getActions(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getActions(selector, options, getQuery);
    }
  },
  getTrigger(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getTrigger(idOrFirstObjectSelector, options);
    } else {
      return ReactiveCacheClient.getTrigger(idOrFirstObjectSelector, options);
    }
  },
  getTriggers(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getTriggers(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getTriggers(selector, options, getQuery);
    }
  },
  getImpersonatedUser(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getImpersonatedUser(
        idOrFirstObjectSelector,
        options,
      );
    } else {
      return ReactiveCacheClient.getImpersonatedUser(
        idOrFirstObjectSelector,
        options,
      );
    }
  },
  getImpersonatedUsers(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getImpersonatedUsers(
        selector,
        options,
        getQuery,
      );
    } else {
      return ReactiveCacheClient.getImpersonatedUsers(
        selector,
        options,
        getQuery,
      );
    }
  },
  getIntegration(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getIntegration(
        idOrFirstObjectSelector,
        options,
      );
    } else {
      return ReactiveCacheClient.getIntegration(
        idOrFirstObjectSelector,
        options,
      );
    }
  },
  getIntegrations(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getIntegrations(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getIntegrations(selector, options, getQuery);
    }
  },
  getSessionData(idOrFirstObjectSelector = {}, options = {}) {
    // no reactive cache, otherwise global search will not work anymore
    return ReactiveCacheServer.getSessionData(
      idOrFirstObjectSelector,
      options,
    );
  },
  getSessionDatas(selector = {}, options = {}, getQuery = false) {
    // no reactive cache, otherwise global search will not work anymore
    return ReactiveCacheServer.getSessionDatas(selector, options, getQuery);
  },
  getInvitationCode(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getInvitationCode(
        idOrFirstObjectSelector,
        options,
      );
    } else {
      return ReactiveCacheClient.getInvitationCode(
        idOrFirstObjectSelector,
        options,
      );
    }
  },
  getInvitationCodes(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getInvitationCodes(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getInvitationCodes(selector, options, getQuery);
    }
  },
  getCurrentSetting() {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getCurrentSetting();
    } else {
      return ReactiveCacheClient.getCurrentSetting();
    }
  },
  getCurrentUser() {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getCurrentUser();
    } else {
      return ReactiveCacheClient.getCurrentUser();
    }
  },
  getTranslation(idOrFirstObjectSelector = {}, options = {}) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getTranslation(
        idOrFirstObjectSelector,
        options,
      );
    } else {
      return ReactiveCacheClient.getTranslation(
        idOrFirstObjectSelector,
        options,
      );
    }
  },
  getTranslations(selector = {}, options = {}, getQuery = false) {
    if (Meteor.isServer) {
      return ReactiveCacheServer.getTranslations(selector, options, getQuery);
    } else {
      return ReactiveCacheClient.getTranslations(selector, options, getQuery);
    }
  },
};

// Server isn't reactive, so search for the data always.
ReactiveMiniMongoIndexServer = {
  async getSubTasksWithParentId(parentId, addSelect = {}, options = {}) {
    let ret = [];
    if (parentId) {
      ret = await ReactiveCache.getCards({ parentId, ...addSelect }, options);
    }
    return ret;
  },
  async getChecklistsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret = [];
    if (cardId) {
      ret = await ReactiveCache.getChecklists({ cardId, ...addSelect }, options);
    }
    return ret;
  },
  async getChecklistItemsWithChecklistId(checklistId, addSelect = {}, options = {}) {
    let ret = [];
    if (checklistId) {
      ret = await ReactiveCache.getChecklistItems(
        { checklistId, ...addSelect },
        options,
      );
    }
    return ret;
  },
  async getCardCommentsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret = [];
    if (cardId) {
      ret = await ReactiveCache.getCardComments({ cardId, ...addSelect }, options);
    }
    return ret;
  },
  async getActivityWithId(activityId, addSelect = {}, options = {}) {
    let ret = [];
    if (activityId) {
      ret = await ReactiveCache.getActivities(
        { _id: activityId, ...addSelect },
        options,
      );
    }
    return ret;
  },
};

// Client side little MiniMongo DB "Index"
ReactiveMiniMongoIndexClient = {
  getSubTasksWithParentId(parentId, addSelect = {}, options = {}) {
    let ret = [];
    if (parentId) {
      const select = { addSelect, options };
      if (!this.__subTasksWithId) {
        this.__subTasksWithId = new DataCache((_select) => {
          const __select = EJSON.parse(_select);
          const _subTasks = ReactiveCache.getCards(
            { parentId: { $exists: true }, ...__select.addSelect },
            __select.options,
          );
          const _ret = _.groupBy(_subTasks, 'parentId');
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
    let ret = [];
    if (cardId) {
      const select = { addSelect, options };
      if (!this.__checklistsWithId) {
        this.__checklistsWithId = new DataCache((_select) => {
          const __select = EJSON.parse(_select);
          const _checklists = ReactiveCache.getChecklists(
            { cardId: { $exists: true }, ...__select.addSelect },
            __select.options,
          );
          const _ret = _.groupBy(_checklists, 'cardId');
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
    let ret = [];
    if (checklistId) {
      const select = { addSelect, options };
      if (!this.__checklistItemsWithId) {
        this.__checklistItemsWithId = new DataCache((_select) => {
          const __select = EJSON.parse(_select);
          const _checklistItems = ReactiveCache.getChecklistItems(
            { checklistId: { $exists: true }, ...__select.addSelect },
            __select.options,
          );
          const _ret = _.groupBy(_checklistItems, 'checklistId');
          return _ret;
        });
      }
      ret = this.__checklistItemsWithId.get(EJSON.stringify(select));
      if (ret) {
        ret = ret[checklistId] || [];
      }
    }
    return ret;
  },
  getCardCommentsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret = [];
    if (cardId) {
      const select = { addSelect, options };
      if (!this.__cardCommentsWithId) {
        this.__cardCommentsWithId = new DataCache((_select) => {
          const __select = EJSON.parse(_select);
          const _cardComments = ReactiveCache.getCardComments(
            { cardId: { $exists: true }, ...__select.addSelect },
            __select.options,
          );
          const _ret = _.groupBy(_cardComments, 'cardId');
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
    let ret = [];
    if (activityId) {
      const select = { addSelect, options };
      if (!this.__activityWithId) {
        this.__activityWithId = new DataCache((_select) => {
          const __select = EJSON.parse(_select);
          const _activities = ReactiveCache.getActivities(
            { _id: { $exists: true }, ...__select.addSelect },
            __select.options,
          );
          const _ret = _.indexBy(_activities, '_id');
          return _ret;
        });
      }
      ret = this.__activityWithId.get(EJSON.stringify(select));
      if (ret) {
        ret = ret[activityId];
      }
    }
    return ret;
  },
};

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
      ret = ReactiveMiniMongoIndexServer.getSubTasksWithParentId(
        parentId,
        addSelect,
        options,
      );
    } else {
      ret = ReactiveMiniMongoIndexClient.getSubTasksWithParentId(
        parentId,
        addSelect,
        options,
      );
    }
    return ret;
  },
  getChecklistsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveMiniMongoIndexServer.getChecklistsWithCardId(
        cardId,
        addSelect,
        options,
      );
    } else {
      ret = ReactiveMiniMongoIndexClient.getChecklistsWithCardId(
        cardId,
        addSelect,
        options,
      );
    }
    return ret;
  },
  getChecklistItemsWithChecklistId(checklistId, addSelect = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveMiniMongoIndexServer.getChecklistItemsWithChecklistId(
        checklistId,
        addSelect,
        options,
      );
    } else {
      ret = ReactiveMiniMongoIndexClient.getChecklistItemsWithChecklistId(
        checklistId,
        addSelect,
        options,
      );
    }
    return ret;
  },
  getCardCommentsWithCardId(cardId, addSelect = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveMiniMongoIndexServer.getCardCommentsWithCardId(
        cardId,
        addSelect,
        options,
      );
    } else {
      ret = ReactiveMiniMongoIndexClient.getCardCommentsWithCardId(
        cardId,
        addSelect,
        options,
      );
    }
    return ret;
  },
  getActivityWithId(activityId, addSelect = {}, options = {}) {
    let ret;
    if (Meteor.isServer) {
      ret = ReactiveMiniMongoIndexServer.getActivityWithId(
        activityId,
        addSelect,
        options,
      );
    } else {
      ret = ReactiveMiniMongoIndexClient.getActivityWithId(
        activityId,
        addSelect,
        options,
      );
    }
    return ret;
  },
};

export { ReactiveCache, ReactiveMiniMongoIndex };
