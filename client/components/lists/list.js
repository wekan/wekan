const { calculateIndex } = Utils;

BlazeComponent.extendComponent({
  template() {
    return 'list';
  },

  // Proxy
  openForm(options) {
    this.componentChildren('listBody')[0].openForm(options);
  },

  onCreated() {
    this.newCardFormIsVisible = new ReactiveVar(true);
  },

  allowAddCard: function(){
    if(Meteor.user().isBoardMember() || this.data().board().isCollaborate())
      return true;
    else
      return false;
  },


  addCard: function(evt) {
    evt.preventDefault();
    var textarea = $(evt.currentTarget).find('textarea');
    var title = textarea.val();
    var position = Blaze.getData(evt.currentTarget).position;
    var sortIndex;
    var firstCard = this.find('.js-minicard:first');
    var lastCard = this.find('.js-minicard:last');
    if (position === 'top') {
      sortIndex = Utils.calculateIndex(null, firstCard).base;
    } else if (position === 'bottom') {
      sortIndex = Utils.calculateIndex(lastCard, null).base;
    }

    if ($.trim(title)) {
      if( ! Meteor.user().isBoardMember() )
        Boards.update(this.data().board()._id, {
          $push: {
            members: {
              userId: Meteor.userId(),
              isAdmin: false,
              isActive: true
            }
          }
        });
      var _id = Cards.insert({
        title: title,
        listId: this.data()._id,
        boardId: this.data().board()._id,
        sort: sortIndex
      });
      // In case the filter is active we need to add the newly inserted card in
      // the list of exceptions -- cards that are not filtered. Otherwise the
      // card will disappear instantly.
      // See https://github.com/libreboard/libreboard/issues/80
      Filter.addException(_id);

      // We keep the form opened, empty it, and scroll to it.
      textarea.val('').focus();
      if (position === 'bottom') {
        this.scrollToBottom();
      }
    }
  },

  scrollToBottom: function() {
    var container = this.find('.js-perfect-scrollbar');
    if( container )
      $(container).animate({
        scrollTop: container.scrollHeight
      });
  },

  events: function() {
    return [{
      
      submit: this.addCard
    }]
  },
  // The jquery UI sortable library is the best solution I've found so far. I
  // tried sortable and dragula but they were not powerful enough four our use
  // case. I also considered writing/forking a drag-and-drop + sortable library
  // but it's probably too much work.
  // By calling asking the sortable library to cancel its move on the `stop`
  // callback, we basically solve all issues related to reactive updates. A
  // comment below provides further details.
  onRendered() {
    var self = this;
    if (!Meteor.user() || !Meteor.user().isBoardMember())
      return;

    var boardComponent = self.componentParent();
    var itemsSelector = '.js-minicard:not(.placeholder, .js-card-composer)';
    var $cards = self.$('.js-minicards');

    //if( Session.get('currentBoardSort') === 'sort' || ! Session.get('currentBoardSort') )
    this.sortable = $cards.sortable({
      connectWith: '.js-minicards',
      tolerance: 'pointer',
      appendTo: 'body',
      helper(evt, item) {
        const helper = item.clone();
        if (MultiSelection.isActive()) {
          const andNOthers = $cards.find('.js-minicard.is-checked').length - 1;
          if (andNOthers > 0) {
            helper.append($(Blaze.toHTML(HTML.DIV(
              { 'class': 'and-n-other' },
              TAPi18n.__('and-n-other-card', { count: andNOthers })
            ))));
          }
        }
        return helper;
      },
      distance: 7,
      items: itemsSelector,
      scroll: false,
      placeholder: 'minicard-wrapper placeholder',
      start(evt, ui) {
        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup');
        boardComponent.setIsDragging(true);
      },
      stop(evt, ui) {
        // To attribute the new index number, we need to get the DOM element
        // of the previous and the following card -- if any.
        const prevCardDom = ui.item.prev('.js-minicard').get(0);
        const nextCardDom = ui.item.next('.js-minicard').get(0);
        const nCards = MultiSelection.isActive() ? MultiSelection.count() : 1;
        const sortIndex = calculateIndex(prevCardDom, nextCardDom, nCards);
        const listId = Blaze.getData(ui.item.parents('.list').get(0))._id;

        // Normally the jquery-ui sortable library moves the dragged DOM element
        // to its new position, which disrupts Blaze reactive updates mechanism
        // (especially when we move the last card of a list, or when multiple
        // users move some cards at the same time). To prevent these UX glitches
        // we ask sortable to gracefully cancel the move, and to put back the
        // DOM in its initial state. The card move is then handled reactively by
        // Blaze with the below query.
        $cards.sortable('cancel');

        if (MultiSelection.isActive()) {
          Cards.find(MultiSelection.getMongoSelector()).forEach((card, i) => {
            card.move(listId, sortIndex.base + i * sortIndex.increment);
          });
        } else {
          const cardDomElement = ui.item.get(0);
          const card = Blaze.getData(cardDomElement);
          card.move(listId, sortIndex.base);
        }
        boardComponent.setIsDragging(false);
      },
    });
    

    // We want to re-run this function any time a card is added.
    this.autorun(() => {
      const currentBoardId = Tracker.nonreactive(() => {
        return Session.get('currentBoard');
      });
      Cards.find({ boardId: currentBoardId }).fetch();
      //f( Session.get('currentBoardSort') === 'sort' || ! Session.get('currentBoardSort') )
      Tracker.afterFlush(function() {
        $cards.find(itemsSelector).droppable({
          hoverClass: 'draggable-hover-card',
          accept: '.js-member,.js-label',
          drop(event, ui) {
            const cardId = Blaze.getData(this)._id;
            const card = Cards.findOne(cardId);

            if (ui.draggable.hasClass('js-member')) {
              const memberId = Blaze.getData(ui.draggable.get(0)).userId;
              card.assignMember(memberId);
            } else {
              const labelId = Blaze.getData(ui.draggable.get(0))._id;
              card.addLabel(labelId);
            }
          },
        });
      });
    });
  },
}).register('list');
