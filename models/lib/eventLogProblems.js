'use strict';

// Selector for the Admin Panel → Problems "new problems" count of one event
// stream: events newer than that stream's acknowledgment, EXCLUDING purely
// informational rows. (#6520)
//
// The CPU stream records a 'detected' row (severity medium/high) when a sustained
// high-CPU period STARTS, and severity:'info' 'remediated' / 'rate-limited' rows
// when it is mitigated and when it ENDS — plus info rows for the FerretDB
// governor talking to FerretDB. So each brief, already-over CPU spike wrote
// several rows, only one of which is a problem. Counting every row made a handful
// of short spikes look like dozens of "new problems" (the reporter saw "57 new
// problems" on an idle server).
//
// Informational rows are notices that a problem was handled or has cleared, not
// problems, so they are not counted. Rows with NO severity are still counted: an
// unclassified event is treated as a possible problem rather than silently
// dropped (Mongo's `$ne` matches documents where the field is missing).
function newProblemsSelector(stream, ackAt) {
  const selector = { stream, severity: { $ne: 'info' } };
  if (ackAt) selector.at = { $gt: ackAt };
  return selector;
}

module.exports = { newProblemsSelector };
