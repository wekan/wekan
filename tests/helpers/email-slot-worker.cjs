'use strict';
const { MongoClient } = require('mongodb');
const { createEmailSendSlots } = require('../../server/lib/emailSendSlots');
(async () => {
  const client = await new MongoClient(process.env.WEKAN_SYNC_TEST_MONGO_URL).connect();
  try {
    const run = createEmailSendSlots(client.db(process.argv[2]).collection('slots'),
      { limit: 1, leaseMs: 300, heartbeatMs: 50 });
    await run(async () => {
      process.send({ state: 'held' });
      await new Promise(resolve => process.once('message', resolve));
    });
    process.send({ state: 'released' });
  } catch (error) { process.send({ state: 'error', code: error.code }); }
  finally { await client.close(); process.disconnect(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
