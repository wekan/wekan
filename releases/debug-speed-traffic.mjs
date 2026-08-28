import { chromium } from '../tests/playwright/node_modules/playwright/index.mjs';

const baseURL = process.env.DEBUGSPEED_URL || 'http://127.0.0.1:3000';
const clients = Math.max(1, Math.min(50, Number.parseInt(process.env.DEBUGSPEED_CLIENTS || '4', 10)));
const seconds = Math.max(5, Math.min(3600, Number.parseInt(process.env.DEBUGSPEED_SECONDS || '60', 10)));
const username = process.env.DEBUGSPEED_USERNAME || '';
const password = process.env.DEBUGSPEED_PASSWORD || '';
if (username && !password) throw new Error('DEBUGSPEED_PASSWORD is required with DEBUGSPEED_USERNAME');

async function login(page) {
  await page.goto(`${baseURL}/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.locator('#at-field-username_and_email, [name="username"], [name="at-field-username_and_email"]').first().fill(username);
  await page.locator('#at-field-password, [name="password"], input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /sign in/i }).first().click();
  await page.waitForFunction(() => typeof Meteor !== 'undefined' && !!Meteor.userId(), null, { timeout: 20000 });
}

const browser = await chromium.launch({ headless: true });
const deadline = Date.now() + seconds * 1000;
let requests = 0;
let failures = 0;

async function worker(number) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    if (username) await login(page);
    while (Date.now() < deadline) {
      try {
        await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (username) {
          const boards = page.locator('li.js-board a, li.js-board .board-list-item');
          const count = await boards.count();
          if (count) {
            await boards.nth((requests + number) % Math.min(count, 20)).click();
            await page.waitForTimeout(1500);
          }
        } else {
          await page.goto(`${baseURL}/sockjs/info`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        }
        requests += 1;
      } catch (error) {
        failures += 1;
        console.error(`[client ${number}] ${error.message}`);
      }
    }
  } finally {
    await context.close();
  }
}

try {
  await Promise.all(Array.from({ length: clients }, (_, i) => worker(i + 1)));
} finally {
  await browser.close();
}
console.log(`DEBUGSPEED traffic complete: ${requests} iterations, ${failures} failures`);
if (failures) process.exitCode = 1;

