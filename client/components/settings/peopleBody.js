import { ReactiveCache } from '/imports/reactiveCache';
import { Session } from 'meteor/session';
import { leftMenuData, paneTitle } from '/models/lib/leftMenu';
// buildFilters and buildActions are imported like the rest of them. The People
// pane declares its filter dropdown and its two action buttons to the shared
// controls row with these, and a missing import is not a build error: it is a
// ReferenceError thrown INSIDE the helper at render time, which Blaze answers by
// rendering nothing. That is what left Admin Panel / People / People with no
// table, no search box and no pager, while Organizations, Teams and Domains -
// which use neither function - drew theirs normally.
import { adjacentPage, buildActions, buildFilters, buildHeader, buildRows, docsByIds, pageInfo, TABLE_PAGE_ROWS_PER_PAGE } from "/models/lib/tablePage";
import { avatarUpdateCounter } from '/client/components/users/avatarUpdateCounter';
import { InfiniteScrolling } from '/client/lib/infiniteScrolling';
import LockoutSettings from '/models/lockoutSettings';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
// The per-pane URLs of the Admin Panel. docs/Features/Page/Admin-Panel-URLs.md
import { adminPath } from '/models/lib/adminUrls';
import Org from '/models/org';
import Settings from '/models/settings';
import Team from '/models/team';
import Users from '/models/users';
// Multitenancy option D: the per-tenant Global Admin rules, the same module the
// publications and methods use (docs/Design/Multitenancy/Multitenancy.md).
import * as tenantAdmin from '/models/lib/tenantAdmin';
// Is this account locked, and why. The lockout is per source address
// (GHSA-rf3w-rj48-jxcc), so one place knows the shape.
const { isUserLocked: lockoutIsUserLocked } = require('/models/lib/accountLockout');
import InviteToBoardRolesSettings, {
  INVITE_TO_BOARD_ROLES,
  INVITE_TO_BOARD_ROLES_ID,
} from '/models/inviteToBoardRolesSettings';
// The one capability table the server allow rules and the client's canModify*
// helpers also read, so the Roles Status pane cannot show a permission that is
// not enforced.
const {
  BOARD_ROLES,
  ROLE_CAPABILITIES,
} = require('/models/lib/boardRoleCapabilities');

// Multitenancy option D (D.2/D.9): the org fields that make an Organization a
// tenant - its hostnames plus the branding that overrides the instance branding on
// them. One list, used to read the edit popup and to send the method, so a field
// cannot be added to the form and forgotten in the save.
const TENANT_ORG_FIELDS = [
  'orgDomains',
  'orgProductName',
  'orgCustomLoginLogoImageUrl',
  'orgCustomLoginLogoLinkUrl',
  'orgTextBelowCustomLoginLogo',
  'orgCustomTopLeftCornerLogoImageUrl',
  'orgCustomTopLeftCornerLogoLinkUrl',
  'orgCustomHelpLinkUrl',
  'orgLegalNotice',
];

// One rows-per-page for the whole app (docs/Features/Page/Table.md): these four
// panes page exactly like every other paginated page in WeKan.
const orgsPerPage = TABLE_PAGE_ROWS_PER_PAGE;
const teamsPerPage = TABLE_PAGE_ROWS_PER_PAGE;
const usersPerPage = TABLE_PAGE_ROWS_PER_PAGE;
const domainsPerPage = TABLE_PAGE_ROWS_PER_PAGE;

// The People table renders the page the SERVER named (getPeoplePageIds), so adding
// or deleting a user has to ask for that page again - the page's contents changed
// without any of the things the table watches (the query, the page number) changing.
// The create and delete handlers live in their own popup templates, so this is a
// module-level counter rather than something on the People instance.
const peopleListVersion = new ReactiveVar(0);
function peopleListChanged() {
  peopleListVersion.set(peopleListVersion.get() + 1);
}
let userOrgsTeamsAction = ""; //poosible actions 'addOrg', 'addTeam', 'removeOrg' or 'removeTeam' when adding or modifying a user
let selectedUserChkBoxUserIds = [];
let activePeopleTemplate = null;

