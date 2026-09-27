# Sprints

Board View / Sprints manages board-local sprint plans and their lifecycle.
Board administrators create sprints, start them, close them, or cancel them.
Existing card permissions control who may assign work or edit its metadata.
Scrum accountabilities do not grant additional permissions.

## Plan and start

Create a planned sprint with a name, goal, start and end dates. Capacity is
optional; when supplied, its unit must match the board's estimate unit.
Assign cards from Product Backlog. Starting a sprint captures its original
scope, estimates and completion policy. A missing estimate stays unknown;
an explicit zero remains zero.

Board Settings / Scrum settings selects planning-poker estimates or an
existing numeric custom field. Completion can mean a card marked complete
or membership in a list whose Scrum category is Done. Estimate and completion
policies cannot change while a sprint is active.

## Close or cancel

Closing captures the final scope and outcomes before moving cards. Completed
cards return to the product backlog; unfinished cards can move to another
planned sprint or to the backlog. Past sprint membership is retained.
Archiving a completed card does not turn it back into unfinished work.

Database writes use a recoverable rollover checkpoint. If an interrupted
close is retried, it resumes without silently overwriting later card edits.
An unresolved rollover conflict must be resolved before further Scrum writes.
This is not a database transaction.

Cancellation requires a reason. It retains current card memberships for
explicit reassignment and does not fabricate a completed-sprint report.

## Optional presentation

New Scrum fields are hidden on existing cards, minicards, lists and swimlanes.
Board Settings / Card has independent Card and Minicard visibility choices.
Board Settings / List controls the workflow category; Board Settings /
Swimlane controls sprint, release and purpose fields. Revealing a field does
not grant permission to edit its value.

## Implementation checkpoint

The current implementation includes planning forms, revision checks,
start/close snapshots, release and event creation, visibility controls, report
tables and Excel/PDF output. Work remains on complete event/release editing,
interactive report charts, History integration and import/export/sync coverage.
These are tracked by [the Scrum design](Scrum-Design.md); this guide does not
claim they are finished.
