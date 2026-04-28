# History of Schema Migration Systems

1. At `server/migrations.js` was changes to database schema, but making modifications to thousands
   of cards did take many hours, it is too much time.
2. There was Admin Panel options to migrate attachments from MongoDB GridFS to filesystem, but that could
   cause WeKan to become unresponsive, it did take too much resources.
3. There was separate migration script to change database schema, but it was incomplete, some data was not migrated.
4. Migrations were moved to opening of board, but that caused opening board to take too much time
5. Migrations were moved to Right Sidebar/Board Settings/Migrations, but there was complains that
   it is too much try to get users to learn using those migrations, and it could take
   many hours for migrations to run at big board. Also, there was Responsible Security Disclosure
   that Board Admins have too much rights to change board structure so much, so migrations were moved
   to Admin Panel to be used only by Admins.
6. At Admin Panel/Cron, migrations did not show progress of migrations well enough, it looked like no
   migrations were happening, migrations did take too much time, and WeKan did slow down while migrations
   were in progress, as was seen at increased CPU and RAM usage.
7. Migrations were commented out, so that they would not slow down WeKan anymore.
8. WeKan was migrated to Meteor 3.x.
9. Someone added datetime migrations, to convert previous date strings to Date Objects, that PR was merged,
   but questions still is, does it cause too much slowdown. It should have been changed to detect and show
   any current date, detecting is it a string or Date Object.
10. There was added code, that could show all Swimlanes/Lists/Cards without migrations, showing both
   previous Shared Lists and newest Per-Swimlane Lists, and also orphaned Swimlanes/Lists/Cards.
   But there was bug that something still disappeared when moving. It remains to be seen,
   can there continue to be showing all data without migrations, can that code be made to work,
   or is it really necessary to reintroduce migrations that take too much time.

How should migrations work?

a) Separate migrations script, that would be run before starting WeKan?
b) Reading any database structure and showing data, without needing to migrate any data?
c) Migrating while WeKan is running, that could cause slowdown?
d) Some other way?