Template.people.onCreated(function () {
  activePeopleTemplate = this;
  this.infiniteScrolling = new InfiniteScrolling();

  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
  // The page opens on Login, the first entry of the menu - as it always did.
  this.registrationSetting = new ReactiveVar(true);
  this.emailSetting = new ReactiveVar(false);
  this.orgSetting = new ReactiveVar(false);
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
  // The ids the `people` publication sent for the CURRENT page, in its order. The
  // browser holds more user documents than one page - the logged-in user's own
  // record is always in minimongo - so the table renders this list, not everything
  // a `Users.find()` happens to match. See getPeoplePageIds in server/models/users.js.
  this.peoplePageIds = new ReactiveVar([]);
  this.peopleLoginLocations = new ReactiveVar({});
  this.loginLocationReport = new ReactiveVar(null);
  this.loginLocationCountry = new ReactiveVar('');
  this.loginLocationSearch = new ReactiveVar('');
  this.loginLocationPage = new ReactiveVar(1);
  this.peopleLoginLocationsRequest = 0;
  this.loadPeopleLoginLocations = userIds => {
    const request = ++this.peopleLoginLocationsRequest;
    Meteor.call('peopleLoginLocations', userIds, (error, reports) => {
      if (request !== this.peopleLoginLocationsRequest) return;
      if (error) {
        console.error('Failed to load people login locations:', error);
        return;
      }
      const byUser = {};
      (reports || []).forEach(report => { byUser[report.userId] = report; });
      this.peopleLoginLocations.set(byUser);
    });
  };
  this.openLoginLocationReport = (userId, country) => {
    const report = this.peopleLoginLocations.get()[userId];
    if (!report || !report.countries || !report.countries.length) return;
    this.loginLocationReport.set(report);
    const requested = report.countries.find(item => item.country === country);
    this.loginLocationCountry.set((requested || report.countries[0]).country);
    this.loginLocationSearch.set('');
    this.loginLocationPage.set(1);
  };
  this.userFilterType = new ReactiveVar('all');
  // The search box lives in the shared controls row now, so keep the term in
  // state rather than reading it back out of a DOM id.
  this.peopleSearchTerm = new ReactiveVar('');
  // Orgs and Teams search through the shared table-page controls row now, like
  // People already did. Their boxes used to live in the page-title bar, which is
  // gone: an Admin Panel page is the left menu and the pane, nothing else.
  this.orgSearchTerm = new ReactiveVar('');
  this.teamSearchTerm = new ReactiveVar('');

  // Was the body of a 'click #unlockAllUsers' handler. That button is a shared
  // controls-row action now, identified by data-action, so the work moves here and
  // the action handler just calls it.
  this.unlockAllUsers = () => {
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
  };
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
    const value = this.orgSearchTerm.get();
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
    const value = this.teamSearchTerm.get();
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
    const value = this.peopleSearchTerm.get();
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
        query['services.accounts-lockout.lockedUntil'] = { $gt: currentTime };
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

  // Which pane is open. The seven booleans below are derived from it; the shared
  // left menu (docs/Features/Page/Left-Menu.md) renders the active row from it, so
  // the menu no longer has to be highlighted by hand.
  this.activeMenuId = new ReactiveVar('registration-setting');

  // Multitenancy option D (D.7): an Organization's own admin has no Login pane, so
  // the page opens on the first entry of the menu THEY have - Organizations.
  //
  // Decided in an autorun, not at onCreated: the user document has often not
  // arrived yet there, and deciding from a missing user would open the wrong pane
  // for the site admin too. Corrected once, when the user is actually known.
  this.openPaneDecided = false;
  this.autorun(() => {
    const user = ReactiveCache.getCurrentUser();
    if (!user || this.openPaneDecided) return;
    this.openPaneDecided = true;
    const openPaneId = firstPeoplePaneId(user);
    if (openPaneId === 'registration-setting') return;
    this.registrationSetting.set(false);
    this.orgSetting.set(openPaneId === 'org-setting');
    this.peopleSetting.set(openPaneId === 'people-setting');
    this.activeMenuId.set(openPaneId);
  });

  // Open a pane BY ID. Split out of switchMenu so the URL can open one too -
  // every left-menu entry has an address now (/people/roles, /people/domains).
  // docs/Features/Page/Admin-Panel-URLs.md
  this.openPane = (targetID) => {
    // Re-opening the open pane must do nothing. The active row is rendered from
    // activeMenuId now, so compare ids instead of reading a DOM class.
    if (targetID && targetID !== this.activeMenuId.get()) {
      this.activeMenuId.set(targetID);
      this.registrationSetting.set('registration-setting' === targetID);
      this.emailSetting.set('email-setting' === targetID);
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

  this.switchMenu = (event) => {
    // data-id is on the anchor; event.target may be the icon inside it.
    const target = $(event.currentTarget || event.target).closest('.js-left-menu-item');
    this.openPane(target.data('id'));
  };

  // The pane the URL asks for. The route resolved it, so it is always a real
  // pane id; a bare /people opens the page's default.
  this.autorun(() => {
    const paneId = Session.get('peopleOpenPane');
    if (paneId) this.openPane(paneId);
  });

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

    // Which users this page consists of, asked for with the same query/limit/skip
    // as the subscription right below it. Without it the table cannot tell the
    // page's documents from the other user documents in minimongo.
    peopleListVersion.get(); // ask again when a user was added or deleted
    Meteor.call('getPeoplePageIds', this.findUsersOptions.get(), limitUsers, skipUsers,
      (error, ids) => {
        if (error) {
          console.error('Failed to load the people page:', error);
          return;
        }
        this.peoplePageIds.set(Array.isArray(ids) ? ids : []);
        this.loadPeopleLoginLocations(Array.isArray(ids) ? ids : []);
        // The total moves with the page's contents, so it is refreshed here too:
        // the subscription's ready callback only fires the first time.
        this.refreshUsersCount();
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

Template.people.onDestroyed(function () {
  if (activePeopleTemplate === this) activePeopleTemplate = null;
});

// The People side menu, as data (docs/Features/Page/Left-Menu.md). Locked users
// keeps the red lock it always had, via the coloured icon wrapper.
// A function, not a bare array: the E-mail entry depends on whether this is a
// Sandstorm deployment, which has to be read at call time from Meteor.settings.
function peopleMenu(user) {
  const isSandstorm =
    Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;
  const items = [
    // Moved here from Admin Panel / Settings: both panes are about the people who can
    // sign in and how they are reached, which is what this page is for. The ids and
    // i18n keys are unchanged, so every existing translation still applies.
    { id: 'registration-setting', icon: 'fa-key', labelKey: 'login', emoji: true },
    // No e-mail settings on Sandstorm; a null entry is dropped, not rendered empty.
    isSandstorm ? null : { id: 'email-setting', icon: 'fa-envelope', labelKey: 'email', emoji: true },
    // Domains sits with E-mail: it lists the e-mail domains the users sign in
    // with, so it belongs beside the e-mail settings rather than at the end of
    // the menu, after the roles and template checkbox lists.
    { id: 'domains-setting', icon: 'fa-at', labelKey: 'domains' },
    { id: 'org-setting', icon: 'fa-globe', labelKey: 'organizations' },
    { id: 'team-setting', icon: 'fa-users', labelKey: 'teams' },
    { id: 'people-setting', icon: 'fa-user', labelKey: 'people' },
    { id: 'locked-users-setting', icon: 'fa-lock', labelKey: 'accounts-lockout-locked-users', iconWrapCls: 'text-red' },
    { id: 'roles-setting', icon: 'fa-key', labelKey: 'roles' },
    { id: 'templates-setting', icon: 'fa-clone', labelKey: 'shared-templates' },
  ];
  // Multitenancy option D (docs/Design/Multitenancy/Multitenancy.md, D.7): a
  // PER-TENANT Global Admin gets the same menu, shorter - only the panes that are
  // about their own Organization. Everything else here is instance-wide. The site
  // admin's menu is untouched, and the decision is the shared rule module, which the
  // publications and methods ask again server-side.
  if (user !== undefined && !tenantAdmin.isSiteAdmin(user)) {
    return tenantAdmin.tenantAdminPeopleMenu(items, user);
  }
  return items;
}

// The pane the page opens on: the first entry of the menu this user actually has.
// A per-tenant admin must not land on Login, which they may not open.
function firstPeoplePaneId(user) {
  const items = peopleMenu(user).filter(Boolean);
  return items.length ? items[0].id : 'people-setting';
}

// Organizations through the shared table page (docs/Features/Page/Table.md). Its
// rows are interactive - inline checkboxes and edit links - so it supplies a
// rowTemplate instead of a text-cell spec, and three of its headers carry a
// select-all pair, supplied as headerTemplate. Everything else - the layout, the
// pager, the search, the total - comes from the shared page.
// Teams: same shape as Organizations - interactive rows, three headers carrying
// a select-all pair. Same two slots (docs/Features/Page/Table.md).
// People: interactive rows again, and two of its headers are templates - the
// new-user row and the select-all checkbox (docs/Features/Page/Table.md).
// One page of users: the ones the server put on this page, in its order.
//
// The 'people' publication applies limit/skip sorted createdAt:-1 server-side, so
// this must NOT re-slice - that paginated an already-paginated set. But it must not
// read the page back with a bare `Users.find(query)` either: minimongo holds user
// documents this page has nothing to do with - above all the logged-in user's own
// record, which accounts publishes and which therefore matched on EVERY page, so
// the admin looking at the list saw themselves on all 578 of them (and anyone else
// another subscription had pulled in could show up twice).
//
// `getPeoplePageIds` names the page; the documents still come from the publication.
// An id whose document has not arrived yet is simply not rendered yet.
function peopleDocs(tpl) {
  const ids = tpl.peoplePageIds.get();
  if (!ids.length) return [];
  const docs = Users.find({ _id: { $in: ids } }, {
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
  // The server's order, not minimongo's: `$in` does not preserve it.
  return docsByIds(ids, docs);
}

const PEOPLE_COLUMNS = [
  { headerTemplate: 'newUserRow' },
  { labelKey: 'username' },
  { labelKey: 'email' },
  { labelKey: 'admin' },
  { labelKey: 'active-person' },
  { labelKey: 'location' },
  { labelKey: 'accounts-lockout-status' },
  { labelKey: 'createdAt' },
  { headerTemplate: 'selectAllUser' },
];

const LOGIN_LOCATION_COLUMNS = [
  { labelKey: 'office-location', value: row => row.city },
  { labelKey: 'event-ipv4', nowrap: true, value: row => row.ipv4 },
  { labelKey: 'event-ipv6', nowrap: true, value: row => row.ipv6 },
  { labelKey: 'office-first-seen', nowrap: true,
    value: row => (row.firstAt ? new Date(row.firstAt).toLocaleString() : '') },
  { labelKey: 'office-last-seen', nowrap: true,
    value: row => (row.at ? new Date(row.at).toLocaleString() : '') },
];

const TEAM_COLUMNS = [
  { headerTemplate: 'newTeamRow' },
  { labelKey: 'displayName' },
  { labelKey: 'description' },
  { labelKey: 'shortName' },
  { labelKey: 'website' },
  { labelKey: 'createdAt' },
  { labelKey: 'active-team' },
  { headerTemplate: 'teamFeatureHeader',
    headerData: { labelKey: 'team-shared-templates', feature: 'teamSharedTemplates' } },
  { headerTemplate: 'teamFeatureHeader',
    headerData: { labelKey: 'team-propagate-members-to-boards', feature: 'teamPropagateMembersToBoards' } },
  { headerTemplate: 'teamFeatureHeader',
    headerData: { labelKey: 'team-sync-members-from-auth', feature: 'teamSyncMembersFromAuth' } },
];

const ORG_COLUMNS = [
  { headerTemplate: 'newOrgRow' },
  { labelKey: 'displayName' },
  { labelKey: 'description' },
  { labelKey: 'shortName' },
  { labelKey: 'website' },
  { labelKey: 'createdAt' },
  { labelKey: 'active-org' },
  { headerTemplate: 'orgFeatureHeader',
    headerData: { labelKey: 'org-shared-templates', feature: 'orgSharedTemplates' } },
  { headerTemplate: 'orgFeatureHeader',
    headerData: { labelKey: 'org-propagate-members-to-boards', feature: 'orgPropagateMembersToBoards' } },
  { headerTemplate: 'orgFeatureHeader',
    headerData: { labelKey: 'org-sync-members-from-auth', feature: 'orgSyncMembersFromAuth' } },
];

Template.people.helpers({
  peopleTablePageData() {
    const tpl = Template.instance();
    const users = peopleDocs(tpl);
    const total = tpl.numberPeople.get() || 0;
    const totalPages = Math.max(1, Math.ceil(total / usersPerPage));
    return {
      // No titleKey: the pane heading is rendered once for every Admin Panel pane
      // from the open menu entry (docs/Features/Page/Left-Menu.md), so a title here
      // would print the same words a second time.
      emptyKey: 'no-items-message',
      searchTerm: tpl.peopleSearchTerm.get(),
      // The filter, the two actions and the total were this pane's own markup in
      // the page header. They are controls-row features of the shared design now -
      // added to it FROM here - so the pane just declares them.
      filters: buildFilters([{
        id: 'user',
        labelKey: 'admin-people-filter-show',
        options: [
          { value: 'all', labelKey: 'admin-people-filter-all' },
          { value: 'locked', labelKey: 'admin-people-filter-locked' },
          { value: 'active', labelKey: 'admin-people-filter-active' },
          { value: 'inactive', labelKey: 'admin-people-filter-inactive' },
          { value: 'admin', label: 'Admin' },
        ],
      }], tpl.userFilterType.get()),
      // No per-action class: both buttons are sized and themed by the shared
      // controls row. The old `unlock-all-btn` carried a 20px top margin and a
      // 28px height from the hand-written page header, which left "Unlock all
      // users" lower and shorter than "Teams" beside it.
      actions: buildActions([
        { id: 'unlock-all', icon: 'fa-unlock', labelKey: 'accounts-lockout-unlock-all' },
        { id: 'add-remove-teams', icon: 'fa-pencil-square-o', labelKey: 'teams' },
      ]),
      header: buildHeader(PEOPLE_COLUMNS),
      rowTemplate: 'peopleRow',
      docs: users.map(user => ({
        user,
        countries: (tpl.peopleLoginLocations.get()[user._id] || {}).countries || [],
      })),
      rowCount: users.length,
      page: tpl.peoplePage.get(),
      totalPages,
      hasPrev: tpl.peoplePage.get() > 1,
      hasNext: tpl.peoplePage.get() < totalPages,
      total,
      totalLabelKey: 'people-number',
    };
  },
  teamTablePageData() {
    const tpl = Template.instance();
    const teams = ReactiveCache.getTeams(tpl.findTeamsOptions.get(), {
      sort: { createdAt: -1 },
    });
    const total = tpl.numberTeams.get() || 0;
    const totalPages = Math.max(1, Math.ceil(total / teamsPerPage));
    return {
      // No titleKey: the pane heading is rendered once for every Admin Panel pane
      // from the open menu entry (docs/Features/Page/Left-Menu.md), so a title here
      // would print the same words a second time.
      searchTerm: tpl.teamSearchTerm.get(),
      emptyKey: 'no-items-message',
      header: buildHeader(TEAM_COLUMNS),
      rowTemplate: 'teamRow',
      docs: teams.map(team => ({ team })),
      rowCount: teams.length,
      page: tpl.teamPage.get(),
      totalPages,
      hasPrev: tpl.teamPage.get() > 1,
      hasNext: tpl.teamPage.get() < totalPages,
      total,
      totalLabelKey: 'team-number',
    };
  },
  orgTablePageData() {
    const tpl = Template.instance();
    // The 'org' publication already returns only the current page (server-side
    // limit/skip, sorted createdAt:-1), so display exactly what it published.
    const orgs = ReactiveCache.getOrgs(tpl.findOrgsOptions.get(), {
      sort: { createdAt: -1 },
    });
    const total = tpl.numberOrgs.get() || 0;
    const totalPages = Math.max(1, Math.ceil(total / orgsPerPage));
    return {
      // No titleKey: the pane heading is rendered once for every Admin Panel pane
      // from the open menu entry (docs/Features/Page/Left-Menu.md), so a title here
      // would print the same words a second time.
      searchTerm: tpl.orgSearchTerm.get(),
      emptyKey: 'no-items-message',
      header: buildHeader(ORG_COLUMNS),
      // Interactive rows: orgRow owns its <tr>, and takes { org } as its context.
      rowTemplate: 'orgRow',
      docs: orgs.map(org => ({ org })),
      rowCount: orgs.length,
      page: tpl.orgPage.get(),
      totalPages,
      hasPrev: tpl.orgPage.get() > 1,
      hasNext: tpl.orgPage.get() < totalPages,
      total,
      totalLabelKey: 'org-number',
    };
  },
  menuItems() {
    return leftMenuData(peopleMenu(ReactiveCache.getCurrentUser()),
      Template.instance().activeMenuId.get());
  },
  loginLocationReportOpen() {
    return !!Template.instance().loginLocationReport.get();
  },
  loginLocationMenuItems() {
    const tpl = Template.instance();
    const report = tpl.loginLocationReport.get();
    const items = (report && report.countries || []).map(country => ({
      id: `login-country-${country.country}`,
      icon: 'fa-map-marker',
      label: `${country.flag} ${country.country} (${country.count})`,
    }));
    return leftMenuData(items, `login-country-${tpl.loginLocationCountry.get()}`);
  },
  loginLocationPaneTitle() {
    const tpl = Template.instance();
    const report = tpl.loginLocationReport.get();
    const country = report && report.countries.find(
      item => item.country === tpl.loginLocationCountry.get());
    return { label: report && country
      ? `${report.username} — ${country.flag} ${country.country}` : '' };
  },
  loginLocationTablePageData() {
    const tpl = Template.instance();
    const report = tpl.loginLocationReport.get();
    const country = report && report.countries.find(
      item => item.country === tpl.loginLocationCountry.get());
    const term = tpl.loginLocationSearch.get().trim().toLowerCase();
    const all = (country && country.rows || []).filter(row => !term
      || [row.city, row.ipv4, row.ipv6].some(value =>
        String(value || '').toLowerCase().includes(term)));
    const info = pageInfo(all.length, tpl.loginLocationPage.get());
    const pageRows = all.slice((info.page - 1) * TABLE_PAGE_ROWS_PER_PAGE,
      info.page * TABLE_PAGE_ROWS_PER_PAGE);
    return {
      searchTerm: tpl.loginLocationSearch.get(),
      actions: buildActions([{ id: 'back-from-login-locations', icon: 'fa-arrow-left',
        labelKey: 'back' }]),
      emptyKey: 'no-items-message',
      header: buildHeader(LOGIN_LOCATION_COLUMNS),
      rows: buildRows(pageRows, LOGIN_LOCATION_COLUMNS),
      rowCount: pageRows.length,
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
      total: all.length,
    };
  },
  // The heading above the pane: the open menu entry's own label
  // (docs/Features/Page/Left-Menu.md). Every Admin Panel page renders one, so no pane
  // has to write a title of its own - and the table panes stopped passing a
  // titleKey to the shared table page, which would have printed it a second time.
  paneTitleData() {
    return paneTitle(peopleMenu(ReactiveCache.getCurrentUser()),
      Template.instance().activeMenuId.get());
  },
  loading() {
    return Template.instance().loading;
  },
  registrationSetting() {
    return Template.instance().registrationSetting;
  },
  emailSetting() {
    return Template.instance().emailSetting;
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
    return peopleDocs(Template.instance());
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

// #6116: one restriction per kind, each in the pane it is about. They were one
// checkbox ("same Organization OR Team") in the Login pane, which is where neither
// of the two things it restricts lives.
//
// Registered on the template the checkbox is IN - orgGeneral / teamGeneral, not the
// People page around them - because Blaze delivers an event to the handlers of that
// template. Writing on click, like every other checkbox in the Admin Panel: there is
// no Save button in these panes to confirm it with.
Template.orgGeneral.events({
  'click a.js-toggle-board-members-same-org'() {
    const setting = ReactiveCache.getCurrentSetting();
    if (!setting) return;
    Settings.update(setting._id, {
      $set: { boardMembersFromSameOrgOnly: !setting.boardMembersFromSameOrgOnly },
    });
  },
});

Template.teamGeneral.events({
  'click a.js-toggle-board-members-same-team'() {
    const setting = ReactiveCache.getCurrentSetting();
    if (!setting) return;
    Settings.update(setting._id, {
      $set: { boardMembersFromSameTeamOnly: !setting.boardMembersFromSameTeamOnly },
    });
  },
});

// Paging state for the active People subpage, including the location drill-down.
function activePeoplePager(tpl) {
  if (tpl.loginLocationReport.get()) {
    const report = tpl.loginLocationReport.get();
    const country = report.countries.find(
      item => item.country === tpl.loginLocationCountry.get());
    return {
      page: tpl.loginLocationPage,
      total: (country && country.rows.length) || 0,
      perPage: TABLE_PAGE_ROWS_PER_PAGE,
    };
  }
  return {
    'org-setting': { page: tpl.orgPage, total: tpl.numberOrgs.get(), perPage: orgsPerPage },
    'team-setting': { page: tpl.teamPage, total: tpl.numberTeams.get(), perPage: teamsPerPage },
    'people-setting': { page: tpl.peoplePage, total: tpl.numberPeople.get(), perPage: usersPerPage },
  }[tpl.activeMenuId.get()];
}

function moveActivePeoplePage(tpl, direction) {
  const pager = activePeoplePager(tpl);
  if (!pager) return;
  pager.page.set(adjacentPage(pager.total, pager.page.get(), direction, pager.perPage));
}

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

  // Search, filter and the two actions come from the shared controls row now.
  // Scoped to the open pane, like the pager: every People pane renders inside this
  // one template and they all carry the same classes.
  'keydown .js-table-page-search'(event, tpl) {
    if (event.keyCode !== 13 || event.shiftKey) return;
    const value = $(event.currentTarget).val() || '';
    if (tpl.loginLocationReport.get()) {
      event.preventDefault();
      tpl.loginLocationSearch.set(value);
      tpl.loginLocationPage.set(1);
      return;
    }
    // One search box, three panes. They all render inside this template and carry
    // the same class, so the open pane decides what the box searches - the same way
    // the pager and the filters are scoped.
    switch (tpl.activeMenuId.get()) {
      case 'people-setting':
        event.preventDefault();
        tpl.peopleSearchTerm.set(value);
        tpl.filterPeople();
        break;
      case 'org-setting':
        event.preventDefault();
        tpl.orgSearchTerm.set(value);
        tpl.filterOrg();
        break;
      case 'team-setting':
        event.preventDefault();
        tpl.teamSearchTerm.set(value);
        tpl.filterTeam();
        break;
      default:
        break;
    }
  },
  'change .js-table-page-filter'(event, tpl) {
    if (tpl.activeMenuId.get() !== 'people-setting') return;
    tpl.userFilterType.set($(event.currentTarget).val());
    tpl.filterPeople();
  },
  'click .js-table-page-action'(event, tpl) {
    if (tpl.activeMenuId.get() !== 'people-setting') return;
    const action = event.currentTarget.getAttribute('data-action');
    if (action === 'back-from-login-locations') {
      event.preventDefault();
      tpl.loginLocationReport.set(null);
      tpl.loginLocationCountry.set('');
      return;
    }
    event.preventDefault();
    if (action === 'add-remove-teams') {
      document.getElementById('divAddOrRemoveTeamContainer').style.display = 'block';
    } else if (action === 'unlock-all') {
      tpl.unlockAllUsers();
    }
  },

  // #4737/#5850: select-all / unselect-all for a team feature column.
  'click .js-team-feature-all'(event) {
    event.preventDefault();
    const field = event.currentTarget.getAttribute('data-feature');
    const value = event.currentTarget.getAttribute('data-value') === 'true';
    Meteor.call('setAllTeamsFeature', field, value);
  },
  // Every People pane renders inside THIS template, and the shared table page
  // gives them all the same control classes - so one handler serves them all and
  // switches on the pane that is open. A separate handler per pane is impossible
  // here anyway: they would be duplicate keys in one event map.
  //
  // Teams gains a working PREV in the process: it had a prev button in its old
  // markup and no handler behind it, so paging back was silently dead.
  'click .js-table-page-prev'(event, tpl) {
    event.preventDefault();
    moveActivePeoplePage(tpl, -1);
  },
  'click .js-table-page-next'(event, tpl) {
    event.preventDefault();
    moveActivePeoplePage(tpl, 1);
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
  // One handler for the whole menu: the shared left menu puts the pane id in
  // data-id, so the seven near-identical per-entry handlers collapsed to this.
  // The per-pane extras (reset to page 1, refresh that pane's total) stay.
  'click .js-left-menu-item'(event, tpl) {
    const targetID = $(event.currentTarget).data('id');
    if (tpl.loginLocationReport.get() && String(targetID).startsWith('login-country-')) {
      event.preventDefault();
      tpl.loginLocationCountry.set(String(targetID).slice('login-country-'.length));
      tpl.loginLocationSearch.set('');
      tpl.loginLocationPage.set(1);
      return;
    }
    tpl.switchMenu(event);
    // ...and into the address bar, so the pane can be linked and bookmarked.
    const path = adminPath('people', targetID);
    if (path && FlowRouter.current().path !== path) FlowRouter.go(path);
    if (targetID === 'org-setting') {
      tpl.orgPage.set(1);
      tpl.refreshOrgsCount();
    } else if (targetID === 'team-setting') {
      tpl.teamPage.set(1);
      tpl.refreshTeamsCount();
    } else if (targetID === 'people-setting') {
      tpl.peoplePage.set(1);
      tpl.refreshUsersCount();
    }
  },
});

Template.rolesGeneral.onCreated(function () {
  // Working copy of the allowed-roles set; null until the published doc loads.
  this.workingRoles = new ReactiveVar(null);
  // Roles Status: the shared table page's search term and page. There are nine
  // roles and no server paging - the set is a constant of the code, not data -
  // but the shared controls row is part of the design, so they work.
  this.statusSearch = new ReactiveVar('');
  this.statusPage = new ReactiveVar(1);
  this.autorun(() => {
    if (this.workingRoles.get() === null) {
      const doc = InviteToBoardRolesSettings.findOne(INVITE_TO_BOARD_ROLES_ID);
      if (doc) {
        this.workingRoles.set((doc.allowedRoles || []).slice());
      }
    }
  });
});

// ── Roles Status ────────────────────────────────────────────────────────────
//
// The read-only table under the Save button: what each board role may do. Its
// rows come from models/lib/boardRoleCapabilities.js — the same table the server
// allow rules and the client's canModify* helpers decide with — so this pane
// cannot show a permission the code does not enforce.
//
// Every string is a translation key, including the Yes/No of each cell: the
// values are booleans, and a hard-coded "Yes" would be English on every one of
// WeKan's languages.
//
// The "Invite to board" column is the one thing here that is a SETTING rather
// than a capability, and it reads the pane's WORKING copy — the checkboxes above
// the Save button — not the saved document. That is deliberate: the table is
// there to show what the checkboxes mean, so it has to follow them as they are
// ticked, before saving.
const ROLES_STATUS_COLUMNS = [
  { labelKey: 'roles-status-role', value: doc => TAPi18n.__(doc.roleKey) },
  { labelKey: 'roles-status-invite', value: doc => yesNo(doc.invite) },
  {
    labelKey: 'roles-status-sees',
    value: doc =>
      TAPi18n.__(doc.seesAllCards ? 'roles-status-sees-all' : 'roles-status-sees-assigned'),
  },
  { labelKey: 'roles-status-comment', value: doc => yesNo(doc.comment) },
  { labelKey: 'roles-status-write', value: doc => yesNo(doc.write) },
  { labelKey: 'roles-status-manage', value: doc => yesNo(doc.manageBoard) },
];

function yesNo(value) {
  return TAPi18n.__(value ? 'yes' : 'no');
}

Template.rolesGeneral.helpers({
  // The shared table page's data context (docs/Features/Page/Table.md).
  rolesStatusTable() {
    const tpl = Template.instance();
    const working = tpl.workingRoles.get() || [];
    const term = (tpl.statusSearch.get() || '').trim().toLowerCase();

    const all = BOARD_ROLES.map(roleKey => ({
      _id: roleKey,
      roleKey,
      // Only the roles offered for invitation carry the setting; the rest are
      // not part of that list at all, so they read as not invitable rather than
      // as "unticked".
      invite: INVITE_TO_BOARD_ROLES.includes(roleKey) && working.includes(roleKey),
      ...ROLE_CAPABILITIES[roleKey],
    }));

    // The shared controls row always renders a search box, so it searches -
    // on the role's TRANSLATED name, which is what the reader sees.
    const docs = term
      ? all.filter(doc => TAPi18n.__(doc.roleKey).toLowerCase().includes(term))
      : all;

    const info = pageInfo(docs.length, tpl.statusPage.get());
    const page = docs.slice(info.skip, info.skip + TABLE_PAGE_ROWS_PER_PAGE);

    return {
      titleKey: 'roles-status',
      descKey: 'roles-status-desc',
      header: buildHeader(ROLES_STATUS_COLUMNS),
      rows: buildRows(page, ROLES_STATUS_COLUMNS),
      rowCount: page.length,
      total: docs.length,
      searchTerm: tpl.statusSearch.get(),
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
      emptyKey: 'roles-status-empty',
    };
  },

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

  // Roles Status controls. The table is read-only, so these are the only
  // interactions it has: search on Enter (like every other table page) and the
  // pager. No row is clickable and no cell is editable — a role's capabilities
  // are a property of the code, not a setting.
  'keydown .js-table-page-search'(event, tpl) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    tpl.statusSearch.set(event.currentTarget.value || '');
    tpl.statusPage.set(1);
  },
  'click .js-table-page-prev'(event, tpl) {
    event.preventDefault();
    tpl.statusPage.set(Math.max(1, tpl.statusPage.get() - 1));
  },
  'click .js-table-page-next'(event, tpl) {
    event.preventDefault();
    tpl.statusPage.set(tpl.statusPage.get() + 1);
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
  loginCountries() {
    const userId = this.user && this.user._id;
    return (this.countries || []).map(country => ({ ...country, userId }));
  },
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
    // GHSA-rf3w-rj48-jxcc moved the lockout to one counter per (user, source
    // address). This read the flat field that fix removed, so every account
    // showed as unlocked; models/lib/accountLockout.js knows the shape now.
    return lockoutIsUserLocked(user);
  }
});

// Initialize filter dropdown
Template.people.rendered = function() {
  const template = this;

  // The filter is rendered by the shared controls row from userFilterType, so
  // reset the STATE - there is no #userFilterSelect to poke at any more.
  template.userFilterType.set('all');
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
  'click .js-open-login-country'(event) {
    event.preventDefault();
    if (activePeopleTemplate) {
      activePeopleTemplate.openLoginLocationReport(
        event.currentTarget.getAttribute('data-user-id'),
        event.currentTarget.getAttribute('data-country'));
    }
  },
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
      const isLocked = lockoutIsUserLocked(user);

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

    // Multitenancy option D (docs/Design/Multitenancy/Multitenancy.md, D.2/D.9):
    // the hostnames this Organization is served on and the branding that replaces
    // the instance branding on them. A separate method because a per-tenant Global
    // Admin may save THESE for their own org while setOrgAllFields stays what it
    // was - and because claiming a host another org already claims must be refused
    // with the host named, not saved silently.
    const tenantFields = {};
    let tenantChanged = false;
    TENANT_ORG_FIELDS.forEach(field => {
      const input = templateInstance.find(`.js-${field}`);
      if (!input) return;
      const value = input.value.trim();
      tenantFields[field] = value;
      if (value !== (org[field] || '')) tenantChanged = true;
    });
    if (tenantChanged) {
      Meteor.call('setOrgTenantFields', org._id, tenantFields, error => {
        if (error && error.error === 'tenant-domain-taken') {
          // The popup is already closing; the message names the host that clashed.
          alert(`${TAPi18n.__('error-org-domain-taken')} ${error.reason || ''}`.trim());
        }
      });
    }

    Popup.back();
  },
});

// Multitenancy option D: the ⋯ menu of an Organization row opens its per-tenant
// Global Admins. Reuses the popup machinery every other row action uses.
Template.orgAdminsPopup.onCreated(function () {
  this.members = new ReactiveVar([]);
  this.loading = new ReactiveVar(true);
  this.error = new ReactiveVar('');
  // The popup is opened from orgRow / settingsOrgPopup with `{ org }` as its data
  // context, the same way editOrgPopup gets it (#6411).
  const data = Template.currentData() || {};
  this.orgId = (data.org && data.org._id) || data.orgId || '';
  this.reload = () => {
    if (!this.orgId) {
      this.loading.set(false);
      return;
    }
    Meteor.call('listOrgMembers', this.orgId, (error, members) => {
      this.loading.set(false);
      if (error) {
        this.error.set(error.reason || error.message);
        return;
      }
      this.members.set(members || []);
    });
  };
  this.reload();
});

Template.orgAdminsPopup.helpers({
  members() {
    return Template.instance().members.get();
  },
  loading() {
    return Template.instance().loading;
  },
  error() {
    return Template.instance().error;
  },
});

Template.orgAdminsPopup.events({
  'click .js-toggle-org-admin'(event, templateInstance) {
    event.preventDefault();
    const userId = $(event.currentTarget).data('user-id');
    const member = templateInstance.members.get().find(m => m._id === userId);
    if (!member) return;
    const value = !member.isOrgAdmin;
    Meteor.call('setOrgAdmin', templateInstance.orgId, userId, value, error => {
      if (error) {
        templateInstance.error.set(error.reason || error.message);
        return;
      }
      templateInstance.error.set('');
      // Re-read rather than patching the local copy: the server is what decides,
      // and it may have refused a site admin or a non-member.
      templateInstance.reload();
    });
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

    // An imported (placeholder) user, and some SSO users, have NO `emails` array at
    // all, so `user.emails[0]` threw "Cannot read properties of undefined (reading
    // '0')" when an admin gave such a user an email in Admin Panel / People (#6508).
    // Read the primary email defensively (missing array OR empty array).
    const primaryEmail =
      Array.isArray(user.emails) && user.emails.length ? user.emails[0] : null;
    const isChangeEmailVerified =
      verified !== (primaryEmail ? primaryEmail.verified : undefined);

    // If no email was set before, allow adding one (compare against `false`).
    const isChangeEmail =
      email.toLowerCase() !==
      (primaryEmail ? primaryEmail.address.toLowerCase() : false);

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
          // The new user belongs on the first page (the list is newest first), so
          // the table has to ask which users that page holds now.
          peopleListChanged();
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
  'click .js-org-admins': Popup.open('orgAdmins'),
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

    // #6536: without an id this called the server with `undefined`, which arrives
    // as null and fails `check(userId, String)` - the user saw nothing happen and
    // the log said "Match error: Expected string, got null", which names neither
    // the method's purpose nor the missing id. Nothing to impersonate, nothing to
    // ask the server.
    if (!userId) {
      // eslint-disable-next-line no-console
      console.error('Impersonate: no user id in the popup context; not calling the server.');
      return;
    }

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
        // One row fewer: which users this page holds has changed.
        peopleListChanged();
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

// Domains renders through the shared table page (docs/Features/Page/Table.md):
// one column spec instead of its own controls row, pagination markup and table.
const DOMAIN_COLUMNS = [
  { labelKey: "domain", value: d => d.domain },
  { labelKey: "domain-user-count", align: "end", value: d => d.count },
];

Template.domainGeneral.helpers({
  tablePageData() {
    const tpl = Template.instance();
    const data = tpl.pageData.get();
    const rows = data.rows || [];
    // The server already returns one page, so pageInfo only computes the window
    // for the counter - the rows are displayed as published.
    const info = pageInfo(data.total || 0, tpl.page.get());
    return {
      // No titleKey: the pane heading is rendered once for every Admin Panel pane
      // from the open menu entry (docs/Features/Page/Left-Menu.md), so a title here
      // would print the same words a second time.
      emptyKey: "no-items-message",
      searchTerm: tpl.searchQuery.get(),
      header: buildHeader(DOMAIN_COLUMNS),
      rows: buildRows(rows, DOMAIN_COLUMNS),
      rowCount: rows.length,
      page: tpl.page.get(),
      totalPages: data.totalPages || 1,
      hasPrev: tpl.page.get() > 1,
      hasNext: tpl.page.get() < (data.totalPages || 1),
      total: data.total || 0,
      totalLabelKey: "domains",
    };
  },
});

Template.domainGeneral.events({
  // Shared control classes, so this pane needs no markup or CSS of its own. The
  // old separate Search button is gone: every table page searches on Enter.
  "keydown .js-table-page-search"(event, tpl) {
    if (event.keyCode === 13) {
      event.preventDefault();
      tpl.searchQuery.set(tpl.$(".js-table-page-search").val() || "");
      tpl.page.set(1);
    }
  },
  "click .js-table-page-prev"(event, tpl) {
    event.preventDefault();
    const current = tpl.page.get();
    if (current > 1) tpl.page.set(current - 1);
  },
  "click .js-table-page-next"(event, tpl) {
    event.preventDefault();
    const current = tpl.page.get();
    if (current < (tpl.pageData.get().totalPages || 1)) tpl.page.set(current + 1);
  },
});
