'use strict';
// vi and vi-VN were partly seeded with Malay and Indonesian: "Komen" for
// Comments, "Hapus komen?", "Anda pasti untuk ...", "Tambah Daftar", the
// colours, Planning Poker, the Node heap statistics, the e-mail templates and
// more (2026-11-21: 283 values). A locale file holds its declared language,
// so they are Vietnamese now. This keeps them out: no value of either file
// has a word that is Malay or Indonesian and never Vietnamese, and every
// placeholder matches English.
// Run: node tests/vietnameseNotMalay.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = tag => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'imports/i18n/data', `${tag}.i18n.json`), 'utf8'));
const en = read('en');
// Words of Malay and Indonesian that are not Vietnamese (nor the product,
// format and tool names that stay in English).
const MALAY = /\b(komen|hapus|anda|pasti|hanya|peruntukkan|untuk|dengan|tidak|sudah|tambah|tambahkan|papan|kad|kadmini|senarai|senaraisemak|tetapan|simpan|batal|daftar|ruang|kerja|gambar|sampul|kartu|latar|belakang|papar|ubah|semula|didayakan|dayakan|pengguna|organisasi|pasukan|timbunan|lampiran|pindah|perincian|sahkan|saiz|storan|judul|teks|terjemahan|pesanan|warna|pilihan|merah|biru|hijau|kuning|putih|hitam|ungu|jingga|kelabu|emas|perak|coklat|undian|siapa|tamat|jadual|bulan|sebelum|depan|tiada|ditemui|selesai|tutup|buka|tangguh|permohonan|tiket|tajuk|laluan|kelajuan|perkembangan|katalaluan|akaun|lupa|emel|alamat|eksport|salin|templat|bekas|pemintal|tunggu|besarkan|kecilkan|laporan|pencipta|sembunyikan|lalai|pekerja|baca|sahaja)\b/i;
const tokens = text => (String(text).match(/__\w+__|%\d*\$?[sd]/g) || []).sort();
let passed = 0;
for (const tag of ['vi', 'vi-VN']) {
  const data = read(tag);
  const malay = Object.entries(data).filter(([key, value]) => MALAY.test(value) && value !== en[key]).map(([key, value]) => `${key}: ${value}`);
  assert.deepEqual(malay, [], `${tag}: Malay or Indonesian values`);
  for (const [key, value] of Object.entries(data)) assert.deepEqual(tokens(value), tokens(en[key] || value), `${tag} ${key} placeholders`);
  assert.equal(data.comments, 'Bình luận');
  assert.equal(data.comment, 'Bình luận');
  assert.equal(data['deleteCommentPopup-title'], 'Xóa bình luận?');
  assert.equal(data['comment-delete'], 'Bạn có chắc chắn muốn xóa bình luận này không?');
  passed += 1;
}
// Negative: the check finds a Malay value.
assert.ok(MALAY.test('Hapus komen?') && !MALAY.test('Xóa bình luận?'));
console.log(`vietnameseNotMalay: ${passed + 1} checks passed`);
