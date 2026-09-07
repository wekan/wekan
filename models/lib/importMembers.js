'use strict';

// Pure member discovery shared by the Jade importer and the server-rendered
// baseline. This module deliberately does not query users: it describes source
// identities only, while each renderer applies its own authorized lookup.
function sourceMember(id, username, fullName = '') {
  const safeId = String(id == null ? '' : id).slice(0, 500);
  if (!safeId || ['__proto__', 'prototype', 'constructor'].includes(safeId)) return null;
  return {
    id: safeId,
    username: String(username == null ? safeId : username).slice(0, 500),
    fullName: String(fullName == null ? '' : fullName).slice(0, 1000),
  };
}

function uniqueMembers(values) {
  const seen = new Set();
  return values.filter(member => {
    if (!member || seen.has(member.id)) return false;
    seen.add(member.id);
    return true;
  }).slice(0, 2000);
}

function membersFromImport(source, data) {
  if (source === 'trello') {
    return uniqueMembers((Array.isArray(data?.members) ? data.members : []).map(member =>
      sourceMember(member?.id, member?.username, member?.fullName)));
  }
  if (source === 'wekan') {
    const users = new Map((Array.isArray(data?.users) ? data.users : [])
      .filter(user => user?._id).map(user => [String(user._id), user]));
    return uniqueMembers((Array.isArray(data?.members) ? data.members : []).map(member => {
      const id = member?.userId ?? member?.id;
      const user = users.get(String(id));
      if (!user) return null;
      return sourceMember(id, user.username, user.profile?.fullname);
    }));
  }
  if (source === 'csv') {
    if (!Array.isArray(data) || !Array.isArray(data[0])) return [];
    const memberIndex = data[0].findIndex(value => String(value).toLowerCase() === 'members');
    if (memberIndex < 0) return [];
    const names = [];
    data.slice(1).forEach(row => String(row?.[memberIndex] || '').split(/\s+/)
      .filter(Boolean).forEach(name => names.push(sourceMember(name, name))));
    return uniqueMembers(names);
  }
  if (source === 'jira') {
    const issues = Array.isArray(data) ? data : (Array.isArray(data?.issues) ? data.issues : []);
    return uniqueMembers(issues.map(issue => issue?.fields?.assignee).filter(Boolean).map(user => {
      const id = user.accountId || user.name || user.emailAddress;
      return sourceMember(id, user.name || user.displayName || id,
        user.displayName || user.name || id);
    }));
  }
  if (source === 'kanboard') {
    const tasks = Array.isArray(data) ? data : (Array.isArray(data?.tasks) ? data.tasks : []);
    return uniqueMembers(tasks.map(task => {
      const id = task?.owner_id || task?.owner_username || task?.owner_name;
      return sourceMember(id, task?.owner_username || task?.owner_name || id,
        task?.owner_name || task?.owner_username || id);
    }));
  }
  return [];
}

module.exports = { membersFromImport, sourceMember, uniqueMembers };
