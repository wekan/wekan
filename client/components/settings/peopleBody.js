import { ReactiveCache } from '/imports/reactiveCache';
import { avatarUpdateCounter } from '/client/components/users/avatarUpdateCounter';
import { InfiniteScrolling } from '/client/lib/infiniteScrolling';
import LockoutSettings from '/models/lockoutSettings';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Org from '/models/org';
import Team from '/models/team';
import Users from '/models/users';
import InviteToBoardRolesSettings, {
  INVITE_TO_BOARD_ROLES,
  INVITE_TO_BOARD_ROLES_ID,
} from '/models/inviteToBoardRolesSettings';

const orgsPerPage = 25;
const teamsPerPage = 25;
const usersPerPage = 25;
const domainsPerPage = 25;
let userOrgsTeamsAction = ""; //poosible actions 'addOrg', 'addTeam', 'removeOrg' or 'removeTeam' when adding or modifying a user
let selectedUserChkBoxUserIds = [];

Template.people.onCreated(function () {
  this.infiniteScrolling = new InfiniteScrolling();

  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
  this.orgSetting = new ReactiveVar(true);
  this.teamSetting = new ReactiveVar(false);
  this.peopleSetting = new ReactiveVar(false);
  this.lockedUsersSetting = new ReactiveVar(false);
  this.rolesSetting = new ReactiveVar(false);
  this.templatesSetting = new ReactiveVar(false);
  // #5850: Admin Panel > People > Domains tab. The domains table itself
  // (domainGeneral) now owns its data via getDomainsWithUserCountsPage.
  this.domainSetting = new ReactiveVar(false);
  this.subscribe('inviteToBoardRolesSettings');
  this.findOrgsOptions = new ReactiveVar({});
  this.findTeamsOptions = new ReactiveVar({});
  this.findUsersOptions = new ReactiveVar({});
  this.numberOrgs = new ReactiveVar(0);
  this.numberTeams = new ReactiveVar(0);
  this.numberPeople = new ReactiveVar(0);
  this.userFilterType = new ReactiveVar('all');
  this.peoplePage = new ReactiveVar(1);
  this.orgPage = new ReactiveVar(1);
  this.teamPage = new ReactiveVar(1);

  this.page = new ReactiveVar(1);
  this.loadNextPageLocked = false;
  this.infiniteScrolling.resetNextPeak();

  this.refreshUsersCount = () => {
    const query = this.findUsersOptions.get();
    Meteor.call('getUsersCollectionCount', query, (error, count) => {
      if (error) {
        console.error('Failed to load users collection count:', error);
        return;
      }
      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / usersPerPage));
      if (this.peoplePage.get() > totalPages) {
        this.peoplePage.set(totalPages);
      }
      this.numberPeople.set(total);
    });
  };

  this.refreshOrgsCount = () => {
    const query = this.findOrgsOptions.get();
    Meteor.call('getOrgsCollectionCount', query, (error, count) => {
      if (error) {
        console.error('Failed to load orgs collection count:', error);
        return;
      }
      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / orgsPerPage));
      if (this.orgPage.get() > totalPages) {
        this.orgPage.set(totalPages);
      }
      this.numberOrgs.set(total);
    });
  };

  this.refreshTeamsCount = () => {
    const query = this.findTeamsOptions.get();
    Meteor.call('getTeamsCollectionCount', query, (error, count) => {
      if (error) {
        console.error('Failed to load teams collection count:', error);
        return;
      }
      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / teamsPerPage));
      if (this.teamPage.get() > totalPages) {
        this.teamPage.set(totalPages);
      }
      this.numberTeams.set(total);
    });
  };

  this.calculateNextPeak = () => {
    const element = this.find('.main-body');
    if (element) {
      const altitude = element.scrollHeight;
      this.infiniteScrolling.setNextPeak(altitude);
    }
  };

  this.loadNextPage = () => {
    if (this.loadNextPageLocked === false) {
      this.page.set(this.page.get() + 1);
      this.loadNextPageLocked = true;
    }
  };

  this.filterOrg = () => {
    const value = $('#searchOrgInput').first().val();
    if (value !== '') {
      const regex = new RegExp(value, 'i');
      this.findOrgsOptions.set({
        $or: [
          { orgDisplayName: regex },
          { orgShortName: regex },
        ],
      });
    } else {
      this.findOrgsOptions.set({});
    }
    this.orgPage.set(1);
    this.refreshOrgsCount();
  };

  this.filterTeam = () => {
    const value = $('#searchTeamInput').first().val();
    if (value !== '') {
      const regex = new RegExp(value, 'i');
      this.findTeamsOptions.set({
        $or: [
          { teamDisplayName: regex },
          { teamShortName: regex },
        ],
      });
    } else {
      this.findTeamsOptions.set({});
    }
    this.teamPage.set(1);
    this.refreshTeamsCount();
  };

  this.filterPeople = () => {
    const value = $('#searchInput').first().val();
    const filterType = this.userFilterType.get();
    const currentTime = Number(new Date());

    let query = {};

    // Apply text search filter if there's a search value
    if (value !== '') {
      const regex = new RegExp(value, 'i');
      query = {
        $or: [
          { username: regex },
          { 'profile.fullname': regex },
          { 'emails.address': regex },
        ],
      };
    }

    // Apply filter based on selected option
    switch (filterType) {
      case 'locked':
        // Show only locked users
        query['services.accounts-lockout.unlockTime'] = { $gt: currentTime };
        break;
      case 'active':
        // Show only active users (loginDisabled is false or undefined)
        query['loginDisabled'] = { $ne: true };
        break;
      case 'inactive':
        // Show only inactive users (loginDisabled is true)
        query['loginDisabled'] = true;
        break;
      case 'admin':
        // Show only admin users (isAdmin is true)
        query['isAdmin'] = true;
        break;
      case 'all':
      default:
        // Show all users, no additional filter
        break;
    }

    this.findUsersOptions.set(query);
    this.peoplePage.set(1);
  };

  this.switchMenu = (event) => {
    const target = $(event.currentTarget);
    if (!target.hasClass('active')) {
      $('.side-menu li.active').removeClass('active');
      target.closest('li').addClass('active');
      const targetID = target.data('id');
      this.orgSetting.set('org-setting' === targetID);
      this.teamSetting.set('team-setting' === targetID);
      this.peopleSetting.set('people-setting' === targetID);
      this.lockedUsersSetting.set('locked-users-setting' === targetID);
      this.rolesSetting.set('roles-setting' === targetID);
      this.templatesSetting.set('templates-setting' === targetID);
      this.domainSetting.set('domains-setting' === targetID);

      // The Domains table (domainGeneral) now fetches its own single page from
      // getDomainsWithUserCountsPage (server-side search / sort / pagination), so
      // the parent no longer eagerly loads every domain into the browser.

      // When switching to locked users tab, refresh the locked users list
      if ('locked-users-setting' === targetID) {
        // Find the lockedUsersGeneral component and call refreshLockedUsers
        const lockedUsersComponent = Blaze.getView($('.main-body')[0])._templateInstance;
        if (lockedUsersComponent && lockedUsersComponent.refreshLockedUsers) {
          lockedUsersComponent.refreshLockedUsers();
        }
      }
    }
  };

  this.autorun(() => {
    const limitOrgs = orgsPerPage;
    const skipOrgs = (this.orgPage.get() - 1) * orgsPerPage;
    const limitTeams = teamsPerPage;
    const skipTeams = (this.teamPage.get() - 1) * teamsPerPage;
    const limitUsers = usersPerPage;
    const skipUsers = (this.peoplePage.get() - 1) * usersPerPage;

    this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, skipOrgs, () => {
      this.loadNextPageLocked = false;
      const nextPeakBefore = this.infiniteScrolling.getNextPeak();
      this.calculateNextPeak();
      const nextPeakAfter = this.infiniteScrolling.getNextPeak();
      if (nextPeakBefore === nextPeakAfter) {
        this.infiniteScrolling.resetNextPeak();
      }
      this.refreshOrgsCount();
    });

    this.subscribe('team', this.findTeamsOptions.get(), limitTeams, skipTeams, () => {
      this.loadNextPageLocked = false;
      const nextPeakBefore = this.infiniteScrolling.getNextPeak();
      this.calculateNextPeak();
      const nextPeakAfter = this.infiniteScrolling.getNextPeak();
      if (nextPeakBefore === nextPeakAfter) {
        this.infiniteScrolling.resetNextPeak();
      }
      this.refreshTeamsCount();
    });

    this.subscribe('people', this.findUsersOptions.get(), limitUsers, skipUsers, () => {
      this.loadNextPageLocked = false;
      const nextPeakBefore = this.infiniteScrolling.getNextPeak();
      this.calculateNextPeak();
      const nextPeakAfter = this.infiniteScrolling.getNextPeak();
      if (nextPeakBefore === nextPeakAfter) {
        this.infiniteScrolling.resetNextPeak();
      }

      this.refreshUsersCount();
    });
  });
});

