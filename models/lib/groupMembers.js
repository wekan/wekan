'use strict';

// #802: a tab per organization and team in All Boards, where their admins
// manage members. A member of an organization or team sees its tab - the
// boards shared with it and who is in it; its admins (`orgs.$.isAdmin` /
// `teams.$.isAdmin` on the admin's own membership) and site admins add and
// remove members there. A group whose membership comes from the sign-in
// provider (LDAP and other directory sync, orgSyncMembersFromAuth /
// teamSyncMembersFromAuth) is shown read-only: WeKan reads directory groups
// and never writes them back. Pure: tests/groupMembers.test.cjs.

const KINDS = Object.freeze({
  org: { list: 'orgs', idKey: 'orgId', nameKey: 'orgDisplayName', syncKey: 'orgSyncMembersFromAuth' },
  team: { list: 'teams', idKey: 'teamId', nameKey: 'teamDisplayName', syncKey: 'teamSyncMembersFromAuth' },
});

function membership(user, kind, id) {
  const k = KINDS[kind];
  return k && user ? (Array.isArray(user[k.list]) ? user[k.list] : []).find(m => m && m[k.idKey] === id) || null : null;
}

// What `user` may do with group `group` of `kind`: 'manage', 'view' or 'none'.
function groupAccess(user, kind, group) {
  if (!KINDS[kind] || !user || !group) return 'none';
  const mine = membership(user, kind, group._id);
  const synced = group[KINDS[kind].syncKey] === true;
  if (!synced && (user.isAdmin === true || (mine && mine.isAdmin === true))) return 'manage';
  if (mine || user.isAdmin === true) return 'view';
  return 'none';
}

// The user update that adds them to / removes them from the group.
function addModifier(user, kind, group) {
  const k = KINDS[kind];
  if (!k || !group || membership(user, kind, group._id)) return null;
  return { $push: { [k.list]: { [k.idKey]: group._id, [k.nameKey]: group[k.nameKey] || '' } } };
}
function removeModifier(user, kind, group) {
  const k = KINDS[kind];
  if (!k || !group || !membership(user, kind, group._id)) return null;
  return { $pull: { [k.list]: { [k.idKey]: group._id } } };
}

// The groups a user belongs to, for the All Boards tabs.
function myGroups(user) {
  const out = [];
  for (const kind of Object.keys(KINDS)) {
    const k = KINDS[kind];
    for (const m of Array.isArray(user && user[k.list]) ? user[k.list] : []) {
      if (m && m[k.idKey]) out.push({ kind, id: m[k.idKey], name: m[k.nameKey] || '', isAdmin: m.isAdmin === true });
    }
  }
  return out;
}

module.exports = { KINDS, membership, groupAccess, addModifier, removeModifier, myGroups };
