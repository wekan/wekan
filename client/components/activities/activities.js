var activitiesPerPage = 20;

BlazeComponent.extendComponent({
  template: function() {
    return 'activities';
  },

  onCreated: function() {
    var self = this;
    // XXX Should we use ReactiveNumber?
    self.page = new ReactiveVar(1);
    self.loadNextPageLocked = false;
    var sidebar = self.componentParent(); // XXX for some reason not working
    sidebar.callFirstWith(null, 'resetNextPeak');
    self.autorun(function() {
      var mode = self.data().mode;
      var capitalizedMode = Utils.capitalize(mode);
      var id = Session.get('current' + capitalizedMode);
      var limit = self.page.get() * activitiesPerPage;
      if (id === null)
        return;

      self.subscribe('activities', mode, id, limit, function() {
        self.loadNextPageLocked = false;

        // If the sibear peak hasn't increased, that mean that there are no more
        // activities, and we can stop calling new subscriptions.
        // XXX This is hacky! We need to know excatly and reactively how many
        // activities there are, we probably want to denormalize this number
        // dirrectly into card and board documents.
        var a = sidebar.callFirstWith(null, 'getNextPeak');
        sidebar.calculateNextPeak();
        var b = sidebar.callFirstWith(null, 'getNextPeak');
        if (a === b) {
          sidebar.callFirstWith(null, 'resetNextPeak');
        }
      });
    });
  },

  loadNextPage: function() {
    if (this.loadNextPageLocked === false) {
      this.page.set(this.page.get() + 1);
      this.loadNextPageLocked = true;
    }
  },

  boardLabel: function() {
    return TAPi18n.__('this-board');
  },

  cardLabel: function() {
    return TAPi18n.__('this-card');
  },

  cardLink: function() {
    var card = this.currentData().card();
    return card && Blaze.toHTML(HTML.A({
      href: card.absoluteUrl(),
      'class': 'action-card'
    }, card.title));
  },

  memberLink: function() {
    return Blaze.toHTMLWithData(Template.memberName, {
      user: this.currentData().member()
    });
  },

  attachmentLink: function() {
    var attachment = this.currentData().attachment();
    return attachment && Blaze.toHTML(HTML.A({
      href: attachment.url(),
      'class': 'js-open-attachment-viewer'
    }, attachment.name()));
  },

  events: function() {
    return [{
      // XXX We should use Popup.afterConfirmation here
      'click .js-delete-comment': function() {
        var commentId = this.currentData().commentId;
        CardComments.remove(commentId);
      },
      'submit .js-edit-comment': function(evt) {
        evt.preventDefault();
        var commentText = this.currentComponent().getValue();
        var commentId = Template.parentData().commentId;
        if ($.trim(commentText)) {
          CardComments.update(commentId, {
            $set: {
              text: commentText
            }
          });
        }
      }
    }];
  }
}).register('activities');
