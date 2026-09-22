import { Meteor } from 'meteor/meteor';
import { Instrumentation } from 'meteor/instrumentation';

const { TYPES, createInstrumentationSummary } = require('/server/lib/instrumentationSummary.cjs');
const summary = createInstrumentationSummary();

for (const type of TYPES) {
  Instrumentation.on(type, event => summary.record(event));
}

Meteor.methods({
  async getInstrumentationReport() {
    const user = this.userId && await Meteor.users.findOneAsync(this.userId,
      { fields: { isAdmin: 1 } });
    if (!user?.isAdmin) throw new Meteor.Error('not-authorized', 'Admin only');
    return summary.snapshot();
  },
});