Template.people.helpers({
  loading() {
    return Template.instance().loading;
  },
  orgSetting() {
    return Template.instance().orgSetting;
  },
  teamSetting() {
    return Template.instance().teamSetting;
  },
  peopleSetting() {
    return Template.instance().peopleSetting;
  },
  lockedUsersSetting() {
    return Template.instance().lockedUsersSetting;
  },
  rolesSetting() {
    return Template.instance().rolesSetting;
  },
  templatesSetting() {
    return Template.instance().templatesSetting;
  },
  domainSetting() {
    return Template.instance().domainSetting;
  },
  orgList() {
    const tpl = Template.instance();
    // The 'org' publication already returns only the current page (server-side
    // limit/skip, sorted createdAt:-1). Display exactly what it published:
    // re-applying skip/limit here paginated an already-paginated set, which
    // left page 2 with a single stray doc and later pages empty.
    const orgs = Org.find(tpl.findOrgsOptions.get(), {
      sort: { createdAt: -1 },
      fields: {
        _id: 1,
        orgDisplayName: 1,
        orgDesc: 1,
        orgShortName: 1,
        orgWebsite: 1,
        createdAt: 1,
        orgIsActive: 1,
        orgSharedTemplates: 1,
        orgPropagateMembersToBoards: 1,
        orgSyncMembersFromAuth: 1,
      },
    }).fetch();
    return orgs;
  },
  teamList() {
    const tpl = Template.instance();
    // The 'team' publication already returns only the current page (server-side
    // limit/skip, sorted createdAt:-1). Display exactly what it published:
    // re-applying skip/limit here paginated an already-paginated set, which
    // left page 2 with a single stray doc and later pages empty.
    const teams = Team.find(tpl.findTeamsOptions.get(), {
      sort: { createdAt: -1 },
      fields: {
        _id: 1,
        teamDisplayName: 1,
        teamDesc: 1,
        teamShortName: 1,
        teamWebsite: 1,
        createdAt: 1,
        teamIsActive: 1,
        teamSharedTemplates: 1,
        teamPropagateMembersToBoards: 1,
        teamSyncMembersFromAuth: 1,
      },
    }).fetch();
    return teams;
  },
  peopleList() {
    const tpl = Template.instance();
    // The 'people' publication already returns only the current page (server-side
    // limit/skip, sorted createdAt:-1). Display exactly what it published:
    // re-applying skip/limit here paginated an already-paginated set — that is
    // why page 1 showed 25, page 2 showed a single stray doc (the admin's own
    // user record, always present in minimongo) and later pages were empty.
    const users = Users.find(tpl.findUsersOptions.get(), {
      sort: { createdAt: -1 },
      fields: {
        _id: 1,
        username: 1,
        emails: 1,
        isAdmin: 1,
        createdAt: 1,
        loginDisabled: 1,
        services: 1,
      },
    }).fetch();
    return users;
  },
  orgNumber() {
    return Template.instance().numberOrgs.get();
  },
  teamNumber() {
    return Template.instance().numberTeams.get();
  },
  peopleNumber() {
    return Template.instance().numberPeople.get();
  },
  peopleCurrentPage() {
    return Template.instance().peoplePage.get();
  },
  peopleTotalPages() {
    const totalUsers = Template.instance().numberPeople.get() || 0;
    return Math.max(1, Math.ceil(totalUsers / usersPerPage));
  },
  hasPeoplePrevPage() {
    return Template.instance().peoplePage.get() > 1;
  },
  hasPeopleNextPage() {
    const tpl = Template.instance();
    const totalUsers = tpl.numberPeople.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
    return tpl.peoplePage.get() < totalPages;
  },
  orgCurrentPage() {
    return Template.instance().orgPage.get();
  },
  orgTotalPages() {
    const totalOrgs = Template.instance().numberOrgs.get() || 0;
    return Math.max(1, Math.ceil(totalOrgs / orgsPerPage));
  },
  hasOrgPrevPage() {
    return Template.instance().orgPage.get() > 1;
  },
  hasOrgNextPage() {
    const tpl = Template.instance();
    const totalOrgs = tpl.numberOrgs.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalOrgs / orgsPerPage));
    return tpl.orgPage.get() < totalPages;
  },
  teamCurrentPage() {
    return Template.instance().teamPage.get();
  },
  teamTotalPages() {
    const totalTeams = Template.instance().numberTeams.get() || 0;
    return Math.max(1, Math.ceil(totalTeams / teamsPerPage));
  },
  hasTeamPrevPage() {
    return Template.instance().teamPage.get() > 1;
  },
  hasTeamNextPage() {
    const tpl = Template.instance();
    const totalTeams = tpl.numberTeams.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalTeams / teamsPerPage));
    return tpl.teamPage.get() < totalPages;
  },
});

