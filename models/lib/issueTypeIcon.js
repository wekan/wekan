'use strict';

// Jira issue types as a first-class card badge (maintainer decision
// 2026-09-29): a card imported from Jira keeps its issue type in
// card.scrum.issueType (models/lib/jiraScrumMetadata.js), and the minicard now
// shows it with an icon whether or not the board uses Scrum. Kanboard
// categories stay labels.
//
// Jira lets every site name its own types, so the name is matched loosely
// (case, spaces, hyphens) against the usual ones; anything else gets a
// neutral icon and still shows its name.

const ISSUE_TYPE_ICONS = [
  { names: ['bug', 'defect', 'incident', 'problem'], icon: 'fa-bug', tone: 'red' },
  { names: ['story', 'userstory', 'requirement'], icon: 'fa-bookmark', tone: 'green' },
  { names: ['task'], icon: 'fa-check-square-o', tone: 'blue' },
  { names: ['subtask', 'technicaltask'], icon: 'fa-level-down', tone: 'blue' },
  { names: ['epic', 'initiative', 'theme'], icon: 'fa-bolt', tone: 'purple' },
  { names: ['improvement', 'enhancement', 'changerequest'], icon: 'fa-arrow-up', tone: 'green' },
  { names: ['newfeature', 'feature'], icon: 'fa-plus-square', tone: 'green' },
  { names: ['spike', 'research', 'investigation'], icon: 'fa-search', tone: 'orange' },
  { names: ['test', 'testcase', 'qa'], icon: 'fa-flask', tone: 'orange' },
];
const GENERIC = { icon: 'fa-circle-o', tone: 'grey' };

const key = name => String(name || '').toLowerCase().replace(/[\s_-]+/g, '');

// { name, icon, tone } for a card's issue type, or null when it has none.
function issueTypeBadge(issueType) {
  if (typeof issueType !== 'string') return null;
  const name = issueType.trim().slice(0, 100);
  if (!name) return null;
  const match = ISSUE_TYPE_ICONS.find(entry => entry.names.includes(key(name)));
  return { name, ...(match ? { icon: match.icon, tone: match.tone } : GENERIC) };
}

module.exports = { ISSUE_TYPE_ICONS, issueTypeBadge };
