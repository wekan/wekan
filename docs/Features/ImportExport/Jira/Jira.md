# Jira import

## Native JSON time-tracking import

The native Jira JSON import reuses WeKan's spent-time field (hours) and
numeric custom fields for original and remaining estimates (hours). It creates
only fields supplied by the export, hides them from minicards by
default, and allows selecting the original estimate through existing Scrum
estimate settings.
It accepts numeric second values from `fields.timetracking`, or the equivalent
flat issue fields when the nested value is absent. Explicit zeroes are preserved.
Validation runs before creating the board. Localized duration strings are not
parsed, partial worklog pages are not summed, and no historical sessions are
fabricated. Native WeKan export retains these values. Jira sprint mapping and
synchronization remain separate implementation work.

The numeric fields follow [Atlassian's issue API](https://developer.atlassian.com/cloud/jira/software/rest/api-group-issue/).
The two numeric custom fields are named `Jira original estimate (hours)` and
`Jira remaining estimate (hours)`. Native WeKan custom-field settings control
their visibility; no new permission or external service is introduced.

Jira JSON export converts these hours back to integer seconds. Dates selection
controls spent time; Custom Fields controls original/remaining estimates.
Imported estimate fields carry `settings.jiraTimeField` markers, so renaming
one does not break export. Export does not infer meaning from matching names.
Older fields without markers, duplicate mappings and invalid values are omitted.
Native WeKan export/import and whole-board duplication retain the markers,
remap custom-field IDs and preserve Scrum's selected estimate field. Browser
regression coverage exports the resulting boards back to Jira and verifies
the original numeric seconds. This preserves time totals, not
individual worklog entries or all Jira Scrum data.


## Migrate from Jira Server (Atlassian) to Wekan

Originally from @webenefits at https://github.com/wekan/wekan/discussions/3504

Hello all,

I wanted to share here my experience with migrating data from Jira (Server) to Wekan. It took me 1 - 2 days to find a solution and I think it makes sense to record it here so that successors have it easier.

In order to not transfer everything manually and still keep all comments and (at least) links to attachments from Jira, my plan was to first migrate everything from **Jira → Trello** and then from **Trello → Wekan**, since importing from Trello works very well. :ok_hand:

Unfortunately there is no "easy" variant to transfer data from Jira to Tello.
First of all, I found "TaskAdpater" through various threads, which allows you to transfer data between different tools (including Jira and Trello). This would have been a nice way to do it, since the data would not have gone through a third party. Unfortunately, this didn't work because of the newer API token authentication in combination with Jira server. Also other suggested things like "Zapier" were not really functional.

## Related

- https://www.theregister.com/2023/10/16/atlassian_cloud_migration_server_deprecation/
- https://news.ycombinator.com/item?id=37897351
When I had almost given up, I had the idea to look for "Power Ups" (Addons) in Trello. And indeed, I found what I was looking for! The power up is called "Unito Sync". It allows you to synchronize individual projects in both directions between tools like Jira and Trello. And the best: There is a 14-day trial version.

That's how it worked in the end. You have to migrate each project separately and make some fine adjustments afterwards. However, all data including comments and attachments (as links) are integrated!

Here again briefly the way:

1. Create a Trello dummy account
2. Create a new board there
3. Install and register Power Up Unito Sync
4. Create a new "flow" for the current project in Unito Sync
5. Synchronize
6. Export data from Trello again afterwards
7. Import JSON into Wekan


I hope I could save you some work with this. Good luck! :four_leaf_clover:
Greetings
Alexander