Template.people.events({
  'scroll .main-body'(event, tpl) {
    // Orgs, teams and people all use explicit prev/next pagination (server-side
    // limit/skip driven by orgPage/teamPage/peoplePage). Infinite scroll must
    // stay disabled on those tabs so the two paging mechanisms don't fight.
    if (tpl.orgSetting.get() || tpl.teamSetting.get() || tpl.peopleSetting.get()) {
      return;
    }
    tpl.infiniteScrolling.checkScrollPosition(event.currentTarget, () => {
      tpl.loadNextPage();
    });
  },
  'click #searchOrgButton'(event, tpl) {
    tpl.filterOrg();
  },
  'keydown #searchOrgInput'(event, tpl) {
    if (event.keyCode === 13 && !event.shiftKey) {
      tpl.filterOrg();
    }
  },
  'click #searchTeamButton'(event, tpl) {
    tpl.filterTeam();
  },
  'keydown #searchTeamInput'(event, tpl) {
    if (event.keyCode === 13 && !event.shiftKey) {
      tpl.filterTeam();
    }
  },
  'click #searchButton'(event, tpl) {
    tpl.filterPeople();
  },
  'click #addOrRemoveTeam'(){
    document.getElementById("divAddOrRemoveTeamContainer").style.display = 'block';
  },
  'keydown #searchInput'(event, tpl) {
    if (event.keyCode === 13 && !event.shiftKey) {
      tpl.filterPeople();
    }
  },
  'change #userFilterSelect'(event, tpl) {
    const filterType = $(event.target).val();
    tpl.userFilterType.set(filterType);
    tpl.filterPeople();
  },
  'click .js-people-prev-page'(event, tpl) {
    event.preventDefault();
    const current = tpl.peoplePage.get();
    if (current > 1) {
      tpl.peoplePage.set(current - 1);
    }
  },
  'click .js-people-next-page'(event, tpl) {
    event.preventDefault();
    const totalUsers = tpl.numberPeople.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
    const current = tpl.peoplePage.get();
    if (current < totalPages) {
      tpl.peoplePage.set(current + 1);
    }
  },
  // #4737/#5850: select-all / unselect-all for an org feature column.
  'click .js-org-feature-all'(event) {
    event.preventDefault();
    const field = event.currentTarget.getAttribute('data-feature');
    const value = event.currentTarget.getAttribute('data-value') === 'true';
    Meteor.call('setAllOrgsFeature', field, value);
  },
  // #4737/#5850: select-all / unselect-all for a team feature column.
  'click .js-team-feature-all'(event) {
    event.preventDefault();
    const field = event.currentTarget.getAttribute('data-feature');
    const value = event.currentTarget.getAttribute('data-value') === 'true';
    Meteor.call('setAllTeamsFeature', field, value);
  },
  'click .js-org-prev-page'(event, tpl) {
    event.preventDefault();
    const current = tpl.orgPage.get();
    if (current > 1) {
      tpl.orgPage.set(current - 1);
    }
  },
  'click .js-org-next-page'(event, tpl) {
    event.preventDefault();
    const totalOrgs = tpl.numberOrgs.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalOrgs / orgsPerPage));
    const current = tpl.orgPage.get();
    if (current < totalPages) {
      tpl.orgPage.set(current + 1);
    }
  },
  'click .js-team-prev-page'(event, tpl) {
    event.preventDefault();
    const current = tpl.teamPage.get();
    if (current > 1) {
      tpl.teamPage.set(current - 1);
    }
  },
  'click .js-team-next-page'(event, tpl) {
    event.preventDefault();
    const totalTeams = tpl.numberTeams.get() || 0;
    const totalPages = Math.max(1, Math.ceil(totalTeams / teamsPerPage));
    const current = tpl.teamPage.get();
    if (current < totalPages) {
      tpl.teamPage.set(current + 1);
    }
  },
  'click #unlockAllUsers'(event) {
    event.preventDefault();
    if (confirm(TAPi18n.__('accounts-lockout-confirm-unlock-all'))) {
      Meteor.call('unlockAllUsers', (error) => {
        if (error) {
          console.error('Error unlocking all users:', error);
        } else {
          // Show a brief success message
          const message = document.createElement('div');
          message.className = 'unlock-all-success';
          message.textContent = TAPi18n.__('accounts-lockout-all-users-unlocked');
          document.body.appendChild(message);

          // Remove the message after a short delay
          setTimeout(() => {
            if (message.parentNode) {
              message.parentNode.removeChild(message);
            }
          }, 3000);
        }
      });
    }
  },
  'click #newOrgButton'() {
    Popup.open('newOrg');
  },
  'click #newTeamButton'() {
    Popup.open('newTeam');
  },
  'click #newUserButton'() {
    Popup.open('newUser');
  },
  'click a.js-org-menu'(event, tpl) {
    tpl.switchMenu(event);
    tpl.orgPage.set(1);
    tpl.refreshOrgsCount();
  },
  'click a.js-team-menu'(event, tpl) {
    tpl.switchMenu(event);
    tpl.teamPage.set(1);
    tpl.refreshTeamsCount();
  },
  'click a.js-people-menu'(event, tpl) {
    tpl.switchMenu(event);
    tpl.peoplePage.set(1);
    tpl.refreshUsersCount();
  },
  'click a.js-locked-users-menu'(event, tpl) {
    tpl.switchMenu(event);
  },
  'click a.js-roles-menu'(event, tpl) {
    tpl.switchMenu(event);
  },
  'click a.js-templates-menu'(event, tpl) {
    tpl.switchMenu(event);
  },
  'click a.js-domains-menu'(event, tpl) {
    tpl.switchMenu(event);
  },
});

Template.rolesGeneral.onCreated(function () {
  // Working copy of the allowed-roles set; null until the published doc loads.
  this.workingRoles = new ReactiveVar(null);
  this.autorun(() => {
    if (this.workingRoles.get() === null) {
      const doc = InviteToBoardRolesSettings.findOne(INVITE_TO_BOARD_ROLES_ID);
      if (doc) {
        this.workingRoles.set((doc.allowedRoles || []).slice());
      }
    }
  });
});

Template.rolesGeneral.helpers({
  roleOptions() {
    const working = Template.instance().workingRoles.get() || [];
    // The role key doubles as the i18n key. 'board-admin' renders as
    // "Board Admin", deliberately distinct from the global Admin Panel admin.
    return INVITE_TO_BOARD_ROLES.map((key) => ({
      key,
      label: key,
      allowed: working.includes(key),
    }));
  },
  allRolesAllowed() {
    const working = Template.instance().workingRoles.get() || [];
    return INVITE_TO_BOARD_ROLES.every((key) => working.includes(key));
  },
});

Template.rolesGeneral.events({
  'click a.js-toggle-role'(event, tpl) {
    event.preventDefault();
    const role = $(event.currentTarget).data('role');
    const working = (tpl.workingRoles.get() || []).slice();
    const idx = working.indexOf(role);
    if (idx >= 0) {
      working.splice(idx, 1);
    } else {
      working.push(role);
    }
    tpl.workingRoles.set(working);
  },
  'click a.js-toggle-all-roles'(event, tpl) {
    event.preventDefault();
    const working = tpl.workingRoles.get() || [];
    const allOn = INVITE_TO_BOARD_ROLES.every((key) => working.includes(key));
    tpl.workingRoles.set(allOn ? [] : INVITE_TO_BOARD_ROLES.slice());
  },
  'click .js-roles-save'(event, tpl) {
    event.preventDefault();
    InviteToBoardRolesSettings.update(INVITE_TO_BOARD_ROLES_ID, {
      $set: { allowedRoles: tpl.workingRoles.get() || [] },
    });
  },
});

// Feature #3313 "Shared templates": admin view of users' shareable template
// boards, grouped by Organization / Team / email Domain. The three checkboxes
// are LIVE view filters (no Save button) — each toggles a grouping dimension and
// the selection is remembered (persisted in localStorage) so it survives reload.
const SHARED_TEMPLATES_SCOPE_KEY = 'sharedTemplatesScopes';
const SHARED_TEMPLATES_VALID_SCOPES = ['organizations', 'teams', 'domains'];

function loadSharedTemplatesScopes() {
  try {
    const raw = window.localStorage.getItem(SHARED_TEMPLATES_SCOPE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter(s => SHARED_TEMPLATES_VALID_SCOPES.includes(s))
      : [];
  } catch (e) {
    return [];
  }
}

function saveSharedTemplatesScopes(scopes) {
  try {
    window.localStorage.setItem(SHARED_TEMPLATES_SCOPE_KEY, JSON.stringify(scopes));
  } catch (e) {
    // ignore storage errors (e.g. private mode)
  }
}

Template.templatesGeneral.onCreated(function () {
  // Restore the previously-checked scopes (empty by default → nothing shown).
  this.selectedScopes = new ReactiveVar(loadSharedTemplatesScopes());
  // Raw rows returned by the admin-only method (one entry per user whose
  // Templates board is non-empty).
  this.sharedTemplates = new ReactiveVar([]);
  this.loading = new ReactiveVar(false);

  this.loadSharedTemplates = () => {
    this.loading.set(true);
    Meteor.call('adminSharedTemplates', (error, result) => {
      this.loading.set(false);
      if (error) {
        console.error('Failed to load shared templates:', error);
        this.sharedTemplates.set([]);
        return;
      }
      this.sharedTemplates.set(result || []);
    });
  };

  this.loadSharedTemplates();
});

const SCOPE_LABELS = {
  organizations: 'organizations',
  teams: 'teams',
  domains: 'domains',
};

// Build the grouped structure for a single scope dimension.
function buildScopeGroups(scope, rows) {
  // group key -> { groupName, members: [] }
  const groups = {};

  const addToGroup = (key, name, row) => {
    if (!groups[key]) {
      groups[key] = { groupKey: key, groupName: name, members: [] };
    }
    groups[key].members.push({
      userId: row.userId,
      label: row.fullname ? `${row.fullname} (${row.username})` : row.username,
      templateBoards: row.templateBoards.map(b => ({
        title: b.title,
        boardId: b.boardId,
        slug: b.slug,
        url: b.boardId ? `/b/${b.boardId}/${b.slug || 'template'}` : '',
      })),
    });
  };

  rows.forEach(row => {
    if (scope === 'organizations') {
      (row.orgs || []).forEach(o => {
        if (o.orgId) addToGroup(o.orgId, o.orgDisplayName || o.orgId, row);
      });
    } else if (scope === 'teams') {
      (row.teams || []).forEach(t => {
        if (t.teamId) addToGroup(t.teamId, t.teamDisplayName || t.teamId, row);
      });
    } else if (scope === 'domains') {
      (row.domains || []).forEach(d => {
        if (d) addToGroup(d, d, row);
      });
    }
  });

  return Object.values(groups).sort((a, b) =>
    String(a.groupName).localeCompare(String(b.groupName)),
  );
}

Template.templatesGeneral.helpers({
  loading() {
    return Template.instance().loading;
  },
  scopeChecked(scope) {
    return Template.instance().selectedScopes.get().includes(scope);
  },
  hasAnyScope() {
    return Template.instance().selectedScopes.get().length > 0;
  },
  scopeBlocks() {
    const tpl = Template.instance();
    const scopes = tpl.selectedScopes.get();
    const rows = tpl.sharedTemplates.get() || [];
    return scopes.map(scope => ({
      scope,
      scopeLabel: SCOPE_LABELS[scope] || scope,
      groups: buildScopeGroups(scope, rows),
    }));
  },
});

Template.templatesGeneral.events({
  'click a.js-toggle-template-scope'(event, tpl) {
    event.preventDefault();
    const scope = $(event.currentTarget).data('scope');
    const current = tpl.selectedScopes.get().slice();
    const idx = current.indexOf(scope);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(scope);
    }
    tpl.selectedScopes.set(current);
    saveSharedTemplatesScopes(current);
  },
});

