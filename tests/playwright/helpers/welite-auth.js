'use strict';

const db = require('./db');

const targetsWeLite = process.env.WEKAN_PLAYWRIGHT_TARGET === 'welite';

async function openWeLiteBoard(page, user, boardId) {
  // The shared fixture starts with a Mongo resume token. Give this isolated
  // test user a password so it can authenticate through the native HTML form.
  db.updateOne('users', { _id: user.id }, {
    $set: {
      'services.password.bcrypt': '$2b$04$......................b8CYpLYfgS/XMWDCU3/.oCRJREnOf3y',
    },
  });
  await page.context().route('**/*', route => {
    const headers = { ...route.request().headers() };
    delete headers.cookie;
    return route.continue({ headers });
  });
  await page.goto('/sign-in?lang=en');
  const form = page.locator('form[method="POST"]');
  await form.locator('input[name="username"]').fill(user.username);
  await form.locator('input[name="password"]').fill('test-password');
  await form.locator('input[type="submit"]').click();
  const destination = new URL('/board', page.url());
  const session = new URL(page.url()).searchParams.get('sessionId');
  if (!session) throw new Error('Native sign-in did not return a session');
  destination.searchParams.set('id', boardId);
  destination.searchParams.set('sessionId', session);
  await page.goto(destination.href);
}

module.exports = { targetsWeLite, openWeLiteBoard };
