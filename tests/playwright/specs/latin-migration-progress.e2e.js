'use strict';
const { test, expect } = require('../fixtures');

test('Latin migration progress template distinguishes overall and current progress', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    const template = Template.migrationProgress;
    const original = template.__helpers.get('isMigrating');
    template.helpers({ isMigrating: () => true });
    const host = document.createElement('div');
    host.id = 'latin-migration-preview';
    document.body.appendChild(host);
    const view = Blaze.render(template, host);
    window.cleanupLatinMigrationPreview = () => {
      Blaze.remove(view);
      host.remove();
      template.helpers({ isMigrating: original });
    };
  });
  try {
    const preview = page.locator('#latin-migration-preview');
    await expect(preview.locator('.migration-progress-title')).toContainText('Migratio tabulae agitur');
    await expect(preview.locator('.migration-progress-overall-label')).toContainText('Progressus totus');
    await expect(preview.locator('.migration-progress-overall-label')).toContainText(/0\s+ex\s+0\s+gradus/);
    await expect(preview.locator('.migration-progress-step-label')).toContainText('Gradus praesens');
    await expect(preview.locator('.migration-progress-note')).toContainText('structuram novissimam');
    await expect(preview).not.toContainText('Latine:');
  } finally {
    await page.evaluate(() => window.cleanupLatinMigrationPreview());
  }
});

test('Latin conversion template explains continued board use', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    const host = document.createElement('div');
    host.id = 'latin-conversion-preview';
    document.body.appendChild(host);
    const view = Blaze.render(Template.boardConversionProgress, host);
    window.cleanupLatinConversionPreview = () => { Blaze.remove(view); host.remove(); };
  });
  try {
    const preview = page.locator('#latin-conversion-preview');
    await expect(preview.locator('h3')).toContainText('Tabula convertitur');
    await expect(preview.locator('.conversion-info')).toContainText('semel pro quaque tabula');
    await expect(preview.locator('.conversion-info')).toContainText('Tabula more solito uti pergere potes.');
    await expect(preview).not.toContainText('Latine:');
  } finally {
    await page.evaluate(() => window.cleanupLatinConversionPreview());
  }
});