Template.orgRow.helpers({
  orgData() {
    return this.org || ReactiveCache.getOrg(this.orgId);
  },
});

Template.teamRow.helpers({
  teamData() {
    return this.team || ReactiveCache.getTeam(this.teamId);
  },
});

Template.peopleRow.helpers({
  userData() {
    // Depend on global avatar update counter to reactively update when avatars change
    avatarUpdateCounter.get();
    // Get the user ID from either this._id or this.user._id
    let userId;
    if (this.user && this.user._id) {
      userId = this.user._id;
    } else if (this._id) {
      userId = this._id;
    }
    // Always fetch from ReactiveCache to ensure latest data
    if (userId) {
      return ReactiveCache.getUser(userId);
    }
    return this.user || this;
  },
  hasAvatarUrl() {
    // Depend on global avatar update counter to reactively update when avatars change
    avatarUpdateCounter.get();
    // Get the user ID from either this._id or this.user._id
    let userId;
    if (this.user && this.user._id) {
      userId = this.user._id;
    } else if (this._id) {
      userId = this._id;
    }
    let user;
    if (userId) {
      user = ReactiveCache.getUser(userId);
    } else {
      user = this.user || this;
    }
    if (!user || !user.profile) return false;
    return !!user.profile.avatarUrl;
  },
  isUserLocked() {
    const user = this.user || ReactiveCache.getUser(this.userId);
    if (!user) return false;

    // Check if user has accounts-lockout with unlockTime property
    if (user.services &&
        user.services['accounts-lockout'] &&
        user.services['accounts-lockout'].unlockTime) {

      // Check if unlockTime is in the future
      const currentTime = Number(new Date());
      return user.services['accounts-lockout'].unlockTime > currentTime;
    }

    return false;
  }
});

// Initialize filter dropdown
Template.people.rendered = function() {
  const template = this;

  // Set the initial value of the dropdown
  Tracker.afterFlush(function() {
    if (template.findAll('#userFilterSelect').length) {
      $('#userFilterSelect').val('all');
    }
  });
};

Template.editUserPopup.onCreated(function () {
  this.authenticationMethods = new ReactiveVar([]);
  this.errorMessage = new ReactiveVar('');

  Meteor.call('getAuthenticationsEnabled', (_, result) => {
    if (result) {
      // TODO : add a management of different languages
      // (ex {value: ldap, text: TAPi18n.__('ldap', {}, T9n.getLanguage() || 'en')})
      this.authenticationMethods.set([
        { value: 'password' },
        // Gets only the authentication methods availables
        ...Object.entries(result)
          .filter((e) => e[1])
          .map((e) => ({ value: e[0] })),
      ]);
    }
  });
});

