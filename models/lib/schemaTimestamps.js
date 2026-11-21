// The createdAt / modifiedAt autoValue every collection schema used to spell
// out on its own: 64 copies of two functions, in 34 files.
//
// SimpleSchema calls an autoValue with the field's context as `this`, so a
// schema names the function instead of writing it again:
//
//   createdAt: { type: Date, autoValue: createdAtAutoValue },
//   modifiedAt: { type: Date, denyUpdate: false, autoValue: modifiedAtAutoValue },
//
// tests/schemaTimestamps.test.cjs runs both against SimpleSchema's contexts and
// fails when a schema writes one of them out by hand again.

// Set when the document is created, and never changed afterwards.
export function createdAtAutoValue() {
  if (this.isInsert) return new Date();
  if (this.isUpsert) return { $setOnInsert: new Date() };
  this.unset();
  return undefined;
}

// Set on every write.
export function modifiedAtAutoValue() {
  if (this.isInsert || this.isUpsert || this.isUpdate) return new Date();
  this.unset();
  return undefined;
}
