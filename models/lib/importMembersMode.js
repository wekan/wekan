// Who the people of an imported file become, the same for every import source.
// The import page asks once, for every source:
//
//   map         - the person importing chooses an existing WeKan user for each
//                 person of the file (the map-members step); anyone left
//                 unchosen becomes a placeholder, as below;
//   placeholder - every person of the file becomes a placeholder user: an
//                 account that cannot log in, carrying the original username
//                 and name, so the board keeps who did what, and a board
//                 admin maps it to a real user later (the default);
//   me          - every person of the file becomes the person importing.
//
// `membersMapping` ({ source person: WeKan user id }) is what every creator
// reads (this.members). For `me` it answers every person with the importing
// user - read when it is looked up, so the HTTP import routes, which run the
// creator as the user afterwards, get the right one.

export const MEMBERS_MODES = ['map', 'placeholder', 'me'];

export function membersMode(data) {
  const mode = data && data.membersMode;
  return MEMBERS_MODES.includes(mode) ? mode : 'placeholder';
}

// The mapping a creator reads. `importerId` is a function, called on lookup.
export function membersMappingFor(data, importerId) {
  const given = data && data.membersMapping && typeof data.membersMapping === 'object' && !Array.isArray(data.membersMapping)
    ? data.membersMapping : {};
  // Only string ids are mappings; anything else from a client is ignored.
  const mapping = {};
  for (const [key, value] of Object.entries(given)) {
    if (typeof value === 'string' && value && key !== '__proto__' && key !== 'constructor' && key !== 'prototype') mapping[key] = value;
  }
  if (membersMode(data) !== 'me') return mapping;
  return new Proxy(mapping, {
    get(target, key) {
      if (typeof key !== 'string' || key in Object.prototype) return target[key];
      if (Object.prototype.hasOwnProperty.call(target, key)) return target[key];
      return importerId() || undefined;
    },
    has(target, key) {
      return typeof key === 'string' ? true : key in target;
    },
  });
}

// Every person a generalized-import document names (models/kanboardCreator.js
// shape): owners, assignees, watchers and comment authors, as the keys the
// task plan maps them by (models/lib/importedTaskPlan.js), with a display name.
export function importedPeople(tasks) {
  const people = new Map();
  const add = (key, name) => {
    const id = typeof key === 'string' || typeof key === 'number' ? String(key).trim() : '';
    if (!id) return;
    const given = String(name || '').trim();
    const known = people.get(id);
    // A person seen first without a name (an owner given only as an e-mail
    // address) takes the name a later mention gives - Taiga's comment author
    // "Ann" - rather than keeping the address as their name.
    if (known) { if (given && known.name === id) known.name = given; return; }
    people.set(id, { key: id, name: given || id });
  };
  for (const task of Array.isArray(tasks) ? tasks : []) {
    if (!task || typeof task !== 'object') continue;
    add(task.owner_id || task.owner_username || task.owner_name, task.owner_name || task.owner_username);
    (Array.isArray(task.assignees) ? task.assignees : []).forEach(key => add(key));
    (Array.isArray(task.watchers) ? task.watchers : []).forEach(key => add(key));
    (Array.isArray(task.comments) ? task.comments : []).forEach(comment => comment && add(comment.author, comment.authorName));
  }
  return [...people.values()];
}