Template.editOrgPopup.helpers({
  org() {
    // #6411: the popup is opened from orgRow with data context `{ org }`, so
    // prefer that exact org. Falling back to `getOrg(this.orgId)` only for the
    // older explicit-id callers — previously this helper used `this.orgId`
    // alone, which is undefined here, so `getOrg(undefined)` returned the FIRST
    // org for every row (you could never edit the 2nd/3rd org).
    // #6411: the popup is opened from orgRow with data context `{ org }`. The
    // popup's own `orgId` is undefined, so the old `getOrg(this.orgId)` returned
    // `getOrg(undefined)` — the FIRST org — for every row, so you could never
    // edit the 2nd/3rd org. Resolve the clicked org's id and look it up.
    const orgId = (this.org && this.org._id) || this.orgId;
    return ReactiveCache.getOrg(orgId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.editTeamPopup.helpers({
  team() {
    // #6411: same fix as editOrgPopup — resolve the clicked team's id from the
    // `{ team }` data context instead of `getTeam(undefined)` (the first team).
    const teamId = (this.team && this.team._id) || this.teamId;
    return ReactiveCache.getTeam(teamId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.editUserPopup.helpers({
  user() {
    return ReactiveCache.getUser(this.userId);
  },
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  orgsDatas() {
    const ret = ReactiveCache.getOrgs({}, {sort: { orgDisplayName: 1 }});
    return ret;
  },
  teamsDatas() {
    const ret = ReactiveCache.getTeams({}, {sort: { teamDisplayName: 1 }});
    return ret;
  },
  isSelected(match) {
    const userId = Template.instance().data.userId;
    const selected = ReactiveCache.getUser(userId).authenticationMethod;
    return selected === match;
  },
  isLdap() {
    const userId = Template.instance().data.userId;
    const selected = ReactiveCache.getUser(userId).authenticationMethod;
    return selected === 'ldap';
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.newOrgPopup.onCreated(function () {
  this.errorMessage = new ReactiveVar('');
});

Template.newTeamPopup.onCreated(function () {
  this.errorMessage = new ReactiveVar('');
});

Template.newUserPopup.onCreated(function () {
  this.authenticationMethods = new ReactiveVar([]);
  this.errorMessage = new ReactiveVar('');

  Meteor.call('getAuthenticationsEnabled', (_, result) => {
    if (result) {
      // TODO : add a management of different languages
      // (ex {value: ldap, text: TAPi18n.__('ldap', {}, T9n.getLanguage() || 'en')})
      this.authenticationMethods.set([
        { value: 'password' },
        // Gets only the authentication methods availables
        ...Object.entries(result)
          .filter((e) => e[1])
          .map((e) => ({ value: e[0] })),
      ]);
    }
  });
});

Template.newOrgPopup.helpers({
  org() {
    return ReactiveCache.getOrg(this.orgId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.newTeamPopup.helpers({
  team() {
    return ReactiveCache.getTeam(this.teamId);
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

Template.newUserPopup.helpers({
  user() {
    return ReactiveCache.getUser(this.userId);
  },
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  orgsDatas() {
    const ret = ReactiveCache.getOrgs({}, {sort: { orgDisplayName: 1 }});
    return ret;
  },
  teamsDatas() {
    const ret = ReactiveCache.getTeams({}, {sort: { teamDisplayName: 1 }});
    return ret;
  },
  isSelected(match) {
    const userId = Template.instance().data.userId;
    if(userId){
      const selected = ReactiveCache.getUser(userId).authenticationMethod;
      return selected === match;
    }
    else{
      false;
    }
  },
  isLdap() {
    const userId = Template.instance().data.userId;
    const selected = ReactiveCache.getUser(userId).authenticationMethod;
    return selected === 'ldap';
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

const ORG_FEATURE_METHODS = {
  orgSharedTemplates: 'setOrgSharedTemplates',
  orgPropagateMembersToBoards: 'setOrgPropagateMembersToBoards',
  orgSyncMembersFromAuth: 'setOrgSyncMembersFromAuth',
};

const TEAM_FEATURE_METHODS = {
  teamSharedTemplates: 'setTeamSharedTemplates',
  teamPropagateMembersToBoards: 'setTeamPropagateMembersToBoards',
  teamSyncMembersFromAuth: 'setTeamSyncMembersFromAuth',
};

Template.orgRow.events({
  'click a.edit-org': Popup.open('editOrg'),
  'click a.more-settings-org': Popup.open('settingsOrg'),
  // #4737/#5850: per-org feature checkbox columns.
  'change .js-toggle-org-feature'(event) {
    const org = this.org || ReactiveCache.getOrg(this.orgId);
    const field = event.currentTarget.getAttribute('data-feature');
    const method = ORG_FEATURE_METHODS[field];
    if (org && method) {
      Meteor.call(method, { _id: org._id }, event.currentTarget.checked);
    }
  },
});

Template.teamRow.events({
  'click a.edit-team': Popup.open('editTeam'),
  'click a.more-settings-team': Popup.open('settingsTeam'),
  // #4737/#5850: per-team feature checkbox columns.
  'change .js-toggle-team-feature'(event) {
    const team = this.team || ReactiveCache.getTeam(this.teamId);
    const field = event.currentTarget.getAttribute('data-feature');
    const method = TEAM_FEATURE_METHODS[field];
    if (team && method) {
      Meteor.call(method, { _id: team._id }, event.currentTarget.checked);
    }
  },
});

Template.peopleRow.events({
  'click a.edit-user'(event) {
    // Get the user ID from the data attribute
    const userId = event.currentTarget.getAttribute('data-user-id');
    if (userId) {
      Popup.open('editUser').call({ userId: userId }, event);
    }
  },
  'click a.more-settings-user'(event) {
    // Get the user ID from the data attribute
    const userId = event.currentTarget.getAttribute('data-user-id');
    if (userId) {
      Popup.open('settingsUser').call({ userId: userId }, event);
    }
  },
  'click .selectUserChkBox': function(ev){
      if(ev.currentTarget){
        if(ev.currentTarget.checked){
          if(!selectedUserChkBoxUserIds.includes(ev.currentTarget.id)){
            selectedUserChkBoxUserIds.push(ev.currentTarget.id);
          }
        }
        else{
          if(selectedUserChkBoxUserIds.includes(ev.currentTarget.id)){
            let index = selectedUserChkBoxUserIds.indexOf(ev.currentTarget.id);
            if(index > -1)
              selectedUserChkBoxUserIds.splice(index, 1);
          }
        }
      }
      if(selectedUserChkBoxUserIds.length > 0)
        document.getElementById("divAddOrRemoveTeam").style.display = 'block';
      else
        document.getElementById("divAddOrRemoveTeam").style.display = 'none';
  },
  'click .js-toggle-active-status': function(ev) {
      ev.preventDefault();
      const userId = this.userId || this.user?._id;
      const user = ReactiveCache.getUser(userId);

      if (!user) return;

      // Toggle loginDisabled status
      const isActive = !(user.loginDisabled === true);

      // Update the user's active status
      Users.update(userId, {
        $set: {
          loginDisabled: isActive
        }
      });
  },
  'click .js-toggle-lock-status': function(ev){
      ev.preventDefault();
      const userId = this.userId || this.user?._id;
      const user = ReactiveCache.getUser(userId);

      if (!user) return;

      // Check if user is currently locked
      const isLocked = user.services &&
          user.services['accounts-lockout'] &&
          user.services['accounts-lockout'].unlockTime &&
          user.services['accounts-lockout'].unlockTime > Number(new Date());

      if (isLocked) {
        // Unlock the user
        Meteor.call('unlockUser', userId, (error) => {
          if (error) {
            console.error('Error unlocking user:', error);
          }
        });
      } else {
        // Lock the user - this is optional, you may want to only allow unlocking
        // If you want to implement locking too, you would need a server method for it
        // For now, we'll leave this as a no-op
      }
  },
  'click a.js-edit-people-avatar'(event) {
    // Extract the user ID from the data attribute
    const userId = event.currentTarget.getAttribute('data-user-id');
    if (userId) {
      // Get the user from cache to pass correct context
      const user = ReactiveCache.getUser(userId);
      if (user) {
        // Call Popup.open with the correct user data context
        Popup.open('adminChangeAvatar').call({ _id: userId, user: user }, event);
      }
    }
  },
});

Template.modifyTeamsUsers.helpers({
  teamsDatas() {
    const ret = ReactiveCache.getTeams({}, {sort: { teamDisplayName: 1 }});
    return ret;
  },
});

Template.modifyTeamsUsers.events({
  'click #cancelBtn': function(){
    let selectedElt = document.getElementById("jsteamsUser");
    document.getElementById("divAddOrRemoveTeamContainer").style.display = 'none';
  },
  'click #addTeamBtn': function(){
    let selectedElt;
    let selectedEltValue;
    let selectedEltValueId;
    let userTms = [];
    let currentUser;
    let currUserTeamIndex;

    selectedElt = document.getElementById("jsteamsUser");
    selectedEltValue = selectedElt.options[selectedElt.selectedIndex].text;
    selectedEltValueId = selectedElt.options[selectedElt.selectedIndex].value;

    // #4593: `teams` is a forbidden field for direct client-side Users.update
    // (see server/permissions/users.js: only the owner may update, and never
    // `teams`), so the previous Users.update() calls here were silently denied
    // by the server and the bulk team assignment never persisted — a user
    // "added" to a team this way never saw the boards that team is assigned
    // to. Use the admin-only `editUser` method instead, which persists the
    // change and also grants the user membership of the boards the gained
    // team is assigned to.
    if(document.getElementById('addAction').checked){
      for(let i = 0; i < selectedUserChkBoxUserIds.length; i++){
        currentUser = ReactiveCache.getUser(selectedUserChkBoxUserIds[i]);
        // Copy, so the cached minimongo document is not mutated in place.
        userTms = (currentUser.teams || []).slice();
        currUserTeamIndex = userTms.findIndex(function(t){ return t.teamId == selectedEltValueId});
        if(currUserTeamIndex == -1){
          userTms.push({
            "teamId": selectedEltValueId,
            "teamDisplayName": selectedEltValue,
          });
        }

        Meteor.call('editUser', selectedUserChkBoxUserIds[i], { teams: userTms }, (error) => {
          if (error) {
            console.error('Error updating user teams:', error);
          }
        });
      }
    }
    else{
      for(let i = 0; i < selectedUserChkBoxUserIds.length; i++){
        currentUser = ReactiveCache.getUser(selectedUserChkBoxUserIds[i]);
        userTms = (currentUser.teams || []).slice();
        currUserTeamIndex = userTms.findIndex(function(t){ return t.teamId == selectedEltValueId});
        if(currUserTeamIndex != -1){
          userTms.splice(currUserTeamIndex, 1);
        }

        Meteor.call('editUser', selectedUserChkBoxUserIds[i], { teams: userTms }, (error) => {
          if (error) {
            console.error('Error updating user teams:', error);
          }
        });
      }
    }

    document.getElementById("divAddOrRemoveTeamContainer").style.display = 'none';
  },
});

Template.newOrgRow.events({
  'click a.new-org': Popup.open('newOrg'),
});

Template.newTeamRow.events({
  'click a.new-team': Popup.open('newTeam'),
});

Template.newUserRow.events({
  'click a.new-user': Popup.open('newUser'),
});

Template.selectAllUser.events({
  'click .allUserChkBox': function(ev){
    selectedUserChkBoxUserIds = [];
    const checkboxes = document.getElementsByClassName("selectUserChkBox");
    if(ev.currentTarget){
      if(ev.currentTarget.checked){
        for (let i=0; i<checkboxes.length; i++) {
          if (!checkboxes[i].disabled) {
           selectedUserChkBoxUserIds.push(checkboxes[i].id);
           checkboxes[i].checked = true;
          }
       }
      }
      else{
        for (let i=0; i<checkboxes.length; i++) {
          if (!checkboxes[i].disabled) {
           checkboxes[i].checked = false;
          }
       }
      }
    }

    if(selectedUserChkBoxUserIds.length > 0)
      document.getElementById("divAddOrRemoveTeam").style.display = 'block';
    else
      document.getElementById("divAddOrRemoveTeam").style.display = 'none';
  },
});

Template.editOrgPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    // #6411: prefer the `{ org }` data context (the row that was clicked);
    // `this.orgId` is undefined here, so the old getOrg(this.orgId) saved the
    // edits onto the FIRST org.
    const org = this.org || ReactiveCache.getOrg(this.orgId);

    const orgDisplayName = templateInstance
      .find('.js-orgDisplayName')
      .value.trim();
    const orgDesc = templateInstance.find('.js-orgDesc').value.trim();
    const orgShortName = templateInstance.find('.js-orgShortName').value.trim();
    const orgAutoAddUsersWithDomainName = templateInstance.find('.js-orgAutoAddUsersWithDomainName').value.trim();
    const orgWebsite = templateInstance.find('.js-orgWebsite').value.trim();
    const orgIsActive = templateInstance.find('.js-org-isactive').value.trim() == 'true';

    const isChangeOrgDisplayName = orgDisplayName !== org.orgDisplayName;
    const isChangeOrgDesc = orgDesc !== org.orgDesc;
    const isChangeOrgShortName = orgShortName !== org.orgShortName;
    const isChangeOrgAutoAddUsersWithDomainName = orgAutoAddUsersWithDomainName !== org.orgAutoAddUsersWithDomainName;
    const isChangeOrgWebsite = orgWebsite !== org.orgWebsite;
    const isChangeOrgIsActive = orgIsActive !== org.orgIsActive;

    if (
      isChangeOrgDisplayName ||
      isChangeOrgDesc ||
      isChangeOrgShortName ||
      isChangeOrgAutoAddUsersWithDomainName ||
      isChangeOrgWebsite ||
      isChangeOrgIsActive
    ) {
      Meteor.call(
        'setOrgAllFields',
        org,
        orgDisplayName,
        orgDesc,
        orgShortName,
        orgAutoAddUsersWithDomainName,
        orgWebsite,
        orgIsActive,
      );
    }

    Popup.back();
  },
});

Template.editTeamPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    // #6411: prefer the `{ team }` data context (the row that was clicked).
    const team = this.team || ReactiveCache.getTeam(this.teamId);

    const teamDisplayName = templateInstance
      .find('.js-teamDisplayName')
      .value.trim();
    const teamDesc = templateInstance.find('.js-teamDesc').value.trim();
    const teamShortName = templateInstance
      .find('.js-teamShortName')
      .value.trim();
    const teamWebsite = templateInstance.find('.js-teamWebsite').value.trim();
    const teamIsActive =
      templateInstance.find('.js-team-isactive').value.trim() == 'true';

    const isChangeTeamDisplayName = teamDisplayName !== team.teamDisplayName;
    const isChangeTeamDesc = teamDesc !== team.teamDesc;
    const isChangeTeamShortName = teamShortName !== team.teamShortName;
    const isChangeTeamWebsite = teamWebsite !== team.teamWebsite;
    const isChangeTeamIsActive = teamIsActive !== team.teamIsActive;

    if (
      isChangeTeamDisplayName ||
      isChangeTeamDesc ||
      isChangeTeamShortName ||
      isChangeTeamWebsite ||
      isChangeTeamIsActive
    ) {
      Meteor.call(
        'setTeamAllFields',
        team,
        teamDisplayName,
        teamDesc,
        teamShortName,
        teamWebsite,
        teamIsActive,
      );
    }

    Popup.back();
  },
});

Template.editUserPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const user = ReactiveCache.getUser(this.userId);
    const username = templateInstance.find('.js-profile-username').value.trim();
    const fullname = templateInstance.find('.js-profile-fullname').value.trim();
    const initials = templateInstance.find('.js-profile-initials').value.trim();
    const password = templateInstance.find('.js-profile-password').value;
    const isAdmin = templateInstance.find('.js-profile-isadmin').value.trim();
    const isActive = templateInstance.find('.js-profile-isactive').value.trim();
    const email = templateInstance.find('.js-profile-email').value.trim();
    const verified = templateInstance.find('.js-profile-email-verified').value.trim();
    const authentication = templateInstance.find('.js-authenticationMethod').value.trim();
    const importUsernames = templateInstance.find('.js-import-usernames').value.trim();
    const userOrgs = templateInstance.find('.js-userOrgs').value.trim();
    const userOrgsIds = templateInstance.find('.js-userOrgIds').value.trim();
    const userTeams = templateInstance.find('.js-userteams').value.trim();
    const userTeamsIds = templateInstance.find('.js-userteamIds').value.trim();

    const isChangePassword = password.length > 0;
    const isChangeUserName = username !== user.username;
    const isChangeInitials = initials.length > 0;
    const isChangeEmailVerified = verified !== user.emails[0].verified;

    // If previously email address has not been set, it is undefined,
    // check for undefined, and allow adding email address.
    const isChangeEmail =
      email.toLowerCase() !==
      (typeof user.emails !== 'undefined'
        ? user.emails[0].address.toLowerCase()
        : false);

    // Build user teams list
    let userTeamsList = userTeams.split(",");
    let userTeamsIdsList = userTeamsIds.split(",");
    let userTms = [];
    if(userTeams != ''){
      for(let i = 0; i < userTeamsList.length; i++){
        userTms.push({
          "teamId": userTeamsIdsList[i],
          "teamDisplayName": userTeamsList[i],
        })
      }
    }

    // Build user orgs list
    let userOrgsList = userOrgs.split(",");
    let userOrgsIdsList = userOrgsIds.split(",");
    let userOrganizations = [];
    if(userOrgs != ''){
      for(let i = 0; i < userOrgsList.length; i++){
        userOrganizations.push({
          "orgId": userOrgsIdsList[i],
          "orgDisplayName": userOrgsList[i],
        })
      }
    }

    // Update user via Meteor method (for admin to edit other users)
    const updateData = {
      fullname: fullname,
      isAdmin: isAdmin === 'true',
      loginDisabled: isActive === 'true',
      authenticationMethod: authentication,
      importUsernames: Users.parseImportUsernames(importUsernames),
      teams: userTms,
      orgs: userOrganizations,
    };

    Meteor.call('editUser', this.userId, updateData, (error) => {
      if (error) {
        console.error('Error updating user:', error);
      }
    });

    if (isChangePassword) {
      Meteor.call('setPassword', password, this.userId);
    }

    if (isChangeEmailVerified) {
      Meteor.call('setEmailVerified', email, verified === 'true', this.userId);
    }

    if (isChangeInitials) {
      Meteor.call('setInitials', initials, this.userId);
    }

    if (isChangeUserName && isChangeEmail) {
      Meteor.call(
        'setUsernameAndEmail',
        username,
        email.toLowerCase(),
        this.userId,
        function (error) {
          const usernameMessageElement = templateInstance.$('.username-taken');
          const emailMessageElement = templateInstance.$('.email-taken');
          if (error) {
            const errorElement = error.error;
            if (errorElement === 'username-already-taken') {
              usernameMessageElement.show();
              emailMessageElement.hide();
            } else if (errorElement === 'email-already-taken') {
              usernameMessageElement.hide();
              emailMessageElement.show();
            }
          } else {
            usernameMessageElement.hide();
            emailMessageElement.hide();
            Popup.back();
          }
        },
      );
    } else if (isChangeUserName) {
      Meteor.call('setUsername', username, this.userId, function (error) {
        const usernameMessageElement = templateInstance.$('.username-taken');
        if (error) {
          const errorElement = error.error;
          if (errorElement === 'username-already-taken') {
            usernameMessageElement.show();
          }
        } else {
          usernameMessageElement.hide();
          Popup.back();
        }
      });
    } else if (isChangeEmail) {
      Meteor.call(
        'setEmail',
        email.toLowerCase(),
        this.userId,
        function (error) {
          const emailMessageElement = templateInstance.$('.email-taken');
          if (error) {
            const errorElement = error.error;
            if (errorElement === 'email-already-taken') {
              emailMessageElement.show();
            }
          } else {
            emailMessageElement.hide();
            Popup.back();
          }
        },
      );
    } else Popup.back();
  },
  'click #addUserOrg'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "addOrg";
    document.getElementById("jsOrgs").style.display = 'block';
    document.getElementById("jsTeams").style.display = 'none';
  },
  'click #removeUserOrg'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "removeOrg";
    document.getElementById("jsOrgs").style.display = 'block';
    document.getElementById("jsTeams").style.display = 'none';
  },
  'click #addUserTeam'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "addTeam";
    document.getElementById("jsTeams").style.display = 'block';
    document.getElementById("jsOrgs").style.display = 'none';
  },
  'click #removeUserTeam'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "removeTeam";
    document.getElementById("jsTeams").style.display = 'block';
    document.getElementById("jsOrgs").style.display = 'none';
  },
  'change #jsOrgs'(event) {
    event.preventDefault();
    UpdateUserOrgsOrTeamsElement();
  },
  'change #jsTeams'(event) {
    event.preventDefault();
    UpdateUserOrgsOrTeamsElement();
  },
});

const UpdateUserOrgsOrTeamsElement = function(isNewUser = false){
  let selectedElt;
  let selectedEltValue;
  let selectedEltValueId;
  let inputElt;
  let inputEltId;
  let lstInputValues = [];
  let lstInputValuesIds = [];
  let index;
  let indexId;
  switch(userOrgsTeamsAction)
  {
    case "addOrg":
    case "removeOrg":
      inputElt = !isNewUser ? document.getElementById("jsUserOrgsInPut") : document.getElementById("jsUserOrgsInPutNewUser");
      inputEltId = !isNewUser ? document.getElementById("jsUserOrgIdsInPut") : document.getElementById("jsUserOrgIdsInPutNewUser");
      selectedElt = !isNewUser ? document.getElementById("jsOrgs") : document.getElementById("jsOrgsNewUser");
      break;
    case "addTeam":
    case "removeTeam":
      inputElt = !isNewUser ? document.getElementById("jsUserTeamsInPut") : document.getElementById("jsUserTeamsInPutNewUser");
      inputEltId = !isNewUser ? document.getElementById("jsUserTeamIdsInPut") : document.getElementById("jsUserTeamIdsInPutNewUser");
      selectedElt = !isNewUser ? document.getElementById("jsTeams") : document.getElementById("jsTeamsNewUser");
      break;
    default:
      break;
  }
  selectedEltValue = selectedElt.options[selectedElt.selectedIndex].text;
  selectedEltValueId = selectedElt.options[selectedElt.selectedIndex].value;
  lstInputValues = inputElt.value.trim().split(",");
  if(lstInputValues.length == 1 && lstInputValues[0] == ''){
    lstInputValues = [];
  }
  lstInputValuesIds = inputEltId.value.trim().split(",");
  if(lstInputValuesIds.length == 1 && lstInputValuesIds[0] == ''){
    lstInputValuesIds = [];
  }
  index = lstInputValues.indexOf(selectedEltValue);
  indexId = lstInputValuesIds.indexOf(selectedEltValueId);
  if(userOrgsTeamsAction == "addOrg" || userOrgsTeamsAction == "addTeam"){
    if(index <= -1 && selectedEltValueId != "-1"){
      lstInputValues.push(selectedEltValue);
    }

    if(indexId <= -1 && selectedEltValueId != "-1"){
      lstInputValuesIds.push(selectedEltValueId);
    }
  }
  else{
    if(index > -1 && selectedEltValueId != "-1"){
      lstInputValues.splice(index, 1);
    }

    if(indexId > -1 && selectedEltValueId != "-1"){
      lstInputValuesIds.splice(indexId, 1);
    }
  }

  if(lstInputValues.length > 0){
    inputElt.value = lstInputValues.join(",");
  }
  else{
    inputElt.value = "";
  }

  if(lstInputValuesIds.length > 0){
    inputEltId.value = lstInputValuesIds.join(",");
  }
  else{
    inputEltId.value = "";
  }
  selectedElt.value = "-1";
  selectedElt.style.display = "none";
}

Template.newOrgPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const orgDisplayName = templateInstance
      .find('.js-orgDisplayName')
      .value.trim();
    const orgDesc = templateInstance.find('.js-orgDesc').value.trim();
    const orgShortName = templateInstance.find('.js-orgShortName').value.trim();
    const orgAutoAddUsersWithDomainName = templateInstance.find('.js-orgAutoAddUsersWithDomainName').value.trim();
    const orgWebsite = templateInstance.find('.js-orgWebsite').value.trim();
    const orgIsActive =
      templateInstance.find('.js-org-isactive').value.trim() == 'true';

    Meteor.call(
      'setCreateOrg',
      orgDisplayName,
      orgDesc,
      orgShortName,
      orgAutoAddUsersWithDomainName,
      orgWebsite,
      orgIsActive,
    );
    Popup.back();
  },
});

Template.newTeamPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const teamDisplayName = templateInstance
      .find('.js-teamDisplayName')
      .value.trim();
    const teamDesc = templateInstance.find('.js-teamDesc').value.trim();
    const teamShortName = templateInstance
      .find('.js-teamShortName')
      .value.trim();
    const teamWebsite = templateInstance.find('.js-teamWebsite').value.trim();
    const teamIsActive =
      templateInstance.find('.js-team-isactive').value.trim() == 'true';

    Meteor.call(
      'setCreateTeam',
      teamDisplayName,
      teamDesc,
      teamShortName,
      teamWebsite,
      teamIsActive,
    );
    Popup.back();
  },
});

Template.newUserPopup.events({
  submit(event, templateInstance) {
    event.preventDefault();
    const fullname = templateInstance.find('.js-profile-fullname').value.trim();
    const username = templateInstance.find('.js-profile-username').value.trim();
    const initials = templateInstance.find('.js-profile-initials').value.trim();
    const password = templateInstance.find('.js-profile-password').value;
    const isAdmin = templateInstance.find('.js-profile-isadmin').value.trim();
    const isActive = templateInstance.find('.js-profile-isactive').value.trim();
    const email = templateInstance.find('.js-profile-email').value.trim();
    const importUsernames = Users.parseImportUsernames(
      templateInstance.find('.js-import-usernames').value,
    );
    const userOrgs = templateInstance.find('.js-userOrgsNewUser').value.trim();
    const userOrgsIds = templateInstance.find('.js-userOrgIdsNewUser').value.trim();
    const userTeams = templateInstance.find('.js-userteamsNewUser').value.trim();
    const userTeamsIds = templateInstance.find('.js-userteamIdsNewUser').value.trim();

    let userTeamsList = userTeams.split(",");
    let userTeamsIdsList = userTeamsIds.split(",");
    let userTms = [];
    for(let i = 0; i < userTeamsList.length; i++){
      if(!!userTeamsIdsList[i] && !!userTeamsList[i]) {
        userTms.push({
          "teamId": userTeamsIdsList[i],
          "teamDisplayName": userTeamsList[i],
        })
      }
    }

    let userOrgsList = userOrgs.split(",");
    let userOrgsIdsList = userOrgsIds.split(",");
    let userOrganizations = [];
    for(let i = 0; i < userOrgsList.length; i++){
      if(!!userOrgsIdsList[i] && !!userOrgsList[i]) {
        userOrganizations.push({
          "orgId": userOrgsIdsList[i],
          "orgDisplayName": userOrgsList[i],
        })
      }
    }

    Meteor.call(
      'setCreateUser',
      fullname,
      username,
      initials,
      password,
      isAdmin,
      isActive,
      email.toLowerCase(),
      importUsernames,
      userOrganizations,
      userTms,
      function(error) {
        const usernameMessageElement = templateInstance.$('.username-taken');
        const emailMessageElement = templateInstance.$('.email-taken');
        if (error) {
          const errorElement = error.error;
          if (errorElement === 'username-already-taken') {
            usernameMessageElement.show();
            emailMessageElement.hide();
          } else if (errorElement === 'email-already-taken') {
            usernameMessageElement.hide();
            emailMessageElement.show();
          }
        } else {
          usernameMessageElement.hide();
          emailMessageElement.hide();
          Popup.back();
        }
      },
    );
    Popup.back();
  },
  'click #addUserOrgNewUser'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "addOrg";
    document.getElementById("jsOrgsNewUser").style.display = 'block';
    document.getElementById("jsTeamsNewUser").style.display = 'none';
  },
  'click #removeUserOrgNewUser'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "removeOrg";
    document.getElementById("jsOrgsNewUser").style.display = 'block';
    document.getElementById("jsTeamsNewUser").style.display = 'none';
  },
  'click #addUserTeamNewUser'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "addTeam";
    document.getElementById("jsTeamsNewUser").style.display = 'block';
    document.getElementById("jsOrgsNewUser").style.display = 'none';
  },
  'click #removeUserTeamNewUser'(event) {
    event.preventDefault();

    userOrgsTeamsAction = "removeTeam";
    document.getElementById("jsTeamsNewUser").style.display = 'block';
    document.getElementById("jsOrgsNewUser").style.display = 'none';
  },
  'change #jsOrgsNewUser'(event) {
    event.preventDefault();
    UpdateUserOrgsOrTeamsElement(true);
  },
  'change #jsTeamsNewUser'(event) {
    event.preventDefault();
    UpdateUserOrgsOrTeamsElement(true);
  },
});

