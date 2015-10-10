BlazeComponent.extendComponent({
  template() {
    return 'boardList';
  },

  boards: function(organizationId) {
    if(!organizationId) organizationId = "";
    return Boards.find({
      archived: false,
      organizationId: organizationId,
      'members.userId': Meteor.userId()
    }, {
      sort: ['title'],
    });
  },
  organizations: function() {
    return Organizations.find({}, {
      sort: ['title']
    });
  },

  isStarred() {
    const user = Meteor.user();
    return user && user.hasStarred(this.currentData()._id);
  },

  events() {
    return [{
      'click .js-add-board': function(evt){
        if(this.currentData())
          Session.set('currentOrgIdHomeBoardList',this.currentData()._id);
        else
          Session.set('currentOrgIdHomeBoardList',''); 
        var popup = Popup.open('createBoard');
        // XXX We need to have a better integration between the popup and the
        // UI components systems.
        return popup.call(this.currentData(), evt);
      },
      'click .js-add-org': Popup.open('createOrg'),
      'click .js-star-board': function(evt) {
        const boardId = this.currentData()._id;
        Meteor.user().toggleBoardStar(boardId);
        evt.preventDefault();
      },
    }];
  },
}).register('boardList');

BlazeComponent.extendComponent({
  template: function() {
    return 'createOrgPopup';
  },

  events: function() {
    return [{
      submit: function(evt) {
        evt.preventDefault();
        

        var title = this.find('.org-title-input');
        var shortName = this.find('.org-short-name-input');
        var desc = this.find('.org-desc-input');
        var alert_short_name = $('.js-short-name-invalid');

        Meteor.call('checkOrgShortNameUsable',$.trim(shortName.value),function (error, result){
          if( result ){
            alert_short_name.hide();
            if ( $.trim(title.value) && $.trim(shortName.value)) {
              var orgId = Organizations.insert({
                title: $.trim(title.value),
                shortName: $.trim(shortName.value),
                description: $.trim(desc.value),
                //boardId: Session.get('currentBoard'),
                sort: $('.organization').length
              });
            }
            title.value = '';
            title.focus();
            shortName.value = '';
            desc.value = '';
            Popup.back();

          }
          else{
            alert_short_name.show();
          }

        });
      }
    }];
  }
}).register('createOrgPopup');