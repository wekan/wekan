import { AttachmentStorage } from '/models/attachments';
import { CardSearchPagedComponent } from '/client/lib/cardSearch';
import SessionData from '/models/usersessiondata';

BlazeComponent.extendComponent({
  subscription: null,
  showFilesReport: new ReactiveVar(false),
  showBrokenCardsReport: new ReactiveVar(false),
  showOrphanedFilesReport: new ReactiveVar(false),
  showRulesReport: new ReactiveVar(false),

  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
  },

  events() {
    return [
      {
        'click a.js-report-broken': this.switchMenu,
        'click a.js-report-files': this.switchMenu,
        'click a.js-report-orphaned-files': this.switchMenu,
        'click a.js-report-rules': this.switchMenu,
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
      } else if ('report-orphaned-files' === targetID) {
        this.showOrphanedFilesReport.set(true);
        this.subscription = Meteor.subscribe('orphanedAttachments', () => {
          this.loading.set(false);
        });
      } else if ('report-rules' === targetID) {
        this.subscription = Meteor.subscribe('rulesReport', () => {
          this.showRulesReport.set(true);
          this.loading.set(false);
        });
      }
    }
  },
}).register('adminReports');

Template.filesReport.helpers({
  attachmentFiles() {
    // eslint-disable-next-line no-console
    // console.log('attachments:', AttachmentStorage.find());
    // console.log('attachments.count:', AttachmentStorage.find().count());
    return AttachmentStorage.find();
  },

  rulesReport() {
    const rules = [];

    Rules.find().forEach(rule => {
      rules.push({
        _id: rule._id,
        title: rule.title,
        boardId: rule.boardId,
        boardTitle: rule.board().title,
        action: rule.action().fetch(),
        trigger: rule.trigger().fetch(),
      });
    });

    return rules;
  },

  resultsCount() {
    return AttachmentStorage.find().count();
  },

  fileSize(size) {
    return Math.round(size / 1024);
  },

  usageCount(key) {
    return Attachments.find({ 'copies.attachments.key': key }).count();
  },
});

Template.orphanedFilesReport.helpers({
  attachmentFiles() {
    // eslint-disable-next-line no-console
    // console.log('attachments:', AttachmentStorage.find());
    // console.log('attachments.count:', AttachmentStorage.find().count());
    return AttachmentStorage.find();
  },

  resultsCount() {
    return AttachmentStorage.find().count();
  },

  fileSize(size) {
    return Math.round(size / 1024);
  },
});

Template.rulesReport.helpers({
  rows() {
    const rules = [];

    Rules.find().forEach(rule => {
      rules.push({
        _id: rule._id,
        title: rule.title,
        boardId: rule.boardId,
        boardTitle: rule.board().title,
        action: rule.action(),
        trigger: rule.trigger(),
      });
    });

    console.log('rows:', rules);
    return rules;
  },

  resultsCount() {
    return Rules.find().count();
  },
});

class BrokenCardsComponent extends CardSearchPagedComponent {
  onCreated() {
    super.onCreated();
  }
}
BrokenCardsComponent.register('brokenCardsReport');
