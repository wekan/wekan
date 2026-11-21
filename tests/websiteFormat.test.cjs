'use strict';

// Websites as boards and boards as websites: models/lib/websiteFormat.js (the
// mapping and the writers), server/lib/websiteImport.js (the readers, with
// the real htmlparser2, unzipper and fflate) and models/lib/websiteView.js
// (Board View / Website). Run: node tests/websiteFormat.test.cjs

const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const ROOT = path.join(__dirname, '..');
// The app's absolute paths, as Meteor resolves them.
const origResolve = Module._resolveFilename;
Module._resolveFilename = function resolve(request, ...rest) {
  if (/^\/(models|server|imports)\//.test(request)) {
    return origResolve.call(this, path.join(ROOT, request.slice(1)) + (/\.\w+$/.test(request) ? '' : '.js'), ...rest);
  }
  return origResolve.call(this, request, ...rest);
};

const { zipSync, strToU8 } = require('fflate');
const zip = files => ({ zipBase64: Buffer.from(zipSync(Object.fromEntries(Object.entries(files)
  .map(([k, v]) => [k, typeof v === 'string' ? strToU8(v) : v])))).toString('base64') });

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

(async () => {
  const W = await import('../models/lib/websiteFormat.js');
  const R = require('../server/lib/websiteImport.js');
  const V = require('../models/lib/websiteView.js');

  // What WeKan's export collects of a board (models/lib/externalExporters.js).
  const collected = {
    board: { title: 'My <Site>' },
    items: [
      { cardId: 'a', title: 'About us', description: '# Who\n\nWe **build** things.', listTitle: 'Published', swimlaneTitle: 'Pages',
        createdAt: '2024-01-01T00:00:00.000Z', labels: ['company'], creator: 'anna', comments: [] },
      { cardId: 'b', parentCardId: 'a', title: 'Team', description: 'The team.', listTitle: 'Published', swimlaneTitle: 'Pages',
        createdAt: '2024-01-02T00:00:00.000Z', labels: [] },
      { cardId: 'c', title: 'Hello world', description: 'First post <script>alert(1)</script>', listTitle: 'Published',
        swimlaneTitle: 'Posts', createdAt: '2024-02-03T10:00:00.000Z', labels: ['news'], creator: 'anna',
        comments: [{ author: 'ben', text: 'Nice', date: '2024-02-04T00:00:00.000Z' }] },
      { cardId: 'd', title: 'Not yet', description: 'Draft text', listTitle: 'Draft', swimlaneTitle: 'Posts', createdAt: '2024-03-01T00:00:00.000Z', labels: [] },
    ],
  };

  test('WordPress WXR: written as WordPress exports it, and read back into the same board', () => {
    const wxr = W.formatWxr(collected, { now: new Date('2024-05-01T00:00:00Z') });
    assert.match(wxr, /<wp:wxr_version>1\.2<\/wp:wxr_version>/);
    assert.match(wxr, /<wp:post_type><!\[CDATA\[page\]\]><\/wp:post_type>/);
    assert.match(wxr, /<wp:post_parent>1<\/wp:post_parent>/, 'Team is under About us');
    assert.match(wxr, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/, 'negative: a card\'s HTML is escaped, never written as markup');
    const { items, name } = R.readWxr(wxr);
    assert.equal(name, 'My <Site>');
    const board = W.siteBoard(items, { name });
    assert.deepEqual(board.columns.map(c => c.title), ['Published', 'Draft']);
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Pages', 'Posts']);
    const hello = board.tasks.find(t => t.title === 'Hello world');
    assert.equal(hello.column_name, 'Published');
    assert.deepEqual(hello.tags, ['news']);
    assert.equal(hello.comments[0].authorName, 'ben');
    assert.equal(hello.date_creation, '2024-02-03T10:00:00.000Z');
    assert.equal(board.tasks.find(t => t.title === 'Team').parent_ref, '1');
    assert.match(board.tasks.find(t => t.title === 'About us').description, /^# Who\n\nWe \*\*build\*\* things\.$/);
  });

  test('WordPress WXR: attachments, menus and trash are not pages; a real export\'s shape is read', () => {
    const wxr = `<?xml version="1.0"?><rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>Blog</title>
      <item><title>Post</title><dc:creator><![CDATA[admin]]></dc:creator><content:encoded><![CDATA[<p>Text <img src="https://example.com/a.jpg" alt="A"></p><!-- wp:paragraph -->]]></content:encoded>
        <wp:post_id>5</wp:post_id><wp:post_date_gmt>2023-04-05 06:07:08</wp:post_date_gmt><wp:status>publish</wp:status><wp:post_type>post</wp:post_type>
        <category domain="category" nicename="uncategorized"><![CDATA[Uncategorized]]></category><category domain="category" nicename="dev"><![CDATA[Dev]]></category></item>
      <item><title>image</title><wp:post_type>attachment</wp:post_type><wp:status>inherit</wp:status></item>
      <item><title>Old</title><wp:post_type>post</wp:post_type><wp:status>trash</wp:status></item>
      <item><title>Menu</title><wp:post_type>nav_menu_item</wp:post_type><wp:status>publish</wp:status></item>
    </channel></rss>`;
    const { items, unsupported } = R.readWxr(wxr);
    assert.deepEqual(items.map(i => i.title), ['Post']);
    assert.equal(items[0].date, '2023-04-05T06:07:08.000Z');
    assert.equal(unsupported.length, 1, 'the media item is reported');
    const board = W.siteBoard(items);
    assert.deepEqual(board.tasks[0].tags, ['Dev'], 'Uncategorized is no label');
    assert.match(board.tasks[0].description, /Text/);
    assert.doesNotMatch(board.tasks[0].description, /wp:paragraph/, 'block comments are gone');
    assert.throws(() => R.readWxr('<rss><channel><item><title>x</title></item></channel></rss>'), /Not a WordPress export/);
  });

  test('WordPress REST API, Ghost and Blogger: each written and read back', () => {
    const rest = W.formatWordPressJson(collected);
    assert.equal(rest[2].title.rendered, 'Hello world');
    const fromRest = W.siteBoard(R.readWordPressJson(JSON.stringify(rest)).items);
    assert.deepEqual(fromRest.tasks.map(t => [t.title, t.column_name, t.swimlane_name]).slice(2),
      [['Hello world', 'Published', 'Posts'], ['Not yet', 'Draft', 'Posts']]);
    assert.throws(() => R.readWordPressJson('[{"id":1}]'), /Not WordPress REST API JSON/);

    const ghost = W.formatGhost(collected, { now: new Date(0) });
    assert.equal(ghost.db[0].data.posts[3].status, 'draft');
    const fromGhost = R.readGhost(ghost);
    assert.deepEqual(fromGhost.items.map(i => [i.title, i.type, i.status]), [['About us', 'page', 'publish'], ['Team', 'page', 'publish'],
      ['Hello world', 'post', 'publish'], ['Not yet', 'post', 'draft']]);
    assert.deepEqual(fromGhost.items[2].tags, ['news']);
    assert.throws(() => R.readGhost({ db: [{ data: {} }] }), /Not a Ghost export/);

    const atom = W.formatBlogger(collected, { now: new Date(0) });
    const fromBlogger = R.readBlogger(atom);
    assert.deepEqual(fromBlogger.items.map(i => [i.title, i.type, i.status]), [['About us', 'page', 'publish'], ['Team', 'page', 'publish'],
      ['Hello world', 'post', 'publish'], ['Not yet', 'post', 'draft']]);
    assert.equal(fromBlogger.items[2].comments[0].author, 'ben');
    assert.throws(() => R.readBlogger('<feed><id>x</id></feed>'), /Not a Blogger export/);
  });

  test('a Markdown site (Hugo, Jekyll) .zip: front matter, posts by folder or date, images attached', async () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const value = zip({
      'site/content/about.md': '---\ntitle: "About"\ntags: [company, team]\n---\n\nWe build ![logo](images/logo.png).\n',
      'site/content/images/logo.png': png,
      'site/_posts/2024-02-03-hello-world.md': '---\ntitle: Hello world\ncategories:\n  - news\ndraft: false\n---\nFirst post.\n',
      'site/content/posts/wip.md': '+++\ntitle = "Work in progress"\ndraft = true\n+++\nSoon.\n',
      'site/README.md': '# not a page',
    });
    const { items } = await R.readMarkdownSite(value);
    const by = t => items.find(i => i.title === t);
    assert.deepEqual(items.map(i => i.title).sort(), ['About', 'Hello world', 'Work in progress']);
    assert.equal(by('About').type, 'page');
    assert.deepEqual(by('About').tags, ['company', 'team']);
    assert.equal(by('About').attachments[0].name, 'logo.png');
    assert.equal(by('Hello world').type, 'post');
    assert.equal(by('Hello world').date, '2024-02-03');
    assert.deepEqual(by('Hello world').categories, ['news']);
    assert.equal(by('Work in progress').status, 'draft', 'Hugo\'s TOML front matter');
    await assert.rejects(R.readMarkdownSite(zip({ 'a.txt': 'x' })), /no Markdown pages/);

    const { files } = W.markdownSiteFiles(collected);
    assert.match(files['content/pages/about-us.md'], /^---\ntitle: "About us"\n/);
    assert.match(files['content/posts/2024-03-01-not-yet.md'], /draft: true/);
  });

  test('an HTML site .zip and Medium: the page\'s main text, never its scripts; index first', async () => {
    const value = zip({
      'index.html': '<html><head><title>Home</title><script>steal()</script></head><body><nav>menu</nav><main><h1>Home</h1><p>Welcome <img src="pic.jpg"></p></main></body></html>',
      'pic.jpg': new Uint8Array([255, 216, 255]),
      'posts/2024-01-01_Hello-abc123.html': '<html><body><article><h1>Hello</h1><time datetime="2024-01-01T00:00:00Z">Jan 1</time><p>Post</p></article></body></html>',
      'posts/draft_Later-def.html': '<html><body><article><h1>Later</h1></article></body></html>',
    });
    const { items } = await R.readHtmlSite(value);
    assert.deepEqual(items.map(i => [i.title, i.type, i.status]), [['Home', 'page', 'publish'], ['Hello', 'post', 'publish'], ['Later', 'post', 'draft']]);
    assert.doesNotMatch(items[0].html, /steal|menu/, 'negative: no scripts, no navigation');
    assert.equal(items[0].attachments[0].name, 'pic.jpg');
    assert.equal(items[1].date, '2024-01-01T00:00:00Z');
    const board = W.siteBoard(items);
    assert.match(board.tasks[0].description, /Welcome/);

    const { files } = W.htmlSiteFiles(collected);
    assert.ok(files['index.html'] && files['about-us.html'] && files['posts/hello-world.html'] && files['style.css']);
    assert.equal(Object.keys(files).some(f => /not-yet/.test(f)), false, 'negative: a draft is not on the exported site');
    assert.doesNotMatch(files['posts/hello-world.html'], /<script/i, 'negative: no script from a card reaches the site');
    assert.match(files['index.html'], /<a href="posts\/hello-world\.html">Hello world<\/a>/);
    assert.match(files['posts/hello-world.html'], /href="\.\.\/style\.css"/);
  });

  test('Substack: posts.csv and the posts\' HTML', async () => {
    const value = zip({
      'posts.csv': 'post_id,post_date,is_published,title,subtitle\n123.hello,2024-01-05T00:00:00Z,true,Hello,Sub\n124.wip,,false,Later,\n',
      'posts/123.hello.html': '<p>Body</p>',
    });
    const { items } = await R.readSubstack(value);
    assert.deepEqual(items.map(i => [i.title, i.status, i.slug]), [['Hello', 'publish', 'hello'], ['Later', 'draft', 'wip']]);
    await assert.rejects(R.readSubstack(zip({ 'x.csv': 'a' })), /no posts\.csv/);
  });

  test('negative: an empty site, or one of other things only, is refused; a site\'s script never becomes markup', () => {
    assert.throws(() => W.siteBoard([]), /no pages or posts/);
    assert.throws(() => W.siteBoard([{ type: 'attachment', status: 'publish' }]), /no pages or posts/);
    const board = W.siteBoard([{ type: 'post', status: 'publish', title: 'x', html: '<p>ok</p><script>alert(1)</script><img src=x onerror=alert(1)>' }]);
    assert.doesNotMatch(board.tasks[0].description, /<script|onerror/i);
    assert.equal(W.markdownHtml('<b>x</b>'), '<p>&lt;b&gt;x&lt;/b&gt;</p>\n', 'raw HTML in Markdown is escaped on the way out');
  });

  test('Board View / Website: Published only, Pages as the menu with subpages, posts newest first', () => {
    const site = V.websiteOf({
      lists: [{ _id: 'pub', title: 'Published', sort: 0 }, { _id: 'dr', title: 'Draft', sort: 1 }],
      swimlanes: [{ _id: 'pg', title: 'Pages' }, { _id: 'po', title: 'Posts' }],
      cards: [
        { _id: 'about', title: 'About', listId: 'pub', swimlaneId: 'pg', sort: 1 },
        { _id: 'team', title: 'Team', listId: 'pub', swimlaneId: 'pg', sort: 2, parentId: 'about' },
        { _id: 'old', title: 'Old', listId: 'pub', swimlaneId: 'po', createdAt: '2024-01-01' },
        { _id: 'new', title: 'New', listId: 'pub', swimlaneId: 'po', createdAt: '2024-03-01' },
        { _id: 'draft', title: 'Draft', listId: 'dr', swimlaneId: 'po', createdAt: '2025-01-01' },
        { _id: 'gone', title: 'Gone', listId: 'pub', swimlaneId: 'po', archived: true },
      ],
    });
    assert.deepEqual(site.pages, [{ _id: 'about', title: 'About', children: [{ _id: 'team', title: 'Team' }] }]);
    assert.deepEqual(site.posts.map(p => p.title), ['New', 'Old']);
    assert.deepEqual(V.pageFor(site, 'team'), { cardId: 'team' });
    assert.deepEqual(V.pageFor(site, 'draft'), { posts: true }, 'negative: a draft is not shown by its id');
    assert.deepEqual(V.pageFor(site, 'gone'), { posts: true }, 'negative: nor an archived card');
    const pagesOnly = V.websiteOf({ lists: [{ _id: 'l', title: 'Todo' }], swimlanes: [{ _id: 's', title: 'Pages' }],
      cards: [{ _id: 'home', title: 'Home', listId: 'l', swimlaneId: 's' }] });
    assert.deepEqual(pagesOnly.home, { cardId: 'home' }, 'no Published list: every list; no posts: the first page');
  });

  for (const [name, fn] of tests) {
    await fn();
    console.log('  ok -', name);
  }
  console.log(`\nwebsiteFormat: ${tests.length} tests passed`);
})().catch(e => { console.error(e); process.exitCode = 1; });
