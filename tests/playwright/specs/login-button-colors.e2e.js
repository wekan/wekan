'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');

test('all authentication actions share Login blue and white text/icons', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.locator('#at-btn')).toBeVisible();
  // Load the source stylesheet so this isolated presentation regression also
  // runs against an existing bundle while editing styles.
  await page.addStyleTag({ content: fs.readFileSync(path.join(root, 'client/components/users/userForm.css'), 'utf8') });
  const markup = fs.readFileSync(path.join(root, 'client/components/main/layouts.jade'), 'utf8');
  expect(markup).toContain('button#at-saml.primary.hide');
  await page.evaluate(() => {
    const saml = document.querySelector('#at-saml');
    saml.classList.add('primary'); saml.classList.remove('hide');
    const host = saml.parentElement;
    for (const kind of ['primary', 'at-social-btn']) {
      const button = document.createElement('button');
      button.className = kind; button.dataset.testAuth = kind;
      button.innerHTML = '<i class="fa fa-key"></i> Provider';
      (kind === 'primary' ? host : document.querySelector('.at-form')).appendChild(button);
    }
  });
  for (const selector of ['#at-saml', '[data-test-auth="primary"]', '[data-test-auth="at-social-btn"]']) {
    const button = page.locator(selector);
    for (const hover of [false, true]) {
      if (hover) await button.hover();
      await expect(button).toHaveCSS('background-color', 'rgb(33, 102, 148)');
      await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(button.locator('i')).toHaveCSS('color', 'rgb(255, 255, 255)');
    }
  }
});