Template.settingsOrgPopup.events({
  'click #deleteButton'(event) {
    event.preventDefault();
    // #6411: the popup carries `{ org }`; `this.orgId` is undefined, so the old
    // code checked users for an undefined org and called Org.remove(undefined).
    const orgId = (this.org && this.org._id) || this.orgId;
    if (ReactiveCache.getUsers({"orgs.orgId": orgId}).length > 0)
    {
      let orgClassList = document.getElementById("deleteOrgWarningMessage").classList;
      if(orgClassList.contains('hide'))
      {
        orgClassList.remove('hide');
        document.getElementById("deleteOrgWarningMessage").style.color = "red";
      }
      return;
    }
    Org.remove(orgId);
    Popup.back();
  }
});

Template.settingsTeamPopup.events({
  'click #deleteButton'(event) {
    event.preventDefault();
    // #6411: same as settingsOrgPopup — derive the id from the `{ team }` context.
    const teamId = (this.team && this.team._id) || this.teamId;
    if (ReactiveCache.getUsers({"teams.teamId": teamId}).length > 0)
    {
      let teamClassList = document.getElementById("deleteTeamWarningMessage").classList;
      if(teamClassList.contains('hide'))
      {
        teamClassList.remove('hide');
        document.getElementById("deleteTeamWarningMessage").style.color = "red";
      }
      return;
    }
    Team.remove(teamId);
    Popup.back();
  }
});

