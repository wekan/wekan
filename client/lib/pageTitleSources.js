import { ReactiveCache } from '/imports/reactiveCache';
import { Session } from 'meteor/session';
import { TAPi18n } from '/imports/i18n';
import AccessibilitySettings from '/models/accessibilitySettings';

// The three pages that carry a name of their own: an admin can rename Support
// and Accessibility, and Import names the source it is importing from.
//
// They live HERE, not in the pages themselves, because the top header bar has
// to ask for them and the header is loaded by the layout - that is, very early.
// Importing a page's own module from the header pulls that module into the
// header's graph and runs it before its .jade has registered, so
// `Template.import.onCreated` was `undefined.onCreated`: a TypeError at module
// load, which aborts every module after it. That is why `connectionMethod` and
// the rest went missing at the same time.
//
// This module registers no template and touches no DOM, so it is safe to load
// at any point. models/lib/pageTitles.js, docs/Features/Page/Header.md

export function supportPageTitle() {
  const setting = ReactiveCache.getCurrentSetting();
  return (setting && setting.supportTitle) || '';
}

export function accessibilityPageTitle() {
  const setting = AccessibilitySettings.findOne({});
  return (setting && setting.title) || '';
}

const IMPORT_SOURCE_NAMES = {
  trello: 'Trello',
  wekan: 'JSON',
  csv: 'CSV-TSV',
  excel: 'Excel',
  jira: 'Jira',
  kanboard: 'Kanboard',
  deck: 'NextCloud Deck',
  openproject: 'OpenProject',
  github: 'GitHub',
  gitlab: 'GitLab',
  gitea: 'Gitea',
  forgejo: 'Forgejo',
  asana: 'Asana',
  zenkit: 'Zenkit',
};

export function importPageTitle() {
  const sourceName = IMPORT_SOURCE_NAMES[Session.get('importSource')] || 'JSON';
  return `${TAPi18n.__('import')} / ${sourceName}`;
}
