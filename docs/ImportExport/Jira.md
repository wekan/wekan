Originally from @webenefits at https://github.com/wekan/wekan/discussions/3504

## Migrate from Jira Server (Atlassian) to Wekan

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