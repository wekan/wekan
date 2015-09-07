const activitiesPerPage = 20;

BlazeComponent.extendComponent({
  template() {
    return 'activities';
  },

  onCreated() {
    // XXX Should we use ReactiveNumber?
    this.page = new ReactiveVar(1);
    this.loadNextPageLocked = false;
    const sidebar = this.componentParent(); // XXX for some reason not working
    sidebar.callFirstWith(null, 'resetNextPeak');
    this.autorun(() => {
      const mode = this.data().mode;
      const capitalizedMode = Utils.capitalize(mode);
      const id = Session.get(`current${capitalizedMode}`);
      const limit = this.page.get() * activitiesPerPage;
      if (id === null)
        return;

      this.subscribe('activities', mode, id, limit, () => {
        this.loadNextPageLocked = false;

        // If the sibear peak hasn't increased, that mean that there are no more
        // activities, and we can stop calling new subscriptions.
        // XXX This is hacky! We need to know excatly and reactively how many
        // activities there are, we probably want to denormalize this number
        // dirrectly into card and board documents.
        const nextPeakBefore = sidebar.callFirstWith(null, 'getNextPeak');
        sidebar.calculateNextPeak();
        const nextPeakAfter = sidebar.callFirstWith(null, 'getNextPeak');
        if (nextPeakBefore === nextPeakAfter) {
          sidebar.callFirstWith(null, 'resetNextPeak');
        }
      });
    });
  },

  loadNextPage() {
    if (this.loadNextPageLocked === false) {
      this.page.set(this.page.get() + 1);
      this.loadNextPageLocked = true;
    }
  },

  boardLabel() {
    return TAPi18n.__('this-board');
  },

  cardLabel() {
    return TAPi18n.__('this-card');
  },

  cardLink() {
    const card = this.currentData().card();
    return card && Blaze.toHTML(HTML.A({
      href: card.absoluteUrl(),
      'class': 'action-card',
    }, card.title));
  },

  memberLink() {
    return Blaze.toHTMLWithData(Template.memberName, {
      user: this.currentData().member(),
    });
  },

  attachmentLink() {
    const attachment = this.currentData().attachment();
    return attachment && Blaze.toHTML(HTML.A({
      href: attachment.url(),
      'class': 'js-open-attachment-viewer',
    }, attachment.name()));
  },

  events() {
    return [{
      // XXX We should use Popup.afterConfirmation here
      'click .js-delete-comment'() {
        const commentId = this.currentData().commentId;
        CardComments.remove(commentId);
      },
      'submit .js-edit-comment'(evt) {
        evt.preventDefault();
        const commentText = this.currentComponent().getValue();
        const commentId = Template.parentData().commentId;
        if ($.trim(commentText)) {
          CardComments.update(commentId, {
            $set: {
              text: commentText,
            },
          });
        }
      },
    }];
  },
}).register('activities');
