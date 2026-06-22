'use strict';

const http = require('http');
const { chromium } = require('@playwright/test');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

// Warm-up budget. The first browser load of a cold WeKan server has to compile
// and serve the large client bundle and spin up publications, which can take far
// longer than a single spec's waitForMeteor timeout — so the early specs (and the
// slower Firefox/WebKit runs) were timing out in CI before the app was ready.
// We pay that cost once here so every spec starts against a warm server.
const WARMUP_TOTAL_MS = Number(process.env.WEKAN_WARMUP_MS || 180000); // 3 min
const WARMUP_PER_TRY_MS = 60000;

module.exports = async function globalSetup() {
  // 1) Server must at least be serving HTTP, otherwise skip the whole suite
  //    (matches the previous behaviour for local "app not running" runs).
  const running = await new Promise(resolve => {
    http.get(BASE_URL, () => resolve(true)).on('error', () => resolve(false));
  });
  if (!running) {
    console.log(`\n[playwright] SKIP: WeKan is not running at ${BASE_URL}\n`);
    process.exit(0);
  }

  // 2) Browser-level warm-up: load the app until the Meteor client global is
  //    available, so the cold-start cost is paid once instead of failing the
  //    first specs. Best-effort — never fail the whole run from here; if the app
  //    genuinely never becomes ready the individual specs will report it.
  const deadline = Date.now() + WARMUP_TOTAL_MS;
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    let ready = false;
    let attempt = 0;
    while (!ready && Date.now() < deadline) {
      attempt += 1;
      try {
        await page.goto(BASE_URL, { waitUntil: 'commit', timeout: WARMUP_PER_TRY_MS });
        await page.waitForFunction(
          () => typeof Meteor !== 'undefined' && typeof Meteor.subscribe !== 'undefined',
          { timeout: Math.min(WARMUP_PER_TRY_MS, Math.max(5000, deadline - Date.now())) },
        );
        ready = true;
      } catch (e) {
        console.log(`[playwright] warm-up attempt ${attempt} not ready yet: ${String(e.message || e).split('\n')[0]}`);
        await page.waitForTimeout(2000).catch(() => {});
      }
    }
    if (ready) {
      console.log(`[playwright] WeKan warmed up: Meteor available after ${attempt} attempt(s).`);
    } else {
      console.log('[playwright] WARNING: warm-up did not see Meteor in time; running specs anyway.');
    }
  } catch (e) {
    console.log(`[playwright] warm-up skipped (browser launch failed): ${String(e.message || e).split('\n')[0]}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
};
