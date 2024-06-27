# Wekan - Open Souce kanban - IRC FAQ

- [Wekan website](https://wekan.github.io)

### If you are in a hurry, please don't use IRC

Instead, [please search existing open and closed issues or add new issue to Wekan Feature Requests and Bugs](https://github.com/wekan/wekan/issues) (open issues have not been solved yet), or alternatively [read docs](https://github.io/wekan/wekan/wiki). Thanks!

### Required license to enter IRC channel

License:

[_] If you ask something, you will wait patiently on IRC channel for answer, idling for at least a week, and not leave IRC channel immediately.

### Congratulations! If you agree with IRC license above, you can join Wekan IRC channel

Wekan IRC is `#wekan` channel at:
- Libera.Chat 
- (or OFTC)

Unfortunately Freenode `#wekan` was taken over by Freenode admins, so it's no longer in use.

***

## QA, answers by [xet7](https://github.com/xet), Maintainer of Wekan

## Answers to IRC questions are added to this wiki page, because most coming to IRC channel leave immediately, and don't wait for answer. Real IRC users know idling and stay at IRC channel. It is required that you read everything in this page before coming to IRC channel.
***
### Q: Max 20 comments visible?
```
[16:11:09] <Dalisay> hi
[16:11:23] <Dalisay> and here we go again,  again wekan
has been released without enough testing
[16:11:31] <Dalisay> Comments can NOT be added any more
[16:11:42] <Dalisay> the comments only show in
the comment-counter on the minicard
[16:11:53] <Dalisay> but, the comments are
not visible when scrolling down
```
A: What new Wekan release? I tested newest versions Wekan for Snap/Docker/Sandstorm, and comments can be added to card. Please add new issue with more details https://github.com/wekan/wekan/issues

If you mean bug about [only 20 newest comments visible](https://github.com/wekan/wekan/issues/2377), that bug is fixed on non-public boards. I will add more fixes to that.

### Q: Contributing to Wekan?
```
[16:12:54] <Dalisay> yes, it's open source
[16:12:57] <Dalisay> yes, it's free
[16:13:02] <Dalisay> but this is not okay any more
[16:13:27] <Dalisay> if this does not change,  I will
gather a group of developers to make a reasonable fork
```
A: I don't know why you think fork would be necessary. I welcome all new contributors and co-maintainers, and help them to get up to speed. You can send your pull requests to Wekan https://github.com/wekan/wekan/pulls . I do have also [blog post about it](https://blog.wekan.team/2018/02/benefits-of-contributing-your-features-to-upstream-wekan/index.html). All what I do on Wekan is based of feedback at GitHub issues, chats and emails. Wekan is friendly Community driven Open Source project. I do also provide [Commercial Support](https://wekan.team/commercial-support) for features and fixes.

### Q: CPU usage?
```
[16:14:01] <Dalisay> in my opinion,  the board is still in
an eary RC state,  and not stable by any means
[16:14:04] <Dalisay> so many bugs all the time
[16:14:09] <Dalisay> we are not talking about minor bugs.
[17:50:41] <Dalisay> oh, and the VERY old bug is also back again:
[17:50:42] <Dalisay> https://pastebin.com/raw/qpPiaWp6
[17:50:53] <Dalisay> CPU overload because of wekan
[17:51:43] <Dalisay> this is the fastest server we have
ever run,  and wekan is the only software on it
[17:51:48] <Dalisay> yet, it still overpowers the CPU
[17:51:59] <Dalisay> wekan is really not ready to be used on a daily basis
[17:52:12] <Dalisay> We have many boards and many users,  and we rely on wekan
[17:52:23] <Dalisay> it disrupts our work life more than it helps us
[17:53:01] <Dalisay> no matter if wekan is open source or not,
some minimum standards of quality should be maintained
[17:55:37] <Dalisay> Here, that's a bug from the year 2016 !
[17:55:38] <Dalisay> https://github.com/wekan/wekan/issues/718
[17:55:44] <Dalisay> this bug is 3 years old
[17:56:00] <Dalisay> that's again not a minor thing
[17:56:11] <Dalisay> that's a major thing that disrupts the work flow
[17:56:20] <Dalisay> it means, that the server admin will be called
all the time to restart the board
```
A: Yes, that bug is back, to fix 2 other bugs. [I added explanation](https://github.com/wekan/wekan/issues/718#issuecomment-561377824). CPU usage is getting improved in newer Wekan releases.

***
### Q: Import multiple Trello boards?

```
[13:15:32] <netopejr> Hello, i there way how to import multiple
Trello booards? I have over 100 boards which i need to migrate
to Wekan. Importing via add board -> import -> from trello
works more or less but its time consuming.
```

A: This will be implemented sometime with [Mass Import from Trello](https://boards.wekan.team/b/D2SzJKZDS4Z48yeQH/wekan-open-source-kanban-board-with-mit-license/RNTZ8NAm46mAeEDev)

### Q: Fork?
```
[15:24:31] <Dalisay> hi
[15:25:13] <Dalisay> I don't mean to come across ungrateful.
[15:25:29] <Dalisay> But I really want to mention,  that wekan should be
tested much better before releasing a new version.
[15:25:46] <Dalisay> It's not important to release a new version every day.
[15:25:58] <Dalisay> It's okay if there is a new version only every 2 weeks.
[15:26:09] <Dalisay> But whenever there is a new version, it should be stable.
[15:26:14] <Dalisay> really stable.  rocksolid.
[15:26:32] <Dalisay> We can not move cards!
[15:26:35] <Dalisay> We can not add cards
[15:27:00] <Dalisay> and when I run "snap revert wekan",  I get the other
version which has the bug of the unsorted columns
[15:28:10] <Dalisay> I really understand that it's open source and
free software.
[15:28:24] <Dalisay> But people trust wekan in real life.  They use it
on a daily basis in their work life.
[15:28:36] <Dalisay> It's a nightmare, when you come to work in the
morning, and nothing works any more
[15:28:55] <Dalisay> The previous version has a major bug  (the lists
that could not be sorted and showed in the wrong order)
[15:29:06] <Dalisay> and the current version is also buggy
(can't move cards / can't add new cards)
[15:29:20] <Dalisay> These updates come via snap automatically.
[15:29:27] <Dalisay> That involves a lot of trust.
[15:30:51] <Dalisay> There really must be more testing.
[15:31:14] <Dalisay> Also the github issues page has reports already.
[15:32:20] <Dalisay> This user also explains what I just said:
[15:32:21] <Dalisay> https://github.com/wekan/wekan/issues/2814#issuecomment-555427628
[15:33:20] <Dalisay> "snap revert wekan"  messes up the list order
because this was a bug in the previous version
[15:33:30] <Dalisay> so there is no bug-free version available now.
[15:33:36] <Dalisay> I am not talking about small bugs.
[15:34:03] <Dalisay> these are all bugs that massively mess up the
functionality to a degree, that it renders the board useless
[15:34:42] <Dalisay> Wekan is such a promising project.
[15:34:47] <Dalisay> But the testing must be much better.
[15:54:46] <Dalisay> aaaaaaaaaaaand OPENING cards on Samsung
phones & tablets stopped working again!
[15:54:55] <Dalisay> it worked in the "edge" version of wekan
[15:54:59] <Dalisay> now it does not work any more
[15:55:12] <Dalisay> cards can NOT be opened any more on Samsung phones & tablets
[15:55:24] <Dalisay> constantly, there is something that breaks
[15:55:53] <Dalisay> Really, wekan could be so promising,
but I think it's time for a fork
[15:58:56] <Dalisay> https://github.com/wekan/wekan/issues/2814
[15:59:22] <Dalisay> https://github.com/wekan/wekan/issues/2810
[16:00:14] <Dalisay> bye, cya later
```
A: 
- Please test newest Wekan
- Do you have time to be Wekan co-maintainer?
- What is URL to your fork? Please send it to me with email to x@xet7.org . Thanks! Currently there is about 2200 forks of Wekan, it would be hard to find without exact URL.
- What features and fixes have you implemented to Wekan?
- [What usually happens when Wekan gets broken](Test-Edge#what-usually-happens-when-wekan-gets-broken).
- [Benefits of contributing your features to upstream Wekan](https://blog.wekan.team/2018/02/benefits-of-contributing-your-features-to-upstream-wekan/index.html).
- [What was Wekan fork](FAQ#what-was-wekan-fork--wefork).

***
### Q: Other mobile browsers?
```
[12:48:54] <MarioSC> For example, on an Oppo phone,  clicking on cards
works in Google Chrome.
[12:49:12] <MarioSC> On Samsung devices,  clicking on cards fails
```
A: Please try newest Wekan.

### Q: Colored text?
```
[13:06:20] <MarioSC> Whenever we want to make titles or
descriptions or comments colored, we must use
outdated (deprecate) html tags
[13:06:43] <MarioSC> <span style="color:#ff0000;">
Important</span>  won't work
[13:06:49] <MarioSC> so we have to go with:
[13:06:55] <MarioSC> <font color="red">Important</font>
[13:07:04] <MarioSC> which is really deprecated
[13:07:21] <MarioSC> Ideal would be, if the board
understood all kinds of html...
[13:07:25] <MarioSC> especially things like:
[13:07:42] <MarioSC> font-weight
[13:07:45] <MarioSC> text-decoration
[13:07:51] <MarioSC> font-variant
[13:07:56] <MarioSC> color
[13:08:00] <MarioSC> background-color
```
A: Currently [some GitHub markdown](https://guides.github.com/features/mastering-markdown/)
works. It needs some research is it possible
to enable more html, or have visual editor
elsewhere.


### Q: Wekan on mobile Chrome?
```
[15:49:52] <Rojola1> xet7, I saw your answer to the
mobile card question
[15:50:13] <Rojola1> it really won't work in Chrome
[15:50:19] <Rojola1> everyone in the organization
has the same issue
[15:50:27] <Rojola1> every phone, every tablet
[15:50:40] <Rojola1> Chrome in the newest version,
even in the dev-version
```
A: Please try newest Wekan.

### Q: Older Node version?

```
[16:47:42] <imestin> Is Wekan compatible with older
versions of Node?
```
A: You can try, but older Node versions have
security issues that are fixed in newest Node version.

### Q: Wekan crashing?

```
[15:20:04] <Rojola> hi
[15:20:12] <Rojola> xet7, are you there by any chance?
[15:20:18] <Rojola> I told you about my problems with
wekan
[15:20:23] <Rojola> now, at this very moment, I am having
one
[15:20:30] <Rojola> Normally I just restart the board to
keep working
[15:20:48] <Rojola> but it's a Saturday, so nobody
currently works on the board, and I can let the board
struggle without restarting it
[15:20:54] <Rojola> this gives us time for finding
out what's wrong
[15:21:21] <Rojola> the error in the browser reads:
[15:21:22] <Rojola> ---
[15:21:24] <Rojola> This page isn’t working
[15:21:24] <Rojola> ***.***.***.*** didn’t send any data.
[15:21:24] <Rojola> ERR_EMPTY_RESPONSE
[15:21:25] <Rojola> ---
[15:21:29] <Rojola> ^ I masked the IP
[15:22:03] <Rojola> I added many cards to the board, and
I had no idea, that the server died in the background
[15:22:15] <Rojola> so, if I restart the board now,
I will loose all the cards which I added
[15:23:21] <Rojola> I heavily depend on wekan for
my life, and it scares me when it glitches
[15:23:31] <Rojola> especially since the board
struggles so much so often
[15:23:49] <Rojola> also an issue is, when I add
cards, and then they vanish
[15:24:09] <Rojola> that happened a short while
ago - I added 2 cards, then they were gone
[15:44:02] <Rojola> xet7, I realized, the
server is not dead.
[15:44:08] <Rojola> It's just very, very,
very slow
[15:44:21] <Rojola> after like... an hour...
a board loaded
[15:44:31] <Rojola> most cards are lost, though
[15:44:55] <Rojola> I don't know how to
bugfix this
```
A: You should upgrade to newest Wekan, or
be online when xet7 is online to debug.
xet7's own boards are not crashing.

***
### Q: Unsaved changes indicator?

A: Added Feature Request https://github.com/wekan/wekan/issues/2537

***
### Q: Wekan on Sandstorm features?
At IRC #sandstorm
```
[20:40:57] <pwa2> are desktop notifications from
wekan possible in sandstorm?  I see references to
notifications throughout the code, but haven't
been able to answer this question on my own. Thanks.
[21:05:22] <xet7> pwa2: Wekan does not yet have push
notifications https://github.com/wekan/wekan/issues/2026 ,
sometime they will be added. I don't know yet would
they work on Sandstorm, because I can't test yet.
[21:11:38] <pwa2> @xet7 thanks!
[21:12:11] <xet7> :)
[21:16:59] <pwa2> i've read the issue reports regarding
email notifications in wekan, where they have to be
configured both at the board level and at the member
settings level. However, the wekan app in sandstorm does
not have the "Edit Notifications" menu item.  So are
email notifications from Wekan under Sandstorm not
implemented either?  Or is there some configuration
switch someplace?  "Change Password" and
"Change Language" are also missing from Member Settings
under Sandstorm, which makes some sense.
[21:19:58] <xet7> pwa2: I need to add code to Wekan
to enable Wekan to send email at Sandtorm
https://github.com/wekan/wekan/issues/2208#issuecomment-469290305
[21:20:52] <xet7> pwa2: Sandstorm apps need special
code for accessing outside secure sandboxed grain
[21:21:57] <pwa2> @xet7 thanks again!
[21:23:10] <xet7> pwa2: It's not possible to change
password in Sandstorm, because Sandtorm does not store
passwords at all, it has 3rd party auth
Google/LDAP/Passwordless etc. I only recently enabled
multiple boards, not all of user management is
implemented yet https://github.com/wekan/wekan/issues/2405
[21:23:44] <xet7> pwa2: I will fix all those,
but it takes some time to develop.
```

***
### Q: Board crashes?

```
<Rojola> Board crashes on server that has Wekan and RocketChat installed.
<Rojola> /var/log/syslog contains a lot
```
A: Well, what does /var/log/syslog contain?
Without that info it's kind of hard to debug.

You could try export that board to Wekan JSON, and then import that Wekan JSON.

I do have server at AWS LightSail that has 4 GB RAM and 60 GB SSD,
running [Snap versions of Wekan and RocketChat installed this way](OAuth2)
on same server, and it does not crash.

BTW, I did yesterday release [Wekan v2.95 with these new features](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v295-2019-07-01-wekan-release).

***
### Q: Board cleanup?

```
[18:02:20] <Rojola> hi
[18:02:29] <Rojola> May I please ask for help bugfixing a wekan board?
[18:02:53] <Rojola> There are many boards with many cards,
and since about 2 days, everything got very, very, very slow
[18:03:06] <Rojola> we must restart the board every
2 minutes to be able to access it
[18:03:11] <Rojola> it's a nightmare
[18:03:23] <Rojola> you add a card / comment,  just to realize,
it has not been saved to the server
[18:03:38] <Rojola> the board has stopped working after over 1,5 years
[18:17:03] <Rojola> I'm AFK for a while,  but I will check
for answers a little later
[23:44:45] <Rojola> is there still nobody around?
[02:25:22] <Rojola1> is anyone here?
[02:25:24] <Rojola1> xet7?
[02:25:27] <Rojola1> anyone?
```
A: I was at meeting or sleeping when you asked. When I came back to IRC you were not online. Anyway, you can [make backup](Backup) and do some [cleanup](https://github.com/wekan/wekan-cleanup) to delete 1,5 years worth of activities etc. Next time, if you have questions, you get faster answers at [GitHub issues](https://github.com/wekan/wekan/issues), because I get email notifications of all new issues and comments on issues.

***
### Q: Rules as code?

```
[23:40:03] <IRC-Source_15> Hey does anyone know
if it is possible to code in rules (as opposed to using the front end UI)?
```
A: Not yet. There are [Rules issues](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+rules+label%3AFeature%3ACards%3AIFTTT-Rules) about Rules variables. If you have ideas how to make translated Rules UI have also translated code, please add new GitHub issue Feature Request or PR.

***
### Q: LDAP Bug: [ERROR] InvalidCredentialsError: 80090308: LdapErr: DSID-0C090400

```
[14:58:26] hello everyone. I am getting this erro:
[14:58:30] Error
[14:58:31] [ERROR] InvalidCredentialsError: 80090308:
LdapErr: DSID-0C090400, comment: AcceptSecurityContext error, data 52e, v1db1
[14:59:19] can someone check this and tell me if I did
something wrong? : https://paste.ee/p/uuUDb
[14:59:33] The credentials are correct
[15:26:09] This is the error in my syslog: https://paste.ee/p/mJdtL
```
A: https://github.com/wekan/wekan/issues/2490

### Q: LDAP Group Filtering

```
[13:17:27] <leOff> hi everyone
[13:18:07] <leOff> was wondering if i could get some help regarding ldap
group filtering .. documentation is pretty much inexistent
[13:19:58] <leOff> in particular, what exactly are the keys
ldap-group-filter-member-attribute ,
ldap-group-filter-member-format and ldap-group-filter-member-name
supposed to point to
[13:21:15] <leOff> ldap-group-filter-member-attribute is it
the membership attribute which is part of the user entry,
or is it the member list attribute in the group entry?
[13:21:59] <leOff> ldap-group-filter-member-format ...
this one i have no idea what might be
[13:23:20] <leOff> and finally, ldap-group-filter-member-name
is it and enumeration of the group names
(related to ldap-group-filter-member-attribute probably)
which are allowed to login?
[13:25:30] <leOff> I REALLY would like to limit my groups
available since i have some very large groups .. up to 15k users
```
A: https://github.com/wekan/wekan/issues/2356#issuecomment-494573761

### Q: Copying Checklists?

```
[09:25:51] <sfielding> I have now about one year of exp with Wekan
usage somewhat daily, and it has become my favourite productivity tool.
[09:27:36] <sfielding> Initially we used it with Sandstorm, but
because of closed sandbox model we changed into standalone snap install.
[09:28:02] <sfielding> Ldap integration works as expected
[09:34:42] <sfielding> Only situation where I end up using tedious
copy & paste string transferring is when moving checklists
from one card to another.
[12:49:45] <xet7> sfielding: click card hamburger menu =>
                  Copy Checklist Template to Many Cards
```

### Q: LDAP?

A: [LDAP for Standalone is now available](LDAP).

```
[17:56:10] <regdude> Hi! I'm trying to setup Wekan with LDAP,
but can't seem to get it to work.
Where could I found logs for why LDAP is not working?
[17:56:18] <regdude> does not seem to send out any LDAP packets
[17:58:31] <regdude> oh, it does not do anything
```

Please see is there existing issues at [LDAP Bugs and Feature Requests](https://github.com/wekan/wekan-ldap/issues), or add a new one.

### Q: Is there in Wekan: My Cards: List of all boards/lists/cards for every card where person is assigned to card ?
```
[15:25:23] <superlou> If I have a Wekan board per project, with people assigned
cards in multiple projects, is there a way to provide a list of the tasks for
a person across all of their projects?
```

A: Yes. Click right top your username / My Cards.

### Q: Wekan Internal Server Error

2018-11-09

```
[20:45:22] <Rojola> hi
[20:45:35] <Rojola> Before I came here, I tried to find a solution myself
[20:46:17] <Rojola> e.g. I read the error log, read the installation troubleshooting docs, did research, and played around with the SMTP settings
[20:46:52] <Rojola> then I joined #sandstorm but nobody replied
[20:47:07] <Rojola> The problem:
[20:47:31] <Rojola> I always get an "Internal Server Error" when I try to send me the registration email
[20:49:15] <Rojola> https://filebin.net/11q54qsyd7rigpiq/internal_server_error.png?t=ziblx18b
[20:49:28] <Rojola> in theory, sandstorm + wekan is installed
[20:49:35] <Rojola> but, in reality I can not access it
```

A: See 4) at https://github.com/wekan/wekan/wiki/Adding-users . This is Stanalone Wekan (Snap, Docker, Source) email setting. This has nothing to do with Sandstorm.

***

### Q: 2018-11-07 Answer speed
```
[12:50:46] <gros> hey
[12:53:45] <gros> I won't whine, because I know sometimes it is
hard to answers to user's questions, but I'm here
since several days, I see that other users asks some things,
and no one is answering
[12:58:11] <gros> I think that you could close this channel in fact,
it will make win time for users
[12:58:24] <gros> and again I don't whine, thanks for the great Wekan :)
```
A:

- Fastest: If you want fast answers, get [Commercial Support](https://wekan.team/commercial-support/).
- Medium speed: If you have time to wait, [add new GitHub issue](https://github.com/wekan/wekan/issues).
- Slow: [Wekan Community Chat with webbroser and mobile Rocket.Chat](https://chat.vanila.io/channel/wekan)
- Slowest: If you want to chat on IRC, please stay at IRC idling, and ask question again also at some other day. Sometimes there is Internet connectivity issues, if it looks like xet7 is not online. IRC is very nice, some Wekan users prefer it. Answers to IRC questions are added to this wiki page, because most coming to IRC channel leave immediately, and don't wait for answer.

***

### Q: SMTP sending to own domain but not Gmail
```
[16:18:47] <k_sze> Does anybody have an idea why I can send e-mail from Wekan
to my personal domain, but not to a Gmail address?
[17:34:16] <k_sze> And now Wekan doesn't actually work. I set it up
from Snap on Ubuntu 18.04.
[17:34:32] <k_sze> (Wekan doesn't work after I reboot Ubuntu)
[17:38:51] <k_sze> Like, I get 502 Bad Gateway from my nginx reverse proxy
```

A: Did you set your domain SPF records (as TXT records) and DKIM records on your domain that your SMTP server uses? Problem is not in Wekan, it's your SMTP server. For example AWS SES works. Also see [Troubleshooting Email](Troubleshooting-Mail).

***

### Q: Integrating Wekan
```
[03:32:12] <ajay> Hi  can anyone tell me how to integrate wekan in
other applications
[03:32:50] <ajay> i am want to integrate it in QGIS for task management
[03:33:01] <ajay> *i want
```
A: Use [Wekan REST API](REST-API). For example, see [Wekan Gogs integration](https://github.com/wekan/wekan-gogs). You can also use [Outgoing Webhooks](Outgoing-Webhook-to-Discord) to send data to some Incoming Webhook. There is also [IFTTT Rules](IFTTT) for some automations.

***

### QA: Rescuing Subtask board
```
[18:33:29] <wekanuser> hello I have a wekan board that
never loads, I just get the spinner. all the other
boards are working fine. This happened after we moved
some subtasks from a subtask board to the main board.
any tips would be appreciated. thanks.
[18:33:58] <xet7> wekanuser: What Wekan version?
[18:34:45] <xet7> Can you move subtasks back to subtask board?
[18:42:02] <wekanuser> v 1.55.0. re: move tasks back to
subtask board - I can't, since the parent board will not load.
[18:42:35] <wekanuser> - I was in subtask board, and moved
manually each subtask over to parent board. Then went to
parent board and it will not load.
[18:43:28] <wekanuser> - the cards would not load on
the main board, but I was able to make an "export"
of the board from the GUI and re-imported it, to another
board but only a fraction of the stories and swimlanes were there.
[18:43:58] <wekanuser> - when I accessed the parent board
via the rest api, I see all my cards, looks like everything is there
[18:44:07] <wekanuser> - so something is hanging on loading the board
[18:44:32] <xet7> Do you still need subtasks on board?
[18:45:09] <wekanuser> no, since the subtasks on the subtasks
board have been moved, there should be nothing "linking" there
[18:46:11] <xet7> Do you see any subtask related in
exported JSON file? So you could remove subtasks from it before importing?
[18:47:06] <wekanuser> thanks, I will check
[18:47:34] <xet7> Does the exported JSON file have all data of
that board? You could check do you see same as with API
[18:47:56] <xet7> You can also create new board that is
similar structure of your exported board, and compare structure
[18:48:52] <xet7> Also please add new issue to
https://github.com/wekan/wekan/issues about what happened,
so somebody can think how to prevent that happening.
[18:52:53] <wekanuser> it appears the json file has all the data
[18:54:04] <xet7> Nice :) Then you can compare it with similar
working board, what is different
[18:54:39] <xet7> Does it have any custom fields?
[18:55:02] <xet7> sometimes removing custom fields makes import work
[18:56:05] <wekanuser> yes there are custom fields, I will consider
trying that. re: removing subtasks, you mean the subtask cards?
or the subtask references in parent cards?
[18:56:27] <xet7> Try first remove subtask references
[18:56:49] <xet7> compare to other exported board JSON that
does not have any subtasks
[18:57:38] <xet7> You don't need to try removing
custom fields yet, there has been some custom fields fixes
[18:58:14] <xet7> I would think that when there is
references to not existing subtasks then that could bring those problems
[19:10:37] <wekanuser> thanks, working on remove subtask refs'
[19:12:31] <wekanuser> I assume that is making
parentId :"" empty,
as I see only subtasks referencing parents,
not parents referencing subtasks
[21:54:39] <wekanuser> update: process of elimination
lead to the import board working if I remove all all
activities from the json file before import
[21:56:47] <xet7> Nice :) Then I think I should not
include activities in export.
[22:03:06] <wekanuser> is there an option to exclude
things from export? I only see the "BUTTON" that does an export
[22:06:16] <xet7> not yet
[22:07:19] <wekanuser> I am probing for possible bad activity item
[22:08:00] <xet7> Probably some activity types are not imported correctly
[19:22:59] <wekanuser> thanks for the help yesterday,
board has been restored.  I will document my issue in a real ticket,
hopefully it will help someone else. Thanks again
[19:23:13] <xet7> :)
```

***

### QA: Wekan in iFrame
```
[17:42:12] <siqueira> Hi, I want to embed my Kanban
from wekan in my website using iframe. Does Wekan
support this feature?
[18:13:59] <xet7> siqueira: Yes, set trusted-url to
your web address that iframes Wekan
https://github.com/wekan/wekan-snap/wiki/Supported-settings-keys
[18:15:35] <xet7> siquiera: If you have problems with browser
javascript console, or something not working, you can
also set browser-policy-enabled='false' that enables
all iframing - but that has a little less security
[18:18:13] <xet7> siquiera: Problem with iframing
Wekan is that link to card does not work well.
For that it's better to have Wekan in sub-url, and
add "iframe" replacing HTML/CSS at beginning of
body tag, and at end of body tag, but that
feature is not yet in Wekan, I'm currently developing it.
[19:25:07] <siqueira> xet7, Thanks a lot
for the information! I just want to have my
public tasks on my website. I think the
browser-policy-enabled can solve my problem,
until I wait for the new feature. Thanks :)
[19:25:51] <xet7> siqueira: You can set
board as public, and provide that public link in iframe.
[19:27:32] <siqueira> I will try it :)
```
A: Currently having Wekan in iframe is broken, because browser APIs changed. See [this issue for progress](https://github.com/wekan/wekan/issues/3875).


***

### Q: Docker reverse proxy

```
yogab> Hi! How are you today ? Can i ask
a docker x reverse proxy x wekan question here ?
```

A: Hmm, it seems you did not ask. Just guessing, maybe it's about [Traefik reverse proxy and Docker](Traefik-and-self-signed-SSL-certs).

***

## Still reading?

Wow, you are so cool ! You gonna be an expert guru soon.

Check out here for more wild stuff: https://github.com/wekan/wekan/wiki

There is:
- Info about translations, dev stuff, changelog, and huge amount of Wekan features.