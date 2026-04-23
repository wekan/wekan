import { ReactiveCache } from '/imports/reactiveCache';
import { trelloGetMembersToMap } from './trelloMembersMapper';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { wekanGetMembersToMap } from './wekanMembersMapper';
import { csvGetMembersToMap } from './csvMembersMapper';
import getSlug from 'limax';
import { UserSearchIndex } from '/models/users';
import { Utils } from '/client/lib/utils';

const Papa = require('papaparse');

Template.importHeaderBar.helpers({
  title() {
    return `import-board-title-${Session.get('importSource')}`;
  },
});

// Helper to find the closest ancestor template instance by name
function findParentTemplateInstance(childTemplateInstance, parentTemplateName) {
  let view = childTemplateInstance.view;
  while (view) {
    if (view.name === `Template.${parentTemplateName}` && view.templateInstance) {
      return view.templateInstance();
    }
    view = view.parentView;
  }
  return null;
}

function _prepareAdditionalData(dataObject) {
  const importSource = Session.get('importSource');
  let membersToMap;
  switch (importSource) {
    case 'trello':
      membersToMap = trelloGetMembersToMap(dataObject);
      break;
    case 'wekan':
      membersToMap = wekanGetMembersToMap(dataObject);
      break;
    case 'csv':
      membersToMap = csvGetMembersToMap(dataObject);
      break;
  }
  return membersToMap;
}

Template.import.onCreated(function () {
  this.error = new ReactiveVar('');
  this.steps = ['importTextarea', 'importMapMembers'];
  this._currentStepIndex = new ReactiveVar(0);
  this.importedData = new ReactiveVar();
  this.membersToMap = new ReactiveVar([]);
  this.importSource = Session.get('importSource');

  this.nextStep = () => {
    const nextStepIndex = this._currentStepIndex.get() + 1;
    if (nextStepIndex >= this.steps.length) {
      this.finishImport();
    } else {
      this._currentStepIndex.set(nextStepIndex);
    }
  };

  this.setError = (error) => {
    this.error.set(error);
  };

  this.importData = (evt, dataSource) => {
    evt.preventDefault();
    const input = this.find('.js-import-json').value;
    if (dataSource === 'csv') {
      const csv = input.indexOf('\t') > 0 ? input.replace(/(\t)/g, ',') : input;
      const ret = Papa.parse(csv);
      if (ret && ret.data && ret.data.length) this.importedData.set(ret.data);
      else throw new Meteor.Error('error-csv-schema');
      const membersToMap = _prepareAdditionalData(ret.data);
      this.membersToMap.set(membersToMap);
      this.nextStep();
    } else {
      try {
        const dataObject = JSON.parse(input);
        this.setError('');
        this.importedData.set(dataObject);
        const membersToMap = _prepareAdditionalData(dataObject);
        // store members data and mapping in Session
        // (we go deep and 2-way, so storing in data context is not a viable option)
        this.membersToMap.set(membersToMap);
        this.nextStep();
      } catch (e) {
        this.setError('error-json-malformed');
      }
    }
  };

  this.finishImport = () => {
    const additionalData = {};
    const membersMapping = this.membersToMap.get();
    if (membersMapping) {
      const mappingById = {};
      membersMapping.forEach(member => {
        if (member.wekanId) {
          mappingById[member.id] = member.wekanId;
        }
      });
      additionalData.membersMapping = mappingById;
    }
    this.membersToMap.set([]);
    Meteor.call(
      'importBoard',
      this.importedData.get(),
      additionalData,
      this.importSource,
      Session.get('fromBoard'),
      (err, res) => {
        if (err) {
          this.setError(err.error);
        } else {
          let title = getSlug(this.importedData.get().title) || 'imported-board';
          Session.set('fromBoard', null);
          FlowRouter.go('board', {
            id: res,
            slug: title,
          });
          //Utils.goBoardId(res);
        }
      },
    );
  };
});

Template.import.helpers({
  error() {
    return Template.instance().error;
  },
  currentTemplate() {
    return Template.instance().steps[Template.instance()._currentStepIndex.get()];
  },
});

Template.importTextarea.helpers({
  instruction() {
    return `import-board-instruction-${Session.get('importSource')}`;
  },
  importPlaceHolder() {
    const importSource = Session.get('importSource');
    if (importSource === 'csv') {
      return 'import-csv-placeholder';
    } else {
      return 'import-json-placeholder';
    }
  },
});

Template.importTextarea.events({
  submit(evt, tpl) {
    const importTpl = findParentTemplateInstance(tpl, 'import');
    if (importTpl) {
      return importTpl.importData(evt, Session.get('importSource'));
    }
  },
});

// Module-level reference so popup children can access importMapMembers methods
let _importMapMembersTpl = null;

