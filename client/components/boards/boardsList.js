BlazeComponent.extendComponent({
  template: function() {
    return 'boardList';
  },

  boards: function(organizationId) {
    if(!organizationId) organizationId = "";
    return Boards.find({
      archived: false,
      organizationId: organizationId,
      'members.userId': Meteor.userId()
    }, {
      sort: ['title']
    });
  },
  organizations: function() {
    return Organizations.find({}, {
      sort: ['title']
    });
  },

  isStarred: function() {
    var user = Meteor.user();
    return user && user.hasStarred(this.currentData()._id);
  },

  events: function() {
    return [{
      'click .js-add-board': function(evt){
        if(this.currentData())
          Session.set('currentOrg',this.currentData()._id);
        else
          Session.set('currentOrg',''); 
        var popup = Popup.open('createBoard');
        // XXX We need to have a better integration between the popup and the
        // UI components systems.
        return popup.call(this.currentData(), evt);
      },
      'click .js-star-board': function(evt) {
        var boardId = this.currentData()._id;
        Meteor.user().toggleBoardStar(boardId);
        evt.preventDefault();
      }
    }];
  }
}).register('boardList');

BlazeComponent.extendComponent({
  template: function() {
    return 'addOrgForm';
  },

  // Proxy
  open: function() {
    this.componentChildren('inlinedForm')[0].open();
  },

  events: function() {
    return [{
      submit: function(evt) {
        evt.preventDefault();
        var title = this.find('.org-title-input');
        var shortName = this.find('.org-short-name-input');
        var desc = this.find('.org-desc-input');

        if ($.trim(title.value)) {
          var orgId = Organizations.insert({
            title: title.value,
            shortName: shortName.value,
            description: desc.value,
            //boardId: Session.get('currentBoard'),
            sort: $('.organization').length
          });

          title.value = '';
          title.focus();
          shortName.value = '';
          desc.value = '';
        }
       
      }
    }];
  }
}).register('addOrgForm');