Template.settingsUserPopup.events({
  'click .impersonate-user'(event) {
    event.preventDefault();
    const userId = this.userId || this.user?._id;

    Meteor.call('impersonate', userId, (err) => {
      if (!err) {
        // Meteor.connection.setUserId() triggers automatic cache invalidation
        // No need to manually invalidate - let Meteor handle the user data refresh
        Meteor.connection.setUserId(userId);
        FlowRouter.go('/');
      }
    });
  },
  'click #deleteButton'(event) {
    event.preventDefault();
    const userId = this.userId || this.user?._id;

    // Use secure server method instead of direct client-side removal
    Meteor.call('removeUser', userId, (error, result) => {
      if (error) {
        if (process.env.DEBUG === 'true') {
          console.error('Error removing user:', error);
        }
        // Show error message to user
        if (error.error === 'not-authorized') {
          alert('You are not authorized to delete this user.');
        } else if (error.error === 'user-not-found') {
          alert('User not found.');
        } else if (error.error === 'not-authorized' && error.reason === 'Cannot delete the last administrator') {
          alert('Cannot delete the last administrator.');
        } else {
          alert('Error deleting user: ' + error.reason);
        }
      } else {
        if (process.env.DEBUG === 'true') {
          console.log('User deleted successfully:', result);
        }
        Popup.back();
      }
    });
  },
});

