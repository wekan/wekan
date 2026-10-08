import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

// #824: DEFAULT_AVATAR_URL, the avatar of a user who has not set one
// (models/lib/defaultAvatarUrl.js has the template). Environment only, as the
// maintainer asked; the browser is redirected there, the server fetches
// nothing. A user with an avatar of their own keeps it: the client asks this
// route only when profile.avatarUrl is empty.
const { defaultAvatarUrl } = require('/models/lib/defaultAvatarUrl');

const template = () => (process.env.DEFAULT_AVATAR_URL || '').trim();
Meteor.settings.public = Meteor.settings.public || {};
Meteor.settings.public.defaultAvatar = Boolean(template());

WebApp.handlers.get('/avatar-default/:userId', async (req, res) => {
  try {
    const userId = String(req.params.userId || '');
    const user = /^[A-Za-z0-9_-]{1,64}$/.test(userId)
      ? await Meteor.users.findOneAsync({ _id: userId }, { fields: { username: 1, emails: 1 } })
      : null;
    const target = user && defaultAvatarUrl(template(), user);
    if (!target) {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      res.end();
      return;
    }
    // A day: the target is derived from the username and email, which rarely change.
    res.writeHead(302, { Location: target, 'Cache-Control': 'private, max-age=86400', 'Referrer-Policy': 'no-referrer' });
    res.end();
  } catch (error) {
    res.writeHead(404);
    res.end();
  }
});
