'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/mai.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["attachment-limit-unit-bytes","Platform","MongoDB_version","MongoDB_storage_engine","MongoDB_Oplog_enabled","settings-group-logo","map-region-asia","s3-file-id","s3-minio-storage-description","s3-disabled","mongodb-gridfs-storage","s3-access-key","s3-bucket","s3-bucket-description","s3-connection-failed","s3-connection-success","s3-enabled","s3-endpoint","s3-endpoint-description","s3-minio-storage","s3-port","s3-port-description","s3-region","s3-secret-key","s3-secret-key-required","s3-settings-saved","s3-ssl-enabled","s3-attachments","s3-size"];
test('Maithili storage translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Maithili storage descriptions retain providers and endpoint examples',()=>{
 for(const term of ['AWS S3','MinIO','Cloudflare R2','Backblaze B2','Wasabi','DigitalOcean Spaces']) assert.ok(locale['s3-minio-storage-description'].includes(term));
 for(const term of ['URL','s3.amazonaws.com','minio.example.com']) assert.ok(locale['s3-endpoint-description'].includes(term));
 assert.ok(locale['s3-ssl-enabled'].includes('SSL'));
 assert.ok(locale['MongoDB_Oplog_enabled'].includes('Oplog'));
 assert.notEqual(locale['s3-connection-success'],locale['s3-connection-failed']);
 assert.notEqual(locale['s3-access-key'],locale['s3-secret-key']);
});
