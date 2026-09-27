# History access boundary audit — 2026-09-27

HistoryScopeBleed is an authorization issue in the universal History methods,
found while integrating Scrum with existing History. It is separate from the
older position-history integrity issue. No CVE is assigned. Severity is high
for installations using private boards or assigned-only memberships (CWE-863).

## Confirmed behavior and correction

The board-history reader checked board visibility, then returned every matching
history row. Assigned-only members could therefore retrieve hidden cards'
historical contents, including through search and contributor counts. The
member-history reader also accepted a person's own historical authorship as
sufficient scope without rechecking current access to each referenced board.
Removing someone from a private board did not remove that history read path.

Reads now filter rows against current board access and assigned-card scope
before search, pagination, totals and contributor aggregation. Container
snapshots can include hidden cards, so assigned-only readers receive only
history attached to a currently visible card. Ordinary board members retain
board-wide history. Current access, not historical authorship, decides access.

The common restore/undo/redo application path checks the same scope. Card-bound
changes additionally use the existing current card/linked-card edit policy.
A writable old board does not authorize editing a card moved to another board.
Restoration of currently assigned cards remains available to authorized writers.

## Detection and limits

Filtering historical data is normal application behavior and is not logged as
an attack. A rejected restoration can also follow a legitimate concurrent
unassignment, card move or permission change. Those cases cannot be reliably
distinguished from deliberate probing here, so this guard does not add an
automatic account-blocking security event for them. Existing linked-card policy
logging remains in its shared permission helper.

This change covers universal History paging and its three reversal paths.
It does not claim a complete audit of every export, activity feed or external
integration. Cards with no current record cannot be restored through a generic
field update; existing dedicated lifecycle behavior remains separate.

## Verification

Focused tests cover current board visibility, assigned-only inclusion and
exclusion, container snapshots, and the centralized reversal/read wiring.
Chromium exercises hidden history search/counts, removed private-board access,
allowed and denied assigned-card restores, and cards moved outside the caller's
access. Existing rule lifecycle undo/redo and stale-edit tests are rerun.

Tests use a local Meteor application and MongoDB. Other browsers, live FerretDB
and Sandstorm are not verified by this batch.
