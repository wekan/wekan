'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'imports/i18n/data', `${code}.i18n.json`)));
const en = read('en');
const available = Object.hasOwn(en, 'email-to-card');
const keys = Object.keys(en).filter(key => key.startsWith('email-to-card') || /^inbound-(?:domain|account)-/.test(key));
// The feature is being developed separately. On branches predating its source
// strings these cases explicitly skip; once present they enforce all its keys.
for (const code of ['cmn', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG', 'zh-HK', 'zh-Hant', 'zh-TW']) {
  test(`email-to-card permissions, secrets and destructive choices in ${code}`, { skip: !available }, async () => {
    const data = read(code);
    const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
    assert.ok(keys.length >= 49);
    for (const key of keys) {
      assert.equal(typeof data[key], 'string', `${code}:${key}`);
      assert.notEqual(data[key], en[key], `${code}:${key}`);
      assert.match(data[key], /\p{Script=Han}/u, `${code}:${key}`);
      assert.deepEqual(translationTokens(data[key]), translationTokens(en[key]), `${code}:${key}`);
    }
    const trad = ['zh-HK', 'zh-Hant', 'zh-TW'].includes(code);
    assert.match(data['email-to-card-address-private'], /保密.*任何.*以.*(身份|身分).*(添加|新增)卡片/);
    assert.match(data['email-to-card-new-address'], trad ? /舊地址.*失效/ : /旧地址.*失效/);
    assert.match(data['email-to-card-off-not-authorized'], trad ? /寫入權限/ : /写入权限/);
    assert.doesNotMatch(data['email-to-card-off-not-authorized'], /只读|唯讀/);
    assert.match(data['email-to-card-secret-saved'], /留空.*(保留|保持不变|保持不變)/);
    assert.match(data['email-to-card-clear-secret'], /(删除|刪除|移除).*Webhook.*(密钥|密鑰|金鑰)/);
    assert.match(data['email-to-card-imap-after-seen'], trad ? /已讀/ : /已读/);
    assert.match(data['email-to-card-imap-after-delete'], trad ? /刪除/ : /删除/);
    assert.notEqual(data['email-to-card-imap-after-delete'], data['email-to-card-imap-after-seen']);
    assert.match(data['email-to-card-sandstorm-board-none'], trad ? /僅.*主旨.*權杖/ : /仅.*(标题|主题).*(令牌)/);
    assert.match(data['email-to-card-sandstorm-subject'], /(你本人身份|您本人身份|您本人身分)/);
    assert.match(data['email-to-card-off-admin-off'], /尚未/);
    assert.match(data['email-to-card-off-board-off'], /尚未/);
    assert.match(data['email-to-card-off-member-off'], trad ? /關閉/ : /关闭/);
    assert.match(data['email-to-card-part-strip-quoted'], /省略.*引用/);
    for (const literal of ['Mailgun', 'SendGrid', 'Postmark', 'MIME']) assert.ok(data['email-to-card-webhook'].includes(literal));
    assert.ok(data['inbound-account-invalid'].includes('IMAP'));
    assert.match(data['inbound-domain-invalid'], /不是有效/);
  });
}
