'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Problems Summary has equivalent admin-only HTML4 reads and acknowledgement', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4admin${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const eventId = `html4-problem-${suffix}`;
  const reportIds = Array.from({ length: 12 }, (_, index) =>
    `${eventId}-report-${index}`);
  const auxiliaryReportSlugs = ['speed', 'tests', 'cpu', 'api', 'database',
    'integrity'];
  const auxiliaryReportIds = auxiliaryReportSlugs.map(slug =>
    `${eventId}-auxiliary-${slug}`);
  const officeUserIds = Array.from({ length: 26 }, (_, index) =>
    `${eventId}-office-user-${index}`);
  const officeAddressIds = Array.from({ length: 26 }, (_, index) =>
    `${eventId}-office-address-${index}`);
  const impersonationIds = Array.from({ length: 12 }, (_, index) =>
    `${eventId}-impersonation-${index}`);
  const impersonatedUserId = `${eventId}-impersonated-user`;
  const longImpersonatedUsername = `impersonated_${suffix}_${'long_name_'.repeat(8)}`;
  const recoveryIds = Array.from({ length: 12 }, (_, index) =>
    `${eventId}-recovery-${index}`);
  const boardReportIds = Array.from({ length: 13 }, (_, index) =>
    `${eventId}-board-report-${index}`);
  const boardReportOrgId = `${eventId}-board-org`;
  const boardReportTeamId = `${eventId}-board-team`;
  const cardReportBoardId = `${eventId}-card-board`;
  const cardReportSwimlaneId = `${eventId}-card-swimlane`;
  const cardReportListId = `${eventId}-card-list`;
  const cardReportIds = Array.from({ length: 12 }, (_, index) =>
    `${eventId}-card-report-${index}`);
  const brokenReportIds = Array.from({ length: 12 }, (_, index) =>
    `${eventId}-broken-report-${index}`);
  const fileReportIds = Array.from({ length: 12 }, (_, index) =>
    `${eventId}-file-report-${index}`);
  const ruleReportIds = Array.from({ length: 12 }, (_, index) =>
    `${eventId}-rule-report-${index}`);
  const ruleActionIds = Array.from({ length: 12 }, (_, index) =>
    `${eventId}-rule-action-${index}`);
  const ruleTriggerIds = Array.from({ length: 12 }, (_, index) =>
    `${eventId}-rule-trigger-${index}`);
  const fileDeleteId = fileReportIds[0];
  const legacyContext = await browser.newContext({
    javaScriptEnabled: false,
    locale: 'fi-FI',
  });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  let settingsId;
  let previousPermanentDelete;
  let previousRenderLinksAsPlainText;
  let previousDisableNotifications;
  const previousSecurityAck = db.findOne('eventlogAcks', {
    stream: 'security',
  });
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy
      .locator('input[name="email"]')
      .fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    const settings = db.findOne('settings', {});
    settingsId = settings?._id;
    previousPermanentDelete = settings?.enablePermanentDelete;
    previousRenderLinksAsPlainText = settings?.renderLinksAsPlainText;
    previousDisableNotifications = settings?.disableNotifications;
    if (settingsId) db.updateOne('settings', { _id: settingsId }, {
      $set: { enablePermanentDelete: false, renderLinksAsPlainText: false,
        disableNotifications: false },
    });
    db.updateOne(
      'users',
      { _id: user._id },
      {
        $set: { isAdmin: true, 'profile.language': 'fi' },
      },
    );
    db.insertOne('eventlog', {
      _id: eventId,
      stream: 'security',
      at: new Date(),
      severity: 'high',
      category: 'authz',
      bleed: 'LegacySummaryTest',
      action: 'blocked',
      source: 'html4-admin-summary-test',
      detail: `Summary event ${suffix}`,
    });

    const allBoards = legacy.locator('form[action="/allboards"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      allBoards.locator('input[type="submit"]').click(),
    ]);
    const adminNav = legacy
      .locator('form[action="/admin/problems/summary"]')
      .first();
    await expect(adminNav).toBeVisible();
    await Promise.all([
      legacy.waitForNavigation(),
      adminNav.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('h1')).toContainText(
      'Hallintapaneeli / Ongelmat / Yhteenveto',
    );
    await expect(legacy.locator('tbody')).toContainText('Tietoturva');
    await expect(
      legacy.locator('input[name="problemStreams"][value="security"]'),
    ).toBeVisible();
    await expect(
      legacy.locator(
        'form:has(input[name="legacyOperation"][value="repair-broken-cards"])',
      ),
    ).toHaveCount(0);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-problems-summary.png`,
        fullPage: true,
      });
    }

    const acknowledge = legacy.locator(
      'form:has(input[name="legacyOperation"][value="acknowledge-problems"])',
    );
    await acknowledge
      .locator('input[name="problemStreams"][value="security"]')
      .check();
    await Promise.all([
      legacy.waitForNavigation(),
      acknowledge.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('tbody')).toContainText('Kuittaa');
    await expect(
      legacy.locator('input[name="problemStreams"][value="security"]'),
    ).toHaveCount(0);

    db.insertMany('eventlog', reportIds.map((id, index) => ({
      _id: id,
      stream: 'security',
      at: new Date(Date.now() + index),
      severity: index % 2 ? 'high' : 'medium',
      category: 'authz',
      bleed: `PagedSummary${index}`,
      action: 'blocked',
      source: `html4-event-report-${suffix}`,
      username,
      ipv4: '192.0.2.10',
      ipv6: '2001:db8::10',
      location: { country: 'FI', city: 'Helsinki' },
      count: index + 1,
      detail: `Searchable report ${suffix} row ${index}`,
    })));
    db.insertMany('eventlog', auxiliaryReportSlugs.map((slug, index) => ({
      _id: auxiliaryReportIds[index],
      stream: slug,
      at: new Date(Date.now() + index),
      firstAt: new Date(Date.now() - 1000),
      severity: 'info',
      category: `${slug}-category`,
      bleed: `${slug}-name`,
      action: 'observed',
      source: `html4-${slug}-${suffix}`,
      ...(slug === 'api' ? { api: `GET /api/${suffix}` } : {}),
      count: index + 1,
      detail: `Auxiliary ${slug} report ${suffix}`,
    })));
    const securityNav = legacy
      .locator('form[action="/admin/problems/security-report"]')
      .first();
    await Promise.all([
      legacy.waitForNavigation(),
      securityNav.locator('input[type="submit"]').click(),
    ]);
    const reportSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await reportSearch.locator('input[name="q"][type="text"]').fill(suffix);
    await Promise.all([
      legacy.waitForNavigation(),
      reportSearch.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('thead')).toContainText('IPv4-osoite');
    await expect(legacy.locator('thead')).toContainText('IPv6-osoite');
    await expect(legacy.locator('tbody')).toContainText('Helsinki');
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    const nextPage = legacy.locator(
      'form:has(input[name="page"][value="2"])',
    );
    await Promise.all([
      legacy.waitForNavigation(),
      nextPage.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('tbody')).toContainText('2 / 2');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-security-report.png`,
        fullPage: true,
      });
    }
    for (const slug of auxiliaryReportSlugs) {
      const nav = legacy.locator(`form[action="/admin/problems/${slug}"]`).first();
      await Promise.all([
        legacy.waitForNavigation(), nav.locator('input[type="submit"]').click(),
      ]);
      const search = legacy.locator('form:has(input[name="q"][type="text"])');
      await search.locator('input[name="q"][type="text"]').fill(suffix);
      await Promise.all([
        legacy.waitForNavigation(), search.locator('input[type="submit"]').click(),
      ]);
      await expect(legacy.locator('tbody')).toContainText(slug === 'api'
        ? `GET /api/${suffix}` : `Auxiliary ${slug} report ${suffix}`);
      if (process.env.WEKAN_HTML4_SCREENSHOTS) {
        await legacy.screenshot({
          path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-${slug}-report.png`,
          fullPage: true,
        });
      }
    }

    const officeAt = new Date();
    db.insertMany('users', officeUserIds.map((id, index) => {
      const address = `198.51.100.${index + 1}`;
      return {
        _id: id,
        username: `office_${suffix}_${String(index).padStart(2, '0')}`,
        profile: { fullname: `Office Person ${suffix} ${index}` },
        loginAddresses: { entries: { address: {
          value: address, family: 'ipv4', count: index + 1,
          firstAt: officeAt, at: officeAt,
        } } },
      };
    }));
    db.insertMany('loginAddresses', officeAddressIds.map((id, index) => ({
      _id: id,
      address: `198.51.100.${index + 1}`,
      ipv4: `198.51.100.${index + 1}`,
      ipv6: '',
      location: { country: 'FI', city: `Office City ${suffix} ${index}` },
      locationLabel: `Office City ${suffix} ${index}`,
    })));
    const officesNav = legacy.locator('form[action="/admin/problems/office"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      officesNav.locator('input[type="submit"]').click(),
    ]);
    const officesSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await officesSearch.locator('input[name="q"][type="text"]').fill(suffix);
    await Promise.all([
      legacy.waitForNavigation(),
      officesSearch.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('thead')).toContainText('IPv4-osoite');
    await expect(legacy.locator('thead')).toContainText('IPv6-osoite');
    await expect(legacy.locator('tbody')).toContainText(`Office City ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-offices.png`,
        fullPage: true,
      });
    }

    db.insertOne('users', {
      _id: impersonatedUserId,
      username: longImpersonatedUsername,
      profile: { initials: 'LONG', fullname: `Long Impersonated Person ${suffix}` },
    });
    db.insertMany('impersonatedUsers', impersonationIds.map((id, index) => ({
      _id: id,
      adminId: user._id,
      userId: impersonatedUserId,
      boardId: `board-${suffix}-${index}`,
      reason: `Impersonation searchable ${suffix} row ${index}`,
      createdAt: new Date(Date.now() + index),
      modifiedAt: new Date(Date.now() + index),
    })));
    const impersonationNav = legacy
      .locator('form[action="/admin/problems/impersonation"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      impersonationNav.locator('input[type="submit"]').click(),
    ]);
    const impersonationSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await impersonationSearch.locator('input[name="q"][type="text"]').fill(suffix);
    await Promise.all([
      legacy.waitForNavigation(),
      impersonationSearch.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('thead')).toContainText('Ylläpitäjä');
    await expect(legacy.locator('tbody')).toContainText(longImpersonatedUsername);
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    const longNameCell = legacy.locator('td', { hasText: longImpersonatedUsername }).first();
    await expect(longNameCell).toBeVisible();
    expect(await longNameCell.evaluate(element =>
      element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-impersonation.png`,
        fullPage: true,
      });
    }

    db.insertMany('recoveryEvents', recoveryIds.map((id, index) => ({
      _id: id,
      type: `html4-recovery-${suffix}`,
      detail: `Recovery searchable ${suffix} row ${index}`,
      severity: 'error',
      source: 'html4-admin-recovery-test',
      done: false,
      deletedData: index === 0,
      userId: user._id,
      username,
      ipv4: '203.0.113.12',
      ipv6: '2001:db8::12',
      location: { country: 'FI', city: `Recovery City ${suffix}` },
      createdAt: new Date(Date.now() + index),
    })));
    const recoveryNav = legacy
      .locator('form[action="/admin/problems/recovery"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      recoveryNav.locator('input[type="submit"]').click(),
    ]);
    const recoverySearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await recoverySearch.locator('input[name="q"][type="text"]').fill(suffix);
    await Promise.all([
      legacy.waitForNavigation(),
      recoverySearch.locator('input[type="submit"]').click(),
    ]);
    const recoveryFilter = legacy.locator('form:has(select[name="status"])');
    await recoveryFilter.locator('select[name="status"]').selectOption('failed');
    await Promise.all([
      legacy.waitForNavigation(),
      recoveryFilter.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('thead')).toContainText('IPv4-osoite');
    await expect(legacy.locator('thead')).toContainText('IPv6-osoite');
    await expect(legacy.locator('tbody')).toContainText(`Recovery City ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText('Failed');
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-recovery.png`,
        fullPage: true,
      });
    }

    db.insertOne('org', {
      _id: boardReportOrgId,
      orgDisplayName: `Report Organization ${suffix}`,
    });
    db.insertOne('team', {
      _id: boardReportTeamId,
      teamDisplayName: `Report Team ${suffix}`,
    });
    db.insertMany('boards', boardReportIds.map((id, index) => ({
      _id: id,
      title: `${index === 0 ? 'Public' : 'Private'} Report Board ${suffix} ${index}`,
      slug: `report-board-${suffix}-${index}`,
      permission: index === 0 ? 'public' : 'private',
      archived: index === 12,
      type: 'board',
      sort: index,
      members: [{ userId: user._id, isActive: true, isAdmin: true }],
      orgs: [{ orgId: boardReportOrgId, isActive: true }],
      teams: [{ teamId: boardReportTeamId, isActive: true }],
    })));
    db.insertOne('boards', {
      _id: cardReportBoardId,
      title: `Card Report Board ${suffix}`,
      slug: `card-report-board-${suffix}`,
      permission: 'private',
      archived: false,
      type: 'board',
      sort: 100,
      members: [{ userId: user._id, isActive: true, isAdmin: true }],
    });
    db.insertOne('swimlanes', {
      _id: cardReportSwimlaneId,
      boardId: cardReportBoardId,
      title: `Card Report Swimlane ${suffix}`,
      type: 'swimlane',
      sort: 0,
    });
    db.insertOne('lists', {
      _id: cardReportListId,
      boardId: cardReportBoardId,
      swimlaneId: cardReportSwimlaneId,
      title: `Card Report List ${suffix}`,
      archived: false,
      sort: 0,
    });
    db.insertMany('cards', cardReportIds.map((id, index) => ({
      _id: id,
      title: `Searchable Card Report ${suffix} ${index}`,
      boardId: cardReportBoardId,
      swimlaneId: cardReportSwimlaneId,
      listId: cardReportListId,
      members: [user._id],
      assignees: [user._id],
      archived: false,
      type: 'cardType-card',
      sort: index,
      createdAt: new Date(Date.now() + index),
    })));
    db.insertMany('cards', brokenReportIds.map((id, index) => ({
      _id: id,
      title: `Searchable Broken Report ${suffix} ${index}`,
      boardId: cardReportBoardId,
      swimlaneId: cardReportSwimlaneId,
      listId: '',
      archived: false,
      type: 'cardType-card',
      sort: index + 20,
      createdAt: new Date(Date.now() + index),
    })));
    db.insertMany('attachments', fileReportIds.map((id, index) => ({
      _id: id,
      name: `Searchable Report File ${suffix} ${String(index).padStart(2, '0')}${index === 1 ? '.gif' : '.txt'}`,
      type: index === 1 ? 'image/gif' : 'text/plain',
      size: index * 1024,
      uploadedAt: new Date(Date.now() + index),
      versions: {},
      meta: { boardId: cardReportBoardId, cardId: cardReportIds[0] },
    })));
    db.insertMany('actions', ruleActionIds.map((id, index) => ({
      _id: id,
      boardId: cardReportBoardId,
      actionType: `moveCardToTop-${suffix}-${index}`,
    })));
    db.insertMany('triggers', ruleTriggerIds.map((id, index) => ({
      _id: id,
      boardId: cardReportBoardId,
      activityType: `cardMoved-${suffix}-${index}`,
    })));
    db.insertMany('rules', ruleReportIds.map((id, index) => ({
      _id: id,
      title: `Searchable Rule Report ${suffix} ${index}`,
      boardId: cardReportBoardId,
      actionId: ruleActionIds[index],
      triggerId: ruleTriggerIds[index],
    })));
    const boardsReportNav = legacy
      .locator('form[action="/admin/problems/boards"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      boardsReportNav.locator('input[type="submit"]').click(),
    ]);
    const boardsReportSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await boardsReportSearch.locator('input[name="q"][type="text"]').fill(suffix);
    await Promise.all([
      legacy.waitForNavigation(),
      boardsReportSearch.locator('input[type="submit"]').click(),
    ]);
    let boardsReportFilter = legacy.locator('form:has(select[name="permission"])');
    await boardsReportFilter.locator('select[name="permission"]').selectOption('public');
    await Promise.all([
      legacy.waitForNavigation(),
      boardsReportFilter.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('tbody')).toContainText(`Public Report Board ${suffix}`);
    await expect(legacy.locator('tbody')).not.toContainText(`Private Report Board ${suffix}`);
    boardsReportFilter = legacy.locator('form:has(select[name="permission"])');
    await boardsReportFilter.locator('select[name="permission"]').selectOption('private');
    await Promise.all([
      legacy.waitForNavigation(),
      boardsReportFilter.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('tbody')).toContainText(`Report Organization ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText(`Report Team ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText(username);
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-boards.png`,
        fullPage: true,
      });
    }

    const cardsReportNav = legacy
      .locator('form[action="/admin/problems/cards"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      cardsReportNav.locator('input[type="submit"]').click(),
    ]);
    const cardsReportSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await cardsReportSearch.locator('input[name="q"][type="text"]')
      .fill(`Searchable Card Report ${suffix}`);
    await Promise.all([
      legacy.waitForNavigation(),
      cardsReportSearch.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('thead')).toContainText('Card Title');
    await expect(legacy.locator('tbody')).toContainText(`Card Report Board ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText(`Card Report Swimlane ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText(`Card Report List ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText(username);
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-cards.png`,
        fullPage: true,
      });
    }
    const brokenReportNav = legacy
      .locator('form[action="/admin/problems/broken-cards"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      brokenReportNav.locator('input[type="submit"]').click(),
    ]);
    const brokenReportSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await brokenReportSearch.locator('input[name="q"][type="text"]')
      .fill(`Searchable Broken Report ${suffix}`);
    await Promise.all([
      legacy.waitForNavigation(),
      brokenReportSearch.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('thead')).toContainText('Card Title');
    await expect(legacy.locator('tbody')).toContainText(`Card Report Board ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText(`Card Report Swimlane ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText('(Tuntematon)');
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-broken-cards.png`,
        fullPage: true,
      });
    }
    const filesReportNav = legacy
      .locator('form[action="/admin/problems/files"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      filesReportNav.locator('input[type="submit"]').click(),
    ]);
    const filesSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await filesSearch.locator('input[name="q"][type="text"]')
      .fill(`Searchable Report File ${suffix}`);
    await Promise.all([
      legacy.waitForNavigation(), filesSearch.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('thead')).toContainText('Filename');
    await expect(legacy.locator('thead')).toContainText('Attachment ID');
    await expect(legacy.locator('tbody')).toContainText(cardReportBoardId);
    await expect(legacy.locator('tbody')).toContainText(cardReportIds[0]);
    await expect(legacy.locator(
      'form:has(input[name="legacyOperation"][value="preview-admin-attachment-gif"])',
    )).toHaveCount(1);
    await expect(legacy.locator(
      'form:has(input[name="legacyOperation"][value="download-admin-attachment-original"])',
    )).toHaveCount(10);
    await expect(legacy.locator(
      'form:has(input[name="legacyOperation"][value="confirm-permanently-delete-admin-attachment"])',
    )).toHaveCount(0);
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    if (settingsId) db.updateOne('settings', { _id: settingsId }, {
      $set: { enablePermanentDelete: true },
    });
    await legacy.waitForTimeout(500);
    await Promise.all([
      legacy.waitForNavigation(), filesSearch.locator('input[type="submit"]').click(),
    ]);
    const requestFileDelete = legacy.locator(
      'form:has(input[name="legacyOperation"][value="confirm-permanently-delete-admin-attachment"])'
      + `:has(input[name="attachmentId"][value="${fileDeleteId}"])`,
    );
    await expect(requestFileDelete).toHaveCount(1);
    await Promise.all([
      legacy.waitForNavigation(), requestFileDelete.locator('input[type="submit"]').click(),
    ]);
    const confirmFileDelete = legacy.locator(
      'form:has(input[name="legacyOperation"][value="permanently-delete-admin-attachment"])'
      + `:has(input[name="attachmentId"][value="${fileDeleteId}"])`,
    );
    await expect(confirmFileDelete).toHaveCount(1);
    await Promise.all([
      legacy.waitForNavigation(), confirmFileDelete.locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('attachments', { _id: fileDeleteId })).toBeNull();
    await expect.poll(() => db.findOne('recoveryEvents', {
      type: 'attachment-permanently-deleted', userId: user._id, done: true,
      detail: { $regex: fileDeleteId },
    })?.username).toBe(username);
    await expect(legacy.locator('input[name="q"][type="text"]'))
      .toHaveValue(`Searchable Report File ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-files.png`,
        fullPage: true,
      });
    }
    const rulesReportNav = legacy
      .locator('form[action="/admin/problems/rules"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      rulesReportNav.locator('input[type="submit"]').click(),
    ]);
    const rulesSearch = legacy.locator('form:has(input[name="q"][type="text"])');
    await rulesSearch.locator('input[name="q"][type="text"]')
      .fill(`Searchable Rule Report ${suffix}`);
    await Promise.all([
      legacy.waitForNavigation(), rulesSearch.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('thead')).toContainText('Rule Title');
    await expect(legacy.locator('thead')).toContainText('Board Title');
    await expect(legacy.locator('thead')).toContainText('actionType');
    await expect(legacy.locator('thead')).toContainText('activityType');
    await expect(legacy.locator('tbody')).toContainText(`Card Report Board ${suffix}`);
    await expect(legacy.locator('tbody')).toContainText(`moveCardToTop-${suffix}`);
    await expect(legacy.locator('tbody')).toContainText(`cardMoved-${suffix}`);
    await expect(legacy.locator('tbody')).toContainText('1 / 2');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-rules.png`,
        fullPage: true,
      });
    }
    const performanceNav = legacy
      .locator('form[action="/admin/problems/performance"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      performanceNav.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('h1')).toContainText('Suorituskyky');
    await expect(legacy.locator('tbody')).toContainText('Korttien lataus');
    await expect(legacy.locator('tbody')).toContainText('CARDS_LOADING');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-performance.png`,
        fullPage: true,
      });
    }
    const securitySettingsNav = legacy
      .locator('form[action="/admin/problems/security"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      securitySettingsNav.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('h1')).toContainText('Turvallisuus');
    const renderLinksForm = legacy.locator(
      'form:has(input[name="settingField"][value="renderLinksAsPlainText"])',
    );
    await expect(renderLinksForm.locator('select[name="enabled"]')).toHaveValue('false');
    await renderLinksForm.locator('select[name="enabled"]').selectOption('true');
    await Promise.all([
      legacy.waitForNavigation(), renderLinksForm.locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('settings', {
      _id: settingsId,
    })?.renderLinksAsPlainText).toBe(true);
    await expect(legacy.locator(
      'form:has(input[name="settingField"][value="renderLinksAsPlainText"]) select[name="enabled"]',
    )).toHaveValue('true');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-security-settings.png`,
        fullPage: true,
      });
    }
    const deleteSettingsNav = legacy
      .locator('form[action="/admin/problems/delete"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      deleteSettingsNav.locator('input[type="submit"]').click(),
    ]);
    const permanentDeleteForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="set-permanent-delete"])',
    );
    await expect(permanentDeleteForm.locator('select[name="enabled"]'))
      .toHaveValue('true');
    await permanentDeleteForm.locator('select[name="enabled"]').selectOption('false');
    await Promise.all([
      legacy.waitForNavigation(),
      permanentDeleteForm.locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('settings', {
      _id: settingsId,
    })?.enablePermanentDelete).toBe(false);
    await expect.poll(() => db.findOne('recoveryEvents', {
      type: 'permanent-delete-setting-changed', userId: user._id, done: true,
    })?.username).toBe(username);
    await expect(legacy.locator(
      'form:has(input[name="legacyOperation"][value="set-permanent-delete"]) select[name="enabled"]',
    )).toHaveValue('false');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-delete-settings.png`,
        fullPage: true,
      });
    }
    const notificationSettingsNav = legacy
      .locator('form[action="/admin/problems/notifications"]').first();
    await Promise.all([
      legacy.waitForNavigation(),
      notificationSettingsNav.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('h1')).toContainText('Ilmoitukset');
    const disableNotificationsForm = legacy.locator(
      'form:has(input[name="settingField"][value="disableNotifications"])',
    );
    await expect(disableNotificationsForm.locator('select[name="enabled"]'))
      .toHaveValue('false');
    await disableNotificationsForm.locator('select[name="enabled"]')
      .selectOption('true');
    await Promise.all([
      legacy.waitForNavigation(),
      disableNotificationsForm.locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('settings', {
      _id: settingsId,
    })?.disableNotifications).toBe(true);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-notifications-settings.png`,
        fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'fi-FI' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    db.insertOne('eventlog', {
      _id: `${eventId}-modern`,
      stream: 'security',
      at: new Date(),
      severity: 'high',
      category: 'authz',
      bleed: 'ModernSummaryTest',
      action: 'blocked',
      source: 'html5-admin-summary-test',
      detail: `Modern event ${suffix}`,
    });
    await navigateInApp(modern, '/admin/problems/summary');
    await expect(modern.locator('h1').first()).toContainText('Yhteenveto');
    await expect(modern.locator('.admin-problem-banner', {
      hasText: 'Tietoturva',
    })).toBeVisible();
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-problems-summary.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/security-report');
    await modern.locator('.js-table-page-search').fill(suffix);
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    await expect(modern.locator('tbody')).toContainText('Helsinki');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-security-report.png`,
        fullPage: true,
      });
    }
    for (const slug of auxiliaryReportSlugs) {
      await navigateInApp(modern, `/admin/problems/${slug}`);
      await modern.locator('.js-table-page-search').fill(suffix);
      await expect(modern.locator('tbody')).toContainText(slug === 'api'
        ? `GET /api/${suffix}` : `Auxiliary ${slug} report ${suffix}`);
      if (process.env.WEKAN_HTML4_SCREENSHOTS) {
        await modern.screenshot({
          path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-${slug}-report.png`,
          fullPage: true,
        });
      }
    }
    await navigateInApp(modern, '/admin/problems/office');
    await modern.locator('.js-table-page-search').fill(suffix);
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    await expect(modern.locator('tbody')).toContainText(`Office City ${suffix}`);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-offices.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/impersonation');
    await modern.locator('.js-table-page-search').fill(suffix);
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    await expect(modern.locator('tbody')).toContainText(longImpersonatedUsername);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-impersonation.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/recovery');
    await modern.locator('.js-table-page-search').fill(suffix);
    await modern.locator('.js-table-page-filter').selectOption('failed');
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    await expect(modern.locator('tbody')).toContainText(`Recovery City ${suffix}`);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-recovery.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/boards');
    await modern.locator('.js-table-page-search').fill(suffix);
    await modern.locator('.js-table-page-filter').selectOption('public');
    await expect(modern.locator('tbody')).toContainText('Public Report Board');
    await expect(modern.locator('tbody')).not.toContainText(`Private Report Board ${suffix}`);
    await modern.locator('.js-table-page-filter').selectOption('private');
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    await expect(modern.locator('tbody')).toContainText(`Report Organization ${suffix}`);
    await expect(modern.locator('tbody')).toContainText(`Report Team ${suffix}`);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-boards.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/cards');
    await modern.locator('.js-table-page-search')
      .fill(`Searchable Card Report ${suffix}`);
    await modern.locator('.js-table-page-search').press('Enter');
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    // The modern table deliberately abbreviates long cell values; the HTML4
    // baseline retains the complete readable value.
    await expect(modern.locator('tbody')).toContainText('Card Report Board');
    await expect(modern.locator('tbody')).toContainText('Card Report Swimlane');
    await expect(modern.locator('tbody')).toContainText('Card Report List');
    await expect(modern.locator('tbody')).toContainText(
      new RegExp(`${username}|${user._id}`),
    );
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-cards.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/broken-cards');
    await modern.locator('.js-table-page-search')
      .fill(`Searchable Broken Report ${suffix}`);
    await modern.locator('.js-table-page-search').press('Enter');
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    await expect(modern.locator('tbody')).toContainText('Searchable Broken Report');
    await expect(modern.locator('tbody')).toContainText('Card Report Board');
    await expect(modern.locator('tbody')).toContainText('Card Report Swimlane');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-broken-cards.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/files');
    await modern.locator('.js-table-page-search')
      .fill(`Searchable Report File ${suffix}`);
    await modern.locator('.js-table-page-search').press('Enter');
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    await expect(modern.locator('tbody')).toContainText('Searchable Report File');
    await expect(modern.locator('tbody')).toContainText(cardReportBoardId);
    await expect(modern.locator('.table-page-attachment')).toHaveCount(10);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-files.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/rules');
    await modern.locator('.js-table-page-search')
      .fill(`Searchable Rule Report ${suffix}`);
    await modern.locator('.js-table-page-search').press('Enter');
    await expect(modern.locator('.table-page-page-info')).toContainText('1 / 2');
    await expect(modern.locator('tbody')).toContainText('Searchable Rule Report');
    await expect(modern.locator('tbody')).toContainText('Card Report Board');
    await expect(modern.locator('tbody')).toContainText(`moveCardToTop-${suffix}`);
    await expect(modern.locator('tbody')).toContainText(`cardMoved-${suffix}`);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-rules.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/performance');
    await expect(modern.locator('h1').first()).toContainText('Suorituskyky');
    await expect(modern.locator('.main-body')).toContainText('Korttien lataus');
    await expect(modern.locator('.main-body')).toContainText('CARDS_LOADING');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-performance.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/security');
    await expect(modern.locator('h1').first()).toContainText('Turvallisuus');
    await expect(modern.locator(
      '.js-toggle-render-links-as-plain-text .materialCheckBox',
    )).toHaveClass(/is-checked/);
    await modern.locator('.js-toggle-render-links-as-plain-text').click();
    await expect.poll(() => db.findOne('settings', {
      _id: settingsId,
    })?.renderLinksAsPlainText).toBe(false);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-security-settings.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/delete');
    await expect(modern.locator('h1').first()).toContainText('Poista');
    await expect(modern.locator(
      '.js-toggle-enable-permanent-delete .materialCheckBox',
    )).not.toHaveClass(/is-checked/);
    await modern.locator('.js-toggle-enable-permanent-delete').click();
    await expect.poll(() => db.findOne('settings', {
      _id: settingsId,
    })?.enablePermanentDelete).toBe(true);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-delete-settings.png`,
        fullPage: true,
      });
    }
    await navigateInApp(modern, '/admin/problems/notifications');
    await expect(modern.locator('h1').first()).toContainText('Ilmoitukset');
    await expect(modern.locator(
      '.js-toggle-disable-notifications .materialCheckBox',
    )).toHaveClass(/is-checked/);
    await modern.locator('.js-toggle-disable-notifications').click();
    await expect.poll(() => db.findOne('settings', {
      _id: settingsId,
    })?.disableNotifications).toBe(false);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-notifications-settings.png`,
        fullPage: true,
      });
    }

    const outsider = await browser.newContext({ javaScriptEnabled: false });
    const outsiderPage = await outsider.newPage();
    await outsiderPage.goto(`${baseURL}/admin/problems/summary`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText(
      'ModernSummaryTest',
    );
    await outsiderPage.goto(`${baseURL}/admin/problems/impersonation`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText(longImpersonatedUsername);
    await outsiderPage.goto(`${baseURL}/admin/problems/recovery`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText(`Recovery City ${suffix}`);
    await outsiderPage.goto(`${baseURL}/admin/problems/boards`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText(`Report Board ${suffix}`);
    await outsiderPage.goto(`${baseURL}/admin/problems/cards`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText(`Searchable Card Report ${suffix}`);
    await outsiderPage.goto(`${baseURL}/admin/problems/broken-cards`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText(`Searchable Broken Report ${suffix}`);
    await outsiderPage.goto(`${baseURL}/admin/problems/files`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText(`Searchable Report File ${suffix}`);
    await outsiderPage.goto(`${baseURL}/admin/problems/rules`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText(`Searchable Rule Report ${suffix}`);
    await outsiderPage.goto(`${baseURL}/admin/problems/performance`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText('CARDS_LOADING');
    await outsiderPage.goto(`${baseURL}/admin/problems/security`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText('disable-all-import');
    await outsiderPage.goto(`${baseURL}/admin/problems/delete`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText('Recovery logs');
    await outsiderPage.goto(`${baseURL}/admin/problems/notifications`);
    await expect(outsiderPage.locator('body')).toContainText('not authorized');
    await expect(outsiderPage.locator('body')).not.toContainText('disable-notifications');
    await outsider.close();
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.deleteMany('eventlog', {
      _id: { $in: [eventId, `${eventId}-modern`, ...reportIds,
        ...auxiliaryReportIds] },
    });
    db.deleteMany('eventlogAcks', { stream: 'security' });
    db.deleteMany('loginAddresses', { _id: { $in: officeAddressIds } });
    db.deleteMany('impersonatedUsers', { _id: { $in: impersonationIds } });
    db.deleteMany('recoveryEvents', { _id: { $in: recoveryIds } });
    db.deleteMany('boards', { _id: { $in: boardReportIds } });
    db.deleteMany('cards', { _id: { $in: cardReportIds } });
    db.deleteMany('cards', { _id: { $in: brokenReportIds } });
    db.deleteMany('attachments', { _id: { $in: fileReportIds } });
    db.deleteMany('rules', { _id: { $in: ruleReportIds } });
    db.deleteMany('actions', { _id: { $in: ruleActionIds } });
    db.deleteMany('triggers', { _id: { $in: ruleTriggerIds } });
    db.deleteMany('recoveryEvents', {
      type: 'attachment-permanently-deleted',
      detail: { $regex: eventId },
    });
    if (user) db.deleteMany('recoveryEvents', {
      type: 'permanent-delete-setting-changed', userId: user._id,
    });
    db.deleteOne('lists', { _id: cardReportListId });
    db.deleteOne('swimlanes', { _id: cardReportSwimlaneId });
    db.deleteOne('boards', { _id: cardReportBoardId });
    db.deleteOne('org', { _id: boardReportOrgId });
    db.deleteOne('team', { _id: boardReportTeamId });
    db.deleteMany('users', { _id: { $in: [...officeUserIds, impersonatedUserId] } });
    if (previousSecurityAck) db.insertOne('eventlogAcks', previousSecurityAck);
    if (settingsId) {
      if (previousPermanentDelete === undefined) db.updateOne('settings', {
        _id: settingsId,
      }, { $unset: { enablePermanentDelete: '' } });
      else db.updateOne('settings', { _id: settingsId }, {
        $set: { enablePermanentDelete: previousPermanentDelete },
      });
      if (previousRenderLinksAsPlainText === undefined) db.updateOne('settings', {
        _id: settingsId,
      }, { $unset: { renderLinksAsPlainText: '' } });
      else db.updateOne('settings', { _id: settingsId }, {
        $set: { renderLinksAsPlainText: previousRenderLinksAsPlainText },
      });
      if (previousDisableNotifications === undefined) db.updateOne('settings', {
        _id: settingsId,
      }, { $unset: { disableNotifications: '' } });
      else db.updateOne('settings', { _id: settingsId }, {
        $set: { disableNotifications: previousDisableNotifications },
      });
    }
    if (user) {
      db.deleteOne('users', { _id: user._id });
    }
  }
});
