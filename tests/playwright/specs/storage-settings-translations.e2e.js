'use strict';
// Technical product names stay recognizable; the surrounding instructions and
// field labels still need translation. This only opens the settings pane.
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

for (const language of ['sr', 'tr', 'bs', 'hr', 'sk', 'cs', 'cs-CZ', 'hu', 'el', 'el-GR', 'st', 'co', 'mt', 'en', 'mr', 'bn', 'is', 'tl', 'sq', 'ne', 'kn', 'ml', 'jv', 'kk', 'ky', 'tg', 'so', 'az', 'az-AZ', 'az-LA']) {
  test(`S3 settings show translated labels and descriptions in ${language}`, async ({ page, adminUser }) => {
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
    await navigateInApp(page, '/admin/attachments/s3');
    const pane = page.locator('#attachment-s3-setting');
    await expect(pane.locator('.description')).toHaveText(strings['s3-minio-storage-description']);
    for (const field of ['endpoint', 'region', 'bucket', 'access-key', 'secret-key']) {
      const group = pane.locator(`.form-group:has(#s3-${field})`);
      await expect(group.locator('.cloud-input-label-tr')).toHaveText(strings[`s3-${field}`]);
    }
    for (const key of ['s3-endpoint-description', 's3-bucket-description', 's3-force-path-style-description', 's3-endpoint-menu-path']) {
      await expect(pane.getByText(strings[key], { exact: true })).toBeVisible();
    }

    if (language === 'st') {
      await expect(pane.getByText(strings['s3-endpoint-menu-path'], { exact: true })).toContainText('sebaka sa kgokelo sa sebaka se kgethilweng');
      await expect(pane.getByText(strings['s3-region-description'], { exact: true })).toBeVisible();
      await expect(pane).not.toContainText('endpoint ya region');
    }
    const secret = pane.locator('.form-group:has(#s3-secret-key)');
    await expect(secret.getByText(strings['s3-secret-key-menu-path'], { exact: true })).toBeVisible();
    await expect(pane.locator('.js-save-cloud-settings')).toHaveText(strings.save);
  });
}
