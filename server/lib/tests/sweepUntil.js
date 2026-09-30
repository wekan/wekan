// A retention sweep reads one page (100 receipts, oldest first) per call and
// keeps its place. The test database outlives a run, so older receipts from
// other suites and earlier runs can fill the first pages: page on until this
// test's own record is compacted, or the sweep has reached the end.
export async function sweepUntil(retention, done) {
  for (let page = 0; page < 1000; page++) {
    const result = await retention.sweep();
    if (await done()) return true;
    if (!result.next) return done();
  }
  return done();
}
