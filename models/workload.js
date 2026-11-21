// Workload and capacity planning (docs/Features/Workload/Workload.md): the
// collections the Workload page plans with. Every write goes through a method
// in server/workload.js, which checks who may make it, and nothing here is
// published: the page asks the server for a computed report instead, so the
// cards of every board in a report never reach the browser.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');


// One person's working time: hours a week, work percent, working days.
export const WorkloadCapacities = new Mongo.Collection('workloadCapacities');
WorkloadCapacities.attachSchema(new SimpleSchema({
  userId: { type: String },
  hoursPerWeek: { type: Number, min: 0, max: 168 },
  workPercent: { type: Number, min: 0, max: 100 },
  workingDays: { type: Array },
  'workingDays.$': { type: Number, min: 1, max: 7 },
  // Skills, each a name and a level 1 to 5 (models/lib/workload.js).
  skills: { type: Array, optional: true },
  'skills.$': { type: Object },
  'skills.$.name': { type: String, max: 50 },
  'skills.$.level': { type: Number, min: 1, max: 5 },
  // The share of the working time meant to be billable.
  utilizationTarget: { type: Number, optional: true, min: 0, max: 100 },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// Leave and absences of one person, both days inclusive. The type and the note
// are shown only to that person and to administrators (server/workload.js):
// to everybody else an absence is only "not available".
export const WorkloadAbsences = new Mongo.Collection('workloadAbsences');
WorkloadAbsences.attachSchema(new SimpleSchema({
  userId: { type: String },
  start: { type: String, regEx: /^\d{4}-\d\d-\d\d$/ },
  end: { type: String, regEx: /^\d{4}-\d\d-\d\d$/ },
  type: { type: String, allowedValues: ['vacation', 'sick', 'holiday', 'training', 'other'] },
  note: { type: String, optional: true, max: 200 },
  createdBy: { type: String, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// Public holidays, set in Admin Panel: a day off for everyone.
export const WorkloadHolidays = new Mongo.Collection('workloadHolidays');
WorkloadHolidays.attachSchema(new SimpleSchema({
  date: { type: String, regEx: /^\d{4}-\d\d-\d\d$/ },
  name: { type: String, optional: true, max: 100 },
  createdBy: { type: String, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// Allocations: a person's share of their time on a board for a period - or,
// with no person, a placeholder for a role the board will need.
export const WorkloadAllocations = new Mongo.Collection('workloadAllocations');
WorkloadAllocations.attachSchema(new SimpleSchema({
  boardId: { type: String },
  userId: { type: String, optional: true },
  roleName: { type: String, optional: true, max: 100 },
  start: { type: String, regEx: /^\d{4}-\d\d-\d\d$/ },
  end: { type: String, regEx: /^\d{4}-\d\d-\d\d$/ },
  percent: { type: Number, min: 1, max: 100 },
  headcount: { type: Number, min: 1, max: 100, optional: true },
  // The skill a placeholder needs, and its lowest level.
  skill: { type: String, optional: true, max: 50 },
  skillLevel: { type: Number, optional: true, min: 1, max: 5 },
  createdBy: { type: String, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// No client writes, to any of them: the methods are the only way in.
if (Meteor.isServer) {
  for (const collection of [WorkloadCapacities, WorkloadAbsences, WorkloadHolidays, WorkloadAllocations]) {
    collection.deny({ insert: () => true, update: () => true, remove: () => true });
  }
}
