'use strict';

// A paginated admin list must show the page the SERVER sent - only it, all of it,
// in its order.
//
// Both panes read their page back out of minimongo, which holds far more than the
// page:
//
//  * Admin Panel / People rendered `Users.find(query)`. The logged-in user's own
//    record is always in minimongo (accounts publishes it), so the admin looking at
//    the list appeared on EVERY one of its 578 pages, and anyone another
//    subscription had pulled in could appear twice.
//
//  * Admin Panel / Problems / Broken cards rendered `Cards.find({})`. Every card of
//    every board the admin had opened is in minimongo, so the report was one endless
//    page under a pager that - counting on the server - correctly said "1 / 1". The
//    Cards and Boards reports beside it read the same way.
//
// The publication (or, for People, a method) now NAMES the page, and the pane
// renders that list. This pins the naming, the rendering, and the pure function
// that puts the documents back in the server's order.
//
// Run: node tests/adminPageRows.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  const { docsByIds } = await import('../models/lib/tablePage.js');
  const { REPORT_PAGE_COLLECTION, publishReportPage } =
    await import('../models/lib/reportPageIndex.js');

  console.log('adminPageRows:');

  test('the page is exactly what the server named, in its order', () => {
    const ids = ['c', 'a', 'b'];
    // Minimongo order is not the server's, and it holds a document that is not on
    // this page at all - the admin's own record, the one that was on every page.
    const inCache = [
      { _id: 'a', title: 'A' },
      { _id: 'me', title: 'the admin' },
      { _id: 'b', title: 'B' },
      { _id: 'c', title: 'C' },
    ];
    assert.deepStrictEqual(docsByIds(ids, inCache).map(d => d._id), ['c', 'a', 'b']);
  });

  test('an id whose document has not arrived is left out, not drawn empty', () => {
    // The ids come back from their own round trip, so they can be there a moment
    // before the documents are. A row with no document is a row of blank cells.
    assert.deepStrictEqual(docsByIds(['a', 'late'], [{ _id: 'a' }]).map(d => d._id), ['a']);
    assert.deepStrictEqual(docsByIds([], [{ _id: 'a' }]), []);
    assert.deepStrictEqual(docsByIds(null, null), []);
    assert.deepStrictEqual(docsByIds(['a'], [null, undefined, { _id: 'a' }]).length, 1);
  });

  test('a publication names its page with the ids it just sent', () => {
    const sent = [];
    const publication = { added: (coll, id, fields) => sent.push([coll, id, fields]) };
    publishReportPage(publication, 'report-broken', [{ _id: 'x' }, { _id: 'y' }]);
    assert.deepStrictEqual(sent, [[REPORT_PAGE_COLLECTION, 'report-broken', { ids: ['x', 'y'] }]]);
    // A document with no id is skipped rather than published as a null id.
    sent.length = 0;
    publishReportPage(publication, 'r', [{ _id: 'x' }, {}, null]);
    assert.deepStrictEqual(sent[0][2], { ids: ['x'] });
  });

  test('#4897 People: the server names the page with the publication\'s own window', () => {
    const server = read('server/models/users.js');
    const at = server.indexOf('async getPeoplePageIds(');
    assert.ok(at !== -1, 'the method must exist');
    const method = server.slice(at, at + 1800);
    // Same guard as the count method beside it: this must not become a way to
    // enumerate user ids.
    assert.ok(/check\(query,/.test(method) && /check\(limit, Number\)/.test(method),
      'every argument is checked');
    assert.ok(/canOpenAdminPanel/.test(method), 'admin only');
    assert.ok(/peopleScopeSelector/.test(method),
      'and scoped by the same rule module as the publication');
    // Same page as the publication, or it would name rows that were never sent.
    const pub = read('server/publications/people.js');
    for (const part of ['sort: { createdAt: -1 }', 'limit,', 'skip: skip || 0,']) {
      assert.ok(method.includes(part), `the method must use ${part}`);
      assert.ok(pub.includes(part), `the publication uses ${part}`);
    }
    assert.ok(/fields: \{ _id: 1 \}/.test(method), 'ids only - the documents come from the publication');
  });

  test('#4897 People: every row publishes stable identity and account fields', () => {
    const pub = read('server/publications/people.js');
    for (const field of ['emails', 'createdAt', 'authenticationMethod']) {
      assert.ok(new RegExp(`\\b${field}: 1`).test(pub),
        `the People publication must include ${field}`);
    }
    assert.ok(/sort: \{ createdAt: -1 \}/.test(pub),
      'the publication order must stay stable while the admin scrolls or pages');
  });

  test('#4897 People: the table renders that page and nothing else', () => {
    const client = read('client/components/settings/peopleBody.js');
    assert.ok(/Meteor\.call\('getPeoplePageIds'/.test(client), 'it asks which users the page holds');
    assert.ok(/_id: \{ \$in: ids \}/.test(client), 'and looks up exactly those');
    assert.ok(/docsByIds\(ids, docs\)/.test(client), 'in the server\'s order');
    // The bug itself: reading the page back with the search query.
    assert.ok(!/Users\.find\(tpl\.findUsersOptions\.get\(\)/.test(client),
      'no bare query find - that is what put the admin on every page');
    // Adding or deleting a user changes which users the page holds, and neither
    // the query nor the page number changes with it.
    assert.ok(/peopleListChanged\(\)/.test(client), 'create/delete ask for the page again');
    assert.strictEqual((client.match(/peopleListChanged\(\);/g) || []).length, 2,
      'both the create and the delete handler');
    assert.ok(/peopleListVersion\.get\(\)/.test(client), 'and the table watches that');
  });

  test('Problems: every report over a shared collection names its page', () => {
    const cards = read('server/publications/cards.js');
    assert.ok(/publishReportPage\(this, 'report-broken', cards\)/.test(cards));
    assert.ok(/publishReportPage\(this, 'report-cards', cards\)/.test(cards));
    const boards = read('server/publications/boards.js');
    assert.ok(/publishReportPage\(this, 'report-boards', boards\)/.test(boards));
    // Files and Rules too: opening one card puts its attachments in minimongo, and
    // opening a board's rules editor puts its rules there.
    assert.ok(/publishReportPage\(this, 'report-files', docs \|\| \[\]\)/
      .test(read('server/publications/attachments.js')));
    assert.ok(/publishReportPage\(this, 'report-rules', rules\)/
      .test(read('server/publications/rules.js')));
  });

  test('Problems: a report shows the whole instance, and only to an admin', () => {
    // These are ADMIN reports. Cards, Broken cards, Rules, Impersonation and
    // Recovery always covered the instance; Boards published `userBoardIds(this
    // .userId)` and Files the cards that user could access - the boards and cards
    // the ADMIN happens to be a member of. On an instance whose admin is not a
    // board member that is nothing at all, which is why Boards Report was empty
    // while the Cards report beside it listed cards from thousands of boards.
    // Comments out first: both notes explain the scoping they replaced, by name.
    const code = rel => read(rel).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const boards = code('server/publications/boards.js');
    const boardsPub = boards.slice(boards.indexOf("Meteor.publish('boardsReport'"),
      boards.indexOf("Meteor.publish('boardsReport'") + 1200);
    assert.ok(!/userBoardIds/.test(boardsPub),
      'the Boards report must not be scoped to the admin\'s own boards');
    assert.ok(!/accessibleCardIds/.test(code('server/publications/attachments.js')),
      'the Files report must not be scoped to the admin\'s own cards');
    // Scoping was what kept those two honest, so the guard has to be isAdmin now -
    // in the publication AND in the count method that pages it.
    for (const [file, marker] of [
      ['server/publications/boards.js', "Meteor.publish('boardsReport'"],
      ['server/publications/attachments.js', "Meteor.publish('attachmentsList'"],
      ['server/publications/cards.js', "Meteor.publish('cardsReport'"],
      ['server/publications/cards.js', "Meteor.publish('brokenCardsReport'"],
      ['server/publications/rules.js', "Meteor.publish('rulesReport'"],
    ]) {
      const src = code(file);
      const at = src.indexOf(marker);
      assert.ok(at !== -1, `${marker} must exist`);
      // The guard must be at the TOP of the publication, before it reads anything.
      assert.ok(/isAdmin/.test(src.slice(at, at + 400)), `${marker} must be admin-only`);
    }
    for (const [file, method] of [
      ['server/publications/boards.js', 'getBoardsReportCount'],
      ['server/publications/attachments.js', 'getAttachmentsReportCount'],
    ]) {
      const src = code(file);
      const body = src.slice(src.indexOf(method), src.indexOf(method) + 700);
      assert.ok(/isAdmin/.test(body), `${method} must be admin-only`);
      assert.ok(!/userBoardIds|accessibleCardIds/.test(body),
        `${method} must count the same set the publication pages`);
    }
  });

  test('a per-tenant admin gets NO report data, only their own tenant\'s People', () => {
    // Admin Panel / Problems is instance-wide, so it is site-admin only
    // (docs/Design/Multitenancy/Multitenancy.md, D.7): 'problems' is not one of a
    // tenant admin's tabs, and every report guard below asks for the SITE flag
    // `user.isAdmin` - which a per-tenant Global Admin does not have; theirs is
    // `orgs[].isAdmin`. This matters now that the Boards and Files reports are
    // instance-wide: the guard is the only thing scoping them.
    const rules = read('models/lib/tenantAdmin.js');
    const tabs = /const TENANT_ADMIN_TABS = \[([^\]]*)\]/.exec(rules);
    assert.ok(tabs, 'the tenant admin tab list must exist');
    assert.ok(!/problems/.test(tabs[1]), 'Problems is not a tenant admin tab');
    const code = rel => read(rel).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const reportGuards = [
      ['server/publications/cards.js', ["Meteor.publish('cardsReport'",
        "Meteor.publish('brokenCardsReport'", 'getCardsReportCount', 'getBrokenCardsReportCount']],
      ['server/publications/boards.js', ["Meteor.publish('boardsReport'", 'getBoardsReportCount']],
      ['server/publications/attachments.js', ["Meteor.publish('attachmentsList'",
        'getAttachmentsReportCount']],
      ['server/publications/rules.js', ["Meteor.publish('rulesReport'", 'getRulesReportCount']],
      ['server/publications/impersonationReport.js', ["Meteor.publish('impersonationReport'",
        'getImpersonationReportCount']],
      ['server/publications/recoveryReport.js', ["Meteor.publish('recoveryReport'",
        'getRecoveryReportCount']],
    ];
    for (const [file, markers] of reportGuards) {
      const src = code(file);
      for (const marker of markers) {
        const head = src.slice(src.indexOf(marker), src.indexOf(marker) + 500);
        assert.ok(/isAdmin/.test(head), `${marker} must ask for the site admin flag`);
        assert.ok(!/canOpenAdminPanel/.test(head),
          `${marker} must NOT accept a per-tenant admin: Problems is instance-wide`);
      }
    }
    // The one admin list a tenant admin DOES get is People, and it is scoped to the
    // orgs they administer - the page, its ids and its total all through the same
    // rule module, so the pager cannot count rows the page may not show.
    const users = code('server/models/users.js');
    for (const method of ['getPeoplePageIds', 'getUsersCollectionCount']) {
      const body = users.slice(users.indexOf(method), users.indexOf(method) + 1400);
      assert.ok(/canOpenAdminPanel/.test(body), `${method} is open to a tenant admin`);
      assert.ok(/peopleScopeSelector/.test(body), `${method} must be tenant-scoped`);
    }
    assert.ok(/peopleScopeSelector/.test(code('server/publications/people.js')),
      'and so is the publication they page');
  });

  test('every report publishes into the collection its pane reads', () => {
    // A name typo here is invisible: the publication succeeds, the client drops the
    // documents, and the report is simply empty.
    const declared = new Set(['users']); // accounts' own collection
    for (const file of fs.readdirSync(path.join(ROOT, 'models'))) {
      if (!file.endsWith('.js')) continue;
      const src = read(`models/${file}`);
      for (const m of src.matchAll(/new Mongo\.Collection\(\s*'([^']+)'/g)) declared.add(m[1]);
      for (const m of src.matchAll(/collectionName:\s*'([^']+)'/g)) declared.add(m[1]);
    }
    for (const file of ['server/publications/attachments.js', 'server/publications/rules.js',
      'server/publications/boards.js', 'server/publications/cards.js',
      'server/publications/impersonationReport.js', 'server/publications/recoveryReport.js']) {
      for (const m of read(file).matchAll(/this\.added\(\s*'([^']+)'/g)) {
        assert.ok(declared.has(m[1]) || m[1] === REPORT_PAGE_COLLECTION,
          `${file} publishes into '${m[1]}', which no model declares`);
      }
    }
  });

  test('Problems: and the pane renders the named page', () => {
    const client = read('client/components/settings/adminProblems.js');
    // From REPORT_TABLES on: each report id appears earlier in reportConfig too.
    const tables = client.slice(client.indexOf('const REPORT_TABLES = {'));
    for (const reportId of ['report-broken', 'report-cards', 'report-boards']) {
      const at = tables.indexOf(`'${reportId}': {`);
      assert.ok(at !== -1, `${reportId} is a report table`);
      const spec = tables.slice(at, at + 700);
      assert.ok(new RegExp(`docs: \\(\\) => reportPageResults\\([A-Za-z]+, '${reportId}'\\)`).test(spec),
        `${reportId} must render the page the publication named`);
      assert.ok(!/docs: \(\) => collectionResults\((Cards|Boards)/.test(spec),
        `${reportId} must not render everything the collection happens to hold`);
    }
    // The client side of the DDP-only index collection, from the shared name.
    // It USED to be declared here; it moved to client/lib/reportPages.js because
    // `new Mongo.Collection(name)` throws if the name is taken, so the second page
    // to need it (/public, docs/Features/Page/Public.md) could not have one. What
    // this guards is unchanged: declared once, from the shared constant, never
    // from a typed string.
    const shared = read('client/lib/reportPages.js');
    assert.ok(/new Mongo\.Collection\(REPORT_PAGE_COLLECTION\)/.test(shared),
      'the index collection is declared from the shared constant, not a typed string');
    assert.ok(/import \{ ReportPages \} from '\/client\/lib\/reportPages'/.test(client),
      'and the Problems pane imports that one rather than declaring its own');
    // On the CODE: the comment there names the call to explain why it moved, and
    // a guard that reads its own explanation fails on it.
    const clientCode = client.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/new Mongo\.Collection\(/.test(clientCode),
      'a second declaration of the same name would throw at load');
    assert.ok(/docsByIds\(ids, collection\.find\(\{ _id: \{ \$in: ids \} \}\)\.fetch\(\)\)/.test(client),
      'and the page is looked up by those ids, in that order');
  });

  console.log(`\n${passed} tests passed`);
})();