Template.importMapMembers.onCreated(function () {
  _importMapMembersTpl = this;
  this.usersLoaded = new ReactiveVar(false);

  this.members = () => {
    const importTpl = findParentTemplateInstance(this, 'import');
    return importTpl ? importTpl.membersToMap.get() : [];
  };

  this._refreshMembers = (listOfMembers) => {
    const importTpl = findParentTemplateInstance(this, 'import');
    if (importTpl) {
      importTpl.membersToMap.set(listOfMembers);
    }
  };

  this._setPropertyForMember = (property, value, memberId, unset = false) => {
    const listOfMembers = this.members();
    let finder = null;
    if (memberId) {
      finder = member => member.id === memberId;
    } else {
      finder = member => member.selected;
    }
    listOfMembers.forEach(member => {
      if (finder(member)) {
        if (value !== null) {
          member[property] = value;
        } else {
          delete member[property];
        }
        if (!unset) {
          // we shortcut if we don't care about unsetting the others
          return false;
        }
      } else if (unset) {
        delete member[property];
      }
      return true;
    });
    // Session.get gives us a copy, we have to set it back so it sticks
    this._refreshMembers(listOfMembers);
  };

  this.setSelectedMember = (memberId) => {
    return this._setPropertyForMember('selected', true, memberId, true);
  };

  this.getMember = (memberId = null) => {
    const allMembers = this.members();
    let finder = null;
    if (memberId) {
      finder = user => user.id === memberId;
    } else {
      finder = user => user.selected;
    }
    return allMembers.find(finder);
  };

  this.mapSelectedMember = (wekanId) => {
    return this._setPropertyForMember('wekanId', wekanId, null);
  };

  this.unmapMember = (memberId) => {
    return this._setPropertyForMember('wekanId', null, memberId);
  };

  this.autorun(() => {
    const handle = this.subscribe(
      'user-miniprofile',
      this.members().map(member => {
        return member.username;
      }),
    );
    Tracker.nonreactive(() => {
      Tracker.autorun(() => {
        if (
          handle.ready() &&
          !this.usersLoaded.get() &&
          this.members().length
        ) {
          this._refreshMembers(
            this.members().map(member => {
              if (!member.wekanId) {
                let user = ReactiveCache.getUser({ username: member.username });
                if (!user) {
                  user = ReactiveCache.getUser({ importUsernames: member.username });
                }
                if (user) {
                  member.wekanId = user._id;
                }
              }
              return member;
            }),
          );
        }
        this.usersLoaded.set(handle.ready());
      });
    });
  });
});

Template.importMapMembers.onDestroyed(function () {
  if (_importMapMembersTpl === this) {
    _importMapMembersTpl = null;
  }
});

Template.importMapMembers.helpers({
  usersLoaded() {
    return Template.instance().usersLoaded;
  },
  members() {
    return Template.instance().members();
  },
});

Template.importMapMembers.events({
  submit(evt, tpl) {
    evt.preventDefault();
    const importTpl = findParentTemplateInstance(tpl, 'import');
    if (importTpl) {
      importTpl.nextStep();
    }
  },
  'click .js-select-member'(evt, tpl) {
    const memberToMap = Template.currentData();
    if (memberToMap.wekan) {
      // todo xxx ask for confirmation?
      tpl.unmapMember(memberToMap.id);
    } else {
      tpl.setSelectedMember(memberToMap.id);
      Popup.open('importMapMembersAdd')(evt);
    }
  },
});

// Global reactive variables for import member popup
const importMemberPopupState = {
  searching: new ReactiveVar(false),
  searchResults: new ReactiveVar([]),
  noResults: new ReactiveVar(false),
  searchTimeout: null,
};

Template.importMapMembersAddPopup.onCreated(function () {
  this.searching = importMemberPopupState.searching;
  this.searchResults = importMemberPopupState.searchResults;
  this.noResults = importMemberPopupState.noResults;
  this.searchTimeout = null;

  this.searching.set(false);
  this.searchResults.set([]);
  this.noResults.set(false);
});

Template.importMapMembersAddPopup.onRendered(function () {
  this.find('.js-search-member-input').focus();
});

Template.importMapMembersAddPopup.onDestroyed(function () {
  if (this.searchTimeout) {
    clearTimeout(this.searchTimeout);
  }
  this.searching.set(false);
});

function importPerformSearch(tpl, query) {
  if (!query || query.length < 2) {
    tpl.searchResults.set([]);
    tpl.noResults.set(false);
    return;
  }

  tpl.searching.set(true);
  tpl.noResults.set(false);

  const results = UserSearchIndex.search(query, { limit: 20 }).fetch();
  tpl.searchResults.set(results);
  tpl.searching.set(false);

  if (results.length === 0) {
    tpl.noResults.set(true);
  }
}

Template.importMapMembersAddPopup.events({
  'click .js-select-import'(event, tpl) {
    if (_importMapMembersTpl) {
      _importMapMembersTpl.mapSelectedMember(Template.currentData().__originalId);
    }
    Popup.back();
  },
  'keyup .js-search-member-input'(event, tpl) {
    const query = event.target.value.trim();

    if (tpl.searchTimeout) {
      clearTimeout(tpl.searchTimeout);
    }

    tpl.searchTimeout = setTimeout(() => {
      importPerformSearch(tpl, query);
    }, 300);
  },
});

Template.importMapMembersAddPopup.helpers({
  searchResults() {
    return importMemberPopupState.searchResults.get();
  },
  searching() {
    return importMemberPopupState.searching;
  },
  noResults() {
    return importMemberPopupState.noResults;
  },
});
