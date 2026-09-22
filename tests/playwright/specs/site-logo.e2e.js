'use strict';
const {test, expect} = require('../fixtures');
const db = require('../helpers/db');
const {loginWithToken, openBoard} = require('../helpers/auth');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WHJ9S8AAAAASUVORK5CYII=';

test('custom login and board logos load without requesting stock logos', async ({page, user, board, browser}) => {
 const setting = db.findOne('settings', {});
 if (!setting) throw Error('Settings document missing');
 const previous = {
  customLoginLogoImageUrl: setting.customLoginLogoImageUrl,
  customTopLeftCornerLogoImageUrl: setting.customTopLeftCornerLogoImageUrl,
  hideLogo: setting.hideLogo,
 };
 const stockRequests = [];
 page.on('request', request => {
  if (/\/(?:wekan-logo\.svg|logo-header\.png)(?:\?|$)/.test(request.url())) {
   stockRequests.push({ url: request.url(), pageUrl: page.url() });
  }
 });
 try {
  db.updateOne('settings', {_id:setting._id}, {$set:{customLoginLogoImageUrl:PIXEL, customTopLeftCornerLogoImageUrl:PIXEL, hideLogo:false}});
  // Earlier specs change the same published setting. Let that reactive stream
  // settle in a disposable context, then inspect a fresh context's first load
  // so its asset cache cannot hide an accidental stock-logo request.
  const warmupContext = await browser.newContext();
  try {
   const warmupPage = await warmupContext.newPage();
   await warmupPage.goto(`${BASE_URL}/sign-in`, {waitUntil:'domcontentloaded'});
   await expect(warmupPage.locator('.auth-layout img[src^="data:image/png"]')).toBeVisible();
  } finally {
   await warmupContext.close();
  }
  await page.goto(`${BASE_URL}/sign-in`, {waitUntil:'domcontentloaded'});
  await expect(page.locator('.auth-layout img[src^="data:image/png"]')).toBeVisible();
  await expect(page.locator('.auth-layout img[src*="wekan-logo.svg"]')).toHaveCount(0);
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await expect(page.locator('.header-logo img[src^="data:image/png"], img.header-logo[src^="data:image/png"]')).toBeVisible();
  await expect(page.locator('.header-logo img[src*="logo-header.png"]')).toHaveCount(0);
  expect(stockRequests).toEqual([]);
 } finally {
  const $set = {}, $unset = {};
  for (const [key, value] of Object.entries(previous)) {
   if (value === undefined) $unset[key] = '';
   else $set[key] = value;
  }
  db.updateOne('settings', {_id:setting._id}, {...Object.keys($set).length && {$set}, ...Object.keys($unset).length && {$unset}});
 }
});
