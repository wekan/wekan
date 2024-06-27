Importing attachments from Trello:
- https://github.com/wekan/wekan/tree/main/trello
- https://github.com/wekan/trello-board-exporter
- https://github.com/wekan/wekan/issues/4877
- https://github.com/wekan/trello-backup

If you're already a Trello user, migrating to Wekan is easy:

1. install Wekan
2. create users
3. export your boards from Trello
4. import them into Wekan
5. be aware of some limitations

# 1. Install Wekan

Detailed instructions are on this wiki at the page [Install and Update](Install-and-Update)

# 2. Create users

Once Wekan is installed, register a user for you. Then register a user for each of your other Trello board members. This is a bit cumbersome, as you have to logout then register in the name of each user.

Pro-tip: your import will be much facilitated if you use the exact same **username** in Wekan that your users had in Trello. But if you can't / don't want to, it's not blocking - it's just going to be a little more work when importing (step 4).

# 3. Export your boards from Trello

Log into Trello, and for each of your boards, go to the board menu (click "Show Menu"), then "More", then "Print and Export", then "Export JSON". Save the resulting page on your computer.

If you have a high number of boards, here is a script that automates these steps (this script it **not** part of the Wekan project): https://github.com/mattab/trello-backup

# 4. Import your boards into Wekan

In Wekan, on the boards list, click on "Add a new board". In the popup, click on "import from Trello".
Then, copy the content of one exported board file into the input field and hit "Import".

If your board had members, you will need to tell Wekan which of its users should replace each of your Trello users: Wekan will display a list of the users found in your Trello board, and let you select which Wekan user to map it to. If the usernames are the same, that mapping will have been done for you. Then hit "Done".

Once imported, Wekan will put you straight into your new board. Enjoy!

# 5. Limitations

The Trello import will import your board, your labels, your lists, your cards, your comments, your attachments, and will map Trello users to Wekan users as you requested it, all pretty quickly.

Yet, it has a few limitations:

- Wekan does not import your activity history (who did what when)
- it does not map non-member users: if you had a public board, all non-member contributions (like comments) will be attached to the user doing the importation
- Trello does not export comments posted earlier than around December 2014 (this is empirical data), so Wekan can't import it.
- when importing attachments, Wekan will download them and host them on your server. But the download process is not particularly robust and there is no feedback on it, so if you have lots of (or heavy) attachments, you'll have to give it some time and it may timeout without you knowing about it.