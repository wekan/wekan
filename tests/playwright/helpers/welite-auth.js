'use strict';

const targetsWeLite = process.env.WEKAN_PLAYWRIGHT_TARGET === 'welite';

async function openWeLitePage(page, user, path) {
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
  const destination = new URL(path, page.url());
  const session = new URL(page.url()).searchParams.get('sessionId');
  if (!session) throw new Error('Native sign-in did not return a session');
  destination.searchParams.set('sessionId', session);
  await page.goto(destination.href);
}

async function openWeLiteBoard(page, user, boardId) {
  await openWeLitePage(page, user, '/board?id=' + encodeURIComponent(boardId));
}

module.exports = { targetsWeLite, openWeLiteBoard, openWeLitePage };
