const activitiesPerPage = 20;

BlazeComponent.extendComponent({
  onCreated() {
    // XXX Should we use ReactiveNumber?
    this.page = new ReactiveVar(1);
    this.loadNextPageLocked = false;
    const sidebar = this.parentComponent(); // XXX for some reason not working
    sidebar.callFirstWith(null, 'resetNextPeak');
    this.autorun(() => {
      let mode = this.data().mode;
      const capitalizedMode = Utils.capitalize(mode);
      let thisId, searchId;
      if (mode === 'linkedcard' || mode === 'linkedboard') {
        thisId = Session.get('currentCard');
        searchId = Cards.findOne({_id: thisId}).linkedId;
        mode = mode.replace('linked', '');
      } else {
        thisId = Session.get(`current${capitalizedMode}`);
        searchId = thisId;
      }
      const limit = this.page.get() * activitiesPerPage;
      const user = Meteor.user();
      const hideSystem = user ? user.hasHiddenSystemMessages() : false;
      if (searchId === null)
        return;

      this.subscribe('activities', mode, searchId, limit, hideSystem, () => {
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
  
  checkItem(){
    const checkItemId = this.currentData().checklistItemId;
    const checkItem = ChecklistItems.findOne({_id:checkItemId});
    return checkItem.title;
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

  lastLabel(){
    const lastLabelId = this.currentData().labelId;
    const lastLabel = Boards.findOne(Session.get('currentBoard')).getLabelById(lastLabelId);
    if(lastLabel.name == undefined || lastLabel.name == ""){
      return lastLabel.color;
    }else{
      return lastLabel.name;
    }
  },

  listLabel() {
    return this.currentData().list().title;
  },

  sourceLink() {
    const source = this.currentData().source;
    if(source) {
      if(source.url) {
        return Blaze.toHTML(HTML.A({
          href: source.url,
        }, source.system));
      } else {
        return source.system;
      }
    }
    return null;
  },

  memberLink() {
    return Blaze.toHTMLWithData(Template.memberName, {
      user: this.currentData().member(),
    });
  },

  attachmentLink() {
    const attachment = this.currentData().attachment();
    // trying to display url before file is stored generates js errors
    return attachment && attachment.url({ download: true }) && Blaze.toHTML(HTML.A({
      href: attachment.url({ download: true }),
      target: '_blank',
    }, attachment.name()));
  },

  customField() {
    const customField = this.currentData().customField();
    return customField.name;
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
        const commentText = this.currentComponent().getValue().trim();
        const commentId = Template.parentData().commentId;
        if (commentText) {
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
