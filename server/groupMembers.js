// #802: All Boards organization and team tabs - who is in a group, and its
// admins adding and removing members (models/lib/groupMembers.js).
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Org from '/models/org';
import Team from '/models/team';

const { KINDS, groupAccess, addModifier, removeModifier } = require('/models/lib/groupMembers');

async function load(userId, kind, id) {
  if (!userId || !KINDS[kind]) throw new Meteor.Error('not-authorized');
  const group = await (kind === 'org' ? Org : Team).findOneAsync(id);
  const user = await Meteor.users.findOneAsync(userId, { fields: { orgs: 1, teams: 1, isAdmin: 1 } });
  return { group, user, access: groupAccess(user, kind, group) };
}

Meteor.methods({
  async groupMembers(kind, id) {
    check(kind, String);
    check(id, String);
    const { access } = await load(this.userId, kind, id);
    if (access === 'none') throw new Meteor.Error('not-authorized');
    const k = KINDS[kind];
    const members = await Meteor.users.find({ [`${k.list}.${k.idKey}`]: id }, { fields: { username: 1, 'profile.fullname': 1, [k.list]: 1 }, sort: { username: 1 }, limit: 1000 })
      .fetchAsync();
    return { canManage: access === 'manage', members: members.map(u => ({ _id: u._id, username: u.username,
      fullname: (u.profile || {}).fullname || '', isAdmin: !!(u[k.list] || []).find(m => m && m[k.idKey] === id && m.isAdmin) })) };
  },

  async addGroupMember(kind, id, username) {
    check(kind, String);
    check(id, String);
    check(username, String);
    const { group, access } = await load(this.userId, kind, id);
    if (access !== 'manage') throw new Meteor.Error('not-authorized');
    const target = await Meteor.users.findOneAsync({ username: username.trim() }, { fields: { orgs: 1, teams: 1 } });
    if (!target) throw new Meteor.Error('user-not-found');
    const modifier = addModifier(target, kind, group);
    if (modifier) await Meteor.users.updateAsync(target._id, modifier);
    return true;
  },

  async removeGroupMember(kind, id, userId) {
    check(kind, String);
    check(id, String);
    check(userId, String);
    const { group, access } = await load(this.userId, kind, id);
    if (access !== 'manage') throw new Meteor.Error('not-authorized');
    const target = await Meteor.users.findOneAsync(userId, { fields: { orgs: 1, teams: 1 } });
    const modifier = target && removeModifier(target, kind, group);
    if (modifier) await Meteor.users.updateAsync(target._id, modifier);
    return true;
  },
});

for (const name of ['groupMembers', 'addGroupMember', 'removeGroupMember']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 20, 10000);
}
