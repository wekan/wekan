BlazeComponent.extendComponent({
  template: function() {
    return 'sidebar';
  },

  mixins: function() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  onCreated: function() {
    this._isOpen = new ReactiveVar(! Session.get('currentCard'));
    Sidebar = this;
  },

  isOpen: function() {
    return this._isOpen.get();
  },

  open: function() {
    if (! this._isOpen.get()) {
      this._isOpen.set(true);
    }
  },

  hide: function() {
    if (this._isOpen.get()) {
      this._isOpen.set(false);
    }
  },

  toogle: function() {
    this._isOpen.set(! this._isOpen.get());
  },

  calculateNextPeak: function() {
    var altitude = this.find('.js-board-sidebar-content').scrollHeight;
    this.callFirstWith(this, 'setNextPeak', altitude);
  },

  reachNextPeak: function() {
    var activitiesComponent = this.componentChildren('activities')[0];
    activitiesComponent.loadNextPage();
  },

  isTongueHidden: function() {
    return this.isOpen() && Filter.isActive();
  },

  onRendered: function() {
    var self = this;
    if (! Meteor.user().isBoardMember())
      return;

    $(document).on('mouseover', function() {
      self.$('.js-member,.js-label').draggable({
        appendTo: 'body',
        helper: 'clone',
        revert: 'invalid',
        revertDuration: 150,
        snap: false,
        snapMode: 'both',
        start: function() {
          Popup.close();
        }
      });
    });
  },

  events: function() {
    // XXX Hacky, we need some kind of `super`
    var mixinEvents = this.getMixin(Mixins.InfiniteScrolling).events();
    return mixinEvents.concat([{
      'click .js-toogle-sidebar': this.toogle
    }]);
  }
}).register('sidebar');
