BlazeComponent.extendComponent({
  template() {
    return 'import';
  },

  onCreated() {
    this.error = new ReactiveVar('');
    this.steps = ['importTextarea', 'importMapMembers'];
    this._currentStepIndex = new ReactiveVar(0);
    this.importedData = new ReactiveVar();
    this.membersToMap = new ReactiveVar({});
  },

  currentTemplate() {
    return this.steps[this._currentStepIndex.get()];
  },

  nextStep() {
    const nextStepIndex = this._currentStepIndex.get() + 1;
    if (nextStepIndex > this.steps.length) {
      this.finishImport();
    } else {
      this._currentStepIndex.set(nextStepIndex);
    }
  },

  importData(evt) {
    evt.preventDefault();
    const dataJson = this.find('.js-import-json').value;
    try {
      const dataObject = JSON.parse(dataJson);
      this.setError('');
      this.importedData.set(dataObject);
      this.nextStep();
    } catch (e) {
      this.setError('error-json-malformed');
    }
  },

  setError(error) {
    this.error.set(error);
  },

  finishImport() {
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
    this.membersToMap.set(null);
    Meteor.call('importTrelloBoard', this.importedData.get(), additionalData,
      (error, response) => {
        if (error) {
          this.setError(error.error);
        } else {
          // ensure will display what we just imported
          Filter.addException(response);
          Utils.goBoardId(response);
        }
      }
    );
  },

  _prepareAdditionalData(dataObject) {
    // we will work on the list itself (an ordered array of objects) when a
    // mapping is done, we add a 'wekan' field to the object representing the
    // imported member
    const membersToMap = dataObject.members;
    // auto-map based on username
    membersToMap.forEach((importedMember) => {
      const wekanUser = Users.findOne({ username: importedMember.username });
      if (wekanUser) {
        importedMember.wekan = wekanUser;
      }
    });
    // store members data and mapping in Session
    // (we go deep and 2-way, so storing in data context is not a viable option)
    this.parentComponent().membersToMap.set(membersToMap);
    return membersToMap;
  },

  _screenAdditionalData() {
    return 'mapMembers';
  },
}).register('import');

BlazeComponent.extendComponent({
  template() {
    return 'importTextarea';
  },

  events() {
    return [{
      submit(evt) {
        return this.parentComponent().importData(evt);
      },
    }];
  },
}).register('importTextarea');

BlazeComponent.extendComponent({
  template() {
    return 'importMapMembers';
  },

  members() {
    return this.parentComponent().membersToMap.get();
  },

  _refreshMembers(listOfMembers) {
    return this.parentComponent().membersToMap.set(listOfMembers);
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
    const allMembers = this.members();
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

  events() {
    return [{
      'click .js-select-import': Popup.open('importMapMembersAdd'),
    }];
  },
}).register('importMapMembers');

Template.importMapMembersAddPopup.onRendered(function() {
  this.find('.js-map-member input').focus();
});
