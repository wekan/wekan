'use strict';

// #1297: an outgoing webhook can also send a Mattermost direct message to each
// member and assignee of the card it is about. A Mattermost incoming webhook
// posts to another channel when the message names one, and `@username` is
// that person's direct-message channel, so each one is the webhook's own
// message with `channel` set. (The webhook must not be locked to its channel
// in Mattermost.) The person who made the change is not messaged about it,
// and a WeKan user name that is not a valid Mattermost one is skipped.
// Pure: tests/mattermostDirectMessages.test.cjs.

const MATTERMOST_USERNAME = /^[a-z0-9._-]{1,64}$/i;
const MAX_MESSAGES = 50;

// The usernames to message: the card's members and assignees, once each,
// without the actor.
function directMessageUsernames({ members = [], assignees = [], actorId, usernameOf }) {
  const seen = new Set();
  const out = [];
  for (const id of [...(Array.isArray(members) ? members : []), ...(Array.isArray(assignees) ? assignees : [])]) {
    if (!id || id === actorId || seen.has(id)) continue;
    seen.add(id);
    const name = usernameOf(id);
    if (typeof name === 'string' && MATTERMOST_USERNAME.test(name)) out.push(name);
    if (out.length >= MAX_MESSAGES) break;
  }
  return out;
}

// One body per person: the webhook's message, to `@username`.
function directMessageBodies(body, usernames) {
  let message;
  try { message = JSON.parse(body); } catch (e) { return []; }
  if (!message || typeof message !== 'object' || Array.isArray(message)) return [];
  return (Array.isArray(usernames) ? usernames : []).map(name => JSON.stringify({ ...message, channel: `@${name}` }));
}

module.exports = { MAX_MESSAGES, directMessageUsernames, directMessageBodies };
