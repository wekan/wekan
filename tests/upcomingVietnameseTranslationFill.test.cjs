'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
for (const language of ['vi', 'vi-VN']) {
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  assert.strictEqual(translated.checklist, 'Danh sách kiểm tra');
  assert.match(translated['font-preview-text'], /[ăâúóư]/u);
  assert.strictEqual(translated['gcs-bucket'], 'Nhóm chứa');
}
console.log('upcomingVietnameseTranslationFill: 6 tests passed');

(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const { execFileSync } = require('node:child_process');
  const english = JSON.parse(fs.readFileSync(path.join(ROOT, 'imports/i18n/data/en.i18n.json'), 'utf8'));
  for (const language of ['vi', 'vi-VN']) {
    const locale = JSON.parse(fs.readFileSync(path.join(ROOT, `imports/i18n/data/${language}.i18n.json`), 'utf8'));
    assert.deepStrictEqual(Object.keys(locale), Object.keys(english));
    for (const key of Object.keys(english)) {
      assert.deepStrictEqual(translationTokens(locale[key]), translationTokens(english[key]), `${language}:${key}`);
    }
    assert.deepStrictEqual(JSON.parse(execFileSync(process.execPath,
      ['releases/translations/fill-translations.mjs', '--list', language],
      { cwd: ROOT, encoding: 'utf8' })), {});
    assert.match(locale['custom-field-links-hint'], /cùng tên và kiểu trên cả hai thẻ/);
    assert.match(locale['custom-field-links-hint'], /chỉ có trên một thẻ được giữ nguyên/);
    assert.match(locale['custom-field-link-inactive'], /không còn quyền sửa cả hai thẻ.*đã được lưu trữ/);
    assert.match(locale['custom-field-link-both'], /Hai chiều.*thẻ nào cũng/);
    assert.match(locale['custom-field-link-send'], /Một chiều.*sang thẻ chính/);
    assert.match(locale['field-link-not-allowed'], /quyền sửa cả hai thẻ/);
    assert.equal(locale['import-members-mode-me'], 'Thay tất cả bằng tài khoản của tôi');
    assert.match(locale['import-many-boards-hint'], /không ánh xạ thành viên/);
    assert.match(locale['import-many-boards-hint'], /vốn là một bản xuất duy nhất.*là một bảng/);
    assert.match(locale['export-all-boards-hint'], /có quyền xuất.*sổ làm việc.*\.zip/);
    assert.match(locale['webhook-payload-description'], /giữ nguyên thiết lập kế thừa/);
    assert.match(locale['notification-delivery-quiet'], /chờ đến khi kết thúc/);
    assert.match(locale['r-wrike-workflow-note'], /đã hoàn thành.*Completed.*Cancelled.*chưa hoàn thành.*Active.*Deferred/);
    for (const literal of ['GET /workflows', 'Active', 'Completed', 'Deferred', 'Cancelled']) assert.ok(locale['r-wrike-workflow-note'].includes(literal));
    assert.ok(locale['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
    for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(locale['import-board-instruction-orgmode'].includes(literal));
    assert.match(locale['subtask-mark-done'], /đã xong$/);
    assert.match(locale['subtask-mark-not-done'], /chưa xong$/);
    assert.match(locale['scrum-import-into-board-hint'], /không tạo bản sao.*không khớp được liệt kê và giữ nguyên/);
    assert.match(locale['sync-planning-hint'], /chỉ được đồng bộ khi Scrum được bật.*mã định danh nguồn trước, rồi theo tên/);
    assert.match(locale['sync-planning-hint'], /Thay đổi kế hoạch cục bộ được giữ lại.*lần đồng bộ đầu tiên không bao giờ xóa kế hoạch/);
    assert.match(locale['scrum-import-card-on-another-board'], /thuộc bảng khác và được giữ nguyên/);
    assert.match(locale['scrum-import-sprint-finished'], /không được chuyển vào sprint đã kết thúc/);
    assert.match(locale['stuck-sync-operation-discard-confirm'], /đã áp dụng được giữ lại.*không bao giờ được ghi/);
    assert.match(locale['stuck-sync-operation-replayable'], /sẽ tự hoàn tất.*không bị loại bỏ/);
    assert.match(locale['interrupted-import-description'], /tệp nguồn không được lưu giữ.*kể cả nội dung được thêm sau đó/);
    assert.match(locale['interrupted-import-keep-confirm'], /Không có gì bị xóa/);
    assert.match(locale['interrupted-import-discard-confirm'], /mọi thứ trên đó sẽ bị xóa vĩnh viễn/);
    assert.match(locale['interrupted-import-foreign-board'], /không được tạo bởi lần nhập này.*không bị tác động/);
    assert.match(locale['scrum-history-checkpoint-hint'], /chỉ có khi không ai khác thay đổi.*không thay đổi bản ghi nào/);
    assert.notEqual(locale['scrum-history-checkpoint-rollback'], locale['scrum-history-checkpoint-discard']);
    assert.match(locale['login-setting-env-only'], /Chỉ môi trường máy chủ.*chỉ đọc/);
  }
  console.log('Vietnamese current catalogs, exact tokens and import/recovery semantics verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
