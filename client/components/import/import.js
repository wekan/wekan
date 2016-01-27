/// Abstract root for all import popup screens.
/// Descendants must define:
/// - getMethodName(): return the Meteor method to call for import, passing json
/// data decoded as object and additional data (see below);
/// - getAdditionalData(): return object containing additional data passed to
/// Meteor method (like list ID and position for a card import);
/// - getLabel(): i18n key for the text displayed in the popup, usually to
/// explain how to get the data out of the source system.
const ImportPopup = BlazeComponent.extendComponent({
  template() {
    // DO NOT remove, this is needed by sub-classes!
    return 'importPopup';
  },
  jsonText() {
    return Session.get('import.text');
  },

  membersMapping() {
    return Session.get('import.membersToMap');
  },

  onCreated() {
    this.error = new ReactiveVar('');
    this.dataToImport = '';
  },

  onFinish() {
    Popup.close();
  },

  onShowMapping(evt) {
    this._storeText(evt);
    Popup.open('mapMembers')(evt);
  },

  onSubmit(evt){
    evt.preventDefault();
    const dataJson = this._storeText(evt);
    let dataObject;
    try {
      dataObject = JSON.parse(dataJson);
      this.setError('');
    } catch (e) {
      this.setError('error-json-malformed');
      return;
    }
    if(this._hasAllNeededData(dataObject)) {
      this._import(dataObject);
    } else {
      this._prepareAdditionalData(dataObject);
      Popup.open(this._screenAdditionalData())(evt);

    }
  },

  events() {
    return [{
      submit: this.onSubmit,
      'click .show-mapping': this.onShowMapping,
    }];
  },

  setError(error) {
    this.error.set(error);
  },

  _import(dataObject) {
    const additionalData = this.getAdditionalData();
    const membersMapping = this.membersMapping();
    if (membersMapping) {
      const mappingById = {};
      membersMapping.forEach((member) => {
        if (member.wekan) {
          mappingById[member.id] = member.wekan._id;
        }
      });
      additionalData.membersMapping = mappingById;
    }
    Session.set('import.membersToMap', null);
    Session.set('import.text', null);
    Meteor.call(this.getMethodName(), dataObject, additionalData,
      (error, response) => {
        if (error) {
          this.setError(error.error);
        } else {
          // ensure will display what we just imported
          Filter.addException(response);
          this.onFinish(response);
        }
      }
    );
  },

  _hasAllNeededData(dataObject) {
    // import has no members or they are already mapped
    return dataObject.members.length === 0 || this.membersMapping();
  },

  _prepareAdditionalData(dataObject) {
    // we will work on the list itself (an ordered array of objects)
    // when a mapping is done, we add a 'wekan' field to the object representing the imported member
    const membersToMap = dataObject.members;
    // auto-map based on username
    membersToMap.forEach((importedMember) => {
      const wekanUser = Users.findOne({username: importedMember.username});
      if(wekanUser) {
        importedMember.wekan = wekanUser;
      }
    });
    // store members data and mapping in Session
    // (we go deep and 2-way, so storing in data context is not a viable option)
    Session.set('import.membersToMap', membersToMap);
    return membersToMap;
  },

  _screenAdditionalData() {
    return 'mapMembers';
  },

  _storeText() {
    const dataJson = this.$('.js-import-json').val();
    Session.set('import.text', dataJson);
    return dataJson;
  },
});

ImportPopup.extendComponent({
  getAdditionalData() {
    const listId = this.currentData()._id;
    const selector = `#js-list-${this.currentData()._id} .js-minicard:first`;
    const firstCardDom = $(selector).get(0);
    const sortIndex = Utils.calculateIndex(null, firstCardDom).base;
    const result = {listId, sortIndex};
    return result;
  },

  getMethodName() {
    return 'importTrelloCard';
  },

  getLabel() {
    return 'import-card-trello-instruction';
  },
}).register('listImportCardPopup');

ImportPopup.extendComponent({
  getAdditionalData() {
    const result = {};
    return result;
  },

  getMethodName() {
    return 'importTrelloBoard';
  },

  getLabel() {
    return 'import-board-trello-instruction';
  },

  onFinish(response) {
    Utils.goBoardId(response);
  },
}).register('boardImportBoardPopup');

const ImportMapMembers = BlazeComponent.extendComponent({
  members() {
    return Session.get('import.membersToMap');
  },
  _refreshMembers(listOfMembers) {
    Session.set('import.membersToMap', listOfMembers);
  },
  /**
   * Will look into the list of members to import for the specified memberId,
   * then set its property to the supplied value.
   * If unset is true, it will remove the property from the rest of the list as well.
   *
   * use:
   * - memberId = null to use selected member
   * - value = null to unset a property
   * - unset = true to ensure property is only set on 1 member at a time
   */
  _setPropertyForMember(property, value, memberId, unset = false) {
    const listOfMembers = this.members();
    let finder = null;
    if(memberId) {
      finder = (member) => member.id === memberId;
    } else {
      finder = (member) => member.selected;
    }
    listOfMembers.forEach((member) => {
      if(finder(member)) {
        if(value !== null) {
          member[property] = value;
        } else {
          delete member[property];
        }
        if(!unset) {
          // we shortcut if we don't care about unsetting the others
          return false;
        }
      } else if(unset) {
        delete member[property];
      }
      return true;
    });
    // Session.get gives us a copy, we have to set it back so it sticks
    this._refreshMembers(listOfMembers);
  },
  setSelectedMember(memberId) {
    return this._setPropertyForMember('selected', true, memberId, true);
  },
  /**
   * returns the member with specified id,
   * or the selected member if memberId is not specified
   */
  getMember(memberId = null) {
    const allMembers = Session.get('import.membersToMap');
    let finder = null;
    if(memberId) {
      finder = (user) => user.id === memberId;
    } else {
      finder = (user) => user.selected;
    }
    return allMembers.find(finder);
  },
  mapSelectedMember(wekan) {
    return this._setPropertyForMember('wekan', wekan, null);
  },
  unmapMember(memberId){
    return this._setPropertyForMember('wekan', null, memberId);
  },
});

ImportMapMembers.extendComponent({
  onMapMember(evt) {
    const memberToMap = this.currentData();
    if(memberToMap.wekan) {
      // todo xxx ask for confirmation?
      this.unmapMember(memberToMap.id);
    } else {
      this.setSelectedMember(memberToMap.id);
      Popup.open('mapMembersAdd')(evt);
    }
  },
  onSubmit(evt) {
    evt.preventDefault();
    Popup.back();
  },
  events() {
    return [{
      'submit': this.onSubmit,
      'click .mapping': this.onMapMember,
    }];
  },
}).register('mapMembersPopup');

ImportMapMembers.extendComponent({
  onSelectUser(){
    this.mapSelectedMember(this.currentData());
    Popup.back();
  },
  events() {
    return [{
      'click .js-select-import': this.onSelectUser,
    }];
  },
  onRendered() {
    // todo XXX why do I not get the focus??
    this.find('.js-map-member input').focus();
  },
}).register('mapMembersAddPopup');
