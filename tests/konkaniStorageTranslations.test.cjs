'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/kok.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["attachment-limit-unit-bytes","Platform","OS","MongoDB_version","MongoDB_storage_engine","MongoDB_Oplog_enabled","settings-group-logo","dueCardsViewChange-choice-me","map-region-usa","map-region-asia","s3-file-id","mongodb-compact","s3-minio-storage-description","s3-disabled","mongodb-gridfs-storage","s3-access-key","s3-bucket","s3-bucket-description","s3-connection-failed","s3-connection-success","s3-enabled","s3-endpoint","s3-endpoint-description","s3-minio-storage","s3-port","s3-port-description","s3-region","s3-secret-key","s3-secret-key-required","s3-settings-saved","s3-ssl-enabled","s3-attachments","s3-size"];
test('Konkani storage translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Konkani storage labels retain identifiers and configuration distinctions',()=>{
 for(const name of ['AWS S3','MinIO','Cloudflare R2','Backblaze B2','Wasabi','DigitalOcean Spaces']) assert.ok(locale['s3-minio-storage-description'].includes(name),name);
 for(const host of ['s3.amazonaws.com','minio.example.com']) assert.ok(locale['s3-endpoint-description'].includes(host),host);
 assert.notEqual(locale['s3-connection-failed'],locale['s3-connection-success']);
 assert.notEqual(locale['s3-access-key'],locale['s3-secret-key']);
 assert.ok(locale['s3-secret-key-required'].includes('\u091c\u093e\u092f'));
 assert.ok(locale['s3-disabled'].includes('\u0905\u0915\u094d\u0937\u092e'));
 assert.ok(locale['s3-ssl-enabled'].includes('SSL'));
 assert.ok(locale['MongoDB_Oplog_enabled'].includes('Oplog'));
 assert.ok(locale['s3-port-description'].includes('\u0915\u094d\u0930\u092e\u093e\u0902\u0915'));
});
