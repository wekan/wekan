'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {siteLogoField, siteLogoImageType, isActiveSiteLogo} = require('../models/lib/siteLogo');

test('logo uploads accept raster image signatures and reject disguised content', () => {
 assert.deepEqual(siteLogoImageType(Buffer.from('89504e470d0a1a0a', 'hex')), ['image/png', '.png']);
 assert.deepEqual(siteLogoImageType(Buffer.from('ffd8ff', 'hex')), ['image/jpeg', '.jpg']);
 assert.deepEqual(siteLogoImageType(Buffer.from('GIF89a')), ['image/gif', '.gif']);
 assert.deepEqual(siteLogoImageType(Buffer.from('524946460000000057454250', 'hex')), ['image/webp', '.webp']);
 assert.equal(siteLogoImageType(Buffer.from('<script>alert(1)</script>')), null);
});

test('only the active configured site logo is public', () => {
 const file = {_id:'abc', type:'image/png', meta:{source:'site-logo'}};
 assert.equal(siteLogoField('login'), 'customLoginLogoImageUrl');
 assert.equal(siteLogoField('header'), 'customTopLeftCornerLogoImageUrl');
 assert.equal(siteLogoField('other'), undefined);
 assert.equal(isActiveSiteLogo(file, {customLoginLogoImageUrl:'/cdn/storage/attachments/abc'}, 'abc'), true);
 assert.equal(isActiveSiteLogo(file, {customTopLeftCornerLogoImageUrl:'/wekan/cdn/storage/attachments/abc'}, 'abc'), true);
 assert.equal(isActiveSiteLogo(file, {customLoginLogoImageUrl:'/cdn/storage/attachments/old'}, 'abc'), false);
 assert.equal(isActiveSiteLogo({...file, meta:{source:'card'}}, {customLoginLogoImageUrl:'/cdn/storage/attachments/abc'}, 'abc'), false);
 assert.equal(isActiveSiteLogo({...file, type:'text/html'}, {customLoginLogoImageUrl:'/cdn/storage/attachments/abc'}, 'abc'), false);
 assert.equal(isActiveSiteLogo(file, {customLoginLogoImageUrl:'/cdn/storage/attachments/xabc'}, 'abc'), false);
});

test('login and header logos wait for settings before choosing stock or custom images', () => {
 const root = path.resolve(__dirname, '..');
 const login = fs.readFileSync(path.join(root, 'client/components/main/layouts.jade'), 'utf8');
 const header = fs.readFileSync(path.join(root, 'client/components/main/header.jade'), 'utf8');
 assert.match(login, /if logoSettingsReady[\s\S]*?if currentSetting\.customLoginLogoImageUrl[\s\S]*?else\n\s+img\(src="\{\{pathFor '\/wekan-logo\.svg'\}\}"/);
 assert.match(header, /if logoSettingsReady[\s\S]*?if currentSetting\.customTopLeftCornerLogoImageUrl[\s\S]*?unless currentSetting\.customTopLeftCornerLogoImageUrl[\s\S]*?logo-header\.png/);
});
