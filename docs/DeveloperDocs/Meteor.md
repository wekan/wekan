## Upgrading Meteor

- Disclaimer:
  - These are opinions about upgrading, from xet7, maintainer of WeKan Open Source kanban https://wekan.github.io
  - xet7 thinks, that it is good to keep using current frontend and backend frameworks, upgrade them when possible. If there is any problems, ask at https://forums.meteor.com
  - xet7 thinks, that upgrading to newest Meteor 2 and Meteor 3 is being made more easier all the time, when new dependencies become available, any bugs are fixed, etc. So it is good to make all possible upgrading steps available.
- Upgrade to newest 2.14 https://guide.meteor.com/2.14-migration . Currently xet7 is using newest 2.14.1-beta.0 in production release of WeKan https://forums.meteor.com/t/meteor-v2-14-1-beta-0-is-out/61142
- Prepare for 3.0 https://guide.meteor.com/3.0-migration
- Migrate Async
  - Helper tool https://forums.meteor.com/t/blaze-async-migration-helper-babel-plugin-tracker-async-enhance-for-the-client-side-released/60842
  - https://guide.meteor.com/prepare-meteor-3.0
- Look at progress of migrated packages https://forums.meteor.com/t/looking-for-help-migrating-packages-to-meteor-3-0/60985
- Add Eslint 3 and fix anything found
  - https://youtu.be/rFjNNNc_7-E
  - https://github.com/quavedev/eslint-plugin
  - https://github.com/quavedev/meteor-template/pull/8
- Watch Meteor Dispatches etc Podcasts https://www.youtube.com/@meteorjscommunity/playlists
  - Some recent also had info, how to make dependencies compatible with both Meteor 2 and Meteor 3
