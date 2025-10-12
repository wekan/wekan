import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { AttachmentStorage } from '/models/attachments';
import { CardSearchPagedComponent } from '/client/lib/cardSearch';
import SessionData from '/models/usersessiondata';
import { QueryParams } from '/config/query-classes';
import { OPERATOR_LIMIT } from '/config/search-const';
const filesize = require('filesize');

BlazeComponent.extendComponent({
  subscription: null,
  showFilesReport: new ReactiveVar(false),
  showBrokenCardsReport: new ReactiveVar(false),
  showOrphanedFilesReport: new ReactiveVar(false),
  showRulesReport: new ReactiveVar(false),
  showCardsReport: new ReactiveVar(false),
  showBoardsReport: new ReactiveVar(false),
  sessionId: null,

  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.sessionId = SessionData.getSessionId();
  },

  events() {
    return [
      {
        'click a.js-report-broken': this.switchMenu,
        'click a.js-report-files': this.switchMenu,
        'click a.js-report-rules': this.switchMenu,
        'click a.js-report-cards': this.switchMenu,
        'click a.js-report-boards': this.switchMenu,
      },
    ];
  },

  switchMenu(event) {
    const target = $(event.target);
    if (!target.hasClass('active')) {
      this.loading.set(true);
      this.showFilesReport.set(false);
      this.showBrokenCardsReport.set(false);
      this.showOrphanedFilesReport.set(false);
      this.showRulesReport.set(false)
      this.showBoardsReport.set(false);
      this.showCardsReport.set(false);
      if (this.subscription) {
        this.subscription.stop();
      }

      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      const targetID = target.data('id');

      if ('report-broken' === targetID) {
        this.showBrokenCardsReport.set(true);
        this.subscription = Meteor.subscribe(
          'brokenCards',
          SessionData.getSessionId(),
          () => {
            this.loading.set(false);
          },
        );
      } else if ('report-files' === targetID) {
        this.showFilesReport.set(true);
        this.subscription = Meteor.subscribe('attachmentsList', () => {
          this.loading.set(false);
        });
      } else if ('report-rules' === targetID) {
        this.subscription = Meteor.subscribe('rulesReport', () => {
          this.showRulesReport.set(true);
          this.loading.set(false);
        });
      } else if ('report-boards' === targetID) {
        this.subscription = Meteor.subscribe('boardsReport', () => {
          this.showBoardsReport.set(true);
          this.loading.set(false);
        });
      } else if ('report-cards' === targetID) {
        const qp = new QueryParams();
        qp.addPredicate(OPERATOR_LIMIT, 300);
        this.subscription = Meteor.subscribe(
          'globalSearch',
          this.sessionId,
          qp.getParams(),
          qp.text,
          () => {
            this.showCardsReport.set(true);
            this.loading.set(false);
          },
        );
      }
    }
  },
}).register('adminReports');

class AdminReport extends BlazeComponent {
  collection;

  results() {
    // eslint-disable-next-line no-console
    return this.collection.find();
  }

  yesOrNo(value) {
    if (value) {
      return TAPi18n.__('yes');
    } else {
      return TAPi18n.__('no');
    }
  }

  resultsCount() {
    return this.collection.find().count();
  }

  fileSize(size) {
    let ret = "";
    if (_.isNumber(size)) {
      ret = filesize(size);
    }
    return ret;
  }

  abbreviate(text) {
    if (text?.length > 30) {
      return `${text.substr(0, 29)}...`;
    }
    return text;
  }
}

(class extends AdminReport {
  collection = Attachments;
}.register('filesReport'));

(class extends AdminReport {
  collection = Rules;

  results() {
    const rules = [];

    ReactiveCache.getRules().forEach(rule => {
      rules.push({
        _id: rule._id,
        title: rule.title,
        boardId: rule.boardId,
        boardTitle: rule.board().title,
        action: rule.action(),
        trigger: rule.trigger(),
      });
    });

    // eslint-disable-next-line no-console
    console.log('rows:', rules);
    return rules;
  }
}.register('rulesReport'));

(class extends AdminReport {
  collection = Boards;

  userNames(members) {
    const ret = (members || [])
      .map(_member => {
        const _ret = ReactiveCache.getUser(_member.userId)?.username || _member.userId;
        return _ret;
      })
      .join(", ");
    return ret;
  }
  teams(memberTeams) {
    const ret = (memberTeams || [])
      .map(_memberTeam => {
        const _ret = ReactiveCache.getTeam(_memberTeam.teamId)?.teamDisplayName || _memberTeam.teamId;
        return _ret;
      })
      .join(", ");
    return ret;
  }
  orgs(orgs) {
    const ret = (orgs || [])
      .map(_orgs => {
        const _ret = ReactiveCache.getOrg(_orgs.orgId)?.orgDisplayName || _orgs.orgId;
        return _ret;
      })
      .join(", ");
    return ret;
  }
}.register('boardsReport'));


(class extends AdminReport {
  collection = Cards;

  userNames(userIds) {
    const ret = (userIds || [])
      .map(_userId => {
        const _ret = ReactiveCache.getUser(_userId)?.username;
        return _ret;
      })
      .join(", ");
    return ret
  }
}.register('cardsReport'));

class BrokenCardsComponent extends CardSearchPagedComponent {
  onCreated() {
    super.onCreated();
  }
}
BrokenCardsComponent.register('brokenCardsReport');
