# Features by menu

## What it is

The start page of WeKan's feature documentation: every feature has its own
page, filed under the menu where it is used.

## How to use it

Start with [Features](Features.md), the menu-based documentation index.
See [September 2026 additions](Newest-Features.md) for the newest guides.

See [menu implementation audit](Menu-Implementation-Audit.md) for test evidence
and known implementation gaps.

Shared topics used from several menus, such as
[Accessibility](Accessibility/README.md), the editor, history, themes and
translations, have a folder of their own here: see
[Shared topics](Features.md#shared-topics).

See the pages above.

## Features in WeKan

The feature overview of the [WeKan website](https://wekan.fi/#features), with
each feature linked to its documentation here.

### Boards

You can make many boards for different projects or tasks. Each board can have
columns to show the different stages of your work, such as "To Do," "Doing,"
and "Done." You can also add cards to each board to represent tasks, with
titles, descriptions, and due dates. WeKan helps you keep track of your tasks
and projects visually, so you can see what needs to be done and what has been
completed.

See [All Boards](All-Boards/README.md) and the [board header](Board-Header/README.md).

### Lists

WeKan uses lists on a Kanban board to represent different stages of a workflow,
such as "To Do," "Doing," and "Done." Lists help you organize and track tasks on
the board. To add a new list, click "Add a list" and give it a name. You can
move tasks between lists by dragging and dropping them. Lists can be customized
by changing their color or adding custom fields to capture more information
about tasks.

See [Lists](Lists/README.md).

### Cards

A card represents a task on a Kanban board. It includes a title, description,
due date, labels, and comments. To create a new card, choose the board and
column, and add the relevant details. As work progresses, move the card from
one column to another. Cards can be customized by adding labels, files, and
checklists. You can also comment on cards to provide updates or feedback.

See [Cards](Cards/README.md).

### Security

WeKan has several features to protect your data and keep it secure. WeKan is
designed with security in mind.

WeKan is an open-source project, which means that its source code is available
for anyone to inspect and audit for security vulnerabilities. This makes it
less likely that there are hidden security holes that could be exploited by
attackers.

See [more about security](../../SECURITY.md) and the
[CVE Hall of Fame](https://wekan.fi/hall-of-fame).

### Trello Attachments Downloader

At 2024-04-08, Trello will limit free users to 10 members. xet7 recommends to
download all Trello JSON and attachments with
[Trello Attachments Downloader](https://github.com/wekan/trello-attachments-downloader).
xet7 is adding a way to import from those files to WeKan.

See [Trello import](Board-Sidebar/Board-Settings/Import-Export/Trello/README.md).

### Standard for Public Code

[WeKan and Standard for Public Code](https://wekan.fi/standard-for-public-code/)
assessment was made at 2023-11. Currently WeKan meets 8 out of 16 criteria out
of the box. Some others could be met with small changes.

### Self-hosted option

One of the biggest advantages of WeKan is its self-hosting option, which gives
you full control over your data, better security, greater customization
options, cost-effectiveness, long-term viability, and can help you ensure that
your data is not being accessed or shared without your knowledge.

See [platforms](../Platforms/Platforms.md).

### Access controls

WeKan allows you to set up access controls to limit who can see and edit your
boards and cards. You can set permissions at the board level or for individual
users, which helps you control who has access to sensitive data.

See [board roles](Board-Sidebar/Members/Roles.md), [board members](Board-Sidebar/Members/README.md)
and [Admin Panel / People](Admin-Panel/People/README.md).

## Commits

 - [README and docs: Workload and capacity, Budget and billing, the Cloud Panel and Website](https://github.com/wekan/wekan/commit/2ba61536176a29ed853d0a99867f29a7e18a30a1)
 - [Docs follow the menus, with the newest features](https://github.com/wekan/wekan/commit/0c277c4d187e59f3e32e1ce1cc04900009a8e047)
 - [File docs/Features the way the WeKan menus are](https://github.com/wekan/wekan/commit/b7589737f5730ce1ba83244946e158519528a783)
 - [Organize the feature guides by menu](https://github.com/wekan/wekan/commit/953d8f7c13cdcb9b2b32d15f2d4c42c5f2d6caae)