Template.settingsUserPopup.helpers({
  user() {
    const userId = this.userId || this.user?._id;
    return ReactiveCache.getUser(userId);
  },
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  isSelected(match) {
    const userId = Template.instance().data.userId || Template.instance().data.user?._id;
    const user = ReactiveCache.getUser(userId);
    if (!user) return false;
    const selected = user.authenticationMethod;
    return selected === match;
  },
  isLdap() {
    const userId = Template.instance().data.userId || Template.instance().data.user?._id;
    const user = ReactiveCache.getUser(userId);
    if (!user) return false;
    const selected = user.authenticationMethod;
    return selected === 'ldap';
  },
  errorMessage() {
    return Template.instance().errorMessage.get();
  },
});

// Admin Panel > People > Domains table. Self-contained (like the Board Table
// view): it keeps its own search / sort / page state and fetches only ONE page
// from the server method getDomainsWithUserCountsPage, so the whole domain list
// is never loaded into the browser.
Template.domainGeneral.onCreated(function () {
  this.searchQuery = new ReactiveVar('');
  this.page = new ReactiveVar(1);
  this.pageData = new ReactiveVar({ rows: [], total: 0, totalPages: 1 });

  this.autorun(() => {
    const params = {
      search: this.searchQuery.get(),
      page: this.page.get(),
      perPage: domainsPerPage,
    };
    Meteor.call('getDomainsWithUserCountsPage', params, (err, res) => {
      if (!err && res) {
        this.pageData.set(res);
        // Server clamps the page into range; mirror that so the controls agree.
        if (typeof res.page === 'number' && res.page !== this.page.get()) {
          this.page.set(res.page);
        }
      }
    });
  });
});

Template.domainGeneral.helpers({
  domainList() {
    return Template.instance().pageData.get().rows;
  },
  currentPage() {
    return Template.instance().page.get();
  },
  totalPages() {
    return Template.instance().pageData.get().totalPages || 1;
  },
  hasPrevPage() {
    return Template.instance().page.get() > 1;
  },
  hasNextPage() {
    const tpl = Template.instance();
    return tpl.page.get() < (tpl.pageData.get().totalPages || 1);
  },
});

Template.domainGeneral.events({
  'click .js-domain-search-button'(event, tpl) {
    event.preventDefault();
    tpl.searchQuery.set(tpl.$('.js-domain-search').val() || '');
    tpl.page.set(1);
  },
  'keydown .js-domain-search'(event, tpl) {
    if (event.keyCode === 13) {
      event.preventDefault();
      tpl.searchQuery.set(tpl.$('.js-domain-search').val() || '');
      tpl.page.set(1);
    }
  },
  'click .js-domain-prev-page'(event, tpl) {
    event.preventDefault();
    const current = tpl.page.get();
    if (current > 1) tpl.page.set(current - 1);
  },
  'click .js-domain-next-page'(event, tpl) {
    event.preventDefault();
    const current = tpl.page.get();
    if (current < (tpl.pageData.get().totalPages || 1)) tpl.page.set(current + 1);
  },
});
