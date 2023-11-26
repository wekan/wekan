# Future

## Moved Import/Export/Sync issues to Big Picture Roadmap wiki page

This change is limited to only Import/Export/Sync issues, while those are In Progress of being fixed.

2023-11-21 xet7 closed 261 issues that are linked at https://github.com/wekan/wekan/wiki/Sync ,
that is Roadmap of Import/Export/Sync in WeKan. It means, that those issues progress will be
updated at that wiki page, when xet7 and other WeKan contributors fix those.
Many of those issues are In Progress of being fixed and added.

## Platform Updates

Issues related to platforms are being closed, because only list of working platforms is mentioned now
at WeKan website https://wekan.github.io Install section and at [ChangeLog](https://github.com/wekan/wekan/blob/main/CHANGELOG.md)
where is this new text:

> Newest WeKan at amd64 platforms: Linux bundle, Snap Candidate, Docker, Kubernetes. Fixing other platforms In Progress. 

Platform support changes often, because:

- There are many dependencies, that update or break or change often
- Node.js segfaults at some CPU/OS
- Some platforms have build errors

Roadmap is to update all existing platforms, and add more platforms.

Upcoming platform upgrades:

- Fix migrations, so that newest WeKan can be released to Snap Stable. (Currently newest is at Snap Candidate).

## WeKan features

Most Meteor WeKan features are listed here:

https://github.com/wekan/wekan/wiki/Deep-Dive-Into-WeKan

Remaining features and all changes are listed here:

https://github.com/wekan/wekan/blob/main/CHANGELOG.md
