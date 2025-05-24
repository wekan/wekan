[Mac ChangeLog](https://github.com/wekan/wekan/wiki/Mac)

Newest WeKan at these amd64 platforms:

- Windows and Linux bundle
- Snap Candidate
- Docker
- Kubernetes

Fixing other platforms In Progress.

- Install info at Server part of webpage https://wekan.github.io
- Newest Node.js is at https://github.com/wekan/node-v14-esm/releases/tag/v14.21.4
- MongoDB 6.x

[How to upgrade WeKan](https://github.com/wekan/wekan/issues/4585)

# v7.91 2025-05-25 WeKan ® release

This release adds the following updates:

- [Updated Docker build push action](https://github.com/wekan/wekan/pull/5780).
  Thanks to dependabot.

and fixes the following bugs:

- Reverted due date fixes.
  [Part 1](https://github.com/wekan/wekan/commit/1979b1692dcaf6fd909cabfb894635f1e6a66fa8),
  [Part 2](https://github.com/wekan/wekan/commit/aaa5f9885d37a369606e61a759af37f444ec606d).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.90 2025-05-14 WeKan ® release

This release fixes the following bugs:

- [Fix Due Date Problem in Non-English Numbers](https://github.com/wekan/wekan/pull/5774).
  Thanks to valhalla-creator.
- [Added missing quotes to Fix Due Date Problem in Non-English Numbers](https://github.com/wekan/wekan/commit/c0a9780f803ed445a93a274d13504a8f245c1885).
  Thanks to xet7.
- [Changed start.bat default ROOT_URL=http://localhost , although it only works for local user](https://github.com/wekan/wekan/commit/e52158b729c8ba39a55fe52e38fd6b134b42548e).
  Thanks to xet7.
- [Fix Lines in multiline markdown code block to not anymore have darker background](https://github.com/wekan/wekan/commit/b82ba63532b32ec3a0c860a380648cef6739db0f).
  Thanks to mueller-ma and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.89 2025-05-13 WeKan ® release

Note: Docker image is only at ghcr.io (GitHub) and Docker Hub (wekanteam/wekan).
Quay.io is at read only mode, they are fixing something, so it's not possible to
push Docker image yet to quay.io .

This release adds the following new features:

- [Add email notifications language localization feature](https://github.com/wekan/wekan/pull/5769).
  Thanks to Adamsss001.

and adds the following updates:

- [Added script to build snap locally and push to snapcraft.io candidate and edge](https://github.com/wekan/wekan/commit/072ced9d0e53dc6c8964e9b37fc7d1036962ca19).
  Thanks to xet7.
- [Updated Browser Compatibility Matrix by adding Servo](https://github.com/wekan/wekan/commit/394f2eae69542067fde9e2511ffcef165d170d2d).
  Thanks to xet7.
- [Updated Caddy docs](https://github.com/wekan/wekan/commit/9aa12b0eb62962bd107fe1aa87cdf5bad5a5905f).
  Thanks to xet7.
- [Upgraded to MongoDB 6.0.23 at Snap Candidate](https://github.com/wekan/wekan/commit/0bd410866196bc2faa76b9c26c12f42617321a03).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [Fix list insertion order and prevent runtime error in "Add After" feature](https://github.com/wekan/wekan/pull/5767).
  Thanks to valhalla-creator.
- [Add missing code of fix insertion order of list](https://github.com/wekan/wekan/commit/7d1a1475baefb3fd20da3df835c349a62b425041).
  Thanks to xet7.
- [Fix: Add CSS vendor prefixes for user-select and text-size-adjust for better browser compatibility](https://github.com/wekan/wekan/pull/5772).
  Thanks to oussama-madimagh.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.88 2025-04-25 WeKan ® release

This release fixes the following bugs:

- [Reverted translation fix that sometimes did not work](https://github.com/wekan/wekan/commit/c825895cebd24355d076741512c9aa16844393d9).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.87 2025-04-25 WeKan ® release

Note: This release does not work, there is bugs. Use newest release.

This release fixes the following bugs:

- [Fix typos](https://github.com/wekan/wekan/commit/d0ea5bf50067fd76359330986edbad8dd1fbcdcc).
  Thanks to xet7.
- [Fix more contrasting issues](https://github.com/wekan/wekan/pull/5750).
  Thanks to walster001.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.86 2025-04-25 WeKan ® release

Note: This release does not work, there is typos. Use newest release.

This release adds the following updates:

- [Improve impersonate user documentation in docs/Admin/Impersonate-user.md](https://github.com/wekan/wekan/pull/5746).
  Thanks to nourguidara.

and fixes the following bugs:

- [Add toggle watch icon on card. Add questions are you sure to duplicate board and archive board](https://github.com/wekan/wekan/pull/5745).
  Thanks to Rayene123.
- [Fix translations not working](https://github.com/wekan/wekan/pull/5748).
  Thanks to nourguidara.
- [Fix contrast issue checkbox at Exodark theme](https://github.com/wekan/wekan/pull/5749).
  Thanks to walster001.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.85 2025-04-21 WeKan ® release

This release adds the following updates:

- Updated Browser compatibility matrix, adding Iris browser at RISC OS Direct, and fixing links.
  [Part1](https://github.com/wekan/wekan/commit/db5346fc5c7407160f381c0fcf4a87204206ed55),
  [Part2](https://github.com/wekan/wekan/commit/05d1736f5f21e93e83b2e25029c6cab6c5106398).
  Thanks to xet7.
- [Updated to MongoDB 6.0.22](https://github.com/wekan/wekan/commit/c1a4250bd2e26be5549704234a3cfb5306120352).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [Fix board sidebar menu doesn't open in mobile](https://github.com/wekan/wekan/commit/01950cc796697fa201ac9e4376cb204d308e8181).
  Thanks to mimZD and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.84 2025-03-23 WeKan ® release

This release adds the following new features:

- [Time on minicard for Start/End/Due Date](https://github.com/wekan/wekan/pull/5712).
  Thanks to Rayene123.

and adds the following updates:

- [Added developer docs about Login code](https://github.com/wekan/wekan/commit/c0e4e01deb936653df69b4fd21598ac27cd349a0).
  Thanks to xet7.
- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/pull/5718),
  [Part 2](https://github.com/wekan/wekan/commit/bb6ac70f63b6f3568b7c943417c698615936a956).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fixed typo at Shortcuts, now became visible translations of assignees visibility 1-9 shortcuts](https://github.com/wekan/wekan/commit/4510ddda1507bc775b9523d3673adba48d7a8385).
  Thanks to xet7.
- [Fixed building OpenAPI docs](https://github.com/wekan/wekan/commit/a2911bc9c3bd94ef583388931d2cd354cc8657e3).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.83 2025-03-08 WeKan ® release

This release adds the following updates:

- [Adding Development information to readme](https://github.com/wekan/wekan/pull/5702).
  Thanks to adam-fu.
- Updated GitHub actions.
  [Part 1](https://github.com/wekan/wekan/pull/5703),
  [Part 2](https://github.com/wekan/wekan/pull/5704).

and fixes the following bugs:

- [Removed siteurl from manifest to fix browser console error about not matching URL](https://github.com/wekan/wekan/commit/b402676079517e463ed291285f69c04126a00975).
  Thanks to xet7.
- [Exception while invoking method 'copyCard' TypeError: Cannot read property 'name' of undefined](https://github.com/wekan/wekan/pull/5711).
  Thanks to Firas-Git.
- [Comment out error message of non-existing Custom Field](https://github.com/wekan/wekan/commit/908a5fc60d5d574a36d4bfd496d3a16fd267ae75).
  Thanks to xet7.
- [Reverted Docker changes of WeKan v7.68 to get WeKan Docker version working](https://github.com/wekan/wekan/commit/e7462ada12ec8edfd08d6c3b3a97a034211d51eb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.82 2025-02-24 WeKan ® release

v7.82 Docker version is broken: https://github.com/wekan/wekan/issues/5697 . Snap Candidate works.

This release adds the following new features:

- [Add possibility to use a token in place of ipaddress to access metrics route](https://github.com/wekan/wekan/pull/5682).
  Thanks to salleman33.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/pull/5691).
  Thanks to dependabot.
- [Updated requirements at docs](https://github.com/wekan/wekan/commit/148b81262d0d143460e881d645fefa6740aae40d).
  Thanks to mueller-ma.
- [Updated dependencies](https://github.com/wekan/wekan/commit/666ee8403388f7d5e1a30cf0e53bc46a70bf1c40).
  Thanks to developes of dependencies.
- [Fixed building WeKan. Updated dompurify. Forked Meteor 2.14 version of meteor-node-stubs to update elliptic](https://github.com/wekan/wekan/commit/18d0fa43275cd2955dd6416213e316ca08a62255).
  Thanks to developers of depedencies and xet7.

and fixes the following bugs:

- [Added missing ) character](https://github.com/wekan/wekan/commit/563a508e269be87eb713e2888409525e1ba82001).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.81 2025-02-07 WeKan ® release

This release adds the following new features:

- [Helm Chart: Added secretManaged value for enabling or disabling the creation of secret by Helm](https://github.com/wekan/charts/pull/39).
  Thanks to salleman33.

and adds the following updates:

- [Updated Docker Actions](https://github.com/wekan/wekan/pull/5670).
  Thanks to dependabot.
- [Added Meteor 3.1 learning course to docs](https://github.com/wekan/wekan/commit/0c7e12c5e7f322bdbaaa61100e66153dd0b92e4d).
  Thanks to producer of learning course.
- [Upgraded to MongoDB 6.0.20 at Snap Candidate](https://github.com/wekan/wekan/commit/b571f1c9530b899db75bf28a03c18277a9b77cb8).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [Fixed env variable METRICS_ACCEPTED_IP_ADDRESS to be same as at docs](https://github.com/wekan/wekan/commit/0b1e0bd39569175668c195b63dde91bf0e6f1b24).
  Thanks to salleman33.
- [Fixed misspelling of hours at env variable setting LDAP_BACKGROUND_SYNC_INTERVAL](https://github.com/wekan/wekan/commit/36a307785369337a788499065f64175971878930).
  Thanks to hubermam.
- [Helm Chart: Restore pod security context in deployment](https://github.com/wekan/charts/pull/40).
  Thanks to adalinesimonian.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.80 2025-01-12 WeKan ® release

This release fixes the following bugs:

- [Fix card updating issues with ReactiveCache when using keyboard shortcuts](https://github.com/wekan/wekan/pull/5654).
  Thanks to NadavTasher.
- [Fix assignee toggling keyboard shortcut to only toggle current board members](https://github.com/wekan/wekan/pull/5655).
  Thanks to NadavTasher.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.79 2025-01-02 WeKan ® release

This release adds the following new features:

- [Add toggle for week-of-year in date displays (ISO 8601)](https://github.com/wekan/wekan/pull/5652).
  Thanks to NadavTasher.
- [Assign members using keyboard shortcut Ctrl+Alt+(1-9)](https://github.com/wekan/wekan/pull/5653).
  Thanks to NadavTasher.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.78 2024-12-31 WeKan ® release

This release fixes the following bugs:

- [Disable scrollbars on older versions of Chrome and Safari in "no vertical scrollbars" mode](https://github.com/wekan/wekan/pull/5644).
  Thanks to NadavTasher.
- [Fix styling for vertical scrollbars toggle](https://github.com/wekan/wekan/pull/5645).
  Thanks to NadavTasher.
- [Add additional archiving keyboard shortcut (added -)](https://github.com/wekan/wekan/pull/5646).
  Thanks to NadavTasher.
- [Fix assign-self shortcut in shortcut help popup (different from actual shortcut)](https://github.com/wekan/wekan/pull/5647).
  Thanks to NadavTasher.
- [Fix upper-case keyboard shortcuts & different language shortcuts getting triggered when shortcuts are disabled](https://github.com/wekan/wekan/pull/5648).
  Thanks to NadavTasher.
- [Fix list header too wide in cleanlight and cleandark themes](https://github.com/wekan/wekan/pull/5649).
  Thanks to NadavTasher.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.77 2024-12-30 WeKan ® release

This release adds the following new features:

- [Allow vertical scrollbars to be disabled (new preference)](https://github.com/wekan/wekan/pull/5643).
  Thanks to NadavTasher.

and fixes the following bugs:

- [Enable keyboard shortcuts by default](https://github.com/wekan/wekan/pull/5639).
  Thanks to NadavTasher.
- [Fix comment backgrounds in cleandark theme](https://github.com/wekan/wekan/pull/5640).
  Thanks to NadavTasher.
- [Fix weird add checklist buttons in card details](https://github.com/wekan/wekan/pull/5641).
  Thanks to NadavTasher.
- [Fix "SPACE" shortcut not working after recent fixes](https://github.com/wekan/wekan/pull/5642).
  Thanks to NadavTasher.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.76 2024-12-30 WeKan ® release

This release fixes the following bugs:

- [Always handle the escape key when shortcuts are enabled](https://github.com/wekan/wekan/pull/5636).
  Thanks to NadavTasher.
- [New Swimlane button visible, when there are no swimlanes at all](https://github.com/wekan/wekan/pull/5635).
  Thanks to NadavTasher.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.75 2024-12-29 WeKan ® release

This release fixes the following bugs:

- [Change margins around keyboard shortcuts toggle to make it clearer, remove old toggle from mobile view](https://github.com/wekan/wekan/pull/5634).
  Thanks to NadavTasher.
- [Fix Cannot save Layout settings](https://github.com/wekan/wekan/commit/407d018067a5398f0c8d50519096b921d744be68).
  Thanks to tensor5g and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.74 2024-12-25 WeKan ® release

This release fixes the following bugs:

- [Restore keyboard shortcuts, enable per-user toggle, fix Ctrl + C bug by checking the text selection range](https://github.com/wekan/wekan/pull/5628).
  Thanks to NadavTasher.
- [Fixed keyboard shortcuts defaults, icons and texts to be more understandable](https://github.com/wekan/wekan/commit/955a46ca6016e75c0ac1b01e25f96f47c2844559).
  Thanks to xet7.
- ["Auto List Width" is now at "List ☰  Set Width" popup](https://github.com/wekan/wekan/commit/a862486ec37fcd022619c7e45ad9ca615aa444ed).
  Thanks to xet7.
- [Keyboard Shortcuts Enable/Disable is now at Right Sidebar, where already was list of Keyboard Shortcuts](https://github.com/wekan/wekan/commit/275ac445d0cd6f817dd2281aacc27ca7d30b17eb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.73 2024-12-24 WeKan ® release

This release adds the following updates:

- [Changed the default maximum list width](https://github.com/wekan/wekan/pull/5614).
  Thanks to NadavTasher.
- [Updated Developer Docs about docker compose](https://github.com/wekan/wekan/commit/3e3b629aa2a9efb43b1be8f57009c1d384b66ed8).
  Thanks to sridharin2020 and xet7.
- [Hide support popup. It will be made editable later](https://github.com/wekan/wekan/commit/0332ef32980b24a0c4e108436eec5b112287c14b).
  Thanks to xet7.
- [Hide Accessibility Settings at Admin Panel. It will be continued and added back later](https://github.com/wekan/wekan/commit/e70c51a1f033c8712771238e408cbf52487f07f5).
  Thanks to xet7.

and fixes the following bugs:

- [Fix buggy behaviours in board dragscrolling](https://github.com/wekan/wekan/pull/5618).
  Thanks to NadavTasher.
- [Revert back to have shortcut "c to archive" back for non-Persian keyboards](https://github.com/wekan/wekan/commit/ba0fdaef72393632ca80b42a3c5d2ee5f5e0c76e).
  Thanks to hatl and xet7.
- Hide and disable Keyboard Shortcuts, because they make using Ctrl-C to copy etc impossible.
  [Part 1](https://github.com/wekan/wekan/commit/5606414f8975fa0f75642d2e3a6b48c7559186f9),
  [Part 2](https://github.com/wekan/wekan/commit/94391d4cde7aed6e37efc6a9127b23ef0c2bd323),
  [Part 3](https://github.com/wekan/wekan/commit/8b73c702c39a1fd546e591a096d703a53577ffec).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.72 2024-12-08 WeKan ® release

This release adds the following new features:

- [Optional board list auto-width, Support for min & max width for lists](https://github.com/wekan/wekan/pull/5607).
  Thanks to NadavTasher.

and adds the following updates:

- [Disabled syncing of old and unrelated docker containers between docker registries](https://github.com/wekan/wekan/commit/17d5fae7bbd96eb6721ad869802cc980c9791c7f).
  Thanks to xet7.

and fixes the following bugs:

- [Fix in API user role is not considered](https://github.com/wekan/wekan/commit/c062bd63bbfceb3a96f23ea3e8696534694db54e).
  Thanks to mohammadZahedian and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.71 2024-12-05 WeKan ® release

This release adds the following new features:

- [To menu right top username, added Support, to have info about from where to get support](https://github.com/wekan/wekan/commit/46327f19a1c6d37f2e5591aa0cc2a882e4c56ee5).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.70 2024-12-04 WeKan ® release

This release adds the following new features:

- [Helm Chart: Allow to define securityContext for pod and containers](https://github.com/wekan/charts/pull/37).
  Thanks to maitredede.
- [Move card to archive, add shortcut key ÷ for Persian keyboard](https://github.com/wekan/wekan/commit/80ea1782f935c74f1b7b1fd0fb7700ef9a39dc64).
  Thanks to mohammadZahedian and xet7.

and fixes the following bugs:

- [Helm Chart: Service account token does not need to be mounted in op](https://github.com/wekan/charts/pull/38).
  Thanks to maitredede.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.69 2024-12-02 WeKan ® release

This release adds the following updates:

- [Bump docker/metadata-action from 5.5.1 to 5.6.1](https://github.com/wekan/wekan/pull/5590).
  Thanks to dependabot.
- [Updated dependencies](https://github.com/wekan/wekan/commit/9c87572f90f16fbdddb6a4dff3984e64acac20cc).
  Thanks to developers of dependencies.
- [Updated Windows docs](https://github.com/wekan/wekan/commit/aa33ead7b2efd11bfd9e3f1fb94b564b6bdce119).
  Thanks to xet7.
- [Update docker-compose.yml Keycloak part](https://github.com/wekan/wekan/pull/5597).
  Thanks to NadavTasher.
- [Updated Keycloak etc login settings at start-wekan.bat and start-wekan.sh](https://github.com/wekan/wekan/commit/ab4c3bd2fc49e6fa82ec47dccdf9670110cddf98).
  Thanks to xet7.
- [Updated release scripts](https://github.com/wekan/wekan/commit/79f7ec27159825db9206f385d9281fd68a2aacf5).
  Thanks to xet7.

and fixes the following bugs:

- [Fix issue with comments not showing when using Exodark Theme](https://github.com/wekan/wekan/pull/5595).
  Thanks to walster001.
- [Change archive-card shortcut to backtick for better ergonomics](https://github.com/wekan/wekan/pull/5589).
  Thanks to malteprang.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.68 2024-11-24 WeKan ® release

This release adds the following updates:

- [Speed improvements to building WeKan x86_64 Dockerfile. Reduced Docker image size from 1 GB to 0.5 GB. Using Ubuntu 24.04 Docker base image](https://github.com/wekan/wekan/pull/5588).
  Thanks to NadavTasher.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.67 2024-11-21 WeKan ® release

This release adds the following new features:

- [Re-introduce list auto-width feature, Reverted scrollbar hiding, Fixed transparent sidebar bug](https://github.com/wekan/wekan/pull/5586).
  Thanks to NadavTasher.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.65 2024-11-20 WeKan ® release

This release fixes the following bugs:

- [Revert some scrollbar, sidebar and list width changes](https://github.com/wekan/wekan/commit/096fe130f68e0d8d082d309901c75ed04285b7e2).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.64 2024-11-20 WeKan ® release

This release fixes the following bugs:

- [Add missing semicolon in keyboard.js](https://github.com/wekan/wekan/pull/5580).
  Thanks to NadavTasher.
- [Make lists fill up space evenly, change listWidth to max-width](https://github.com/wekan/wekan/pull/5581).
  Thanks to NadavTasher.
- [Change way of disabling scrollbars, disable swimlane scrollbars](https://github.com/wekan/wekan/pull/5583).
  Thanks to NadavTasher.
- [Improve list auto-width, fix regressions](https://github.com/wekan/wekan/pull/5584).
  Thanks to NadavTasher.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.63 2024-11-16 WeKan ® release

This release adds the following new features:

- [Always close sidebar when user clicks ESC](https://github.com/wekan/wekan/pull/5571).
  Thanks to NadavTasher.
- [Added 'n' shortcut for adding new minicards to current list](https://github.com/wekan/wekan/pull/5570).
  Thanks to NadavTasher.
- [Patch to allow shortcuts to work when another keyboard layout is used](https://github.com/wekan/wekan/pull/5574).
  Thanks to NadavTasher.

and adds the following updates:

- [Updated scaling docs](https://github.com/wekan/wekan/commit/92af6f71d9c60acbca8f65c7ec1822818186639c).
  Thanks to xet7.

and fixes the following bugs:

- [Fix some text alignment issues when using RTL languages](https://github.com/wekan/wekan/pull/5572).
  Thanks to NadavTasher.
- [Hide scrollbars where they interrupt](https://github.com/wekan/wekan/pull/5573).
  Thanks to NadavTasher.
- [Disable sidebar showing when filtering using keyboard shortcut](https://github.com/wekan/wekan/pull/5575).
  Thanks to NadavTasher.
- [Change move-to-archive keyboard shortcut to '-', because of Ctrl + C shortcut](https://github.com/wekan/wekan/pull/5576).
  Thanks to NadavTasher.
- [Potential bug(fix?) - Add assign-self keyboard shortcut (old shortcut actually adds)](https://github.com/wekan/wekan/pull/5577).
  Thanks to NadavTasher.
- [Sidebar style overhaul - absolute positioning, weird style fixes, disable sidebar scrollbar](https://github.com/wekan/wekan/pull/5578).
  Thanks to NadavTasher.
- [Revert adding more stack size](https://github.com/wekan/wekan/commit/edb73982953d63066494dbc096bdeb62f7fe730b).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.62 2024-11-15 WeKan ® release

This release adds the following new features:

- [Added comment section on card details to avoid loading the card comment activities from the server](https://github.com/wekan/wekan/pull/5566).
  Thanks to mfilser.
- [Checklist items hide per card](https://github.com/wekan/wekan/pull/5567).
  Thanks to mfilser.
- [Checklist multiline insert (many checklist items at once)](https://github.com/wekan/wekan/pull/5568).
  Thanks to mfilser.
- [Each checklist can now be configured to hide checked checklist items](https://github.com/wekan/wekan/pull/5569).
  Thanks to mfilser.

and adds the following updates:

- [Copied updated Docs from wiki to WeKan repo](https://github.com/wekan/wekan/commit/559251eb0d8aea6a714f14224497d0a25c7a3864).
  Thanks to xet7.
- [Updated docs about Linked Cards](https://github.com/wekan/wekan/commit/96627540da0b6e12890ee1660f4ff0f469bb0e25).
  Thanks to xet7.
- [Add docs about how at LXC/LXD Fix: System does not fully support snapd](https://github.com/wekan/wekan/commit/508bbb37ce960c88c2a7d0b2cb35e5d8790df19f).
  Thanks to xet7.
- [Copied from Sandstorm developer discussions to docs fix for running Sandstorm at Ubuntu 24.04](https://github.com/wekan/wekan/commit/8ac9353c5313402e00160843ca57405ebeb128cb).
  Thanks to xet7.
- [Update ldap-sync.py reference](https://github.com/wekan/wekan/pull/5555).
  Thanks to emmanuel-ferdman.
- [Updated dependencies](https://github.com/wekan/wekan/commit/b24acefa6f6696b702f2c3ceb28d6d6290017bb2).
  Thanks to developers of dependencies.
- [Update Snap Candidate to MongoDB 6.0.19. Updated WeKan Windows version numbers. Added Cron docs](https://github.com/wekan/wekan/commit/fb4d95672e37d849ff52954c79eede2af7d2a509).
  Thanks to xet7.
- [Updated docs sidebar](https://github.com/wekan/wekan/commit/5448a1569113142ab5b2440763c9642c88e86ba4)-
  Thanks to xet7.
- [Updated Docker base image to Ubuntu 24.10](https://github.com/wekan/wekan/commit/7a34bc3eb03943506abe5e54501d1906fc16540b).
  Thanks to Ubuntu developers.

and fixes the following bugs:

- [Add more stack size](https://github.com/wekan/wekan/commit/324be07b859937966f98feb2aeea8f344c689bb0).
  Thanks to xet7.
- [Fix Warning: missing space before text for line 210 of jade file client/components/activities/activities.jade](https://github.com/wekan/wekan/commit/a27f8ecfa9971740a019a955d3f8d0e5a5dd8dab).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.61 2024-10-23 WeKan ® release

This release adds the following updates:

- [Testing packages without versions from, for upcoming upgrades](https://github.com/wekan/wekan/commit/6e8e581ceb330a7756403efa1f8bbe5a198ff111).
  Thanks to xet7.
- [Updated to MongoDB 6.0.18 at Snap Candidate](https://github.com/wekan/wekan/commit/9d92a79a284147380eb08a0c011a8815dae5209b).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [Try 3 to fix apparmor denied in syslog at Snap Candidate. Changed MongoDB --host back to --bind_ip](https://github.com/wekan/wekan/commit/6c54b38cdfd14959f4449cea0c3150bf86708ecd).
  Thanks to webenefits and xet7.
- [Try 4 to fix apparmor denied in syslog at Snap Candidate](https://github.com/wekan/wekan/commit/ecdfc681700633d8688ca709f36924ceced96af8).
  Thanks to webenefits and xet7.
- [Try 5 to fix apparmor denied in syslog at Snap Candidate](https://github.com/wekan/wekan/commit/e32d2daa4567728e4dd5048c9c575edcac1372da).
  Thanks to webenefits and xet7.
- [Try 6 to fix apparmor denied in syslog at Snap Candidate](https://github.com/wekan/wekan/commit/5aa38c2e40429f06aac8bc1bc0b5ac30c5344c6f).
  Thanks to webenefits and xet7.
- [Renaming list shows in activities](https://github.com/wekan/wekan/pull/5549).
  Thanks to AdenKoziol.
- [Fixing opening cards and slow performance of closing cards by reverting switching kadira:flow-router to ostrio:flow-router-extra](https://github.com/wekan/wekan/pull/5552).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.60 2024-09-23 WeKan ® release

This release adds the following updates:

- [Added to Docs CNAME DNS info about CloudFlare and Sandstorm](https://github.com/wekan/wekan/commit/b6e7e03c95dfa68c8de6922ffb7663631e476d91).
  Thanks to xet7.
- [Switch from kadira:flow-router to ostrio:flow-router-extra](https://github.com/wekan/wekan/pull/5530).
  Thanks to imajus.
- [Removed outdated dependency page. To be seen, does anything break](https://github.com/wekan/wekan/commit/a9d41217bd8c797b28510efec3e21a92d7ec4bba).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.59 2024-09-04 WeKan ® release

This release tries to fix the following bugs:

- [Try 2 to fix apparmor denied in syslog at Snap Candidate](https://github.com/wekan/wekan/commit/0a1074ca6e95728b0da30bd701ba783f2a4bdd98).
  Newest MongoDB uses --host, not anymore --bind_ip.
  Thanks to webenefits and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.58 2024-09-04 WeKan ® release

This release tries to fix the following bugs:

- [Try to fix apparrmor denied in syslog at Snap Candidate](https://github.com/wekan/wekan/commit/a6c8833f652ee84284da2195bf79fb8edaa818b7).
  Thanks to webenefits and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.57 2024-09-04 WeKan ® release

This release adds the following updates:

- [Rework fix for mobile devices to incorporate all themes/list headers](https://github.com/wekan/wekan/pull/5517).
  Thanks to walster001.
- [Update templates to use label instead of span](https://github.com/wekan/wekan/pull/5519).
  Thanks to novashdima.
- [Large updates to UI CSS](https://github.com/wekan/wekan/pull/5523).
  Thanks to walster001.
- [Updated dependencies](https://github.com/wekan/wekan/commit/1610eff0e9212fdf6423ce5579b7bdaf8e45950b).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.56 2024-08-21 WeKan ® release

This release adds the following updates:

- Updated Browser compatibility matrix.
  [Part 1](https://github.com/wekan/wekan/commit/cab285c34d1f159120ccd48b17a897e95bd48471),
  [Part 2](https://github.com/wekan/wekan/commit/ec534c8cca3f0256091c2d870c128d26033d40ad).
- [Updated code of conduct](https://github.com/wekan/wekan/commit/cae6f38b8070cfcc2f2529027f7e66b965a19f05).
  Thanks to xet7.
- [Updated Docker build actions](https://github.com/wekan/wekan/pull/5505).
  Thanks to dependabot.
- Updated docs for building custom Docker image.
  [Part 1](https://github.com/wekan/wekan/issues/5509),
  [Part 2](https://github.com/wekan/wekan/commit/6d6d51310e4168cd0fc75f550d3af35df9ccef9f),
  [Part 3](https://github.com/wekan/wekan/commit/a94cfd5b91d29f81e51e67ed03ba84f820d4892a).
- [Update mongodb chart version to 15.6.18 and enables wekan to be deployed on an OpenShift cluster](https://github.com/wekan/charts/pull/36).
  Thanks to fobrice.
- [Upgraded Snap Candidate MongoDB to 6.0.17](https://github.com/wekan/wekan/commit/d63d445b7d5da48c05d0fbd4e560c00283b1aef7).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [Fix ModernDark Mobile View List Titles](https://github.com/wekan/wekan/pull/5503).
  Thanks to walster001.
- [Fix apparmor denied in syslog at Snap Candidate](https://github.com/wekan/wekan/commit/c3909edc5ee7a82b694b19ca7e022cbdfd12affd).
  Thanks to webenefits and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.55 2024-08-08 WeKan ® release

This release fixes the following bugs:

- [Fix board backgrounds not showing correctly after v7.54](https://github.com/wekan/wekan/pull/5501).
  Thanks to walster001.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.54 2024-08-07 WeKan ® release

This release adds the following new features:

- [Helm Chart: Add Support for Overriding Image Registry in Airgapped Environments](https://github.com/wekan/charts/pull/35).
  Thanks to geilername.
- [PWA, move to standalone (standard) to display the status bar](https://github.com/wekan/wekan/pull/5484)
  Thanks to mfilser.
- [Added info how with Caddy webserver config, PWA and Android app override icons, showing toolbars, etc](https://github.com/wekan/wekan/commit/55fc342f6d90d8e30b70a8903ecead1c4370bd89).
  Thanks to xet7.

and fixes the following bugs:

- [Don't set background image in .board-canvas too](https://github.com/wekan/wekan/pull/5485).
  Thanks to mfilser.
- [Bugfix, variable "color" didn't exist](https://github.com/wekan/wekan/pull/5486).
  Thanks to mfilser.
- [Little opacity to minicards to see the background image a little bit](https://github.com/wekan/wekan/pull/5487).
  Thanks to mfilser.
- [Remove attachment storage name from attachment list](https://github.com/wekan/wekan/pull/5488).
  Thanks to mfilser.
- [Attachment popup back was broken since new attachment viewer, now fixed](https://github.com/wekan/wekan/pull/5489).
  Thanks to mfilser.
- [Change Meteor.user() to ReactiveCache.getCurrentUser()](https://github.com/wekan/wekan/pull/5490).
  Thanks to mfilser.
- [Fix empty parentId in cards](https://github.com/wekan/wekan/pull/5491).
  Thanks to mfilser.
- [Sidebar xmark icon, add padding and background color](https://github.com/wekan/wekan/pull/5492).
  Thanks to mfilser.
- [Board view, first column a bit smaller to save screen space](https://github.com/wekan/wekan/pull/5493).
  Thanks to mfilser.
- [Minicard, show creator, defaultValue of schema and other code is now the same](https://github.com/wekan/wekan/pull/5494).
  Thanks to mfilser.
- [Editor, Bugfix, copy text is now at each editor (textarea) again](https://github.com/wekan/wekan/pull/5495).
  Thanks to mfilser.
- [Bugfix, Cards Count on mobile view was missing](https://github.com/wekan/wekan/pull/5496).
  Thanks to mfilser.
- [ListHeader, simpler code logic at collapsed if conditions](https://github.com/wekan/wekan/pull/5497).
  Thanks to mfilser.
- [Bugfix, edit description didn't work if it was clicked](https://github.com/wekan/wekan/pull/5498).
  Thanks to mfilser.
- [Fix LDAP login fails after upgrade](https://github.com/wekan/wekan/commit/a4169f3da773e4fd961acd0266260085a753cdab).
  Thanks to juppees and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.53 2024-08-03 WeKan ® release

This release adds the following new features:

- [Added Dragscroll to scroll the board](https://github.com/wekan/wekan/pull/5477).
  Click on an empty space in the board, hold the left mouse and move left and right
  to scroll the board easily.
  Thanks to mfilser.

and adds the following updates:

- [Updated release script: New install webpage location](https://github.com/wekan/wekan/commit/5e639a7c2d6dc1182ba95e44875ac8a6798a62be).
  Thanks to xet7.
- [Updated dependencies](https://github.com/wekan/wekan/commit/3f9ae57144dc9befd674c784896d68b5db9df146).
  Thanks to developers of dependencies.
- [Copied changes from wiki to docs](https://github.com/wekan/wekan/commit/aaca60b6760cc84b56a24fc15c93f23b4a34f06e).
  Thanks to xet7.
- [Updated Snap Candidate to MongoDB 6.0.16](https://github.com/wekan/wekan/commit/1af1844f37d17f9f54ca358ccf0f44eed1dfbef4).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [Board Menu Popup's were opened twice because of 2 same event creation](https://github.com/wekan/wekan/pull/5478).
  Thanks to mfilser.
- [Fixing of "mode is undefined" on first activity component creation](https://github.com/wekan/wekan/pull/5479).
  Thanks to mfilser.
- [Changing card color now closes the popup and doesn't refresh the whole board page](https://github.com/wekan/wekan/pull/5480).
  Thanks to mfilser.
- [Fix dragscroll package name](https://github.com/wekan/wekan/commit/45674806d78fddb8a3b8a75890e5059cc1a680ea).
  Thanks to xet7.
- [Reducing card size in database if no planning poker was started](https://github.com/wekan/wekan/pull/5481).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.52 2024-08-03 WeKan ® release

This release adds the following new features:

- [Helm Chart: Add option to set resource limits for initContainer](https://github.com/wekan/charts/pull/33).
  Thanks to mreichelt-dicos.
- [Helm Chart: Fixes for mongodb persistence. Please test is this correct](https://github.com/wekan/charts/commit/7efb071dd91d76c3971e1865fd18f9d43d8c6891).
  Thanks to emoritzx.
- [Helm Chart: Added info about rarely used running WeKan at subpath](https://github.com/wekan/charts/commit/7d4176c7b328c5477c1fa29a323574aac78616a9).
  Thanks to emoritzx.

and adds the following updates:

- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/pull/5460),
  [Part 2](https://github.com/wekan/wekan/pull/5464),
  [Part 3](https://github.com/wekan/wekan/pull/5460),
  [Part 4](https://github.com/wekan/wekan/pull/5469),
  [Part 5](https://github.com/wekan/wekan/pull/5470),
  [Part 6](https://github.com/wekan/wekan/pull/5471),
  [Part 7](https://github.com/wekan/wekan/pull/5473).
  Thanks to dependabot.
- Added RepoCloud SaaS.
  [Part 1](https://github.com/wekan/wekan/commit/21d6dfd79090f9885635f55537bd9fa1ef8539e1),
  [Part 2](https://github.com/wekan/wekan/commit/e663ce038af397f547e8823d61ce5dc2e3cea84d),
  [Part 3](https://github.com/wekan/wekan.github.io/commit/e9e0550824cdda31daae42df7c497fbd037fd78f).
  Thanks to RepoCloud.
- [Updated WeKan app webmanifest](https://github.com/wekan/wekan/commit/745618626535743938b9d2e8c88afe6345807a85).
  Thanks to xet7.
- [Revert forking of ldapjs](https://github.com/wekan/wekan/commit/c89f3ba3da6512169e033d76377a9190b35a92d2).
  Thanks to xet7.

and fixes the following bugs:

- [Fixes to Clean light and Clean dark themes](https://github.com/wekan/wekan/pull/5458).
  Thanks to abramchikd.
- [Activities, adding back "created at" field](https://github.com/wekan/wekan/pull/5476).
  Thanks to mfilser.
- [Fix typos at attachments code](https://github.com/wekan/wekan/commit/de3bc9cb4d20590c45ff72ef7749d830ea3fc16c).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.51 2024-06-27 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/pull/5452).
  Thanks to dependabot.
- Moved docs from wiki to wekan repo docs directory, organized to subdirectories. Organizing and updating in progress.
  [Part 1](https://github.com/wekan/wekan/commit/1961e22cbd51e83aa131c8b092c7d43475a021eb),
  [Part 2](https://github.com/wekan/wekan/commit/ce89ff48331a27ffb42d021833c78df3a462b9db),
  [Part 3](https://github.com/wekan/wekan/commit/449c02c42a0183a49592ada89bdfb8f25e5db903),
  [Part 4](https://github.com/wekan/wekan/commit/0fb2f7fdd6b6cb828ab4ea534204a5b834d2e19a),
  [Part 5](https://github.com/wekan/wekan/commit/e9c1c620eb938349c30761497066daf41cdcfc19),
  [Part 6](https://github.com/wekan/wekan/commit/6b7b66801b716e1d0bf2548b18eed4ed4e354f2d),
  [Part 7](https://github.com/wekan/wekan/commit/1cfaddff9cd4fe84fb74c80d1585f2a5dd65f5ca),
  [Part 8](https://github.com/wekan/wekan/commit/057ac4031eaa912b849c637e163f4dffa79a9329),
  [Part 9](https://github.com/wekan/wekan/commit/52375df78380bbe3407b51dc986baaf6f31f40e4),
  [Part 10](https://github.com/wekan/wekan/commit/00a56f6aaa0c2bcd24ca8829a0718b45e7cedf04),
  [Part 11](https://github.com/wekan/wekan/commit/c863428aa2597457fc4931e7b1bdd75d6cc2610b).
  Thanks to xet7.

and fixes the following bugs:

- [Fix ModernDark Cards not showing correctly](https://github.com/wekan/wekan/pull/5455).
  Thanks to walster001.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.50 2024-06-22 WeKan ® release

This release adds the following new features:

- [Added "Clean dark" and "Clean light" themes that are more clean and modern looking](https://github.com/wekan/wekan/pull/5449).
  Thanks to abramchikd.

and adds the following updates:

- Updated docs for WeKan version for Windows.
  [Part 1](https://github.com/wekan/wekan/commit/9b428150a4fb9efdcb2ae9d3bb59d0da29529e69),
  [Part 2](https://github.com/wekan/wekan/commit/3c35a6400b88e071a474a552ee941892522c8d59).
  Thanks to xet7.
- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/pull/5446),
  [Part 2](https://github.com/wekan/wekan/commit/99a8afd6c39591e0d85fe5f55ebc3016b9e7f011).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Task card may overflow below the screen when maximized, making the bottom part not viewable](https://github.com/wekan/wekan/pull/5443).
  Thanks to Hekatomb.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.49 2024-06-11 WeKan ® release

This release adds the following updates:

- [WeKan new release version number from wiki to WeKan repo docs](https://github.com/wekan/wekan/commit/e5c7650fc8eb5c3fcc6216f12e806ceb56fd94d9).
  Thanks to xet7.
- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/pull/5430),
  [Part 2](https://github.com/wekan/wekan/pull/5441).
  Thanks to dependabot.

and fixes the following bugs:

- [Bugfix: Strikethrough inactive Teams and orginizations logic was inverted](https://github.com/wekan/wekan/pull/5435).
  Thanks to Hekatomb.
- [Changed back to original icon of Edit Description](https://github.com/wekan/wekan/commit/e3214c874ec9369ab6b865154f7964da8ec55f45).
  Thanks to saschafoerster, C0rn3j and xet7.
- [Fill out Org and Team in adminReports](https://github.com/wekan/wekan/pull/5440).
  Thanks to Hekatomb.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.48 2024-06-06 WeKan ® release

This release adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/4a9d881e47751ec49d24af5bf4fd1c5452ceb194).
  Thanks to xet7.
- Add changes from wiki to docs.
  [Part 1](https://github.com/wekan/wekan/commit/13be8160d5b6a894c674d04c37ff9e653e7bd4b0),
  [Part 2](https://github.com/wekan/wekan/commit/e65a8c90177cd948ca8212486a365b65cd7d5372).
  Thanks to xet7.

and fixes the following bugs:

- [Fix Admin Panel pages Organizations and Teams, where HTML Tables were broken](https://github.com/wekan/wekan/commit/36bb5e099ed9f1f88c0399867bd76f040467745c).
  Thanks to Hekatomb and xet7.
- [Try to show more of title of collapsed list](https://github.com/wekan/wekan/commit/ec0e88ad2e914437b4767456a160f2c1138fc5f2).
  Thanks to C0rn3j and xet7.
- [Allow Normal user to add new swimlane, list and label](https://github.com/wekan/wekan/commit/04b995e77fdb5abc186e02482a75aba6a5cf0759).
  Thanks to RyanHecht, norrig and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.47 2024-06-03 WeKan ® release

This release adds the following updates:

- [Update Docker base images to Ubuntu 24.04](https://github.com/wekan/wekan/commit/79e2001708b5110b26cf54b15bbbf90f7977fe90).
  Thanks to xet7.
- [Updated to MongoDB 6.0.15 at Snap Candidate](https://github.com/wekan/wekan/commit/4e2a8735bc2e449a2a3c949d042fb625052a1152).
  Thanks to MongoDB developers.
- [Updated release scripts](https://github.com/wekan/wekan/commit/2c9c9c43561093801004f0268d58b29d9a10b570).
  Thanks to xet7.

and fixes the following bugs:

- [Only show Board name edit button to BoardAdmin](https://github.com/wekan/wekan/commit/5e2b423ef87c62a70a6b08abd2f185fd560f391f).
  Thanks to xet7.
- [Fix Edit Description button is wildly out of place](https://github.com/wekan/wekan/commit/1f2fb2ccce38e9cac348f1c459784d6e5a949ded).
  Thanks to C0rn3j and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.46 2024-06-03 WeKan ® release

This release adds the following updates:

- [Update ukrainian translation](https://github.com/wekan/wekan/pull/5405).
  Thanks to novashdima.
- [Updated GitHub issue template for issue instructions to be more visible](https://github.com/wekan/wekan/commit/5124265142c94d5044b81f81eaaa9c3bc01cef58).
  Thanks to xet7.
- [For development, only recommend Debian 12 amd64, because Sandstorm works at Debian 12. Sandstorm does not work at Ubuntu 24.04](https://github.com/wekan/wekan/commit/1bd30bc12129be8cc8a633a561bb8a5be76823d7).
  Thanks to xet7. Related https://github.com/sandstorm-io/sandstorm/issues/3712

and fixes the following bugs:

- [Optimize SVGs and PNGs to save 550KB](https://github.com/wekan/wekan/pull/5403).
  Thanks to C0rn3j.
- [Swap deprecated egrep for grep -E](https://github.com/wekan/wekan/pull/5404).
  Thanks to C0rn3j.
- [Remove notification while copying board](https://github.com/wekan/wekan/pull/5412).
  Thanks to e-gaulue.
- [Fixed loading of cards if there are more than 20 of them on one swimlane](https://github.com/wekan/wekan/pull/5417).
  Thanks to novashdima.
- [Devcontainer, reduce image size and other necessary changes for development](https://github.com/wekan/wekan/pull/5418).
  Thanks to mfilser.
- [Dockerfile production and dev same build](https://github.com/wekan/wekan/pull/5419).
  Thanks to mfilser.
- [Remove second created at on activities](https://github.com/wekan/wekan/pull/5420).
  Thanks to mfilser.
- [Fix Export CSV/TSV from Board create unhandled Exception](https://github.com/wekan/wekan/pull/5424).
  Thanks to Dexus.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.45 2024-05-06 WeKan ® release

This release adds the following updates:

- [Update Docker base container to Ubuntu 24.04, and update software versions](https://github.com/wekan/wekan/commit/63117e87e759af965c8eeceaaa41f52815630d20).
  Thanks to developers of dependencies.
- [Updated dependencies](https://github.com/wekan/wekan/pull/5392).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix display of tables with a large number of rows](https://github.com/wekan/wekan/pull/5393).
  Thanks to novashdima.
- [Fix white List color and define Silver in CSS instead of leaving it unset](https://github.com/wekan/wekan/pull/5400).
  Thanks to C0rn3j.
- [Allow silver color to be set in List and Swimlane](https://github.com/wekan/wekan/pull/5401).
  Thanks to C0rn3j.
- [Fix Can't set a Due Date that has a leading zero in time, errors with invalid time](https://github.com/wekan/wekan/commit/9cebee734740790145ca574c539ccebd067cee7e).
  Thanks to C0rn3j and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.44 2024-04-26 WeKan ® release

This release adds the following new features:

- [Collapse Lists](https://github.com/wekan/wekan/commit/a601ba542aebefdfa8b5d683d22405ab3d5f8569).
  Thanks to xet7.
- [Collapse Swimlanes. In Progress, does not work yet, not visible yet](https://github.com/wekan/wekan/commit b704d58f0f3cf5e7785b79d5a6c9f6c63da4159c).
  Thanks to xet7.

and fixes the following bugs:

- [Fix board not visible at Collapse Lists](https://github.com/wekan/wekan/commit/e6476319bcb06cc71fa0eefa0a608ec3a7b89767).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.43 2024-04-18 WeKan ® release

This release adds the following updates:

- [Updated release script for Windows On-Premise, that is without container like Docker and Snap](https://github.com/wekan/wekan/commit/802eeb1e6bb87c45fa79298f67ff690e87f939f8).
  Thanks to xet7.
- [Updated translations Transifex URL at readme](https://github.com/wekan/wekan/commit/9838af5e5630a6ef34175e110ddfb6bfc225b40c).
  Thanks to xet7.
- [Improve Docker files](https://github.com/wekan/wekan/pull/5377).
  Thanks to C0rn3j.
- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/08e2f2f2731856255e0b40eb692328424efdf9ac),
  [Part 2](https://github.com/wekan/wekan/commit/da99e363cd72cda7d400ce65785a6650e42c72cf).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix DEBUG environment variable check](https://github.com/wekan/wekan/pull/5380).
  Thanks to verdel.
- [By default, use localized long date-time format](https://github.com/wekan/wekan/pull/5381).
  Thanks to tvogel.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.42 2024-04-03 WeKan ® release

This release fixes the following CRITICAL SECURITY ISSUES:

- [Fixed CRITICAL SECURITY ISSUE by updating meteor-node-stubs](https://github.com/wekan/wekan/commit/c461adff11456734fcb9193b5522cc6451078732).
  Thanks to Meteor developers.

and adds the following updates:

- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/pull/5355),
  [Part 2](https://github.com/wekan/wekan/pull/5356),
  [Part 3](https://github.com/wekan/wekan/commit/1c8f783767a680758f2219d2f416ce3ae2fb0c57).
  Thanks to dependabot and developers of dependencies.
- [Small tweaks to moderndark theme](https://github.com/wekan/wekan/pull/5363).
  Thanks to jghaanstra.

and fixes the following bugs:

- [Fixed link at readme](https://github.com/wekan/wekan/pull/5360).
  Thanks to dyercode.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.41 2024-03-18 WeKan ® release

This release fixes the following bugs:

- Fixes for mongosh to allow snap packages to update to the edge/candidate version.
  [Part 1](https://github.com/wekan/wekan/pull/5349),
  [Part 2](https://github.com/wekan/wekan/pull/5350).
  Thanks to lorodoes.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.40 2024-03-17 WeKan ® release

This release fixes the following bugs:

- [Fixed centering of text below custom login logo](https://github.com/wekan/wekan/commit/24c89aeb64cf6266d95f42124419d4f070864631).
  Thanks to xet7.
- [Fixed In RTL, hamburger margin is too much in mobile](https://github.com/wekan/wekan/commit/583fca1814d916490b04947ba8d97dd85168fb22).
  Thanks to mohammadZahedian and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.39 2024-03-16 WeKan ® release

This release adds the following updates:

- Clarify usage of api.py.
  [Part 1](https://github.com/wekan/wekan/pull/5341).
  [Part 2](https://github.com/wekan/wekan/commit/8f3c948614df0641b0971d1882cc241587d9d3b4).
  Thanks to e-gaulue and xet7.
- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/pull/5343),
  [Part 2](https://github.com/wekan/wekan/pull/5344).

and fixes the following bugs:

- [Make the contents of the cards grow to the list width](https://github.com/wekan/wekan/pull/5346).
  Thanks to kuba-orlik.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.38 2024-03-10 WeKan ® release

This release adds the following new features:

- [Added docs wikis to WeKan repo directory docs, to make possible to send PRs](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804).
  Thanks to e-gaulue, C0rn3j and xet7.
- [Added script to count lines of code changed per committer email address, because GitHub removed that feature from web UI](https://github.com/wekan/wekan/commit/835e33bf090022875f50916412f80b6a9b4a3b21).
  Thanks to bgwines and xet7.
- [Add info about GitHub top committers at Finland](https://github.com/wekan/wekan/commit/ef5b8887799a75ab797655f39483bc08841815d2).
  Thanks to xet7.

and adds the following updates:

- [Updated contributing to wiki](https://github.com/wekan/wekan/commit/8ba3a05648818f6162b2021affeb33066f91c400).
  Thanks to xet7.
- [Upgraded to MongoDB 6.0.14 at Snap Candidate](https://github.com/wekan/wekan/commit/07d6c1e5148eb0392357d55d0486a9672378c16f).
  Thanks to MongoDB developers.

and tried to fix the following bugs:

- [Fix error during delete](https://github.com/wekan/wekan/pull/5336).
  Thanks to xator91.
- [Fixed text below custom login logo not visible](https://github.com/wekan/wekan/commit/00bbc2669814247c0ff79bd816be7bf34bcf08a2).
  Thanks to xet7.
- [Fixed In RTL, hamburger needs margin](https://github.com/wekan/wekan/commit/abd3c95dfa13cd697ff2fb7e299c85287406772a).
  Thanks to mohammadZahedian and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.37 2024-03-07 WeKan ® release

This release fixes the following bugs:

- [Fixed API get swimlane cards wrong order. Please test](https://github.com/wekan/wekan/commit/7beced1e683c2eb2960b0ee40d5ec927d235fa6a).
  Thanks to mohammadZahedian, xator91 and xet7.
- [Fixed API get_all_cards doesn't return SwimlaneId. Please test](https://github.com/wekan/wekan/commit/ffafb30b9b394188e1b60ec836ad83f1738c266d).
  Thanks to mohammadZahedian, xator91 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.36 2024-03-06 WeKan ® release

This release adds the following features:

- [api.py: checklistid, checklistinfo, get_list_cards_count and get_board_cards_count](https://github.com/wekan/wekan/pull/5326).
  Thanks to xator91.

and fixes the following bugs:

- [Fixed Card image cover should be margin-top:6px since hamburger menu and due date at the top](https://github.com/wekan/wekan/commit/747bc4c08837ad9781d63b9f16b97a64b0bfe7b8).
  Thanks to e-gaulue and xet7.
- [Try to fix API get cards wrong order. Please test](https://github.com/wekan/wekan/commit/c570405d0267e28f2b2644005d48fb097eac385b).
  Thanks to mohammadZahedian, xator91 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.35 2024-02-27 WeKan ® release

This release adds the following features and bugs:

- [Added back Mathjax that has bug of showing math twice](https://github.com/wekan/wekan/commit/f43dadc06894d874281ec0e449dcc4c81b3c59ad).
  Thanks to macthecadillac, Dexus and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.34 2024-02-23 WeKan ® release

This release adds the following updates:

- [Updated translations](https://github.com/wekan/wekan/commit/3cd5d00b0b8d74acb2cd2afbc12f5b9d7aafcbd8).
  Thanks to translators.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.33 2024-02-23 WeKan ® release

This release adds the following updates:

- [Updated docs for previous version of WeKan](https://github.com/wekan/wekan/commit/3b0616c1500b5070e660d2ba00968d59600958eb).
  Thanks to xet7.

and fixes the following bugs:

- [OpenAPI: Fix breakage introduced with blank return](https://github.com/wekan/wekan/pull/5321).
  Thanks to bentiss.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.32 2024-02-22 WeKan ® release

This release adds the following new features:

- [api.py: Added create label](https://github.com/wekan/wekan/pull/5308).
  Thanks to xator91.
- [api.py: Edit card color](https://github.com/wekan/wekan/pull/5309).
  Thanks to xator91.
- [api.py: Add checklist with multiple items also or just title](https://github.com/wekan/wekan/pull/5311).
  Thanks to xator91.
- [api.py: Delete all cards. Will delete all cards from Swimlanes automatically, will retrieve automatically all list id and delete everything](https://github.com/wekan/wekan/pull/5313).
  Thanks to xator91.
- [cards.js: Added a control to check error if card is not updated](https://github.com/wekan/wekan/pull/5312).
  Thanks to xator91.
- [Shortcut a to filter by assignees](https://github.com/wekan/wekan/pull/5318).
  Thanks to DevOpsNB.

and fixes the following bugs:

- [Fixed Error 500 when adding user to a board and multiple same avatar icons by reverting back from Meteor 2.15 to 2.14](https://github.com/wekan/wekan/commit/b5f4be36d4577c391ad19c5e5dd9de3036b8998f).
  Thanks to xator91, mariogalan, bbyszio, zeo101, laurentm255, johnnytolengo and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.31 2024-02-17 WeKan ® release

This release adds the following new features:

- [api.py: Added getcard and cardsbyswimlane](https://github.com/wekan/wekan/pull/5287).
  Thanks to xator91.
- [api.py: Add card with label and add a label to a card](https://github.com/wekan/wekan/pull/5290).
  Thanks to xator91.
- [api.py: Fix BoardID to SwimlaneID in cardsbyswimlane](https://github.com/wekan/wekan/pull/5290).
  Thanks to xator91.
- [boards.js: New update board title function for API](https://github.com/wekan/wekan/pull/5300).
  Thanks to xator91.
- [api.py: EDIT BOARD TITLE](https://github.com/wekan/wekan/pull/5301).
  Thanks to xator91.

and adds the following updates:

- [Release scripts: Commented out not currently in use builds of WeKan bundle](https://github.com/wekan/wekan/commit/4eb0085243672071a392dc32f77dba3103c592ab).
  Thanks to xet7.
- [Try to fix Snap](https://github.com/wekan/wekan/commit/a54e52d34bdab02befda7eefad46d16814d2c46e).
  Thanks to xet7.
- [Updated to Meteor 2.15-rc.1 and removed duplicate nodemailer package because of some errors](https://github.com/wekan/wekan/commit/59c42bc1a3a1792a50379be2f9251fce9b45c1a3).
  Thanks to Meteor developers.
- [Updated to Meteor 2.15](https://github.com/wekan/wekan/commit/5198ee997cb43b503fcb2edaf781b0521d8096cd).
  Thanks to Meteor developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.30 2024-01-28 WeKan ® release

This release adds the following updates:

- [Back to MongoDB 6.0.13](https://github.com/wekan/wekan/commit/64592d734cfdbe10b48c3aa3ea74e0ba35903976).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.29 2024-01-27 WeKan ® release

This release removes the following features:

- [Removed markdown-it-mathjax3](https://github.com/wekan/wekan/commit/19703fed311c894b61e9269cc0b973d0b0275a6a).
  Thanks to Dexus and xet7.

and adds the following updates:

- [Updated to Meteor 2.14.1-beta.0](https://github.com/wekan/wekan/commit/28d640afb40f4d7c9070fa514c910fbf7065a724).
  Thanks to Meteor developers.
- [Updated to MongoDB 7.0.5 at Snap Candidate and Docker](https://github.com/wekan/wekan/commit/f624211620c5e42ccdd6f931ba473be62437a62c).
  Thanks to MongoDB developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.28 2024-01-23 WeKan ® release

This release adds the following new features:

- [Added archive option to of Wekan API](https://github.com/wekan/wekan/pull/5265).
  Thanks to gustavengstrom.

and adds the following updates:

- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/pull/5270),
  [Part 2](https://github.com/wekan/wekan/pull/5271),
  [Part 3](https://github.com/wekan/wekan/commit/67896adefc4a12a93fed7575f621f8aa924a2ab8).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.27 2024-01-02 WeKan ® release

This release fixes the following bugs:

- [Fix missing maximize card](https://github.com/wekan/wekan/commit/f10f80f6559a6cdee020d5ca34fd5991e07617cf).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.26 2024-01-02 WeKan ® release

This release fixes the following bugs:

-[Fix some public board buttons](https://github.com/wekan/wekan/commit/8ae47cb2f82bcc2078cc9c9987f7d7b7f6394493).
 Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.25 2023-12-30 WeKan ® release

This release adds the following updates:

- [Snap: Organized file locations](https://github.com/wekan/wekan/commit/84a228fc1a7ced2b8b146795acc13eb5abb13d24).
  Thanks to xet7.
- Updated GitHub Actions.
  [Part 1](https://github.com/wekan/wekan/pulls/5243),
  [Part 2](https://github.com/wekan/wekan/pulls/5244),
  [Part 3](https://github.com/wekan/wekan/pulls/5245).
- [Updated percolate:synced-cron](https://github.com/wekan/wekan/commit/06397e9e11a689a0a2e6a95ae785749d5a6a695b).
  Thanks to developers of percolate:synced-cron.
- Snap: Added MongoDB 3 binaries for migrating to MongoDB 6.
  [Part 1](https://github.com/wekan/wekan/commit/805458a7638ff6213929bfa70a46b5afeacaedf1),
  [Part 2](https://github.com/wekan/wekan/commit/335f0451e07d6ff924c0af3e5a934676c8e69f4c),
  [Part 3](https://github.com/wekan/wekan/commit/374e67310723f3c0d3ab20f6b2e4bd0b273bce2b).
  Thanks to xet7.
- [Updated dependencies](https://github.com/wekan/wekan/commit/0e6d83c0852b2da4430f9c902b84c16f5c2ee8bc).
  Thanks to developers of dependencies.

and adds the following translations:

- [Translations: Added German (Germany) (de_DE) and Odia (India) (or_IN)](https://github.com/wekan/wekan/commit/23c2a2bc224e2def4722a35c20f32a21062b4154).
  Thanks to translators.

and fixes the following bugs:

- [Fix: Export HTML popup](https://github.com/wekan/wekan/pull/5252).
  Thanks to Lewiscowles1986.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.24 2023-12-17 WeKan ® release

This release adds the following new features:

- [Azure AD B2C login using OAuth2](https://github.com/wekan/wekan/commit/93be112a9454c894c1ce3146ed377e6a6aeca64a).
  https://github.com/wekan/wekan/wiki/B2C .
  Thanks to snowsky and xet7.

and adds the following updates:

- [Upgrade to Meteor 2.14](https://github.com/wekan/wekan/commit/75383fe477874a7aaf5caa3b913e2173694efe13).
  Thanks to Meteor developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.23 2023-12-11 WeKan ® release

This release adds the following updates:

- [Updated security.md about mitm](https://github.com/wekan/wekan/commit/b4c9c1df9a7e89d263b1864407a7007338ce770d).
  Thanks to xet7.
- [Upgraded to Meteor 2.14-rc.3](https://github.com/wekan/wekan/commit/6a3b8a668bc84c89714e44c3865168be81c8e2ed).
  Thanks to Meteor developers.
- [Updated dependencies](https://github.com/wekan/wekan/commit/e3a0a480ed960d30fc80f7c7c1a6c7471368d0e8).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.22 2023-12-01 WeKan ® release

This release adds the following new features:

- [At right sidebar, moved Minicard Settings to Card Settings popup](https://github.com/wekan/wekan/commit/2f2a039e3c1957b8921f3800315508d4f51c21b7).
  Thanks to Roemer and xet7.
- [New feature: Sidebar / Card Settings / Creator at minicard](https://github.com/wekan/wekan/commit/f3242869110738210b712761dda67fec34932307).
  Thanks to Roemer and xet7.

and adds the following updates:

- [Upgraded to MongoDB 6.0.12 at Snap Candidate](https://github.com/wekan/wekan/commit/31ca78c17b0c734087cef99d481b939ac9533612).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [Fixed Markdown and copy buttons on top of text](https://github.com/wekan/wekan/commit/3cc10c77f99db344d0af3d6d862eb05c909fbf2c).
  Thanks to mueller-ma and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.21 2023-11-27 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/fef0c0e490ef0d90b6504074312bf827ff5f2d61).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.20 2023-11-26 WeKan ® release

This release adds the following updates:

- [Added standard for public code assessment](https://github.com/wekan/wekan/commit/a307bfa1ec82b66d97714bff32d4201aa8e6e6f7).
  Thanks to those that participated to making of assessment.
- [Upgraded to Meteor 2.14-beta.2](https://github.com/wekan/wekan/commit/126ddda45d07769f9fef67aa74241c9afa04b6a8).
  Thanks to Meteor developers.
- [Upgraded to Meteor 2.14-beta.4](https://github.com/wekan/wekan/commit/d90ab03bbe9f13d211aaca2e72542386fdf2a6ba).
  Thanks to Meteor developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.19 2023-11-20 WeKan ® release

This release adds the following new features:

- [Updated swimlane (restore and changed title) and board (changed title) webhooks](https://github.com/wekan/wekan/pull/5205).
  Thanks to gustavengstrom.
- When user logins, "Automatically add user with the domain name" (at Admin Panel / Organizations) to Organization. In Progress.
  [Part 1](https://github.com/wekan/wekan/commit/6e2f84673e98abec07a10c843ab83bed50774b35),
  [Part 2](https://github.com/wekan/wekan/commit/9bc63669933bd763930add22ad7d05d89566d3ee).
  Thanks to xet7.
- [Permissions for default board after OIDC/OAuth2 login](https://github.com/wekan/wekan/pull/5213).
  Thanks to diegosteiner.

and adds the following updates:

- [Added governance.md](https://github.com/wekan/wekan/commit/2b1d2222cc900e8c815c30a4d07c897e30ba3636).
  Thanks to xet7.
- Updated contributing.md.
  [Part 1](https://github.com/wekan/wekan/commit/d840cb3be7b1788a4dbdd09ef45690afcf6b3dd4),
  [Part 2](https://github.com/wekan/wekan/commit/e91e68c48c6392814fbc1362b7ae15ead34e7e47),
  [Part 3](https://github.com/wekan/wekan/commit/026236edc962a8fc3863b9a4f7dc1d1f5dec3b5c),
  [Part 4](https://github.com/wekan/wekan/commit/59874d16b9cf95ff05d92dd4d3bbdcb42fd37a94).
- [Updated security.md](https://github.com/wekan/wekan/commit/f047c6da295c4ab5ddc6d4d0a8137f419d8704d5).
- Updated code of conduct.md.
  [Part 1](https://github.com/wekan/wekan/commit/c4293ecd95b9faec846060bcbcb8362cb58a54e6),
  [Part 2](https://github.com/wekan/wekan/commit/f512047ac6439e53f92359f45ab907c629d225a9).

and fixes the following bugs:

- [Removed console.log](https://github.com/wekan/wekan/commit/0c54c1540c494bb7ffeb61a89cbc9a79c8f05d19).
  Thanks to xet7.
- [Fix typos at oidc_server.js](https://github.com/wekan/wekan/commit/cd51ad75086950f29adf245b6d6c0b43e69da171).
  Thanks to xet7.
- [Fix to not anymore show confusing Organization Id and Team Id fields at Admin Panel / People / People / Edit user](https://github.com/wekan/wekan/commit/6405c35bc08fc73657a4111c6fd72a8bd72ded70).
  Thanks to xet7.
- [Fix to not anymore require website for Organization and Team](https://github.com/wekan/wekan/commit/d4d6a5f96d88a89eb47ee56ba9857e859203a53c).
  Thanks to xet7.
- [Snap: Disable apparmor="DENIED" in syslog](https://github.com/wekan/wekan/commit/2048975e92152bb1c397b61fc2fd0a8124fade58).
  Thanks to diegargon, webenefits and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.18 2023-11-14 WeKan ® release

This release adds the following new features:

- [Added restore list and changing list title to outgoing webhooks](https://github.com/wekan/wekan/pull/5198).
  Thanks to gustavengstrom.

and adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/d4252f30567665897c6314b578dff1fe294265de).
  Thanks to xet7.

and fixes the following bugs:

- [Add Docker label org.opencontainers.image.source](https://github.com/wekan/wekan/pull/5196).
  Thanks to mueller-ma.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.17 2023-11-09 WeKan ® release

This release fixes the following bugs:

- [Fix move card rule on checklist complete doesn't work, with ReactiveMiniMongoIndex for Server-Side](https://github.com/wekan/wekan/pull/5194).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.16 2023-11-09 WeKan ® release

This release fixes the following bugs:

- [Fix users.save is not a function](https://github.com/wekan/wekan/commit/42ece21fa14113a28792bf97dfd899a064f0ea56).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.15 2023-11-09 WeKan ® release

This release fixes the following bugs:

- [Fix missing profile/avatar pictures](https://github.com/wekan/wekan/commit/4e97a5351a4ac715d21503a129f12fe5bf3f4016).
  Thanks to kovacs-andras and xet7.
- [Commented out links at My Cards Table, because they unexpectly caused to go elsewhere from current view](https://github.com/wekan/wekan/commit/2c36fe3d45a0f95f8ba18526ffd1dc230f6f46a8).
  Thanks to xet7.
- [Add more Docker Labels to Dockerfile](https://github.com/wekan/wekan/commit/52e76c5496b6621916b61f35d5b68687685e0809).
  Thanks to mueller-ma and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.14 2023-11-09 WeKan ® release

This release adds the following updates:

- [Upgraded to Meteor 2.14-beta.0](https://github.com/wekan/wekan/commit/55903472aae0032a49f03529cc9013007a20475e).
  Thanks to Meteor developers.

and fixes the following bugs:

- [Removed double edit text from card description](https://github.com/wekan/wekan/commit/972981a57997fdaeb5202a3c588cd9eb83516360).
  Thanks to derbolle and xet7.
- [Fix Notifications are identical until one is marked read](https://github.com/wekan/wekan/pull/5189).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.12 2023-11-02 WeKan ® release

This release adds the following updates:

- [Updated Snap Candidate MongoDB to 6.0.11](https://github.com/wekan/wekan/commit/ff4c8a5d23d9315ad12970c35cf2928b204b073b).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [Fix Add List button too wide at themes: Clearblue, Modern, Exodark](https://github.com/wekan/wekan/commit/b756150f76c711cf93aa486a55d0e3340f558c01).
  Thanks to xet7.
- [Fix Windows build bundle script](https://github.com/wekan/wekan/commit/720d4223e21da7fa6651dcb51def81a8e081750d).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.11 2023-11-02 WeKan ® release

Known issues: At some non-amd64 platforms, Node.js 14.x may show segmentation fault.
This will be fixed when upgrading to Node.js 18.x or newer works.

This release fixes the following CRITICAL SECURITY ISSUES:

- [Fix Security issue: Hyperlink injection](https://github.com/wekan/wekan/commit/4fe168b03b1f4303c2b117d24ad63ca9f40a02d2).
  Thanks to mc-marcy and xet7.

and adds the following new features:

- [Feature: Convert to Markdown button at editor of Card Description and Comment. Useful when there is no WYSIWYG editor](https://github.com/wekan/wekan/commit/069e2c69b2e00e402628a3123164af257533ddc6).
  Thanks to BabyFnord and xet7.
- [Feature: Copy Card Details code block to clipboard](https://github.com/wekan/wekan/commit/0cc63b810c5a9e23a8a3939a11176f25c1fa8dc7).
  Thanks to C0rn3j and xet7.

and adds the following updates:

- [docker-compose.yml back to latest docker image tag](https://github.com/wekan/wekan/commit/cfa0a063ce4ac5b2dcfa9952764cb15ce21bc263).
  Thanks to xet7.
- [Updated year at license](https://github.com/wekan/wekan/commit/0e902d73a881e4f1a17ee7f2028e1b041872ab61).
  Thanks to xet7.
- [Updated screenshot at readme](https://github.com/wekan/wekan/commit/be72274ca515dc7b652cb1b93361e97089186166).
  Thanks to xet7.
- [Added info to docker-compose.yml about newest docker image of newest git commit automatic build](https://github.com/wekan/wekan/commit/c9e80eaa03e42d1976576ad6553c056840f3060c).
  Thanks to xet7.
- Updated SECURITY.md.
  [Part 1](https://github.com/wekan/wekan/commit/aae7960f251fe626d8bb319643e4cd939a8fbfa9),
  [Part 2](https://github.com/wekan/wekan/commit/f5355422ee21d54e26785f483a7eaecade3d1b64),
  [Part 3](https://github.com/wekan/wekan/commit/fe985e219a9e467973e9449762fc17c6a94e9031),
  [Part 4](https://github.com/wekan/wekan/commit/90da40fde0b2c68d3f751fe8ff2a06f3180cf6d9),
  [Part 5](https://github.com/wekan/wekan/commit/2c74240bcb9d24e206ffe4e59bc8242a6abd07d9).
- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/c45bf4e36882c898055db248bf54a8e7e0add3c4),
  [Part 1](https://github.com/wekan/wekan/commit/b08876327237c549783a2ee7d07db7f2dd0904a7),
  [Part 1](https://github.com/wekan/wekan/commit/75de7b119d868e0e1ef650d7d795b7349b1c9281),
  [Part 1](https://github.com/wekan/wekan/commit/974c17723705d58b660154bb2fd8997c018ddddc).
  Thanks to developers of dependencies.
- [Docker base image to Ubuntu 23.10](https://github.com/wekan/wekan/commit/0f99f22fa5bfc7d3764de2a7f34165f699571449).
  Thanks to Ubuntu developers.
- [Updated dependencies](https://github.com/wekan/wekan/commit/8323649cf098388684ea5e690dcb233171440345).
  Thanks to zodern.
- [Updated dependencies](https://github.com/wekan/wekan/commit/b54d17467cd2868091c52240594630923875946c).
  Thanks to exceljs developers.

and fixed the following bugs:

- [Fixed can not close sidebar at Modern theme](https://github.com/wekan/wekan/commit/53e569d28582a04d7bac49c23cd04ed8f546ed71).
  Thanks to xet7.
- [Fix LDAP login](https://github.com/wekan/wekan/pull/5159).
  Thanks to faburem.
- [Fix can't use card template](https://github.com/wekan/wekan/pull/5161).
  Thanks to faburem.
- [Open card details always in the middle of the screen](https://github.com/wekan/wekan/pull/5168).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.10 2023-09-29 WeKan ® release

This release adds the following new features:

- At opened card, toggle to show checklist at minicard.
  [Part 1](https://github.com/wekan/wekan/commit/2a190fdc194ac2fc2d8086521c5a3eaa2aff0641),
  [Part 2](https://github.com/wekan/wekan/commit/2c99d1cecbaab8556b65bce857b8d93c2cc62c37),
  [Part 3](https://github.com/wekan/wekan/commit/80312d30520840145ee24042aca3ebeda3260d99),
  [Part 4](https://github.com/wekan/wekan/commit/86814a0fd8615fde1867dcf2841b6a24fcfb105b),
  [Part 5](https://github.com/wekan/wekan/commit/75d524f61558b2b6003220c43aa23adb142da91d),
  [Part 6](https://github.com/wekan/wekan/commit/47468a475003c433db0fcc7735741e4548d6c19c).
  Thanks to xet7.
- [Added show-subtasks-field to be translateable at Board Settings / Subtasks Settings](https://github.com/wekan/wekan/commit/e60eddda0440f49d769d73db212322d5ba994662).
  Thanks to xet7.
- [After OIDC login, add users to board DEFAULT_BOARD_ID](https://github.com/wekan/wekan/pull/5098).
  Thanks to diegosteiner.
- [Added DEFAULT_BOARD_ID environment variable setting to all WeKan platforms](https://github.com/wekan/wekan/commit/a781c0e7dcfdbe34c1483ee83cec12455b7026f7).
  Thanks to xet7.
- [Make available translation text to set empty string](https://github.com/wekan/wekan/pull/5103).
  Thanks to ipyramiddev.
- [Added a condition to filter unwanted webhooks](https://github.com/wekan/wekan/pull/5106).
  Thanks to ipyramiddev.
- [Added docker-compose.yml-arm64](https://github.com/wekan/wekan/commit/e103bf46dd796b5c589b315ca68c7a60b5e388db).
  Thanks to xet7.

and adds the following updates:

- [In rebuild-wekan.sh, option 9 to Save Meteor dependency chain to ../meteor-deps.txt](https://github.com/wekan/wekan/commit/7c80a34cf238cbccfe4fed0fb92cf73ddff6beed).
  Thanks to xet7.
- [Update FullCalendar version to 3.10.5](https://github.com/wekan/wekan/pull/5100).
  Thanks to helioguardabaxo.
- [Renamed directory packages/meteor-fullcalendar to packages/wekan-fullcalendar](https://github.com/wekan/wekan/commit/2d652df176b63f7cc27e9de51fbf2f2cbd52ef34).
  Thanks to xet7.
- [Removed old demo API key to silence GitHub secret scanning warning](https://github.com/wekan/wekan/commit/c22e71e3a2175260e483a08026e1ea3446dc77fa).
  Thanks to xet7.
- [Added assetlinks.json](https://github.com/wekan/wekan/commit/74b98a5ee40564448906f41cf66f93ee73faaea1).
  Thanks to xet7.
- [Update translations. Added Afrikaans (af), Afrikaans (South africa)(af_ZA), English (South Africa)(en_ZA)](https://github.com/wekan/wekan/commit/ee4a3b5b35ade479b8ddf7cdedf56aa1ef676b3f).
  Thanks to translators.
- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/4933bf8203dd615ca02963bd502a1cca2584bbac),
  [Part 2](https://github.com/wekan/wekan/pull/5119).
  [Part 3](https://github.com/wekan/wekan/pull/5129).
  Thanks to developers of dependencies.
- [Update Font Awesome version to 6.4.2](https://github.com/wekan/wekan/pull/5125).
  Thanks to helioguardabaxo.
- [Removed Font Awesome not in use directories svgs, scss and less](https://github.com/wekan/wekan/commit/473e2c28c6093403881515067e1b0560eddc85b2).
  Thanks to xet7.
- [Add all Font Awesome characters](https://github.com/wekan/wekan/pull/5128).
  Thanks to helioguardabaxo.
- [Update Bootstrap Datepicker version to 1.10.0](https://github.com/wekan/wekan/pull/5126).
  Thanks to helioguardabaxo.
- [Removed non-existing sw translation and not needed files from bootstrap-datepicker](https://github.com/wekan/wekan/commit/dfe05cc924767e69f40a7332f0e0196ddf2bc8d5).
  Thanks to xet7.
- [Upgraded to Meteor 2.13.3](https://github.com/wekan/wekan/commit/6b88ae2ba26427ab58597b580440e601fd77b320).
  Thanks to Meteor developers.
- [Upgrade Snap Candidate to MongoDB 6.0.10](https://github.com/wekan/wekan/commit/522ab40f436be5656fd6fbd8057c6715afa2fa36).
  Thanks to MongoDB developers.
- Renamed WeKan repo branch master to main.
  [Part 1](https://github.com/wekan/wekan/commit/549982b5e10c240fb2358c21b0781fef2e63a2ba),
  [Part 2](https://github.com/wekan/wekan/commit/fa32010a656a47a6fba9a625d6ab216c9b2034df),
  [Part 3](https://github.com/wekan/wekan/commit/b68493b009bbbb63cf26c9020299762c2a2717aa).
  Thanks to xet7.
- [Use newest Docker build from newest main branch commit at docker-compose.yml](https://github.com/wekan/wekan/commit/8cba42efbefeac159c0c653b53f6464a2fc5ed09).
  Thanks to xet7.
- [Removed disabled codeql-analysis workflow](https://github.com/wekan/wekan/commit/240e05ba1640e92de639ddded5c4a20b32a74d2a).
  Thanks to xet7.
- [Updated versions at Dockerfile](https://github.com/wekan/wekan/commit/637442563ea843a89396d557db3327c1775e6a12).
  Thanks to xet7.
- [Fixed arm64 Dockerfile](https://github.com/wekan/wekan/commit/73e690a5fee24707377d3fe7985c52947cbc8929).
  Thanks to manfromdownunder and xet7.
- [Added Dockerfile for s390x](https://github.com/wekan/wekan/commit/eacb310e59e03b44b0249206b28e4cb3adf163d0).
  Thanks to xet7.
- [Updated dependencies](https://github.com/wekan/wekan/commit/52ce6da32c54d8c65ed679072c64fda66e1606a0).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Correctly display preview for very tall images](https://github.com/wekan/wekan/pull/5097).
  Thanks to VidVidex.
- Replaced ldap logger https://www.npmjs.com/package/bunyan with https://docs.meteor.com/packages/logging.html, because bunyan did show dtrace errors when building WeKan.
  [Part 1](https://github.com/wekan/wekan/commit/e83945c1a6c08fe58f660bcd7b7f8494f629e913),
  [Part 2](https://github.com/wekan/wekan/commit/427eb8ebd16b847eb278cd319adb75adc5206e99).
  Thanks to xet7.
- [Comment out warning about unset variable at ldap.js](https://github.com/wekan/wekan/commit/7f91055d8c7ed508b2f6fca111f17ec1353c445a).
  Thanks to xet7.
- [Removed CollectionFS and and attachment migrations, because they prevented using MONGO_URL username/passwrod with MongoDB 6.x, CollectionFS forced old MongoDB driver](https://github.com/wekan/wekan/commit/3b936ff6e7ed733a65488f1384f868e17b8ab751).
  Thanks to xet7.
- [Hide incomplete feature Show checklist at minicard](https://github.com/wekan/wekan/commit/75d524f61558b2b6003220c43aa23adb142da91d).
  Thanks to xet7.
- [Fix for CalendarView, Create Card without Refresh](https://github.com/wekan/wekan/pull/5105).
  Thanks to DimDz.
- [Active members list now is ordered](https://github.com/wekan/wekan/pull/5107).
  Thanks to helioguardabaxo.
- [Removed limit when setting Swimlane max height](https://github.com/wekan/wekan/commit/7f9aa7509314a85a550dd16615429c5e030b5f2b).
  Thanks to Meeques, mark-i-m and xet7.
- [Fixed Can't login via LDAP because of some Node.js issues](https://github.com/wekan/wekan/commit/c898a3f5ea689469f4e1003b90162bd4233b6aeb).
  Thanks to Danny-Graf and xet7.
- [Stop using /etc/timezone in Docker. Only use /etc/localtime](https://github.com/wekan/wekan/commit/7baa95fcab5447a359c84a2139b1968f0332f683).
  Thanks to dabiao2008 and xet7.
- [Fix createCardWithDueDate Error: User id is required](https://github.com/wekan/wekan/commit/7d1ab0a38875909de02230e70181a7ddb5187870).
  Thanks to xet7.
- [Fix Swimlane Default title from "key default returned an object instead of string" to translated title of "Default"](https://github.com/wekan/wekan/commit/73a25775e1cb7b1f1b355707e21e3704b98ca9c5).
  Thanks to titho85, hpvb and xet7.
- [Fix allow normal user to view subtasks at subtasks board](https://github.com/wekan/wekan/commit/22d98fec38dd16b4cc8ad0fdca8c2973e9779e08).
  Thanks to xet7.
- [Fix minicard description text color to black, so that it is visible at light grey background](https://github.com/wekan/wekan/commit/ab944e51c728412d455d88b5714e84393eccb210).
  Thanks to xet7.
- [Fix mini width of add list also to moderndark theme](https://github.com/wekan/wekan/commit/05c6e101ff32efb42365ac2ffbd802497d5199ac).
  Thanks to xet7.
- [Fixed typo at ldap.js](https://github.com/wekan/wekan/commit/c27a00a4a872cca280ee07079f93941bbee9844f).
  Thanks to xet7.
- [Try to get some label outgoing webhooks working](https://github.com/wekan/wekan/commit/b40654cdfea61cd7a0a6c7f5efca86b62b3a2cbd).
  Thanks to xet7.
- [Fix missing Font Awesome icons](https://github.com/wekan/wekan/pull/5133).
  Thanks to helioguardabaxo.
- [Font Awesome 6.4.2 adding missing icons](https://github.com/wekan/wekan/pull/5134).
  Thanks to mfilser.
- [Make sessinAffinity stickable to clientIP](https://github.com/wekan/wekan/pull/5136).
  Thanks to Dexus.
- [Users can't change their password since V7.02](https://github.com/wekan/wekan/pull/5146).
  Thanks to nebulade.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.09 2023-08-21 WeKan ® release

This release adds the following new features:

- [Move card to other boards API](https://github.com/wekan/wekan/pull/5090).
  Thanks to DimDz.

and adds the following updates:

- [Upgraded Snap Candidate MongoDB to 6.0.9](https://github.com/wekan/wekan/commit/9d5af24e7b656c2bf6ad32bc8360bb80374408d6).
  Thanks to MongoDB developers.
- Fixed building s390x release.
  [Part 1](https://github.com/wekan/wekan/commit/73f943f89a89374a83cdfb31f0bfbfdfe4d6f52e),
  [Part 2](https://github.com/wekan/wekan/commit/7dfb1eb6ce00166a6263f98b9bf975b8a84d1143).
  Thanks to xet7.
- [ReactiveCache, use default parameters](https://github.com/wekan/wekan/pull/5091).
  Thanks to mfilser.
- [ReactiveCache, serialize and parse json with EJSON](https://github.com/wekan/wekan/pull/5092).
  Thanks to mfilser.
- [Translations are working on the client side again](https://github.com/wekan/wekan/pull/5093).
  Thanks to mfilser.
- [ReactiveCache, full implementation of the collection "Translation"](https://github.com/wekan/wekan/pull/5094).
  Thanks to mfilser.
- [Attachments, big images are now fully displayed](https://github.com/wekan/wekan/pull/5095).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.08 2023-08-17 WeKan ® release

This release adds the following new features:

- [Custom translation strings at Admin Panel](https://github.com/wekan/wekan/pull/5085).
  Thanks to ipyramiddev.
- [Added remaining translations to feature custom translation strings at Admin Panel](https://github.com/wekan/wekan/commit/c769bed7dd6d61b5f56e0ec5d43c9f2662a156d2).
  Thanks to xet7.
- [Corrected source code so that it works correctly with reactiveCache](https://github.com/wekan/wekan/pull/5087).
  Thanks to ipyramiddev.

and adds the following updates:

- Updated release scripts.
  [Part 1](https://github.com/wekan/wekan/commit/558d406148eb47c27de9828b541f6081ceac224a),
  [Part 2](https://github.com/wekan/wekan/commit/d6b960f79a5cb9db83587fae7d9c83d2ee63d90c),
  [Part 3](https://github.com/wekan/wekan/commit/c570e426a1e6c4055a72a8ae6febce016c3eef5a),
  [Part 4](https://github.com/wekan/wekan/commit/c47d5ca64e8c9c8a977d7dca5aeb92afb2e62fe5),
  [Part 5](https://github.com/wekan/wekan/commit/7b94188f64e554be11bee244892a0cd9fefd0a9a),
  [Part 6](https://github.com/wekan/wekan/commit/b068d07ce56add0fbd02a4a23fcb14d77bd9fcfd).
  Thanks to xet7.

and fixes the following bugs:

- [Fix broken attachment preview in Safari](https://github.com/wekan/wekan/pull/5088).
  Thanks to VidVidex.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.07 2023-08-16 WeKan ® release

This release adds the following updates:

- [Update Windows bundle build script](https://github.com/wekan/wekan/commit/d48068f63c93fc5a9f8041acb220d6491b5e22ae).
  Thanks to xet7.

and fixes the following bugs:

- [Fix downloading attachments with unusual filenames](https://github.com/wekan/wekan/pull/5083).
  Thanks to VidVidex.
- [Add some filename, if there is no filename after sanitize](https://github.com/wekan/wekan/commit/3d1a161c59a0cb4eafb50ab2fdb04443d54b2086).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.06 2023-08-15 WeKan ® release

This release adds the following updates:

- [Updated exceljs and jszip](https://github.com/wekan/wekan/commit/f9823f67bd7ded44982298b15487f945e8216b60).
  Thanks to developers of dependencies.
- [Update building Windows bundle](https://github.com/wekan/wekan/commit/6d1705af344a36e1cd7846c3d41e486ae0200e2e).
  Thanks to xet7.
- [s390x disabled, because there is problem adding fibers](https://github.com/wekan/wekan/commit/9bf3b960a199ec8d65faab3061947d809144ebdc).
  Thanks to xet7.

and fixes the following bugs:

- [Alphabetic ordered member lists on assigne and member lists](https://github.com/wekan/wekan/pull/5071).
  Thanks to chrisi51.
- [Label drag/drop (reorder labels) works now again](https://github.com/wekan/wekan/pull/5075).
  Thanks to mfilser.
- [Add attachment swiping](https://github.com/wekan/wekan/pull/5080).
  Thanks to VidVidex.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.05 2023-08-08 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/529a43fa0e47ff478dd6b2e6f1c7b4513fe0bbbb).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Make default swimlane auto-height](https://github.com/wekan/wekan/pull/5059).
  Thanks to mark-i-m.
- [Show option b) -1 for disabling swimlane height at swimlane height popup](https://github.com/wekan/wekan/commit/ab4073721151e1308b2e9ffd32a1ee765c7b7668).
  Thanks to xet7.
- [Fixed Normal (non-admin) board users cannot adjust swimlane height](https://github.com/wekan/wekan/commit/6b1403984f3b11700f6b06b4eff64a062916381a).
  Thanks to mgdbbrt and xet7.
- [Fixing positioning of opened cards](https://github.com/wekan/wekan/pull/5066).
  Thanks to chrisi51.
- [Cleaner memberlist popups](https://github.com/wekan/wekan/issues/5068).
  Thanks to chrisi51.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.04 2023-08-03 WeKan ® release

This release fixes the following bugs:

- [Fix edit_swimlane](https://github.com/wekan/wekan/pull/5055).
  Thanks to Pandetthe.
. [Login layout fixes 2](https://github.com/wekan/wekan/pull/5056).
  Thanks to nebulade.
- [Do not open preview for attachments that cannot be previewed](https://github.com/wekan/wekan/pull/5058).
  Thanks to VidVidex.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.03 2023-08-02 WeKan ® release

This release fixes the following bugs:

- [Fix return value of edit_custom_field_dropdown_item](https://github.com/wekan/wekan/pull/5047).
  Thanks to Pandetthe.
- [Move authentication UI handling in correct place](https://github.com/wekan/wekan/pull/5049).
  Thanks to nebulade.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.02 2023-08-02 WeKan ® release

This release adds the following new features:

- [Make swimlane height and list width adjustable](https://github.com/wekan/wekan/pull/4964).
  Thanks to mark-i-m.
- [Don't translate swimlane height and list width minimum value](https://github.com/wekan/wekan/commit/7baf7d2256b87f66aa31ee282e08ebbd4564202d).
  Thanks to xet7.

and adds the following updates:

- [Upgrade to Meteor 2.13 and Node.js 14.21.4](https://github.com/wekan/wekan/commit/caa8d087389b3f212c5eb4b7f538f3ad7c8c1227).
  Thanks to Meteor developers.
- [Upgrade WeKan Docker to Node.js 14.21.4](https://github.com/wekan/wekan/commit/8dc7aa490a456cbf3207d266470febe69c0d5b6a).
  Thanks to Meteor and xet7.
- [Upgrade to MongoDB 6.0.8 in Snap Candidate](https://github.com/wekan/wekan/commit/a773abaf2f4c77cbf586e2b0cba7b9ce412527ef).
  Thanks to MongoDB developers.
- [Upgrade WeKan Snap Candidate to Node.js 14.21.4](https://github.com/wekan/wekan/commit/0161f19ba7ac63c40933bb4550f5397ddecd3452).
  Thanks to Meteor and xet7.
- [Upgrade WeKan StackSmith to Node.js 14.21.4](https://github.com/wekan/wekan/commit/f0620ce8800eccff4da822048f90ee4812560937).
  Thanks to Meteor and xet7.
- [Upgrade to Node.js 14.21.4 at build scripts and remaining Docker containers](https://github.com/wekan/wekan/commit/9f6e6bdc8193d86387166468578a6a24811ca9ec).
  Thanks to Meteor and xet7.

and fixes the following bugs:

- [Only selectively show login elements once settings is loaded](https://github.com/wekan/wekan/pull/5032).
  Thanks to nebulade.
- [First registration after installation must be an admin account](https://github.com/wekan/wekan/pull/5037).
  Thanks to mfilser.
- [Fix get_board_cards_count](https://github.com/wekan/wekan/pull/5040).
  Thanks to Pandetthe.
- [Login layout code cleanup](https://github.com/wekan/wekan/pull/5041).
  Thanks to nebulade.
- [Drag board made translateable](https://github.com/wekan/wekan/commit/62c2d59f469a3e4d11df010ed65561defdda991f).
  Thanks to xet7.
- [Fixed v7.01.0 fresh install in listview first column small](https://github.com/wekan/wekan/commit/7b607b2aaf852b550d968c2f1ec17f53fb5d686e).
  Thanks to intellekta and xet7.
- [Fix assignees description](https://github.com/wekan/wekan/pull/5043).
  Thanks to Pandetthe.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.01 2023-07-21 WeKan ® release

This release fixes the following bugs:

- [Fix for Calendar View Create Card](https://github.com/wekan/wekan/pull/5019).
  Thanks to DimDz.
- [Minicard didn't show the assignee](https://github.com/wekan/wekan/pull/5021).
  Thanks to mfilser.
- [Helm Chart: Add imagePullPolicy to initContainer. Needed for running wekan when restarting while offline](https://github.com/wekan/charts/pull/21).
  Thanks to jadams.
- [Removing Utils.getCurrentSetting() and use ReactiveCache directly](https://github.com/wekan/wekan/pull/5022).
  Thanks to mfilser.
- [Attachment rename and delete works now again for non board admins](https://github.com/wekan/wekan/pull/5023).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v7.00 2023-07-19 WeKan ® release

This release adds the following new features:

- [Speed improvements to Board and List loading](https://github.com/wekan/wekan/pull/5014).
  Thanks to mfilser.

and adds the following updates:

- [Forked meteor-globals and meteor-reactive-cache to @wekanteam/meteor-globals and @wekanteam/meteor-reactive-cache to update to newest dependencies](https://github.com/wekan/wekan/commit/1c5857f0646658b121d7612b6176ec5e09c68592).
  Thanks to xet7.

and fixes the following bugs:

- [Added missing @babel/runtime](https://github.com/wekan/wekan/commit/60cb5fb0176ecb623d494613aab196f252c16752).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.99.9 2023-07-18 WeKan ® release

This release fixes the following bugs:

- [Fix "PROPAGATE_OIDC_DATA" mechanism if "info.groups" is undefined](https://github.com/wekan/wekan/pull/5011).
  Thanks to NotTheEvilOne.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.99.8 2023-07-13 WeKan ® release

This release fixes the following bugs:

- [Fix card creation. Now date fields are checked if they are empty](https://github.com/wekan/wekan/pull/5009).
  Thanks to helioguardabaxo.
- [Helm Chart: Changes for Openshift](https://github.com/wekan/charts/pull/20).
  Thanks to salleman33.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.99.7 2023-07-11 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/pull/5008).
  Thanks to dependabot.

and fixes the following bugs:

- [Fix setting background image](https://github.com/wekan/wekan/pull/5004).
  Thanks to VidVidex.
- [Added missing character](https://github.com/wekan/wekan/commit/4431ec5a2761d56685d2fca1202679b9bdcd9b81).
  Thanks to xet7.
- [Added back datepicker](https://github.com/wekan/wekan/commit/912479baa48354a68bc807737a3db7975a4cb95c).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.99.5 2023-07-10 WeKan ® release

This release fixes the following bugs:

- [Reverted bold of minicard title](https://github.com/wekan/wekan/commit/c7dc912dd4403845a123d9202e930c886788db5b).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.99.4 2023-07-10 WeKan ® release

This release fixes the following bugs:

- [Disable migration attachment-cardCopy-fix-boardId-etc. Part 3](https://github.com/wekan/wekan/commit/34fef627a1c02700650fa97fb0fd1d3a36d79776).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.99.3 2023-07-10 WeKan ® release

This release fixes the following bugs:

- [Fix migration attachment-cardCopy-fix-boardId-etc. Part 2](https://github.com/wekan/wekan/commit/8555c24eb21134eda9b4d71494676b39d126ef35).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.99.2 2023-07-10 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/pull/5001).
  Thanks to dependabot.

and fixes the following bugs:

- [Added back npm packages: fibers and @mapbox/node-pre-gyp](https://github.com/wekan/wekan/commit/8bf40e219a9fa55b8f2ef19dbf6acc58d646b968).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.99.1 2023-07-10 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/95d3e5cdc6136a9778bf7c84812a6d62ef6d4044).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix for migration "attachment-cardCopy-fix-boardId-etc"](https://github.com/wekan/wekan/pull/4999).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.99 2023-07-09 WeKan ® release

This release adds the following new features:

- [Preview PDF](https://github.com/wekan/wekan/pull/4989).
  Thanks to VidVidex.
- [Preview PDF translations](https://github.com/wekan/wekan/commit/83ae1d4a19925363d8f176553fb10a98a77420be).
  Thanks xet7.
- [Preview PDF to have full width, close at top, and improve viewing at mobile](https://github.com/wekan/wekan/commit/4be5727a18472920ed775b8a2024b9c8ca2fdf0a).
  Thanks to xet7.
- [Show Meteor dependency chain with rebuild-wekan.sh](https://github.com/wekan/wekan/commit/ba9f9705d43189d2491266af1fd4817ff34a3b59).
  Thanks to xet7.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/92c57fc91ea063914730647d0add8dae77187424).
  Thanks to developers of dependencies.
- Added Snap MONGO_URL to rebuild-wekan.sh dev options.
  [Part 1](https://github.com/wekan/wekan/commit/7d59ae93f9263c383a1c8c8605490d54b1e09ed7),
  [Part 2](https://github.com/wekan/wekan/commit/3c2cc351f4bbe82b6870bab0e1891823c359e789).
  Thanks to xet7.
- [MongoDB 6.0.7 at Snap](https://github.com/wekan/wekan/commit/5babe0358deae4b01261ee8655ec0e5a38f0344d).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [New popup scrolls to top and restore previous position after closing again](https://github.com/wekan/wekan/pull/4979).
  Thanks to mfilser.
- [Copy Checklist dialog now set's the last selected board](https://github.com/wekan/wekan/pull/4980).
  Thanks to mfilser.
- [Copy Checklist only copied the checklist items at the first time, now always](https://github.com/wekan/wekan/pull/4981).
  Thanks to mfilser.
- [Attachment copy changes now the boardId, listId and swimlaneId in the collection data](https://github.com/wekan/wekan/pull/4982).
  Thanks to mfilser.
- [Admin attachment view was missing the column header "S3FileId"](https://github.com/wekan/wekan/pull/4983).
  Thanks to mfilser.
- [Global Search, limit 0 is no limit](https://github.com/wekan/wekan/pull/4984).
  Thanks to mfilser.
- [Admin Report, fixing filesize if not a number](https://github.com/wekan/wekan/pull/4985).
  Thanks to mfilser.
- [Global search, found cards count is now substituted by the translation function itself](https://github.com/wekan/wekan/pull/4986).
  Thanks to mfilser.
- [Utils of canModifyCard and canModifyBoard + move this general functions to Utils class](https://github.com/wekan/wekan/pull/4987).
  Thanks to mfilser.
- Set background color only if it exists.
  [Part 1](https://github.com/wekan/wekan/commit/45d33fa2e459717064969a1729e016d4004e5435),
  [Part 2](https://github.com/wekan/wekan/commit/c6cad13f1e86fea44c7c16e1a194c6d7164e824a),
  [Part 3](https://github.com/wekan/wekan/commit/549b15000b538d6e5013cc978c0f49e753fd903a).
  Thanks to xet7.
- [If there is no Custom Field label at minicard, show value full width](https://github.com/wekan/wekan/commit/ffea7aff99db555d357876e1415f9015154782cc).
  Thanks to koluka and xet7.
- API: Fix /api/boards/{boardId}/attachments endpoint.
  [Part 1](https://github.com/wekan/wekan/pull/4991),
  [Part 2](https://github.com/wekan/wekan/pull/4992).
  Thanks to VidVidex.
- [Improved attachment gallery and attachment viewer](https://github.com/wekan/wekan/pull/4995).
  Thanks to VidVidex.
- [Removed horka:swipebox](https://github.com/wekan/wekan/commit/4148238af31ad31b6190221ad69db865f9ed5ccc).
  Thanks to VidVidex and xet7.
- [Bold minicard custom field title](https://github.com/wekan/wekan/pull/4993).
  Thanks to VidVidex.
- [Revert first list width change](https://github.com/wekan/wekan/pull/4993).
  Thanks to xet7.
- [Fixed maximum call stack exceeded by removing bootstrap 3, datepicker and summernote. Updated jquery. Disabled attachments viewer that opens empty when opening card. Fixes all npm audit errors](https://github.com/wekan/wekan/commit/140a134a11d0b262f69e4f343dddddb87c978748).
  Thanks to xet7.
- [Fix attachment viewer not being hidden](https://github.com/wekan/wekan/pull/4997).
  Thanks to VidVidex.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.98 2023-06-22 WeKan ® release

This release adds the following new features:

- Add checklist at top.
  [Part 1](https://github.com/wekan/wekan/pull/4973),
  [Part 2](https://github.com/wekan/wekan/pull/4974).
  Thanks to mfilser.

and adds the following updates:

- [Update rebuild-wekan.sh to use local network IP address](https://github.com/wekan/wekan/commit/6479c6a5c516ade68d50849115367be90d3199a2).
  Thanks to xet7.
- Update GitHub Actions.
  [Part 1](https://github.com/wekan/wekan/pull/4970),
  [Part 2](https://github.com/wekan/wekan/pull/4971).
  Thanks to dependabot.

and adds the following upcoming translations:

- [Added translations: Cantonese (China) (yue_CN) and Chinese Traditional (zh-Hant)](https://github.com/wekan/wekan/commit/dc2835d3410fcd7fd376a2be765c63236696605e).
  Thanks to translators.

and fixes the following bugs:

- [Wait until user has logged in before fetching language preference](https://github.com/wekan/wekan/pull/4968).
  Thanks to simon816.
- [Always fetch favicons from / path](https://github.com/wekan/wekan/commit/4d9f76cc68f435b1bbeeb51833dbce931f626b6d).
  Thanks to nebulade.
- [Rounding sort number to next integer](https://github.com/wekan/wekan/pull/4975).
  Thanks to mfilser.
- [Reduce list scroll speed while drag/drop the minicard](https://github.com/wekan/wekan/pull/4976).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.97 2023-06-10 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/d93481d84009922c22a4eaaf49624f7153f737dd).
  Thanks to developers of dependencies.

and removes the following features:

- [Feature: Docker Health Check](https://github.com/wekan/wekan/commit/c8ec8d456b481b10cbf135d5289093a57b2e547f).
  Thanks to luketainton, mfilser and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.96 2023-06-10 WeKan ® release

This release fixes the following CRITICAL SECURITY ISSUES:

- Found and fixed more InvisibleBleed of WeKan.
  [Part 1](https://github.com/wekan/wekan/commit/4c016169c55e0dc5df9533795ddfec424a053300),
  [Part 2](https://github.com/wekan/wekan/commit/df40384200d10595a7a9cd582d8534295eec5036).
  Thanks to xet7.

and adds the following new features:

- [Docker Health Check](https://github.com/wekan/wekan/pull/4954).
  Thanks to luketainton.

and fixes the following bugs:

- [Fix due date filter for next and this week](https://github.com/wekan/wekan/pull/4953).
  Thanks to helioguardabaxo.
- Fixed Rare bug: All Boards page icons random dance. Disabled cards counts and card members at All Boards page.
  [Part 1](https://github.com/wekan/wekan/commit/b75e16f104390211e3e26c500c0a54687fee329d),
  [Part 2](https://github.com/wekan/wekan/commit/e1a00090ba0ca192ba30f735a13d1ec5b5aa6bc1),
  [Part 3](https://github.com/wekan/wekan/commit/9ab0efe87adbc872af287fb8254cccb6dd44aec3).
  Thanks to xet7.
- [Docker build was broken because of wrong curl install](https://github.com/wekan/wekan/pull/4955).
  Thanks to mfilser.
- [Try to fix Docker build by removing empty continuation lines](https://github.com/wekan/wekan/commit/b008986122e258e725379264850d16d06c445db1).
  Thanks to xet7.
- [Clarified required settings for start-wekan.bat and start-wekan.sh](https://github.com/wekan/wekan/commit/3e6b396d0913e6747714a9f87e2161bba0ce525e).
  Thanks to xet7.
- [Fixed drag-drop at Ubuntu Touch Morph Browser and WeKan OpenStore app by changing jquery-ui-touch-punch to newer updated @rwap/jquery-ui-touch-punch](https://github.com/wekan/wekan/commit/af63259f091cb2ade84493a288ea37c53cd37321).
  Thanks to xet7.
- [Try to fix SVG image failed to render](https://github.com/wekan/wekan/commit/7a3c340d657894bf72130b7e51e313e3b020f9cf).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.95 2023-06-07 WeKan ® release

This release fixes the following bugs:

- [Revert smaller swimlane height](https://github.com/wekan/wekan/commit/95efcbe71727ea2be5d2c9a1fa7fd2de76f71ef2).
  Thanks to kovacs-andras and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.94 2023-06-07 WeKan ® release

This release adds the following new features:

- [Added list position when create a new list on board](https://github.com/wekan/wekan/pull/4938).
  Thanks to helioguardabaxo.
- [Added option to show/hide cover attachment on minicard](https://github.com/wekan/wekan/pull/4939).
  Thanks to helioguardabaxo.
- [Count of attachments on minicard. (Badges renamed to Count of attachments)](https://github.com/wekan/wekan/pull/4940).
  Thanks to helioguardabaxo.
- [Renamed Badge to Count of attachments on minicard. Changed icons to Cover image on minicard](https://github.com/wekan/wekan/commit/825742359ef0738b110ed0904853c604bdbd1bac).
  Thanks to xet7. 
- [Added conditional to show after list field only if board has at least one list. Now after list shows the last list by default](https://github.com/wekan/wekan/pull/4941).
  Thanks to helioguardabaxo.
- [Changed Add List to be at left. Before it was at right](https://github.com/wekan/wekan/commit/467835192fbcd9d4016674fa2ee406258cc106e7).
  Thanks to xet7.
- [Added icons to swimlane action popup](https://github.com/wekan/wekan/pull/4943).
  Thanks to helioguardabaxo.
- [Added translations to Sort](https://github.com/wekan/wekan/pull/4945).
  Thanks to DimDz.
- Set card attachment as background image.
  [Part 1](https://github.com/wekan/wekan/commit/8c6df7f20c946163b447227ff2f0d4da681cffb2),
  [Part 2](https://github.com/wekan/wekan/commit/ed92db87bc0415d3c0bb7f2803d92f8fd7726517),
  [Part 3](https://github.com/wekan/wekan/commit/01a1eb177e151c3042e1975de771737a6697342f),
  [Part 4](https://github.com/wekan/wekan/commit/47380244b827a79426ea92d5a96374b72c5b0811).
  Thanks to xet7.
- [Edit the title of a swimlane using API](https://github.com/wekan/wekan/pull/4950).
  Thanks to DimDz.

and adds the following updates:

- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/edf08c8cd44062cbdaa0cc98d10ec045a524cff3),
  [Part 2](https://github.com/wekan/wekan/pull/4949).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix 6.93 with brackground image breaks scrolling on lists within swimlanes](https://github.com/wekan/wekan/commit/04aaa6f30cfe59769c9b1c75cf8921fcc99b1977).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.93 2023-05-29 WeKan ® release

This release fixes the following bugs:

- [Layout fixes for modern-dark after shuffling labels and date field on minicard](https://github.com/wekan/wekan/pull/4935).
  Thanks to jghaanstra.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.92 2023-05-29 WeKan ® release

This release adds the following improvements:

- [Moved minicard labels from above minicard title to below minicard title](https://github.com/wekan/wekan/commit/b33a3ef254719dede124921bde40ce8a47c796fc).
  Thanks to xet7.
- [Changed Due Date etc dates to be at top of Minicard](https://github.com/wekan/wekan/commit/a3d37e621c1eeeb9cd586b8fb644eae498df7ac4).
  Thanks to xet7.

and fixes the following bugs:

- [Fix Docker latest tags at Docker Hub, Quay and GitHub](https://github.com/wekan/wekan/commit/2d8ac3bf8085c913d14fb8a89f84769366073967).
  Thanks to rikhuijzer and xet7.
- [Fixes for Create Card at Calendar](https://github.com/wekan/wekan/pull/4934).
  Thanks to DimDz.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.91 2023-05-27 WeKan ® release

This release adds the following new features:

- [BoardAdmin and Admin can now set board background image URL](https://github.com/wekan/wekan/commit/49ef80ab6c2dc038941558f68eface5e82a87593).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.90 2023-05-24 WeKan ® release

This release adds the following new features:

- [Added Edit Custom Field Value to api.py](https://github.com/wekan/wekan/commit/ea908adbf9b75607c61c0cbc2b23886aa8e95fe7).
  Thanks to RazvanTinca and xet7.

and adds the following updates:

- Update docker-compose.yml info about Docker images used.
  [Part 1](https://github.com/wekan/wekan/commit/30ada6086245eb9957385d96132268344ce9513b),
  [Part 2](https://github.com/wekan/wekan/commit/e83b0ac6519be4163cb6702a4a97d10e7315f5d9).
  Thanks to xet7.
- [Upgrade Snap Candidate to MongoDB 6.0.6](https://github.com/wekan/wekan/commit/87fc4f936a2e37c0b9e3353a7b6f93dbff7fc2b7).
  Thanks to MongoDB developers.
- [Use GitHub Docker Registry. Updated release scripts](https://github.com/wekan/wekan/commit/28e5b0bd5b270b2e2d3de5dad46804ac0d20d898).
  Thanks to xet7.
- [Sync Docker Registries](https://github.com/wekan/wekan/commit/32ec95ffa8b34d5a7d9dff94302520509479c838).
  Thanks to xet7.

and fixes the following bugs:

- [To get corrent API docs generated, moved new_checklist_item API to correct file where is other checklist item API](https://github.com/wekan/wekan/commit/9de704040172e37769fa28cf571f293dfbd8bbb5).
  Thanks to xet7.
- [Fix sharedDataFolder persisdent provide by k8s has no permission to mkdir and write](https://github.com/wekan/charts/commit/54c11ec8d7d165309632c455003b6e861e43fb4c).
  Thanks to new2001y.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.89 2023-05-12 WeKan ® release

This release fixes the following bugs:

- [Fix for the Create Card at Calendar](https://github.com/wekan/wekan/pull/4923).
  Thanks to DimDz.
- [Fixed broken migration migrate-attachments-collectionFS-to-ostrioFiles](https://github.com/wekan/wekan/pull/4926).
  Thanks to Aman-Maheshwari.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.88 2023-05-11 WeKan ® release

This release adds the following new features:

- [Create Card on Calendar View](https://github.com/wekan/wekan/pull/4922).
  Thanks to DimDz.

and fixes the following bugs:

- [OpenaAPI: Also ignores ThrowStatement](https://github.com/wekan/wekan/pull/4918).
  Thanks to bentiss.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.87 2023-05-08 WeKan ® release

This release adds the following new features:

- Added to meteor development options for logging also to ../wekan-log.txt, and showing deprecated API that is Meteor v2.12 new feature.
  [Part 1](https://github.com/wekan/wekan/commit/9fc52838562c3179775a6b24c23d0385363a0661),
  [Part 2](https://github.com/wekan/wekan/commit/521e840b54dd896eb192834133c5134a104f1d0b),
  [Part 3](https://github.com/wekan/wekan/commit/e6c59fc9b0ac53abd7519121d3bff700b1a43c24),
  [Part 4](https://github.com/wekan/wekan/commit/0bd9f309a10dff200efe6e38c6161deaf93c776d).
  Thanks to Meteor developers and xet7.
- [API: Added User and Admin API for New Checklist Item and Edit Card Custom Field](https://github.com/wekan/wekan/pull/4911).
  Thanks to DimDz.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/2b91557ad2931b3004a1da1ba0c790ed0e0546d3).
  Thanks to developers of dependencies.
- [Upgraded to Meteor 2.12](https://github.com/wekan/wekan/commit/d519429ea14de3740408fbca3d231a1440562201).
  Thanks to Meteor developers.
- [Updated translations](https://github.com/wekan/wekan/commit/40c077101a94f639b90f607624c4c72e12235711).
  xet7 fixed all translations of advanced filter description to have correct escaping of slash and backslash,
  so that bulding bundle of WeKan would not crash to invalid JSON syntax in translations.
  Thanks to xet7.

and fixes the following bugs:

- [Added X for closing card opened in Global Search](https://github.com/wekan/wekan/pull/4910).
  Thanks to deniszulic.

and tried to fix the following bugs:

- [Tried to fix building WeKan OpenAPI docs using Ubuntu 23.04 amd64 with XFCE desktop, but it did not work, still getting error: Failed to parse the source OpenAPI document](https://github.com/wekan/wekan/commit/97c6b6531502d09cbd6c267212651f3036338a11).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.86 2023-04-26 WeKan ® release

This release fixes the following CRITICAL SECURITY FIXES:

- [Security fix to InvisibleBleed in WeKan. Escape HTML comment tags so that HTML comments are visible](https://github.com/wekan/wekan/commit/167863d95711249e69bb3511175d73b34acbbdb3).
  Thanks to xet7 for fixing.
- [Security Fix to AdminBleed in WeKan, so that non-admin can not change to Admin](https://github.com/wekan/wekan/commit/cbad4cf5943d47b916f64b4582f8ca76a9dfd743).
  Thanks to Christian Pöschl of usd AG Responsible Disclosure Team for reporting and xet7 for fixing.

and adds the following new features:

- [Feature: Show plus sign in front of attachments](https://github.com/wekan/wekan/commit/2b13158fcd37ff7163fc3d97b88b6bf920dd7b9c).
  Thanks to Meeques and xet7.

and adds the following updates:

- [Upgrade to Meteor 2.12-beta.2](https://github.com/wekan/wekan/commit/4d9d4a9dfdd5bb0fc5997351df8995f72d9ca82c).
  Thanks to Meteor developers.
- [Update Docker Ubuntu base image and Meteor version](https://github.com/wekan/wekan/commit/bcd43629cc4074bc4f9b0b70189645ae91cfe59a).
  Thanks to xet7.

and fixes the following bugs:

- Fix Exception in callback of async function: TypeError: this._now is not a function.
  [Part 1](https://github.com/wekan/wekan/commit/aeb0f1e6d8d9f5d8808128f4049768bea57ca164),
  [Part 2](https://github.com/wekan/wekan/commit/aef6967d4c90544aa0281d22b6df46b2dd40467f).
  Thanks to xet7.
- [Remove extra debug message and disable some rarely used feature that produces errors](https://github.com/wekan/wekan/commit/c0bdde26cfd2ae6d1aeaf8b5c7ce0eb72ada6dec).
  Thanks to xet7.
- [Revert some migration filename changes](https://github.com/wekan/wekan/commit/3300bbe9e7a6c02c753b0d1f2e8547d1d85cb76c).
  Thanks to xet7.
- [Add back node-gyp related dependencies](https://github.com/wekan/wekan/commit/712dbb8e73df740816eb66257e834bc7e22bd0fb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.85 2023-04-18 WeKan ® release

This release adds the following CRITICAL SECURITY FIXES:

- [Security fix to ReactionBleed in WeKan. It is XSS in feature "Reaction to comment"](https://github.com/wekan/wekan/commit/47ac33d6c234359c31d9b5eae49ed3e793907279).
  Thanks to Alexander Starikov at Jet Infosystems (https://jetinfosystems.com/) for reporting and fixing.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/fb37f48a86732be40c20c58eb336fa262218d0fe).
  Thanks to xet7.

and fixes the following bugs:

- [Disable file validation temporarily, because it causes data loss of some attachments when upgrading](https://github.com/wekan/wekan/commit/e7122a9b368e25cc155f39e34fff741fcc9f004c).
  Thanks to xet7.
- [Added uploadedAt and copies to be migrated when migrating CollectionFS to ostrio-files](https://github.com/wekan/wekan/commit/0090734cd85435e852d2546d20c5a16a24a1ae66).
  Thanks to xet7
- [Added more descriptive times of attachment migrations and uploads](https://github.com/wekan/wekan/commit/f11650ece1ccd8cd8ff820c1ccb39086129e01d0).
  Thanks to xet7.
- [Fix LDAP Group Filtering does not work](https://github.com/wekan/wekan/commit/2da7b1d5420d7621cafa387db5c63bf1612e3d08).
  Thanks to emilburggraf, psteinforth, craig-silva, Daniel-H76, benh57, falkheiland and xet7.
- [Save files serverside with filename ObjectID, without filename](https://github.com/wekan/wekan/commit/76ac070f9b99388fa9e13bd987b1c93ed1f465c7).
  Thanks to g-roliveira, iamabrantes, Floaz, koelle25, scott-dunt, mfilser and xet7.
- [Fixed count of found cards in Global Search](https://github.com/wekan/wekan/commit/9af03b0416b532f2084d0320b95388f0009fb364).
  Thanks to xet7.
- [Fix Card opens full width by opening at left](https://github.com/wekan/wekan/commit/418fe725e5846620a244b22bce2e0d1194ebf033).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.84 2023-04-11 WeKan ® release

This release fixes the following bugs:

- [Get card drag/drop working for empty swimlane](https://github.com/wekan/wekan/pull/4883).
  Thanks to mfilser.
- [Added 'next week' due date filter](https://github.com/wekan/wekan/pull/4884).
  Thanks to helioguardabaxo.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.83 2023-04-08 WeKan ® release

This release fixes the following bugs:

- [Fix open card position by opening card to fullscreen](https://github.com/wekan/wekan/commit/030faf918e64ab5ee359703c038c7c7a3d3154ae).
  Thanks to SmartPhoneLover, BabyFnord and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.82 2023-04-07 WeKan ® release

This release fixes the following bugs:

- [Added missing docs of Snap avatars max size etc](https://github.com/wekan/wekan/commit/2aba1e3bf98717f403b064f4de3f893bf1b009aa).
  Thanks to xet7.
- [Fix avatar if Meteor.user() is undefined](https://github.com/wekan/wekan/pull/4876).
  Thanks to mfilser.
- [Fix broken add_board_member API and return value for remove_board_member](https://github.com/wekan/wekan/pull/4880).
  Thanks to gustavengstrom.
- [Try to fix card open position and make card resizeable](https://github.com/wekan/wekan/commit/f258d8d51784839d06b34e43ec50951603340037).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.81 2023-03-26 WeKan ® release

This release fixes the following bugs:

- [Helm Chart - fix: broken secretEnv indentation](https://github.com/wekan/charts/pull/18).
  Fixed in already released WeKan Helm Chart 1.2.7.
  Thanks to Nightreaver.
- [Fix Bug: Cardoptions disappear behind scrollbar in german](https://github.com/wekan/wekan/commit/bf636725e8637200c2121e754297d281f8c38d4e).
  Thanks to Meeques and xet7.
- [Add some info about allowed filesizes and filetypes for attachments and avatars](https://github.com/wekan/wekan/commit/5b3bd8ff2a29e2c1ada4c49de4c50c132b603863).
  Thanks to Meeques and xet7.
- [Disable MongoDB telemetry and free monitoring in WeKan Snap](https://github.com/wekan/wekan/commit/df152e292dadd10a9873c21fff9571b98a06eec6).
  Thanks to webenefits and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.80 2023-03-23 WeKan ® release

This release adds the following improvements:

- [Helm Charts secretEnv: Modify secret and deployment to allow users to provide secretEnv with empty value](https://github.com/wekan/charts/pull/13).
  Thanks to jehutyy.

and fixes the following bugs:

- [Custom Fields, display Grid Button only if more than 1 custom field](https://github.com/wekan/wekan/pull/4864).
  Thanks to mfilser.
- Helm Charts: Add missing data-storage as pvc for WRITABLE_PATH.
  [Part 1](https://github.com/wekan/charts/issues/14),
  [Part 2](https://github.com/wekan/charts/pull/15),
  [Part 3](https://github.com/wekan/charts/pull/16).
  Thanks to Nightreaver, NotTheEvilOne and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.79 2023-03-22 WeKan ® release

This release adds the following updates:

- [Upgraded to Meteor 2.11.0](https://github.com/wekan/wekan/commit/e48db7d7ea7e70dc767576126be35927ced24ee5).
  Thanks to Meteor developers.
- [Use MongoDB 6](https://github.com/wekan/wekan/commit/4aeab872de2c9d0365a4b8872b6b015a36666615).
  Thanks to to MongoDB.

and fixes the following bugs:

- [Avatar upload was broken if no size is configured](https://github.com/wekan/wekan/pull/4857).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.78 2023-02-28 WeKan ® release

This release fixes the following CRITICAL SECURITY ISSUES:

- [Try to fix some security issue](https://github.com/wekan/wekan/commit/5d79c231ed3cfc09636ab678b3f62ea9f36160f2).
  Thanks to Responsible Security Disclousure contributors and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.77 2023-02-27 WeKan ® release

This release adds the following updates:

- Updated release scripts
  [Part 1](https://github.com/wekan/wekan/commit/23e01130e907f0068333046dc4b88a471b781ce7),
  [Part 2](https://github.com/wekan/wekan/commit/ad53414c4d415b93e808ec88cc36af5a4741f681),
  [Part 3](https://github.com/wekan/wekan/commit/e390852a673be25e00cb397acf4dbdc5a7d2a1f9).
  Updated release scripts.
  Thanks to xet7.

and fixes the following bugs:

- [Fixed indentation for image size and compression in docker-compose.yml](https://github.com/wekan/wekan/pull/4846).
  Thanks to Entepotenz.
- [Made ☰ menu buttons bigger at minicard and list, they were too hard to click when they were small](https://github.com/wekan/wekan/commit/c2cf850179ad0079d83561675b6dc2c59825cc11).
  Thanks to mohammadZahedian and xet7.
- [Added "Move card to archive" to minicard ☰ menu](https://github.com/wekan/wekan/commit/1deccf2f4b5ba1a72bc76d5ae83858e6c50b36ae).
  Thanks to mohammadZahedian and xet7.
- [Fix attachment migration error about avatarUrl startsWith undefined](https://github.com/wekan/wekan/commit/7b2cff4c5e7bae4971776638b680696596edc7e6).
  Thanks to xet7.
- Try to fix attachment migrations to ostrioFiles, allow existing files to be migrated.
  [Part 1](https://github.com/wekan/wekan/commit/9216a69c0541325be6941c07d256b07627a8ec73),
  [Part 2](https://github.com/wekan/wekan/commit/16ad6bf9fc75b39e6e8cedb8a5a98ec963ccf14a).
  Thanks to xet7.
- [MongoDB to 5 for beta Snap. MongoDB 5 does not seem to show some errors that only MongoDB 6 has](https://github.com/wekan/wekan/commit/a64381153fd762b67f2a752b590b2cdd196bcfe5).
  Thanks to xet7.
- [Use MongoDB 5 at docker-compose.yml](https://github.com/wekan/wekan/commit/51f22f48dc916717ed6be9502dc767798692f07b).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.76 2023-02-22 WeKan ® release

This release adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/cae0b29500ff417598690590f43bc1e1875a4b4e).
  Thanks to xet7.

and fixes the following bugs:

- [Try to fix build errors on some platforms](https://github.com/wekan/wekan/commit/fd9478dc57a81aadb275a205766c44285efb4c61).
  Thanks to xet7.
- Fix at bottom of list Add button to be higher, so that text Add is not over button borders.
  [Part 1](https://github.com/wekan/wekan/commit/139a1c0f784443103397c9b6c8c17d5432ce9bdd),
  [Part 2](https://github.com/wekan/wekan/commit/c27a2b22c604377170c34f30e4b5710e18ae47c8).
  Thanks to WeKan commercial support customer and xet7.
- [Removed Mermaid, because newest Mermaid does not work anymore](https://github.com/wekan/wekan/commit/67500abcd4d034ebed2d13f5156123d5f70bd014).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.75 2023-02-21 WeKan ® release

This release fixes the following CRITICAL SECURITY ISSUES:

- Security Fix of Filebleed in WeKan. That is XSS in filename.
  [Part 1](https://github.com/wekan/wekan/commit/ff993e7c917b5650a790238e95c78001e4f0e039),
  [Part 2](https://github.com/wekan/wekan/commit/382168a5b428a7124d368c4fcb37e7e140e7ec8b).
  Thanks to responsible security disclosure contributors and xet7.

and adds the following updates:

- [Updated to Node.js v14.21.3. Thanks to Node.js developers](https://github.com/wekan/wekan/commit/dd6e7372b77ec963c3623953a7613f1e468e5745).
  Thanks to Node.js developers.
- [Updated webmanifest to have PWA as fullscreen](https://github.com/wekan/wekan/commit/ed058914b53e3575b6e8036fed45fba5e0893001).
  Thanks to xet7.

and fixes the following bugs:

- [Fix "Top 10 boards" metric order](https://github.com/wekan/wekan/pull/4835).
  Thanks to garciadavy.
- [Swipebox slide background gradient of black to blue, so that back SVG images are visible](https://github.com/wekan/wekan/commit/c3577aa434ac5330d664f17d0771ff9679cced86).
  Thanks to xet7.
- [Fix typo](https://github.com/wekan/wekan/pull/4840).
  Thanks to robert-scheck.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.74 2023-02-10 WeKan ® release

This release fixes the following bugs:

- [Fix typos in Snap config](https://github.com/wekan/wekan/commit/7ca489478950094177f93574d259af61a5ae00c0).
  Thanks to urmel1960 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.73 2023-02-10 WeKan ® release

This release fixes the following bugs:

- [Update docker-compose.yml: removes quotes, with quotes this setting is not working](https://github.com/wekan/wekan/pull/4829).
  Thanks to q16marvin.
- [Fix double quotes around metric label](https://github.com/wekan/wekan/pull/4831).
  Thanks to garciadavy.
- [Back to MongoDB 6.x](https://github.com/wekan/wekan/commit/b5d35d464501cbca4dc4e4ee403c8bb205024b21).
  Thanks to urmel1960 and xet7.
- [Try to fix building WeKan](https://github.com/wekan/wekan/commit/d9a7e135d33339aedf23875b67ac29c6f11f1bdb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.72 2023-02-02 WeKan ® release

This release adds the following updates:

- [Change back to MongoDB 5, shell and tool](https://github.com/wekan/wekan/commit/1733203f8e236bd62ef34ea1878d3a63db5eccc4).
  Thanks to xet7.
- Updated translations to use new Go-based transifex-client https://developers.transifex.com/docs/cli ,
  but it seems now all translations look like 100% translated, maybe something is wrong,
  so discussing about it with Transifex Support.
  [Part 1](https://github.com/wekan/wekan/commit/2d7639262f266810fd863e3339485371e03cb8e6),
  [Part 2](https://github.com/wekan/wekan/commit/c7330a47a02efc609a383ddf8d4ad6f409595e01),
  [Part 3](https://github.com/wekan/wekan/commit/7d7c45c33f9eaa3e4db90758d97c49363f47d0f3),
  [Part 4](https://github.com/wekan/wekan/commit/bed2669ff8e136d4aedbd66bc2dfd73c38e18469).
- Updated dependencies
  [Part 1](https://github.com/wekan/wekan/commit/362fb66b84e7200c3f7482ab8b79ae8ac0b11832),
  [Part 1](https://github.com/wekan/wekan/commit/b4963d872b9dc2f19dd3fe418fdbf4f7364a7a47),
  [Part 1](https://github.com/wekan/wekan/commit/a3e3e70a3abb28948c5ad62745d15f142107bb8d).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Small improvements modern-dark theme](https://github.com/wekan/wekan/pull/4813).
  Thanks to jghaanstra.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.71 2023-01-18 WeKan ® release

This release adds the following updates:

- [Forked minio npm package to @wekanteam/minio to update package dependencies. S3/MinIO support In Progress](https://github.com/wekan/wekan/commit/cd1750f368aca5a474f08acd85996258d8781386).
  Thanks to xet7.
- Updated GitHub Actions.
  [Part 1](https://github.com/wekan/wekan/commit/05139ed553cc9792699ad46190be40e4edf3d323),
  [Part 2](https://github.com/wekan/wekan/commit/e0aad13fefb1c31a851dd0dbc3a9885a6be564c9),
  [Part 3](https://github.com/wekan/wekan/commit/1e73f9b90963b55dbae8ff1668d482da278869f4),
  [Part 4](https://github.com/wekan/wekan/commit/bd0b5391835734e668df92db6b1a0439fd8e30bc).
  Thanks to dependabot.
- [Upgraded to Meteor 2.10.0](https://github.com/wekan/wekan/commit/434ce9f7c49412b3c0df766789231ce772725ff9).
  Thanks to Meteor developers.

and fixes the following bugs:

- [Fix API Edit card function does nothing](https://github.com/wekan/wekan/commit/eda2b3b406aaa9cee229b65c3fcd453293de4535).
  Thanks to gu1ll0me, HEMGDevelopment and xet7.
- [Fix Customfields are not added to new cards created with the API](https://github.com/wekan/wekan/commit/beaa50551d1eaccdb05f69c74384b349d4bd5b31).
  Thanks to HEMGDevelopment and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.70 2023-01-14 WeKan ® release

This release fixes the following bugs:

- Try to fix User API.
  [Part 1](https://github.com/wekan/wekan/commit/8092f8be28fd6f1d9e2b86e672878cbaebf48000),
  [Part 2](https://github.com/wekan/wekan/commit/cc90291192f068ca6908b6b5e3605f78c2bed085).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.69 2023-01-09 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/17a06ad1b1db79504482e9e8ae66784ec23f7ad2).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.68 2023-01-07 WeKan ® release

This release adds the following updates:

- [Upgraded to Meteor 2.9.1](https://github.com/wekan/wekan/commit/a0318e59c13c2f50339ff170fbd221f3915f5ba9).
  Thanks to Meteor developers.

and fixes the following bugs:

- [Add "use-credentials" directive to site.webmanifest request](https://github.com/wekan/wekan/pull/4801).
  Thanks to markormesher.
- [OIDC login loop for integer user ID. Fix 2](https://github.com/wekan/wekan/commit/bc67b5c3bcd6ff645b7e6cd9c3d8bb79d83d5111).
  Thanks to danielkaiser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.67 2023-01-03 WeKan ® release

This release adds the following updates:

- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/f20656909bbf8457d2c3ab7e049aec3a6dcf8977),
  [Part 2](https://github.com/wekan/wekan/commit/4c814ce3fed32f7fdb2a1e2a7cc04946bd79cf3a).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix OIDC login loop for integer user ID](https://github.com/wekan/wekan/commit/f2a92be01a753c5752284d221706c6efb0dd60a7).
  Thanks to danielkaiser and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.65 2022-12-27 WeKan ® release

This release adds the following new features:

- Store files to any cloud storage (like S3, MinIO, etc) mounted as filesystem with Rclone.
  Works with move to filesystem feature (not move to S3 feature).
  Docs at https://github.com/wekan/wekan/wiki/Rclone .
- Store files to S3. In Progress. Note: S3 button does not work yet.
  [Part 1](https://github.com/wekan/wekan/commit/21e2eabd607cc7fccbce8ed8562d886ab54fee68),
  [Part 2](https://github.com/wekan/wekan/commit/028633b00ab25bcd5c7ce6f78368aa6e33102a0c),
  [Part 3](https://github.com/wekan/wekan/commit/fb6f618917f73a1772c9670b85a9d368a8a02855),
  [Part 4](https://github.com/wekan/wekan/commit/391607ec79954ddc907170add8381c134717f576).

and adds the following updates:

- Update readme badges to be only links, and not load remote images.
  [Part 1](https://github.com/wekan/wekan/commit/2b2bb5d6e220758be7e7c7b660ba9ab6061d6ba2),
  [Part 2](https://github.com/wekan/wekan/commit/9a838e7990cd614fdf47047280d7e4731663102e),
  [Part 3](https://github.com/wekan/wekan/commit/d65f8cda1b1909ed1deac387e4c71fbf92889392),
  [Part 4](https://github.com/wekan/wekan/commit/182e1d4bf4eb0751ef51e820c223623c11a39e1d).
  Thanks to xet7.
- [Moved helm charts to https://github.com/wekan/charts](https://github.com/wekan/wekan/commit/62dc63c03386f092301b1c1ef41007c8c0654eaa).
  Thanks to xet7.
- Released newest Helm Chart to https://artifacthub.io/packages/helm/wekan/wekan .
  Thanks to xet7.
- [Updated dependencies](https://github.com/wekan/wekan/commit/0ae8e4912b9ac69ef481b101137d30406f1fe03a).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fixed Windows bundle build script and updated newest Windows WeKan release](https://github.com/wekan/wekan/commit/f1ff6d1e1fe935073f2600303c5c54f62d892311).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.64 2022-12-24 WeKan ® release

This release adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/71d35b0525b50191839147e74a7c9c66bf99496a).
  Thanks to xet7.
- [Update webmanifest for WeKan Android Play Store app](https://github.com/wekan/wekan/commit/558093ff0c41da5798acc0b3ab723d288e104f8a).
  Thanks to xet7.
- Upgrade to MongoDB 6.0.3.
  [Part 1](https://github.com/wekan/wekan/commit/62242b4a9636c1af49462403143e43e14e9a0cec),
  [Part 2](https://github.com/wekan/wekan/commit/f22fe5497b78bad5277675cba05aebb014c7ce60).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [Fix: changing list color reloads webpage](https://github.com/wekan/wekan/pull/4787).
  Thanks to helioguardabaxo.
- [Bug: Adding Users to Groups via OIDC seems to be broken](https://github.com/wekan/wekan/pull/4788).
  Thanks to Viehlieb.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.63 2022-12-22 WeKan ® release

This release adds the following new features:

- [Add link card feature to rules](https://github.com/wekan/wekan/pull/4783).
  Thanks to jos-webservices.

and adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/67c41afe9adadd420e76c8ac1be19d32cf1cc9e7).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.62 2022-12-20 WeKan ® release

This release adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/88604b634b60fd1bcabd9dd8e8451e38380c96eb).
  Thanks to xet7.
- [Added backup sync script](https://github.com/wekan/wekan/commit/5f946707e54f6acca8c0881ef80946afedf31e12).
  Thanks to xet7.
- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/cae4cc33f8d8e1a50e0caed4166fa2bed6e85444),
  [Part 2](https://github.com/wekan/wekan/commit/abc5601942cddc8024941d3e94c2468610e32f8d).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Remove duplicate IDs issue about Attachments not visible](https://github.com/wekan/wekan/pull/4781).
  Thanks to mfilser.
- [Fixed installing api2html when generating OpenAPI docs](https://github.com/wekan/wekan/commit/ccbc7f612295c7b20c0a2bcd912fa0d1102c1327).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.61 2022-12-15 WeKan ® release

This release adds the following new features:

- [Added newuser to api.py](https://github.com/wekan/wekan/commit/f485ccea2f22e83cab2f780106e79eb5d7a3e741).
  Thanks to WassimDhib and xet7.
- [For export/print print board/card, added some CSS better. Use browser print preview %20 etc setting to fit to page. Next: Card CSS](https://github.com/wekan/wekan/commit/a561d1b63368c52c8b643e5134392961a45b81ff).
  Thanks to xet7.

and adds the following updates:

- [Upgraded to Meteor 2.9.0](https://github.com/wekan/wekan/commit/49546b7e3b6ea77c17008d07b6938da4f8ff0a47).
  MongoDB performance upgrades etc: https://blog.meteor.com/new-meteorjs-2-9-and-the-new-scaffold-api-5fcc0f3b1ce5
  Thanks to Meteor developers.
- Updated to Node.js v14.21.2.
  [Part 1](https://github.com/wekan/wekan/commit/689e37e43486cb5b96bfa9222d40ec76d4e0be45),
  [Part 2](https://github.com/wekan/wekan/commit/ed3a512518e629a9399ebe80aea4bd77f43bc809).
  Thanks to Node.js developers.
- Updated dependecies like markdown-it-mermaid.
  [Part 1](https://github.com/wekan/wekan/commit/fe1e1983adfb29c0522c2f81d1ffe1432e496348),
  [Part 2](https://github.com/wekan/wekan/commit/c4d1ffc2e50344bc8ba35de1109cd03ea1af356a).
  Thanks to developers of dependencies.
- [Update release scripts like Node.js update script](https://github.com/wekan/wekan/commit/d1f519917ba3b5a14d110575afd8cfce90360fe1).
  Thanks to xet7.

and fixes the following bugs:

- [Fixed text not visible at white swimlane at themes dark and exodark. Commented out not in use font Poppins](https://github.com/wekan/wekan/commit/b9ae5a19c7755eaabcdc28d71c94b3044eed9300).
  Custom fonts were previously removed because they did not work,
  there were errors at browser inspect console.
  Thanks to Meeques and xet7.
- [Move Desktop Drag Handle setting more right](https://github.com/wekan/wekan/commit/2be0385c254793f4ff8371d981c665fcc3878458).
  Thanks to Emile840 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.60 2022-12-01 WeKan ® release

This release adds the following updates:

-  [Upgraded to Meteor 2.8.2](https://github.com/wekan/wekan/commit/49404203aba23bd9c6fea37b037e1e8432a92cee).
   This could fix memory leaks. See https://forums.meteor.com/t/meteor-v2-8-memory-leak-in-mongo-driver/59101/23 .
   Added Mongo sessions count to Admin Panel / Version at bottom of page, see that it is not growing all the time.
   Thanks to Meteor developers and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.59 2022-11-28 WeKan ® release

This release adds the following updates:

- [Bump GitHub Action VeryGoodOpenSource/very_good_coverage from 2.0.0 to 2.1.0](https://github.com/wekan/wekan/pull/4761).
  Thanks to dependabot.

and fixes the following bugs:

- [Provide a copy of escapedToHex() from ldapjs](https://github.com/wekan/wekan/pull/4760).
  Thanks to nebulade.
- [Removed FOSSA GitHub badge integration, because FOSSA Open Source plan does not show enough details about licenses, and does not allow to fix incorrectly detected licenses](https://github.com/wekan/wekan/commit/e8d483098e1123336f3132c0f63b1e794b9d20b9).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.58 2022-11-25 WeKan ® release

This release fixes the following bugs:

- [Try to fix #4754 LDAP CN escape. Please test](https://github.com/wekan/wekan/commit/252b2f6f87ec2e972f7a4b065375da740abc1780).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.57 2022-11-24 WeKan ® release

This release adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/38f7384fd743ac673a44606fecadb4dd68728cad).
  Thanks to xet7.

and fixes the following bugs:

- [Try to fix Unescaped char in CN at LDAP, by updating to ldapjs to 2.3.3 and adding escape](https://github.com/wekan/wekan/commit/743d9d2be81d1350f1a3655450c1ab89bfcdfe86).
  Thanks to xUndero, mfilser, gramakri and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.56 2022-11-22 WeKan ® release

This release adds the following new features:

- [Add delete token api](https://github.com/wekan/wekan/pull/4752).
  Thanks to aazf.

and adds the following updates:

- [Upgraded to Meteor 2.8.1](https://github.com/wekan/wekan/commit/3b59620ee39b6224660b6abd95fe4f0f288d7a15).
  Thanks to Meteor developers.
- [Revert max_old_space_size and stack-size. Update markdown-it-mermaid and cli-table3](https://github.com/wekan/wekan/commit/57c09e15acd40c24f946e220d9e064a34f4152fb).
  Thanks to xet7.
- [Updated Meteor version at Dockerfile](https://github.com/wekan/wekan/commit/e62b19affe7cc3ad2858ece776495fb76bfae447).
  Thanks to xet7.

and fixes the following bugs:

- [Try to fix building Snap Candidate](https://github.com/wekan/wekan/commit/fbae3b0e557d2cf355579456684a9b1dec8cb72d).
  Thanks to xet7.
- [Revert set miniscreen to 250px](https://github.com/wekan/wekan/commit/6a4e17e0394736cd59ab7650c397c46595c8b60e).
  Thanks to zlobcek, mfilser and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.55 2022-11-05 WeKan ® release

This release adds the following new features:

- Added LDAP sync Python3 script, that also correctly removes users.
  [Part 1](https://github.com/wekan/wekan/commit/ca9d47c2aab8d8e856515aba53ac77be90faf9f0),
  [Part 2](https://github.com/wekan/wekan/commit/55bd94bbf4f8d37d2aebd445694b02bd6fc92e4a).
  Thanks to hpvb.

and adds the following updates:

- [Commented out ppc64el from release scripts](https://github.com/wekan/wekan/commit/f67ffc910c7a44e69d799d2e5251c6cdb9bd88c1).
  Thanks to xet7.
- [Use Ubuntu 22.10 base on Docker](https://github.com/wekan/wekan/commit/a52213b93a89dfe407037191e477c73013ac7224).
  Thanks to Ubuntu developers.
- [Updated to Node.js v14.21.1](https://github.com/wekan/wekan/commit/20e3282edd45fb395143c08e82631a41bdf296d4).
  Thanks to Node.js developers.
- [Updated ostrio:files](https://github.com/wekan/wekan/commit/2ef75a810da2566d8630be0dde0ec7c2df518b76).
  Thanks to ostrio:files developers.
- [Updated markdown-it-mermaid](https://github.com/wekan/wekan/commit/a3ecda64cfb1ba033caa8e5162f9b8a008a51cdb).
  Thanks to xet7.

and fixes the following bugs:

- [Fix Python-Esprima upstream failing](https://github.com/wekan/wekan/pull/4732).
  Thanks to bentiss.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.54 2022-10-24 WeKan ® release

This release adds the following new features:

- [Added development option for using bundle visualizer](https://github.com/wekan/wekan/commit/7810e90524438c4305c55b64da716c0f68e1b1df).
  Thanks to xet7.
- [In optional WeKan metrics feature, rename metrics key and add a new one](https://github.com/wekan/wekan/pull/4728).
  Thanks to Emile840.
- Drag handle toggle at top left.
  Each touch/non-touch screen can use different setting, because it's saved to browser localstorage, not database.
  For example, when using Firefox Multi-Account Containers AddOn, different browsers etc, when logged in as same user.
  [Part 1](https://github.com/wekan/wekan/commit/e214bc55dcfd685c96311da7c2226cfb96208fca),
  [Part 2](https://github.com/wekan/wekan/commit/7e5e29cacb90e6eb01f34baad2b6dec9adb0ad4a).
  Thanks to hatl and xet7.

and adds the following updates:

- [Upgraded to Meteor 2.8.0](https://github.com/wekan/wekan/commit/ab495458767162dcfab2d2a5940138eee39f6fc0).
  Thanks to Meteor developers.
- [OpenPower MiniCloud is discontinued, no ppc64le build server. Looking for other ways to build](https://github.com/wekan/wekan/commit/93fa56d039500f83a7c290ba57fc609b4295e13d).
  Thanks to MiniCloud.

and fixes the following bugs:

- [docker-compose.yml added info about LDAP and disable Password login option at Admin Panel](https://github.com/wekan/wekan/pull/4716).
  Thanks to luisfcorreia.
- [Commented out fonts, because after upgrade to Meteor 2.8.0 there was errors in browser inspect console: downloadable font: rejected by sanitizer font-family Roboto Poppins](https://github.com/wekan/wekan/commit/005c91af51223966687e3c98fa0b6bce66a552f9).
  Thanks to xet7.
- [Try to fix Mermaid Diagram error in Chrome: Maximum call stack size exceeded](https://github.com/wekan/wekan/commit/2573d325e62675771e2faf5ee2c26758d1dda86d).
  Thanks to xet7.
- [Added URL path / for site.webmanifest and pwa-service-worker because of errors in Chrome inspect console](https://github.com/wekan/wekan/commit/15bf69c3194394272633a1c5572e37fc09e5d947).
  Thanks to xet7.
- [Fix to use metrics related code only when enabled, because got error about userId](https://github.com/wekan/wekan/commit/d474ce64b82c1ba24c7659ad378be0d379ee7826).
  Thanks to xet7.
- [Fix metrics to check that socket is defined, because got error about userId](https://github.com/wekan/wekan/commit/a9dfcf852088e968e521b128de643a85e71dc1bc).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.53 2022-10-06 WeKan ® release

This release adds the following updates:

- Updated release scripts to try fix building bcrypt from source at accounts-password dependency.
  [Part 1](https://github.com/wekan/wekan/commit/b98888e128dd3ec932754aba320af11fc02143c3),
  [Part 2](https://github.com/wekan/wekan/commit/923e48d64c4f9db8a1654e3ed9463771069ba3eb),
  [Part 3](https://github.com/wekan/wekan/commit/f6dfd2ab67ab8bc216435d46129663bd7e0da103).
  Thanks to xet7.

and fixes the following bugs:

- [Try to fix Mermaid Diagram error: Maximum call stack size exceeded](https://github.com/wekan/wekan/commit/aeac6e605b9c8659a690b195bc67e6fc2478f74f).
  Thanks to xet7.
- [Updated README.md about Docker: You can use latest tag to get newest release tag](https://github.com/wekan/wekan/commit/fc28b6cbe29e578f1415ed47dab7cc11f383a8cc).
  Thanks to gohrner and xet7.
- Refine subpath deployment support.
  [Part 1](https://github.com/wekan/wekan/pull/4712) thanks to schnell18.
  [Part 2](https://github.com/wekan/wekan/commit/625a9f16f5f34fd2250d83ecbeb7a0b0c8ee6e39) thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.52 2022-10-02 WeKan ® release

This release adds the following new features:

- [Added faster way to do actions on minicard menu](https://github.com/wekan/wekan/commit/b70a6cb348a45c856bd63aaba691e0e334dabe4b).
  Thanks to mohammadZahedian, HT-Marley and xet7.

and adds the following updates:

- [Snap Candidate MongoDb upgrade](https://github.com/wekan/wekan/commit/7c6b557186dc88d96eb965294151e2b4c093ae8f).
  Thanks to MongoDB developers.
- [Node to 14.20.1 on Snap](https://github.com/wekan/wekan/commit/7af0d85687e1c603043b52ebe5448854e81d5925).
  Thanks to Node.js developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.51 2022-09-29 WeKan ® release

This release adds the following updates:

- [Updated to Node.js v14.20.1](https://github.com/wekan/wekan/commit/ccf4f59430ba0b1e63178811286eba4ae668101b).
  Thanks to Node.js developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.50 2022-09-23 WeKan ® release

This release adds the following new features:

- [Added a possibility of getting some WeKan metrics datas](https://github.com/wekan/wekan/pull/4700).
  Thanks to Emile840.
- [Added METRICS_ALLOWED_IP_ADDRESSES settings to Docker/Snap/Source](https://github.com/wekan/wekan/commit/34862810df686abfc0ee9ff1a13690a7b2bacc7e)
  https://github.com/wekan/wekan/wiki/Metrics and missing Matomo settings to Snap help.
  Thanks to xet7.

and adds the following updates:

- [Update CONTRIBUTING.md](https://github.com/wekan/wekan/commit/389b07138c43e954d2e6fca0fae278b3e7dcff21).
  Thanks to [BlobbyBob](https://github.com/wekan/wekan/issues/4696).
- [Update link to Meteor repair tools](https://github.com/wekan/wekan/issues/4697).
  Thanks to BlobbyBob.
- [Updated markdown-it-mermaid and cli-table3](https://github.com/wekan/wekan/commit/5ce08345292b4ca9843fb328a4e82f215ef8fbb6).
  Thanks to xet7.

and adds the following translations:

- [Added Romanian translation. Updated translations](https://github.com/wekan/wekan/commit/e2d5a83d7c9e1725fec93d9da4038b893736cace).
  Thanks to translators.
- [Fix typos and translate comments to English](https://github.com/wekan/wekan/commit/551f57b03bbc1dba37862a0cc3407c8d359e2a9a).
  Thanks to xet7.

and fixes the following bugs:

- [Build: harden GitHub Workflow permissions](https://github.com/wekan/wekan/pull/4699).
  Thanks to sashashura.
- [Try to fix again Mermaid Diagram error: Maximum call stack size exceeded](https://github.com/wekan/wekan/commit/0e5f98fd96abd0f287e38726e68770bcb3940ae6).
  Thanks to xet7.
- [Show translations debug messages only when DEBUG=true](https://github.com/wekan/wekan/commit/a30276e3d88c5c15b340d2c8f1a6f896c2207b7e).
  Thanks to xet7.
- [Fix bootstrap and datepicker3 css map missing](https://github.com/wekan/wekan/commit/21e6e4cb1a5d44dbe6173ba6696c9375eaecedf3).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.49 2022-09-18 WeKan ® release

This release fixes the following bugs:

- [Checklist copy/move dialog was sometimes empty](https://github.com/wekan/wekan/pull/4694).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.48 2022-09-17 WeKan ® release

This release adds the following new features:

- [RegExp possible at Custom Field String Templates](https://github.com/wekan/wekan/pull/4692).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.47 2022-09-16 WeKan ® release

This release adds the following new features:

- [Added hide/show to show counters and members on All Boards to Admin Panel](https://github.com/wekan/wekan/pull/4691).
  Thanks to helioguardabaxo.

and fixes the following bugs:

- [Removed Azeri/Azerbaijani from RTL list](https://github.com/wekan/wekan/commit/627d1830150391073601595a68fd2c273951e68c).
  Thanks to yarons.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.46 2022-09-15 WeKan ® release

This release adds the following new features:

- [Added limit description on minicard to three lines](https://github.com/wekan/wekan/pull/4685).
  Thanks to helioguardabaxo.
- [Added titles to add and edit checklist items](https://github.com/wekan/wekan/pull/4686).
  Thanks to helioguardabaxo.

and adds the following updates:

- [Updated Snap Candidate MongoDB to 5.0.12](https://github.com/wekan/wekan/commit/080cec07c0f7fefcc8dfa46a4063695f2b8d5aee).
  Thanks to MongoDB developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.45 2022-09-14 WeKan ® release

This release adds the following new features:

- [Add ARIA in checklist items](https://github.com/wekan/wekan/pull/4677).
  Thanks to helioguardabaxo.
- [Heading hierarchy fixed on checklist title to simplify screen reader](https://github.com/wekan/wekan/pull/4680).
  Thanks to helioguardabaxo.
- [Add info about RTL languages to Meteor WeKan. Not used in Meteor WeKan yet](https://github.com/wekan/wekan/commit/cf7c0512422178be23d287cce269a7b854a2bc21).
  Thanks to xet7.
- [Added help button with custom URL](https://github.com/wekan/wekan/pull/4681).
  Thanks to helioguardabaxo.

and adds the following updates:

- [Add starting wekan test to arm64/s390x/ppc64el release scripts](https://github.com/wekan/wekan/commit/51ed0acc4f84ebce497f52a3267e57f554b3cd30).
  Thanks to xet7.

and fixes the following bugs:

- [Avoid non-terminating containers](https://github.com/wekan/wekan/pull/4675).
  Thanks to bronger.
- [Fixed WeKan api.py . WeKan API now works in newest WeKan and n8n](https://github.com/wekan/wekan/commit/aa2c3774a233025a163e9d9c210ad2f1807c0acb).
  Thanks to DimDz and Joffcom.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.44 2022-09-05 WeKan ® release

This release adds the following new features:

- [Add tab view to sidebar members: people, orgs and teams](https://github.com/wekan/wekan/pull/4672).
  Thanks to helioguardabaxo.

and adds the following updates:

- [Updated matb33:collection-hooks](https://github.com/wekan/wekan/commit/0f6d84d69f286c8191e8d3a6eee59bc3f6845ad1).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Added missing currentUser](https://github.com/wekan/wekan/commit/3a0269640b7fad0d40dc3b65f559f5124f4256b6).
  Thanks to xet7.
- [Removed old stuff from Dockerfile](https://github.com/wekan/wekan/commit/77927a1ca4fb9bf9c68fe823cf0dd9a95f310879).
  Thanks to xet7.
- [Fix building Dockerfile on Mac M1 etc](https://github.com/wekan/wekan/commit/3772ce3acab5a7421144df3a538def33baf0eda4).
  Thanks to willman42 and xet7.
- [Fix 2) Due date is not created nor changed, when cards are moved in the calendar view](https://github.com/wekan/wekan/commit/6b4613d3ed6020b4072fe6540da5fdb0b2e85ac7).
  Thanks to DimDz.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.43 2022-09-01 WeKan ® release

This release fixes the following bugs:

- [Revert Remove hard-coded port 8080 binding in Dockerfile](https://github.com/wekan/wekan/pull/4667).
  Thanks to willman42.
- [Added back autologin, because reverting it broke Google OIDC login](https://github.com/wekan/wekan/commit/1e4fba3ec8366aac2e9fdd812aa047f5d53db749).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.42 2022-08-31 WeKan ® release

This release adds the following new translations:

- [Added translations: English (Malaysia) (en_MY), Japanese (Hiragana) (ja-Hira), Malay (ms)](https://github.com/wekan/wekan/commit/17f97f6acc1827e956039f4cae5e15e7fcb0e19e).
  Thanks to dimanLubis.

and fixes the following bugs:

- [Fix check for current user at card details](https://github.com/wekan/wekan/commit/68e4e6f04921a3618d71d72b617f49c9ee85c18f).
  Thanks to xet7.
- [Comment out CentOS 7 specific settings](https://github.com/wekan/wekan/commit/d470a74a9fe2a2029c2063d940d4573b58adf6c0).
  Thanks to williamtrelawny and xet7.
- [00checkStartup, userInfo was missing](https://github.com/wekan/wekan/pull/4662).
  Thanks to mfilser.
- Try to fix EasySearch.
  [Part 2](https://github.com/wekan/wekan/commit/a21883e3a151644ffeac921b5978157d0674c414),
  [Part 3](https://github.com/wekan/wekan/commit/0d3b7ca04121abd2f170a5934672bc79112ac4ef).
  Thanks to danielkaiser and xet7.
- [Revert autologin, because it broke OIDC login with Keycloak](https://github.com/wekan/wekan/commit/43a709675394f6aade42033c14c7fb5b78ac25c8).
  Thanks to wb9688 and xet7.
- [Remove hard-coded port 8080 binding in Dockerfile](https://github.com/wekan/wekan/pull/4663).
  Thanks to willman42.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.41 2022-08-28 WeKan ® release

This release fixes the following bugs:

- [Try to fix EasySearch syntax](https://github.com/wekan/wekan/commit/5ca84d293080c682de9c23c6754f142e7f3cd383).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.40 2022-08-25 WeKan ® release

This release fixes the following bugs:

- [Move/Copy Card dialog didn't set the last selected board right](https://github.com/wekan/wekan/pull/4657).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.39 2022-08-21 WeKan ® release

This release adds the following new features:

- [Add support to validate avatar uploads by type, size and external program](https://github.com/wekan/wekan/pull/4648).
  Thanks to NotTheEvilOne.
- [Attachment using new feature of Meteor Files 2.3.0](https://github.com/wekan/wekan/pull/4650).
  Thanks to mfilser.

and adds the following updates:

- [Upgraded Snap candidate MongoDB versions](https://github.com/wekan/wekan/commit/d0f1382055278a2f78fd9d53b0dd5c3daaaf23fd).
  Thanks to MongoDB developers.

and fixes the following bugs:

- [Set miniscreen to 250px to get Mobile Android Firefox working](https://github.com/wekan/wekan/pull/4649).
  Thanks to repmovs.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.38 2022-08-18 WeKan ® release

This release adds the following new features:

- [Add support to validate attachment uploads by an external program](https://github.com/wekan/wekan/pull/4637).
  Thanks to NotTheEvilOne.
- [Attachment upload progress bar + multiple files upload](https://github.com/wekan/wekan/pull/4641).
  Thanks to mfilser.
- [Move and copy card dialog remember last selected board](https://github.com/wekan/wekan/pull/4643).
  Thanks to mfilser.
- [Copy card copies now attachments too](https://github.com/wekan/wekan/pull/4646).
  Thanks to mfilser.
- [Copy / move card and checklists using same code](https://github.com/wekan/wekan/pull/4647).
  Thanks to mfilser.

and adds the following updates:

- [Updated to ostrio:files 2.3.0 and standard-minifier-js 2.8.1](https://github.com/wekan/wekan/commit/ce1f8b674de9e9a7d03e198e88e7a200af576729).
  Thanks to developers of dependencies.
- [Updated parse-ms](https://github.com/wekan/wekan/commit/79add98aa77658221a86830f4816f19a15a52460).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Meteor files 2.2.1 fixes + attachment view](https://github.com/wekan/wekan/pull/4638).
  Thanks to mfilser.
- [Fix Validate attachment error at PR Meteor files 2.2.1 fixes + attachment view](https://github.com/wekan/wekan/commit/c23f5dc8582e948a7c9af6fd1c6c7cca85a7e1f1).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.37 2022-08-15 WeKan ® release

This release fixes the following CRITICAL SECURITY ISSUES:

- [Updated dependencies like ostrio:files etc](https://github.com/wekan/wekan/commit/7c619859fcb6a609581adc8f09c7937b7c2efcc4).
  Thanks to developers of dependencies and xet7.

and fixes the following bugs:

- [Fix All Boards: The list of lists on each card with the summary counts is not sorted](https://github.com/wekan/wekan/pull/4635).
  Thanks to repmovs.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.36 2022-08-14 WeKan ® release

This release fixes the following bugs:

- [Revert Fix Open card links in current tab. So now links open in new tab](https://github.com/wekan/wekan/commit/8560b36a5aeb31d7032d82f75a53a18281c9f7f8).
  Thanks to dvsk, mfilser and xet7.
- [Revert Fix URLs to favicons etc for sub-urls, because it broke favicons on subdomain URLs](https://github.com/wekan/wekan/commit/8566f32bbdd3ce42ab907602fcb61ad67ece41c9).
  Thanks to dsvk and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.35 2022-08-13 WeKan ® release

This release fixes the following CRITICAL SECURITY ISSUES:

- [Fix Users can delete Boards from global archive (w/o permission)](https://github.com/wekan/wekan/commit/54e6e32ab2ec0b3a6f4e18154f66d154cf4ee0de).
  Thanks to Meeques and xet7.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/3762768ed39f967aa26b76c0454e7d5900655cc4).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix Typo in CHANGELOG](https://github.com/wekan/wekan/pull/4624).
  Thanks to mfilser.
- [Fix _getTopStack(), comment type error](https://github.com/wekan/wekan/pull/4625).
  Thanks to mfilser.
- [Set drag handle on touch screen not miniscreen](https://github.com/wekan/wekan/pull/4633).
  Thanks to repmovs.
- [Fix Open card links in current tab. Not in new tab anymore](https://github.com/wekan/wekan/commit/ee3c5cbb6a1ab87c1597d0ffcd6996f423f4d1b3).
  Thanks to bronger, ManZosh and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.34 2022-08-05 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/43360c103b462ee02945d629ce46e9010fccd5d6).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix and update easysearch](https://github.com/wekan/wekan/pull/4623).
  Thanks to danielkaiser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.33 2022-08-05 WeKan ® release

This release fixes the following bugs:

- [Try 2 to fix missing variable in WeKan fails to get MongoDB server version](https://github.com/wekan/wekan/commit/37f9de8b9b11e8dd1b54452531aa708e16517c6d).
  Thanks to simon816 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.32 2022-08-05 WeKan ® release

This release adds the following new features:

- [Add support to validate attachment uploads by type and size](https://github.com/wekan/wekan/pull/4618).
  Thanks to NotTheEvilOne.
- [Added attachments file type and size snap settings and help text](https://github.com/wekan/wekan/commit/0c224a0a7f3f2f99839db65eed896bb2dd316e3c).
  Thanks to xet7.
- [Added dependencies for attachments file size and type](https://github.com/wekan/wekan/commit/1b30485e68e5cd30784207801a1c8d659fb14018) (HEAD -> master)
  Thanks to xet7.

and adds the following updates:

- Updated release build scripts to reinstall bcrypt, upload Windows version etc.
  [Part 1](https://github.com/wekan/wekan/commit/14e5d08a19d213ab901cce9088a3e368b508e7d0),
  [Part 2](https://github.com/wekan/wekan/commit/86d6d2d19aacaf0cadcbf36e223208a5a5e69ecd),
  [Part 3](https://github.com/wekan/wekan/commit/73ea39466bd08f8d82e21beb0f71e715ee5ac120).
  Thanks to xet7.
- [Try to fix Snap Candidate](https://github.com/wekan/wekan/commit/b433fbdda81478558585cbaa7717d00247550325).
  Thanks to xet7.

and fixes the following bugs:

- [Fix In Lists view, Card Details pop-up does not appear in 6.31 release](https://github.com/wekan/wekan/commit/063ad08e9e81f5235d323cc3ed7af4cd5610dc93).
  Thanks to Sdub76, niels, m4teh, r4nc0r, mfilser, medjedovicm and xet7.
- [Try to fix missing variable in WeKan fails to get MongoDB server version](https://github.com/wekan/wekan/commit/4941fd183c54f514119587380bf659115a1adc6e).
  Thanks to simon816 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.31 2022-07-31 WeKan ® release

This release adds the following new features:

- [Added LaTex support to all input fields with markdown-it-mathjax3](https://github.com/wekan/wekan/commit/e81900178e62d36672952a8f0707c5297dcd7767).
  Examples: https://github.com/wekan/wekan/wiki/LaTeX .
  Thanks to DoktorScience.
- [Rescue Save description on card exit](https://github.com/wekan/wekan/pull/4598).
  Thanks to Viehlieb.

and adds the following updates:

- [Snap Candidate to MongoDB 5.0.10 etc](https://github.com/wekan/wekan/commit/27198c4064a41035bb800aa5e5797852e1dfdafb).
  Thanks to MongoDB developers and xet7.

and fixes the following bugs:

- [Fix URLs to favicons etc](https://github.com/wekan/wekan/commit/1b95f9f167a021ac0d0c9392ced6a9cd888ffe2d).
  Thanks to letmp, Meeques and xet7.
- [Fix the bug that displayed a card popup to all swimlanes for public board (when a user is not logged)](https://github.com/wekan/wekan/pull/4610).
  Thanks to Emile840.
- [Reverted incomplete fix about bug where opening card scrolls to wrong place](https://github.com/wekan/wekan/commit/6594795f39bd6d14a7105dc61642baa034995bad).
  Thanks to danceb, DimDz, mfilser, Emile840, derbolle, xplodwild and xet7.
- [Fix Login Page Error, Lists can't move anymore, reverted incomplete Change Lists Width](https://github.com/wekan/wekan/commit/d37adbb0462c7fc9f645594b3bd20d2bec781b18).
  Thanks to johnnytolengo, gda140 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.30 2022-07-11 WeKan ® release

This release adds the following new features:

- [Automatic login with OIDC](https://github.com/wekan/wekan/pull/4588).
  Thanks to Viehlieb.
- [OIDC/OAuth2 autologin settings for Docker/Snap/Source/Bundle platforms](https://github.com/wekan/wekan/commit/284f4401369aadcec72e67fa935dfc3a9fead721).
  Thanks to xet7.

and tries to fix the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/17f8f8f14ff205d0cbb316c63a2da36f61ba4a1d).
  Thanks to xet7.
- [On CentOS 7 Docker there is seccomp issue with glibc 6, so setting it to unconfined to get WeKan working](https://github.com/wekan/wekan/commit/054d420dc97cadee6ed7896c608d95a6fe09dc9d).
  Thanks to m-brangeon.
- [Fix uploading attachments](https://github.com/wekan/wekan/commit/69d454dd035a989266175eb4268ffc3d7891eb95).
  Thanks to BabyFnord and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.29 2022-07-11 WeKan ® release

This release adds the following features:

- [Resizeable size of list width and height. Size is not saved yet. In Progress](https://github.com/wekan/wekan/commit/01d0dd3b1dd0a3c9764e7c9d31eab739db2d3ad8).
  Thanks to NLBlackEagle and xet7.
- [00checkStartup, on error give more details on current user which run's wekan](https://github.com/wekan/wekan/pull/4581).
  Thanks to mfilser.

and adds the following updates:

- [Updated to Node.js v14.20.0](https://github.com/wekan/wekan/commit/239dd1a3411a3d4f51b109e1a0505a5a23bc72ee).
  Thanks to Node.js developers.
- [Docker base image to Ubuntu 22.04](https://github.com/wekan/wekan/commit/6b4ffa69c64f0186a8b1b3ac175b633ac7c24263).
  Thanks to Ubuntu developers.
- Updated ostrio:files.
  [Part 1](https://github.com/wekan/wekan/commit/0d67a86f2c9c1c9696d8507c60e53d47a226a6ad),
  [Part 2](https://github.com/wekan/wekan/commit/c3bfcb78e9047a84d43041bebcec56718eaa140b).
  Thanks to developers of dependencies.
- [Updated dependencies](https://github.com/wekan/wekan/commit/ae09f0f0083a96c2211fdc02e60b4ff6a2f413ca).
  Thanks to developers of dependencies.

and adds the following translations:

- [Added translation Asturia (Spain)](https://github.com/wekan/wekan/commit/12615fef5d44cf611b3f1d9fc0a7be3e98b8c042).
  Thanks to translators.
- [Added translations: Arabic (Algeria) (ar_DZ), Azerbaijani (az),  Azerbaijani (Azerbaijan) (az_AZ), Azerbaijani (Latin) (az@latin)](https://github.com/wekan/wekan/commit/99b2fdbf99f26ee9df2e1ff906db2d740210f902).
  Thanks to translators.

and fixes the following bugs:

- [Do not show archived lists on All Boards](https://github.com/wekan/wekan/pull/4573).
  Thanks to  helioguardabaxo.
- [Fix div max-width on My Cards table view](https://github.com/wekan/wekan/pull/4574).
  Thanks to  helioguardabaxo.
- [Fixed one Typo in CSS Style Sheet](https://github.com/wekan/wekan/pull/4577).
  Thanks to JonasPfeiferb1.
- [Comment out unused CSS](https://github.com/wekan/wekan/commit/724d1386f6943ad87b8e32f5544cc84ae211904c).
  Thanks to xet7.
- [Move/Copy card closes now the popup if done](https://github.com/wekan/wekan/pull/4582).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.28 2022-06-08 WeKan ® release

This release adds the following updates:

- [Upgraded to Meteor 2.7.3](https://github.com/wekan/wekan/commit/43b2d714043e053874e3c1101ae6e464d2e61b7e).
  Thanks to Meteor developers.

and adds the following translations:

- [Added translations: Moroccan Arabic (ary) and Standard Moroccan Tamazight (zgh)](https://github.com/wekan/wekan/commit/5af4f54f4c702f9cc4df60a27ac234421e41575d).
  Thanks to translators.
- [Try to detect Japanese (Japan) better](https://github.com/wekan/wekan/commit/e25050316f6f018f68b03bef6fccbdaea7248461).
  Thanks to takenoko14 at Transifex and xet7.

and fixes the following bugs:

- [Removed lightbox that caused bugs like Maximum stack size exceeded. TODO later: Add a new way to open attachment image bigger](https://github.com/wekan/wekan/commit/dfea3d0e735f1665a14f7e534e352e0e00871a02).
  Thanks to xet7.
- [Move and copy card set sorting](https://github.com/wekan/wekan/pull/4557).
  Thanks to mfilser.
- [Updated dependencies. Try to fix Binary release on releases.wekan.team lacks the CSS](https://github.com/wekan/wekan/commit/937797356ceeb99bf66eb826e13fc55f266c8739).
  Thanks to znerol, mrcancer91, BabyFnord and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.27 2022-05-28 WeKan ® release

This release adds the following updates:

- [Upgraded to Meteor 2.7.3-beta.0](https://github.com/wekan/wekan/commit/25e50e3908a52a7bac61f8b939ad7c78cbd79060).
  Thanks to Meteor developers.

and fixes the following bugs:

- [Fix opening card scrolls to wrong position when many swimlanes and card at bottom of board](https://github.com/wekan/wekan/commit/adcc33ed7fe686d46a85da6c11ea448d29e94ca7).
  Thanks to xet7.
- [Removed wekan-accounts-sandstorm .test-app directory, that could not be git cloned on Windows](https://github.com/wekan/wekan/commit/4f44c5bf872e369cd89ea0e8791482cc925294d3).
  Thanks to xet7.
- Try to fix Snap.
  [Part 1](https://github.com/wekan/wekan/commit/3b419848d1b7a7f421db3662d860dcea1ea6af1c),
  [Part 2](https://github.com/wekan/wekan/commit/e50d69cfb78e5f0150e96cc90337255ccbd59e76),
  [Part 3](https://github.com/wekan/wekan/commit/ea66eca60ddbf7127c9fbed9ab41df52542ad279),
  [Part 4](https://github.com/wekan/wekan/commit/9ca26d22d0c2c9bee792e50ff203a5c18c9d556b),
  [Part 5](https://github.com/wekan/wekan/commit/fac1ba5952f763d257b04a934e3407f9b1d1d37a),
  [Part 6](https://github.com/wekan/wekan/commit/f2815a90393418dea88aa49ee74c6af91fafe96d),
  [Part 7](https://github.com/wekan/wekan/commit/2587e2f00ae27742893e48e98845a3139e3f3a02),
  [Part 8](https://github.com/wekan/wekan/commit/693a49f85200adcf81f5cf0ea56c7dd795757988).
  Thanks to xet7.
- [WeKan Gantt GPLv2: Try to fix Gantt, by adding translations, but is not visible yet](https://github.com/wekan/wekan-gantt-gpl/commit/a08c01c76eaaf2884890a39c97d1f72da222fba1).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.26 2022-05-21 WeKan ® release

This release adds the following updates:

- [Updated to Node.js v14.19.3](https://github.com/wekan/wekan/commit/6c8563d02f0865989d8db39dd84757a1a534b49b).
  Thanks to Node.js developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.25 2022-05-21 WeKan ® release

This release adds the following new features:

- [Attachment rename](https://github.com/wekan/wekan/pulls/4521).
  Thanks to mfilser.

and fixes the following bugs:

- [Fix Bullets in label selection popup. Related to import nib css reset](https://github.com/wekan/wekan/commit/985c2cdbfdb38eb43852f3aa257859bbd3f817b9).
  Thanks to AuspeXeu, mfilser and xet7.
- [Fix images not showing correctly, by updating packages like jquery,
  removing handlebars, changing image attachment view big image popup
  from swipebox to lightbox, and changing import nib related code](https://github.com/wekan/wekan/commit/990477e9c6b33072b27bebf387bd6e6d9ef62074).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.24 2022-05-18 WeKan ® release

This release fixes the following bugs:

- [Fix redirects needs to be done in sync](https://github.com/wekan/wekan/commit/3ed1fc3e6bdf90ecdc3593468d68a29807ed52b5).
  Thanks to nebulade and xet7.
- [Added missing 'import nib' stylesheet reset that removes extra li bullet points](https://github.com/wekan/wekan/commit/8964a18e765699e2a5060a72c3ca66d27e1c2ffd).
  Thanks to mfilser and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.23 2022-05-17 WeKan ® release

This release adds the following updates:

- [Merged branch upgrade-meteor 2.7.2 to master](https://github.com/wekan/wekan/commit/7e43a6f4fb6ac3346729d3bb091e2019591fb323).
  Thanks to xet7.
- [Upgrade to Meteor 2.7.2](https://github.com/wekan/wekan/commit/963a4711dbad325a1618abf2f76541d94570ca89).
  Thanks to Meteor developers.
- [When developing with Meteor on macOS, get current IP address](https://github.com/wekan/wekan/commit/a73a4c1e5b1971ff32643fb39a37e285a240a77a).
  Thanks to xet7.
- [Updated meteor-upgrade branch to Node.js v14.19.2](https://github.com/wekan/wekan/commit/907013228d00f1190933bf7fc402957b1a973131).
  Thanks to Node.js developers.
- [Added back to meteor-upgrade branch packages WeKan lockout, ldap, oidc, cas](https://github.com/wekan/wekan/commit/00768b4392109dec62a4dcf44dbceb295990d785).
  Thanks to xet7.
- [Added fixes to meteor-upgrade branch Sandstorm accounts](https://github.com/wekan/wekan/pulls/4500).
  Thanks to mfilser.
- [Added backup to meteor-upgrade branch Sandstorm Accounts](https://github.com/wekan/wekan/commit/f260b7ba889c39a2db4a5f3057439a9b78dd7cf1).
  Thanks to xet7.
- [Improvements to future WeKan Snap core20. Does not work yet. In Progress](https://github.com/wekan/wekan/commit/38d26fa7e32c705a0cad34c199e1190c5226b968).
  Thanks to xet7.
- [Updated MongoDB 5 rawCollection deprecated update to updateMany (or updateOne)](https://github.com/wekan/wekan/commit/a196a5ed63cba2b812b9e825172f3a97d9756daa).
  Thanks to xet7.
- [Added --trace-warnings to start-wekan.sh](https://github.com/wekan/wekan/commit/50ce0ce442d804bf1d9eacacba3b493761ca6773).
  Thanks to xet7.
- [Meteor-upgrade: Fix language auto-detection](https://github.com/wekan/wekan/commit/8f43b74bbca78fa03162985fc7b2192782549c1f).
  Thanks to imajus.
- [Meteor-upgrade: Fix broken useraccounts UI i18n](https://github.com/wekan/wekan/commit/566527dfad9b11d730c84f7b62bac9c4d60518bd).
  Thanks to imajus.
- [Meteor-upgrade: Rename isoCode to tag (cause they are IETF tags actually)](https://github.com/wekan/wekan/commit/c858e0b7965847587c5e16b775c4cd44cbefbee0).
  Thanks to imajus.
- [Meteor-upgrade: Add missing language names](https://github.com/wekan/wekan/commit/f40b0d495db12824e46a60d9676e94464cc9897a).
  Thanks to imajus.
- [Added 30 new languages, now about 105 total](https://github.com/wekan/wekan/commit/28317c7cf3fea7f1c7cf0860ccebb7322000d132).
  Thanks to translators and xet7.
- [Use MongoDB 5 at docker-compose.yml](https://github.com/wekan/wekan/commit/77d72ae20acf3c96d7e864bf0fd8a159f9456823).
  Thanks to MongoDB.

and fixes the following bugs:

- [Fix Copy Board](https://github.com/wekan/wekan/pulls/4496).
  Thanks to mfilser.
- [Fix FileStoreStrategy, moveToStorage, wrong variable in error handling](https://github.com/wekan/wekan/commit/58d760a615834f989633efcd5e1577265219af19).
  Thanks to mfilser.
- [Multi-File Storage code was missing after merge](https://github.com/wekan/wekan/commit/3fad014e919be29fc85af754f89b708888d8a98e).
  Thanks to mfilser.
- Card Details dates in user language format.
  [Part 1](https://github.com/wekan/wekan/commit/d1714abc6a13783600c68526c259967886dbe80d),
  [Part 2](https://github.com/wekan/wekan/commit/2e5ec0308f2ac8059af6219693177e294197776a),
  [Part 3](https://github.com/wekan/wekan/commit/441b3e9c0a50b21da2c875946ff1059a14ce04e4).
  Thanks to mfilser.
- [Converted Stylus to CSS. Removed Stylus. This change removed many error messages](https://github.com/wekan/wekan/commit/072778b9aaefd7fcaa7519b1ce1cafc1704d646d).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.22 2022-05-09 WeKan ® release

- [Updated to Node.js v14.19.2](https://github.com/wekan/wekan/commit/bfef7844ba15a28bce63a577ed499ed899aaff79).
  Thanks to Node.js developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.21 2022-04-28 WeKan ® release

This release fixes the following bugs:

- [Fix themes](https://github.com/wekan/wekan/pull/4490).
  Thanks to TheExo.
- [Try to fix Snap by adding cypress and jest for cypress-image-snapshot and jest-image-snapshot](https://github.com/wekan/wekan/commit/7dd5fa4ac40f0fe63168b9a2ef4a0940bfc9d80b).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.20 2022-04-25 WeKan ® release

This release fixes the following bugs:

- [Fix Dockerfile: Ubuntu 22.04 causes Python trouble](https://github.com/wekan/wekan/commit/79a866e2384d262572edf68503f31e699df675eb).
  Thanks to bronger.
- [FileStoreStrategyFactory, added logic to determine the right file storage strategy to use](https://github.com/wekan/wekan/pull/4486).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.19 2022-04-22 WeKan ® release

This release adds the following new features:

- [Added to All Boards: Members list and board card count per list](https://github.com/wekan/wekan/pull/4477).
  Thanks to helioguardabaxo.
- [Added to All Boards MiniScreen: Members list and board card count per list](https://github.com/wekan/wekan/commit/45642911a9984dc48b4bcf89403a2a47d324b9c1).
  Thanks to mfilser and xet7.
- [Added All Boards Settings popup title](https://github.com/wekan/wekan/commit/023deb6c953b66f4dfcbff68ab2d1871dfb45d51).
  Thanks to xet7.
- [Updated All Boards Settings icon](https://github.com/wekan/wekan/commit/ce55d84fd83f58d25797cfccf5cec35b68b41732).
  Thanks to xet7.
- [Added to Board Settings: Minicard Settings and All Boards Settings improvements](https://github.com/wekan/wekan/commit/95a4b4fd919683e51e56a7bb76213b146a170e09).
  Thanks to xet7.
- [Added Table View to My Cards](https://github.com/wekan/wekan/pulls/4479).
  Thanks to helioguardabaxo.
- [Fix syntax in myCards.jade](https://github.com/wekan/wekan/commit/d271678ef494675d78ada25ee33f1d18d3d7ce14).
  Thanks to xet7.
- [Multi file storage for moving between MongoDB GridFS and filesystem](https://github.com/wekan/wekan/pull/4484).
  Thanks to mfilser.

and adds the following updates:

- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/f87cb10d099e5f80cded71bf633f3418713680e1),
  [Part 2](https://github.com/wekan/wekan/commit/626a7f83fc71228f2d793667ad11c5e9939e2970),
  [Part 3](https://github.com/wekan/wekan/commit/359692a564d891ee895391db72315a7c0cff9a26).
  Thanks to developers of dependencies.
- [Updated meteor-spk](https://github.com/wekan/wekan/commit/1360517af8648a7b1daf664e82700aa60f9d87c4).
  Thanks to meteor-spk developers.

and fixes the following bugs:

- [Fix Board Settings / All Boards Settings options has some bug](https://github.com/wekan/wekan/commit/77085daaa8b16f05acb314f077f48bf1d4ddbbac).
  Thanks to helioguardabaxo.
- [.gitignore, ignore all vim swap files](https://github.com/wekan/wekan/commit/5e567365f3b4e7cc40558105a0bd779efa17ac5b).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.18 2022-04-08 WeKan ® release

This release adds the following new features:

- [New theme "exodark"](https://github.com/wekan/wekan/pull/4464).
  Thanks to TheExo.
- [Show bigger logo on tab](https://github.com/wekan/wekan/commit/4057bb6372a06d9e120964e5040ddd808ba93840)-
  Thanks to Meeques, helioguardabaxo and xet7.

and fixes the following bugs:

- [Fix Card Description on dark theme is too dark](https://github.com/wekan/wekan/pull/4466).
  Thanks to TheExo.
- Removed browser contect policy so that attachments would be visible.
  [Part 1](https://github.com/wekan/wekan/commit/8a39a52d5d4d151dd90604091e35e51b6744e599),
  [Part 2](https://github.com/wekan/wekan/commit/12448ab473c08a2c3c873d7ffa2b78e7630dc87a).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.17 2022-04-06 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/f613a5875fbc600292f6821776d957c7221bcd0a).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.16 2022-04-06 WeKan ® release

This release fixes the following bugs:

- [Added HTML viewer to description on minicard](https://github.com/wekan/wekan/pull/4457).
  Thanks to helioguardabaxo.
- [Remove incomplete translated changelogs](https://github.com/wekan/wekan/pull/4455).
  Thanks to ocdtrekkie.
- [Fix Can't add attachments because of Content-Security-Policy](https://github.com/wekan/wekan/commit/0d9c37b0067d46669b7258bfff5dfc16d590e1d9).
  Thanks to Ben0it-T and xet7.
- [Try to fix Duplicate Board](https://github.com/wekan/wekan/commit/e7a11c57338a15a8fc1e1b74a2446ffd7d4743a7).
  Thanks to xet7.
- [Try to fix Trello import Attachment and links not defined. In Progress, does not work yet](https://github.com/wekan/wekan/commit/5eca3de00fea31721fa2e10b7d3a6f13ca87f39c).
  Thanks to akhudushin, hatl, 2447254731 and xet7.
- [Comment out Trello attachment import until it's implemented with API key](https://github.com/wekan/wekan/commit/49a996624f3842c243bb72120b95c27d914e02a9).
  Thanks to xet7.
- [Try to fix Snap WRITABLE_FILES](https://github.com/wekan/wekan/commit/4ca7b0dad733099cd6ad15acc69ec436539f7460).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.15 2022-04-05 WeKan ® release

This release add the following new features:

- [Show description text on minicard](https://github.com/wekan/wekan/pull/4454).
  Thanks to helioguardabaxo.

and fixes the following bugs:

- [Card Details List-Dropdown is now filled too if the card is opened from global search](https://github.com/wekan/wekan/pull/4444).
  Thanks to mfilser.
- [UI improvements on maximized card header](https://github.com/wekan/wekan/pull/4446).
  Thanks to helioguardabaxo.
- [Fix oidc login when no group data is present](https://github.com/wekan/wekan/pull/4450).
  Thanks to danielkaiser.
- [Fix LDAP authentication doesn't support multiple emails in LDAP accounts](https://github.com/wekan/wekan/commit/3394f54fb47ce2830dd72f67fba4f281246c156f).
  Thanks to buzztiaan and NURDspace.
- [Added missing characters to Subtasks jade template](https://github.com/wekan/wekan/commit/c18f5319152cd4df51729f26911d2e910d8bbc5d).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.14 2022-04-03 WeKan ® release

This release fixes the following bugs:

- [WRITABLE_PATH must be writable, otherwise abort starting Wekan](https://github.com/wekan/wekan/pull/4440).
  Thanks to mfilser.
- [Better error message layout if Wekan can not start](https://github.com/wekan/wekan/pull/4442).
  Thanks to mfilser.
- [Try to fix Attachments.insert is not a function](https://github.com/wekan/wekan/commit/02e977f5128c76b6ff592c8b236868baaa9404cb).
  Thanks to ChrisMagnuson and xet7.
- Some torodb fixes. In Progress.
  [Part 1](https://github.com/wekan/wekan/commit/edb4db30bbd0b60ccc58be7238652288cf31ebd0),
  [Part 2](https://github.com/wekan/wekan/commit/1e42aebd707aae46a1f7b005a0891d7b12275d1b).
  Thanks to xet7.
- [Not ZFS, it uses many gigabytes of RAM](https://github.com/wekan/wekan/commit/747a3b17d52c972db5c9b460e88d02bd52fb35bb).
  Thanks to xet7.
- [Added WRITABLE_PATH to rebuild-wekan.sh meteor commands](https://github.com/wekan/wekan/commit/9ab2d5fab09f5c9a245f841df912a9b04bc9b3f0).
  Thanks to xet7.
- [Fix list color too close with moderndark theme on mobile view](https://github.com/wekan/wekan/commit/5d3d5e4b2db22564b669c93e083c3d40215454f4).
  Thanks to gerald41, Meeques, Go-rom, mfilser, jghaanstra and xet7.
- [Fixed docker-compose.yml WRITABLE_PATH](https://github.com/wekan/wekan/commit/9238b6620cf062e70c812f5c3575fbd8d4dd56be).
  Thanks to xet7.
- [Updated WRITABLE_PATH at start-wekan.sh and start-wekan.bat](https://github.com/wekan/wekan/commit/10555e151457edba1d61eff5dd8f6cf75a71abef).
  Thanks to xet7.
- [Try to fix Snap WRITABLE_PATH](https://github.com/wekan/wekan/commit/74d468ea7947703bdd77ff84b8d175a3276ddd36).
  Thanks to xet7.
- [Snap: Try to delete incomplete uploads when starting](https://github.com/wekan/wekan/commit/25dc378c46f7b047f82d5848ae4d7b4d8ef39c5e).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.13 2022-04-01 WeKan ® release

This release adds the following new features:

- [Added Perl scripts for Asana export to WeKan ®](https://github.com/wekan/wekan/commit/376bcbb373d16317060adc2b1154cc20496775cc).
  Thanks to GeekRuthie.
- [Add get list and board cards count to API](https://github.com/wekan/wekan/pull/4424).
  Thanks to helioguardabaxo.
- [Added translations: English (Brazil) en-BR and Czech (Czech Republic) cs-CZ](https://github.com/wekan/wekan/commit/ca15e060bb182b0ff4768a3ff9d4de5b1ee125ce).
  Thanks to translators.
- [Added WRITABLE_PATH to Windows start-wekan.bat](https://github.com/wekan/wekan/commit/1da0786211556697acac45bdc71b283630348081).
  Thanks to BabyFnord and xet7.

and adds the following updates:

- [Changed from volta to n. Added info about developing on Ubuntu 22.04](https://github.com/wekan/wekan/commit/9099e20b806c713cc73b86122ac4a462b12e4785).
  Thanks to xet7.
- [Added some more info about building on Windows, not tested yet](https://github.com/wekan/wekan/commit/e61e9bb5081efca352dc9496f0602df2f15492fd).
  Thanks to xet7.
- [Updated URL to meteor-spk](https://github.com/wekan/wekan/commit/f2f3b76eda982856f88f5289c6d574fdf95abd82).
  Thanks to xet7.
- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/c397b5eda8e60ef41ce66bec716f859c352d4744),
  [Part 2](https://github.com/wekan/wekan/commit/971391eae9e9d7df341de630a28e074408991c2c).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Attachment migration, try to ignore error on Cloudron on removing old index cardId](https://github.com/wekan/wekan/pull/4408).
  Thanks to mfilser.
- [Fix Import Done Button do not redirect](https://github.com/wekan/wekan/pull/4411).
  Thanks to Ben0it-T.
- [Fix Duplicate board and create board from template doesn't open board](https://github.com/wekan/wekan/pull/4413).
  Thanks to Ben0it-T.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.12 2022-03-11 WeKan ® release

This release adds the following new features:

- Feature/empower sso oicd data propagation.
  [Part 1](https://github.com/wekan/wekan/pull/4392),
  [Part 2](https://github.com/wekan/wekan/pull/4404).
  Thanks to Viehlieb.
- [Add linkedBoard Activities to sidebar](https://github.com/wekan/wekan/pull/4396).
  Thanks to Ben0it-T.
- [Added Snap WRITABLE_PATH](https://github.com/wekan/wekan/commit/9f807c59d76b08476b79b0173c2c3a59248fa65b).
  Thanks to xet7.
- [Docs for Snap WRITABLE_PATH](https://github.com/wekan/wekan/commit/01a91f3a36747311fb69123124254db13156e4da).
  Thanks to xet7.

and fixes the following bugs:

- Fix Boards.uniqueTitle not working as expected.
  [Part 1](https://github.com/wekan/wekan/pull/4401),
  [Part 2](https://github.com/wekan/wekan/pull/4402).
  Thanks to Ben0it-T.
- [Attachments fixes after migration to meteor files (image preview, global search)](https://github.com/wekan/wekan/pull/4405).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.11 2022-03-03 WeKan ® release

This release adds the following updates:

- [Updated In Progress future Snap configs](https://github.com/wekan/wekan/commit/dc6bc9ed54e46ad2ba55fb1dd73f41c0432a7b8f).
  Thanks to xet7.

and tries to fix the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/e5cfcc84faea551ea49b588348ade44b027718ce).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.10 2022-03-02 WeKan ® release

This release adds the following new features:

- [Switch from CollectionFS to Meteor-Files](https://github.com/wekan/wekan/pull/4336).
  NOTE: This does not yet have migration feature to filesystem or S3.
  Thanks to imajus, mfilser and xet7.
- [Added Meteor-Files WRITEABLE_PATH for Sandstorm, Snap and Source](https://github.com/wekan/wekan/commit/cc0658a225ef35a6153feab2ad0c0eb40ad66eeb).
  Thanks to xet7.
- [Added WRITABLE_PATH to be usable when developing with meteor command, and to torodb](https://github.com/wekan/wekan/commit/e0d8ddf0034a6d2a7f259a71544ec4c57d23f0c5).
  Thanks to xet7.
- [Enabled building Sandstorm WeKan, now that file uploading with Meteor-Files works](https://github.com/wekan/wekan/commit/dc99218e4ecb766e7947f8a0298236dead140b9f).
  Thanks to imajus, mfilser and xet7.

and adds the following updates:

- [Updated to Node.js v14.19.0](https://github.com/wekan/wekan/commit/492997922129f4076c61c1bd8822851d39ce3f11).
  Thanks to Node.js developers.
- [Use Node 14 at rebuild-wekan.sh](https://github.com/wekan/wekan/commit/ab33866d1a5a9080688c0c5f857d12c4117b9311).
  Thanks to xet7.
- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/1a7a41698c1a5180e5ffa7d6b84820e05864ac77),
  [Part 2](https://github.com/wekan/wekan/commit/9b4179e163bbf6690070fe1e6a14799f2ea17df6).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.09 2022-02-28 WeKan ® release

This release tries to fix the following bugs:

- [Try to fix Admin Panel / Disable Registration and Disable Forgot Password](https://github.com/wekan/wekan/commit/0775e2a3e5c5d98e4d8c1954a15beb0688c73075).
  Thanks to urmel1960, Ben0it-T and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.08 2022-02-27 WeKan ® release

This release tries to fix the following bugs:

- [Try to allow register and login](https://github.com/wekan/wekan/commit/3076547cee3a5fabe8df106ddbbd6ce1e6c91a8b).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.07 2022-02-26 WeKan ® release

This release fixes the following bugs:

- [Fix Forgot Password to be optional](https://github.com/wekan/wekan/commit/9bd68794555009f5eabad269ed642efa4e3010f1).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.06 2022-02-26 WeKan ® release

This release adds the following new features:

- [Feature/shortcuts for label assignment](https://github.com/wekan/wekan/pull/4377).
  Thanks to Viehlieb.
- [Feature/propagate OIDC data](https://github.com/wekan/wekan/pull/4379).
  Thanks to Viehlieb.

and fixes the following bugs:

- [Global search: Card Details popup opens now in normal view even if maximized card is configured](https://github.com/wekan/wekan/pull/4352).
  Thanks to mfilser.
- [Card details, fix header while scrolling](https://github.com/wekan/wekan/pull/4358).
  Thanks to mfilser.
- [Add subscription to announcements, so that system wide announcements are shown to all](https://github.com/wekan/wekan/pull/4375).
  Thanks to pablo-ng.
- [Fixed Disable Self-Registration. Added Disable Forgot Password to same Admin Panel page](https://github.com/wekan/wekan/commit/b85db43c4755cf54e550f664311cd95097d68ae1).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.05 2022-02-07 WeKan ® release

This release adds the following updates:

- [Update release scripts to merge latest changes](https://github.com/wekan/wekan/commit/ad35e7b7bd1d6d7568b3a5d692941e03e4623c1a).
  Thanks to xet7.

and fixes the following bugs:

- [Fix copy move card](https://github.com/wekan/wekan/pull/4345).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.04 2022-02-07 WeKan ® release

This release fixes the following bugs:

- [Fixed Copy card to list does not work, by reverting clientside changes of PR 4333](https://github.com/wekan/wekan/commit/a5b376e6b5f9b171c39cd9341b8c2a4346fc3f5e).
  Thanks to Meeques, PaulITsoft and xet7.
- [Fixed Problem with selecting action in rule window](https://github.com/wekan/wekan/commit/dc7b97c1780849b04389696f0dac38e4477e28cf).
  Thanks to Meeques and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.03 2022-02-07 WeKan ® release

This release adds the following updates:

- [Updated to Node.js v12.22.10](https://github.com/wekan/wekan/commit/cc5486797648b8098e50fa4f68cc4b588f41ab60).
  Thanks to Node.js developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.02 2022-02-06 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/f888b5cb23917c01cef7a84cf23314051ec6bfff).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.01 2022-02-06 WeKan ® release

This release adds the following updates:

- [Updated to Node.js v14.19.0](https://github.com/wekan/wekan/commit/ceed865e305f41ec027f1ed345b041841c9812c0).
  Thanks to Node.js developers.

and fixes the following bugs:

- [Fixed WeKan on Sandstorm](https://github.com/sandstorm-io/meteor-spk/pull/41).
  Thanks to xet7.
- [Fixed building fibers](https://github.com/wekan/wekan/commit/0460a7d9d3219ed7ba5aa5040349b9d56e6a45e0).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v6.00 2022-02-05 WeKan ® release

This release adds the following new features:

- [Adding list select at card details](https://github.com/wekan/wekan/pull/4333).
  Thanks to mfilser.

and adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/9b7bf1ba289f0026f0bf957527c86b6f4696686e).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.99 2022-02-04 WeKan ® release

This release adds the following changes:

- [Revert rounded corners minicard on moderndark theme](https://github.com/wekan/wekan/pull/4332).
  Thanks to jghaanstra.

and fixes the following bugs:

- [Remove not working options from rebuild-wekan.sh](https://github.com/wekan/wekan/commit/af598b13e8266654ab52425f71840c3628c9835a).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.98 2022-02-03 WeKan ® release

This release adds the following CRITICAL SECURITY UPDATES:

- [Updated to Node.js v12.22.10](https://github.com/wekan/wekan/commit/290a6dfb6e104b887f9ee2cc70db84b83fe3be35).
  Thanks to Node.js developers.

and adds the following new features:

- [Make card corners round](https://github.com/wekan/wekan/commit/045160c7bb7c8696a181d9ed4e0b54d0c27b5f59).
  Thanks to Meeques and xet7.
- [Copy checklist](https://github.com/wekan/wekan/pull/4331).
  Thanks to mfilser.

and adds the following new translations:

- Added translation: Galician (Spain).
  [Part 1](https://github.com/wekan/wekan/commit/c0828f2d00095c68b4533a10ff7ede0a16131093),
  [Part 2](https://github.com/wekan/wekan/commit/9a539fb414c3ffeae2ea94f863d2bb3bc6e314f1),
  [Part 3](https://github.com/wekan/wekan/commit/a8e3dc06fe76620d09eddbc7d118a749c85b1c7c).
  Thanks to translators.

and fixes the following bugs:

- [Fix typo in tests](https://github.com/wekan/wekan/commit/62efb67d06a4aeb3299805911391b6e936901b42).
  Thanks to xet7.
- Try to fix tests by adding puppeteer back.
  [Part 1](https://github.com/wekan/wekan/commit/7122f59c51775f9b382cdbcf5690eba2ad907ccf),
  [Part 2](https://github.com/wekan/wekan/commit/1bf1ed79e85e091d79fa70feb46d072c81e55810).
  Thanks to xet7.
- [Removed unnecessary space between checklist title and first checklist item if checklist progress is 0%](https://github.com/wekan/wekan/pull/4329).
  Thanks to mfilser.
- [Lists now moveable when swimlane requires scrolling](https://github.com/wekan/wekan/pull/4330).
  Thanks to mfilser.
- [Add more stack and heap to Node.js at all WeKan platforms](https://github.com/wekan/wekan/commit/ff13571c719ad24e24ea6dc871ced827a7120ac8).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.97 2022-01-23 WeKan ® release

This release fixes the following bugs:

- [Fix can't add Checklist on cardType-linkedBoard](https://github.com/wekan/wekan/pull/4318).
  Thanks to Ben0it-T.
- [Fix comments for cards that link to a board are not shown](https://github.com/wekan/wekan/pull/4319).
  Thanks to Ben0it-T.
- [Fix Snap OAUTH2_REQUEST_PERMISSIONS of Google/OAuth2/OIDC login](https://github.com/wekan/wekan/commit/4bf6b457ae6bfb6d28127f696344019765d0467d).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.96 2022-01-23 WeKan ® release

This release adds the following new features:

- [Move checklist and card popup restore last selected board value](https://github.com/wekan/wekan/pull/4307).
  Thanks to mfilser.

and fixes the following bugs:

- [Fix Layout "Modern Dark", Card Color, List Header and mouse hover](https://github.com/wekan/wekan/pull/4308).
  Thanks to mfilser.
- [Try to fix OAUTH2_REQUEST_PERMISSIONS by removing quotes](https://github.com/wekan/wekan/commit/5e65dfc272925490b4ad20c49d8d3fd74597beac).
  Thanks to pcurie and xet7.
- [Fix notification drawer always on top](https://github.com/wekan/wekan/commit/bec25720da947e048a63541b4e421bd9bd846c58).
  Thanks to Azorimor.
- [Fix comments not loading on cardType-linkedBoard](https://github.com/wekan/wekan/pull/4315).
  Thanks to Ben0it-T.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.95 2022-01-18 WeKan ® release

This release adds the following new features:

- [Move copy card remembers the last confirmed field values](https://github.com/wekan/wekan/pull/4296).
  Thanks to mfilser.
- [Added "move checklist" and created a "Checklist Action Menu"](https://github.com/wekan/wekan/pull/4297).
  Thanks to mfilser.
- [Add checklist item - each line becomes new item](https://github.com/wekan/wekan/pull/4298).
  Thanks to mfilser.
- [Add progress bar to checklist](https://github.com/wekan/wekan/pull/4299).
  Thanks to mfilser.

and adds the following updates:

- [Update ISSUE_TEMPLATE.md: Use comments and rephrase](https://github.com/wekan/wekan/pull/4295).
  Thanks to xeruf.
- [Updated WeKan s390x bundle build script](https://github.com/wekan/wekan/commit/d4c3f323830e4692aac0f1d0faa413302087303b).
  Thanks to xet7.
- [Use different distro for building WeKan releases](https://github.com/wekan/wekan/commit/a176a58a728ffc2bb410b3e8a0036fee25f0b0bd).
  Thanks to xet7.

and fixes the following bugs:

- [Custom Field StringTemplates didn't save the last input value on desktop view after pressing Ctrl+Enter](https://github.com/wekan/wekan/pull/4300).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.94 2022-01-16 WeKan ® release

This release adds the following new features:

- [Added copy button to card title](https://github.com/wekan/wekan/pull/4291).
  Thanks to mfilser.

and fixes the following bugs:

- [Fix Card, List and Comment colors not visible at some themes](https://github.com/wekan/wekan/commit/218ddf03bc109b954d1fe741d1aa533467b51a4d).
  Thanks to Meeques, Go-rom and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.93 2022-01-14 WeKan ® release

This release tries to fix the following bugs:

- Try to fix Sandstorm WeKan package. This did not fix it. Do not try broken experimental Sandstorm WeKan versions yet.
  [Part 1](https://github.com/wekan/wekan/commit/bff43c3f9252e3133acedb9ccf4fb4f91d1c908d),
  [Part 2](https://github.com/wekan/wekan/commit/f75ab964be784bf7f6accb3ab0085f623196d811).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.92 2022-01-13 WeKan ® release

This release adds the following CRITICAL SECURITY UPDATES:

- [Upgraded markdown-it to 12.3.2](https://github.com/wekan/wekan/commit/724f9d43b47aab3198730801200c0faa53c73e5c).
  Thanks to markdown-it developers.

and adds the following new translations:

- Added translations: Estonian (Estonia) et_EE, Russian (Ukraine) ru_UA, Ukrainian (Ukraine) uk_UA.
  [Part 1](https://github.com/wekan/wekan/commit/ac85e00e0a99574499786ddf97823dcf2802a47f),
  [Part 2](https://github.com/wekan/wekan/commit/30131ffc20173d222cb02b283f38a8c0d6a28ccc).
  Thanks to translators.

and fixes the following bugs:

- [Fixed OpenAPI docs generating has some swagger error](https://github.com/wekan/wekan/commit/99d6f7a765e2945fb17411f5b8545cd7d6010c5f).
  Thanks to bentiss.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.91 2022-01-11 WeKan ® release

This release adds the following CRITICAL SECURITY UPDATES:

- [Updated to Node.js v12.22.9](https://github.com/wekan/wekan/commit/0218f3266bbab2e044f83a06042ca61afab65bdf).
  Thanks to Node.js developers.

and adds the following updates:

- [Added release scripts for starting and stopping services](https://github.com/wekan/wekan/commit/33f47414bbecdc3bca10e807c38562e833997db4).
  Thanks to xet7.
- Updated rebuild-wekan.sh script about installing dependencies.
  [Part1](https://github.com/wekan/wekan/commit/9979193df5b896efb1a8c0ac9c244972fa08aae1),
  [Part2](https://github.com/wekan/wekan/commit/6f7292db5e8427fb63305e1e0e41d2337d8d9a60).
  Thanks to xet7.
- In install scripts, use Volta Node and NPM install manager, made with Rust https://volta.sh .
  Volta uses home directory also with "npm -g install", no sudo needed.
  xet7 found info about Volta from Miniflare docs.
  [Part 1](https://github.com/wekan/wekan/commit/2efa42b8537b8a404a0f82d78c5299f098130183),
  [Part 2](https://github.com/wekan/wekan/commit/ef685703cf8180c3fedef381d3c10aaf405ee8b4).
  Thanks to Volta developers.
- [Updated dependencies](https://github.com/wekan/wekan/commit/75fdc53746710206482b66513b02216dab5a4ad6).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix user mentions](https://github.com/wekan/wekan/pull/4273).
  Thanks to Ben0it-T.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.90 2021-12-26 WeKan ® release

This release fixes the following bugs:

- [Fix Create Board from Template not opening](https://github.com/wekan/wekan/commit/95ed3a0ab56a52a04c13856cf9d1d845659ea1b7).
  Thanks to Ben0it-T and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.89 2021-12-26 WeKan ® release

This release adds the following new features:

- [Edit team/org now update users.teams.teamDisplayName / users.orgs.orgDisplayName](https://github.com/wekan/wekan/pull/4257).
  Thanks to Ben0it-T.
- [Trello api.py: Added for using newest Trello API, to show Trello boards/cards/actions/reactions JSON and download Trello attachments
  as binary files from S3](https://github.com/wekan/wekan/commit/aff6e361f03f1a7e269edc184884313557c94362).
  Thanks to xet7.
- [Trello api.py: Added additional TODO notes](https://github.com/wekan/wekan/commit/f2c31f877c5a22af4429688fe2620919858ca69f).
  Thanks to xet7.
- [Added Info about Shared Templates In Progress](https://github.com/wekan/wekan/issues/3313#issuecomment-1001187003).
  Thanks to xet7.

and fixes the following bugs:

- [Fix getLabels exception in template helper](https://github.com/wekan/wekan/pull/4262).
  Thanks to Ben0it-T.
- [Fixed Templates are Missing, Error: Site not Found "/templates" is missing in the URL.
  Shared Templates part 5: Make visible Create template board checkbox and templates at All Boards page, In Progress](https://github.com/wekan/wekan/commit/7f32de3bec151df9e656013e8e910eb650b8ce80).
  Thanks to xet7.
- [Fixed Duplicate board](https://github.com/wekan/wekan/commit/67687110bb715028dd646d5879c109a095e584d5).
  Thanks to Ben0it-T and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.88 2021-12-22 WeKan ® release

This release adds to following CRITICAL SECURITY FIXES:

- [User now should only see archived cards belonging to boards to which he has permission](https://github.com/wekan/wekan/pull/4252).
  Thanks to jrsupplee.
- [Fix `Boards.userBoards()` method to take into account organizations and teams of the user when determining which boards are accessible](https://github.com/wekan/wekan/pull/4252).
  Thanks to jrsupplee.

and adds the following new features:

- [New `debug` search operator that should help debugging future problems with search](https://github.com/wekan/wekan/pull/4252).
  Thanks to jrsupplee.
- [New `org` and `team` search operators for finding cards belonging to boards with the given organization or team](https://github.com/wekan/wekan/pull/4252).
  Thanks to jrsupplee.
- [New admin report to list boards](https://github.com/wekan/wekan/pull/4252).
  Thanks to jrsupplee.

and adds the following accessibility improvements:

- Made WeKan zoomable by recommendation of Axe browser extension
  https://github.com/wekan/wekan/issues/459#issuecomment-999098233 by changing meta viewport settings at
  https://github.com/wekan/wekan/blob/main/client/components/main/layouts.jade#L3 ,
  in some commit of this WeKan v5.88.
  Thanks to xet7.

and fixes the following bugs:

- Fixed Mermaid Diagram error: Maximum call stack size exceeded.
  [Part 1](https://github.com/wekan/wekan/commit/23a403644c7db44392d4b0498ee0fc85c504d974),
  [Part 2](https://github.com/wekan/wekan/commit/998d2f5b445b6bf2bc6cd16beac7231a0cf94fc3),
  [Part 3](https://github.com/wekan/wekan/commit/443b40cff3cf507887c20639224ac1447acfaf88).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.87 2021-12-19 WeKan ® release

This release adds the following updates:

- [Changed Docker base image to ubuntu:rolling](https://github.com/wekan/wekan/commit/8446640060e6e5058d0d186d71831a32a9e606e3).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.86 2021-12-19 WeKan ® release

This release fixes the following bugs:

- [Fix: BoardAdmin can't edit or delete others comments on cards](https://github.com/wekan/wekan/pull/4248).
  Thanks to Ben0it-T.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.85 2021-12-17 WeKan ® release

This release adds the following updates:

- [Updated to Node.js v12.22.8](https://github.com/wekan/wekan/commit/5ad9ee1de6446e3b2f3e4a5df207d12de76e1b95).
  Thanks to Node.js developers.

and fixes the following bugs:

- [Fix mobile card details for Modern Dark theme](https://github.com/wekan/wekan/pull/4240).
  Thanks to jghaanstra.
- [Fixed undefinded added member to board](https://github.com/wekan/wekan/pull/4245).
  Thanks to Emile840.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.84 2021-12-15 WeKan ® release

This release adds the following new features:

- [Kubernetes 1.22 support and basic helm test](https://github.com/wekan/wekan/pull/4208).
  Thanks to varac.
- [Added Helm Chart usage docs](https://github.com/wekan/wekan/pull/4224).
  Thanks to varac.
- [Add full name if exists in `email-invite-subject` for user to invite](https://github.com/wekan/wekan/pull/4226).
  Thanks to Emile840.
- [Sort Organizations, Teams and People](https://github.com/wekan/wekan/pull/4232).
  Thanks to Emile840.

and fixes the following bugs:

- [List title doesn't overlap with hamburger menu anymore](https://github.com/wekan/wekan/pull/4203).
  Thanks to mfilser.
- [Fix legal notice traduction bug when refreshing sign in page](https://github.com/wekan/wekan/pull/4217).
  Thanks to Emile840.
- [Fix: Clicking to view Lists or Swimlanes Archive adds temporarily many empty Lists to board](https://github.com/wekan/wekan/pull/4221).
  Thanks to Ben0it-T.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.83 2021-11-30 WeKan ® release

This release adds to following new improvements:

- [Changed delete checklist dialog to a popup](https://github.com/wekan/wekan/pull/4200).
  Thanks to mfilser.
- [Dragging minicards scrolls now vertically at the end of the screen](https://github.com/wekan/wekan/pull/4201).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.82 2021-11-29 WeKan ® release

This release removes the following new features:

- [Revert change from WeKan v5.81: At Sandstorm, every WeKan user is now WeKan Admin and has Admin Panel](https://github.com/wekan/wekan/commit/ebc7741fcb9ad854234921ed0546255411adeec9).
  Thanks to ocdtrekkie and xet7.

and adds the following new features:

- [List header contains now a button to add the card to the bottom of the list](https://github.com/wekan/wekan/pull/4195).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.81 2021-11-29 WeKan ® release

This release adds the following new features:

- [At Sandstorm, every WeKan user is now WeKan Admin and has WeKan Admin Panel. This could help export, board member permissions, etc](https://github.com/wekan/wekan/commit/23a2e90f5f553c2051978a0b4cd5b0d6d4ee03da).
  Thanks to PizzaProgram and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.80 2021-11-26 WeKan ® release

This release adds the following new features:

- [Show helper at label drag/drop if label popup opened from card details popup](https://github.com/wekan/wekan/pull/4176).
  Thanks to mfilser.
- [Show or hide members and assignee(s) on minicard](https://github.com/wekan/wekan/pull/4179).
  Thanks to Ben0it-T.
- [List adding has now a cancel button](https://github.com/wekan/wekan/pull/4183).
  Thanks to mfilser.
- [CustomFields Currency, autofocus on edit](https://github.com/wekan/wekan/pull/4189).
  Thanks to mfilser.
- [Attachments, show file size in KB in card details](https://github.com/wekan/wekan/pull/4191).
  Thanks to mfilser.
- [Sidebar Member Settings Popup has now a Popup title](https://github.com/wekan/wekan/pull/4190).
  Thanks to mfilser.
- [Add copy text button to most textarea fields](https://github.com/wekan/wekan/pull/4185).
  Thanks to mfilser.
- Copy text button at most textarea fields is now translatable.
  [Part 1](https://github.com/wekan/wekan/commit/5088c122536e13b44cf2fdbcfabeefd00cee332e),
  [Part 2](https://github.com/wekan/wekan/commit/96465ac664c526d8749dcad158704b512317e256).
  Thanks to xet7.

and adds the following updates:

- [Docker build script to be executeable](https://github.com/wekan/wekan/commit/8054f2b0025c4cb3f6a3ddf71754ae7c707d6ac0).
  Thanks to xet7.
- [Drag drop jquery-ui update + screen and list scroll](https://github.com/wekan/wekan/pull/4181).
  Thanks to mfilser.
- [Settings, add some space between radio buttons](https://github.com/wekan/wekan/pull/4186).
  Thanks to mfilser.

and fixes the following bugs:

- [Default Top Left Corner Logo Image display few seconds before a display of custom Top Left Corner Logo Image](https://github.com/wekan/wekan/issues/4173).
  Thanks to Emile840.
- [App reconnect link wasn't clickable](https://github.com/wekan/wekan/pull/4180).
  Thanks to mfilser.
- [Copy card URL works now again](https://github.com/wekan/wekan/pull/4184).
  Thanks to mfilser.
- [Fix: On mobile infinite scrolling didn't work](https://github.com/wekan/wekan/pull/4187).
  Thanks to mfilser.
- [Custom Field StringTemplates didn't save the last input value on touch devices](https://github.com/wekan/wekan/pull/4188).
  Thanks to mfilser.
- [Move cards to top/bottom ignores the current filter if active](https://github.com/wekan/wekan/pull/4192).
  Thanks to mfilser.
- [Moving many cards with multi selection drag/drop to another list keeps the card order](https://github.com/wekan/wekan/pull/4193).
  Thanks to mfilser.
- [Sidebar multi selection actions keep now the card sorting (cards moving, cards to archive etc)](https://github.com/wekan/wekan/pull/4194).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.79 2021-11-25 WeKan ® release

This release fixes the following bugs:

- [Fix label width oversize bug](https://github.com/wekan/wekan/pull/4157).
  Thanks to mfilser.
- [Fixed label popup at desktop view (add and remove labels)](https://github.com/wekan/wekan/pull/4170).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.78 2021-11-17 WeKan ® release

This release fixes the following bugs:

- [Fix: Sandstorm WeKan Admin Panel version info broken](https://github.com/wekan/wekan/commit/02b6df320fc98e18e5a97105a35196bdffec98bb).
  Thanks to ocdtrekkie and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.77 2021-11-16 WeKan ® release

This release adds the following updates:

- [Updated Docker Ubuntu base image](https://github.com/wekan/wekan/commit/b1b12b05b571f4eebd38e7486dea28dfd97a885d).
  Thanks to Ubuntu developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.76 2021-11-16 WeKan ® release

This release adds the following new features:

- [Global search load card details](https://github.com/wekan/wekan/pull/4142).
  Thanks to mfilser.
- [Layout improvement: Adding organisations to the board](https://github.com/wekan/wekan/pull/4143).
  Thanks to Ben0it-T.
- [App reconnect is now possible if the connection was interrupted](https://github.com/wekan/wekan/pull/4147).
  Thanks to mfilser.
- [Boards view has now drag handles at desktop view if drag handles are enabled](https://github.com/wekan/wekan/pull/4149).
  Thanks to mfilser.
- [Account configuration of option loginExpirationInDays is now possible](https://github.com/wekan/wekan/pull/4150).
  Thanks to mfilser.
- [Part 2: Added remaining of Account configuration of option loginExpirationInDays for Snap](https://github.com/wekan/wekan/commit/17d90684bb59fd4159f80b2da224638824151c6f).
  Thanks to xet7.
- [Improve multi selection sidebar opening and closing](https://github.com/wekan/wekan/pull/4153).
  Thanks to marook.

and adds the following updates:

- [Added release scripts for building local Docker images and pushing them to Quay.io and Docker Hub](https://github.com/wekan/wekan/commit/49c4dd8b14d9c13a9ae2aa18b37238a05ed41f92).
  Thanks to xet7.

and fixes the following bugs:

- [Fixed trim whitespace at multiline editor fields](https://github.com/wekan/wekan/pull/4146).
  Thanks to mfilser.
- [Fixed placeholder was not visible at list view (mobile view)](https://github.com/wekan/wekan/pull/4148).
  Thanks to mfilser.
- [Fix list adding to bottom](https://github.com/wekan/wekan/pull/4152).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.75 2021-11-12 WeKan ® release

This release adds the following new features:

- [Card popup close color remove move bottom delete](https://github.com/wekan/wekan/pull/4138).
  Thanks to mfilser.
- [Comment edit has now a cancel button](https://github.com/wekan/wekan/pull/4139).
  Thanks to mfilser.
- [Checklist and items drag drop scrollable mobile view](https://github.com/wekan/wekan/pull/4140).
  Thanks to mfilser.

and adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/936d9fe30697e4651cba04d505393e05f8c902c1).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.74 2021-11-11 WeKan ® release

This release fixes the following bugs:

- [Docker fix failed export and timezone](https://github.com/wekan/wekan/pull/4137).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.73 2021-11-11 WeKan ® release

This release adds the following new features:

- [Added NodeJS Statistics to Admin Panel/Versio](https://github.com/wekan/wekan/pull/4118).
  Thanks to Ben0it-T.
- [Card detail popup loads now comments if opened from board search](https://github.com/wekan/wekan/pull/4128).
  Thanks to mfilser.

and adds the following updates:

- Updated dependencies
  [Part 1](https://github.com/wekan/wekan/commit/cf6713a31c9f6ce9d30832ee6bf6c95d35d7044b),
  [Part 2](https://github.com/wekan/wekan/commit/ac7ef4d4cd7179a140f0c56c7c7d1ffc33e75fbe).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Card Details, add missing hr line before Activity title](https://github.com/wekan/wekan/pull/4117).
  Thanks to Ben0it-T.
- [Sidebar search only opens the card as popup on mobile view](https://github.com/wekan/wekan/pull/4122).
  Thanks to mfilser.
- [Fixed a bug related to the default text of the OIDC button](https://github.com/wekan/wekan/pull/4132).
  Thanks to Emile840.
- [Fix: Impossible to export board to excel where title exceeding 31 chars](https://github.com/wekan/wekan/pull/4135).
  Thanks to Ben0it-T.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.72 2021-10-31 WeKan ® release

This release adds the following new features:

- [Add a possibility for non-admin users (who have an email on a given domain name in Admin Panel) to invite new users for registration](https://github.com/wekan/wekan/pull/4107).
  Thanks to Emile840.

and fixes the following bugs:

- [Try to fix: Filter List by Title - Hide empty lists in Swimlane view](https://github.com/wekan/wekan/pull/4108).
  Thanks to Ben0it-T.
- [Card labels on minicard withouth text are now at the same line again](https://github.com/wekan/wekan/pull/4109).
  Thanks to mfilser.
- [Rename "Domaine" to "Domain" that is more like English](https://github.com/wekan/wekan/commit/c136033c1fb25688d310b1b62841003f3901641a).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.71 2021-10-29 WeKan ® release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/df2a2aae1d44ba22563cc28bc8d9baac71b2ced7).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix: Filter List by Card Title](https://github.com/wekan/wekan/pull/4105).
  Thanks to Ben0it-T.
- Add info about upgrades to GitHub issue template.
  [Part 1](https://github.com/wekan/wekan/commit/46a5eec7d21b66eb1aacac4fec84a0d0a0f4d16b),
  [Part 2](https://github.com/wekan/wekan/commit/7cc35970a849c19d35b89cf0a5fb91216a66fcb3).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.70 2021-10-28 WeKan ® release

This release fixes the following bugs:

- [Fix bug related to Admin Panel teams management](https://github.com/wekan/wekan/pull/4103).
  Thanks to Emile840.
- Docker: Try to fix "Failed export and unexpected container restart". Added timezone and localtime.
  [Part 1](https://github.com/wekan/wekan/commit/ec33d0b34f3abe5634be0b87f03314c738c771d1),
  [Part 2](https://github.com/wekan/wekan/commit/e3292dd5627f95d59d130a8c1b9a62df317ae6bd).
  Thanks to akitzing, mfilser and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.69 2021-10-28 WeKan ® release

This release adds the following updates:

- [Updated Docker base image to Ubuntu 21.10 Impish](https://github.com/wekan/wekan/commit/5411113544f040cab2df86234745e4846029660f).
  Thanks to Ubuntu developers.

and fixes the following bugs:

- [Fix Docs: Only MAIL_URL and MAIL_FROM for email settings. Not Admin Panel anymore](https://github.com/wekan/wekan/commit/d9adce7b676b705da786eb44cd2c2c4dba120d30).
  Thanks to niklasdahlheimer.
- [Popup fixes: Archive cards, upload attachements etc](https://github.com/wekan/wekan/pull/4101).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.68 2021-10-27 WeKan ® release

This release adds the following new features:

- [Labels are now drag/drop/sortable](https://github.com/wekan/wekan/pull/4084).
  Thanks to mfilser.

and fixes the following bugs:

- [Fix labels desktop view add and delete](https://github.com/wekan/wekan/pull/4087).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.67 2021-10-27 WeKan ® release

This release fixes the following bugs:

- [Fix typo](https://github.com/wekan/wekan/commit/cb9b8d4f2b8e24475a2aafd6f9653f28f305eefb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.66 2021-10-27 WeKan ® release

This release adds the following new features:

- [api.py: List All Public Boards](https://github.com/wekan/wekan/commit/eac102dbbf302ccc121bbf1e4e8faf115e1f9da8).
  Thanks to xet7.
- [api.py: List Custom Fields of Board](https://github.com/wekan/wekan/commit/bcf35731316c327090a8513a4c4094e32e301e3f).
  Thanks to xet7.
- [api.py: Info of one Custom Field](https://github.com/wekan/wekan/commit/5c571ca8638c29e558f3a196daf5458274eb715e).
  Thanks to xet7.
- [api.py: Add Custom Fields to Board. Does not work yet, error: Settings must be object](https://github.com/wekan/wekan/commit/3921209c9fbf1d908f2ef3e97dade5863a000309).
  Thanks to xet7.
- [Add full name if exists in email-invite-subject or when tagging someone with `@` while commenting a card](https://github.com/wekan/wekan/pull/4057).
  Thanks to Emile840.
- [Popup sorting number](https://github.com/wekan/wekan/pull/4060).
  Thanks to mfilser.
- [At mobile view the card details are opened as Popup](https://github.com/wekan/wekan/pull/4062).
  Thanks to mfilser.
- [Add card button has now a cancel button](https://github.com/wekan/wekan/pull/4067).
  Thanks to mfilser.
- [Global search checklistitems and custom fields boolean](https://github.com/wekan/wekan/pull/4074).
  Thanks to mfilser.
- [Board View, sort cards button also in mobile view](https://github.com/wekan/wekan/pull/4076).
  Thanks to mfilser.
- [Minicard label popup](https://github.com/wekan/wekan/pull/4079).
  Thanks to mfilser.
- [Re-enables custom schemes auto linking](https://github.com/wekan/wekan/commit/f67a174c4a7706a2d419ba3dd43d696104f90696).
  Thanks to chrisi51.
- [Board search remove limit](https://github.com/wekan/wekan/pull/4082).
  Thanks to mfilser.
- [Add a possibility of selecting displayed users in Admin Panel](https://github.com/wekan/wekan/pull/4083).
  Thanks to Emile840.

and adds the following updates:

- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/f14e710ac0d5381ec092c9f383b9b68f446cab4d),
  [Part 2](https://github.com/wekan/wekan/commit/156c0b5d4d91dae2ee9b12ed8c312dc19a3c3075).
  Thanks to developers of dependencies.
- [Added npm publish script for releases](https://github.com/wekan/wekan/commit/2666b30ba911da8502153be5827f277b81354f8b).
  Thanks to xet7.

and fixes the following bugs:

- [Fix infinite loading of public boards](https://github.com/wekan/wekan/pull/4053).
  Thanks to mfilser.
- [Fix: Setting overtime not working](https://github.com/wekan/wekan/pull/4056).
  Thanks to Ben0it-T.
- [Fix main scrollbar](https://github.com/wekan/wekan/pull/4063).
  Thanks to mfilser.
- [Try to fix orphanedAttachments](https://github.com/wekan/wekan/commit/6a06522777a0bfa2f758e96c2d25e1237a7b43dc).
  Thanks to Madko and xet7.
- [Fix markdown header quick access](https://github.com/wekan/wekan/pull/4065).
  Thanks to mfilser.
- [Fix Filter List by Card Title](https://github.com/wekan/wekan/pull/4066).
  Thanks to Ben0it-T.
- [Fix long textarea editing](https://github.com/wekan/wekan/pull/4068).
  Thanks to mfilser.
- [Boards weren't loaded because of missing filter](https://github.com/wekan/wekan/pull/4069).
  Thanks to mfilser.
- [Fix Card details Custom Fields popup empty hr sections and plus icon](https://github.com/wekan/wekan/pull/4070).
  Thanks to mfilser.
- [Card popup search and global search improvements](https://github.com/wekan/wekan/pull/4071).
  Thanks to mfilser.
- [Comment out showing Search All Boards logs in console](https://github.com/wekan/wekan/commit/a62a177fb1cdf8b823b5c32380a81e803e0049e7).
  Thanks to mfilser and xet7.
- [Long labels on card and minicard are wrapped if too long](https://github.com/wekan/wekan/pull/4073).
  Thanks to mfilser.
- [Card dates, if deleted rules didn't apply on "unset date fields"](https://github.com/wekan/wekan/pull/4075).
  Thanks to mfilser.
- [Comment, added confirm delete popup](https://github.com/wekan/wekan/pull/4077).
  Thanks to mfilser.
- [Fix: Filter List by Card Title](https://github.com/wekan/wekan/pull/4078).
  Thanks to Ben0it-T.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.65 2021-10-12 WeKan ® release

This release adds to following CRITICAL SECURITY UPDATES:

- [Updated to Node.js v12.22.7](https://github.com/wekan/wekan/commit/64fc2e5d8fe50115175d44c01f7fca4e668c7231).
  Thanks to Node.js developers.

and fixes the following bugs:

- [Excel Export: Export only comments for cards that are not linked](https://github.com/wekan/wekan/pull/4047).
  Thanks to Ben0it-T.
- [If OIDC button text was customized, the default text will be added if a user click on `Sign In`](https://github.com/wekan/wekan/pull/4052).
  Thanks to Emile840.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.64 2021-10-09 WeKan ® release

This release adds the following new features:

- [Excel Export : add board description, add comments worksheet](https://github.com/wekan/wekan/pull/4045).
  Thanks to Ben0it-T.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.63 2021-10-07 Wekan release

This release adds the following new features:

- [Allow setting custom kubernetes labels when using the helm chart](https://github.com/wekan/wekan/pull/4031).
  Thanks to ariep.

and fixes the following bugs:

- [Fixed SMTP by reverting MAIL_SERVICE changes](https://github.com/wekan/wekan/commit/9c99c5c3ae8d291df5305b3b6cd1825fc5cc2c21).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.62 2021-10-04 Wekan release

This release adds the following new features:

- [Allow word match for rules -> title filter](https://github.com/wekan/wekan/pull/4025).
  Thanks to ilvar.
- [CSV/TSV/Excel Export translatable and fixed, CSV semicolon option added](https://github.com/wekan/wekan/pull/4028).
  Thanks to Ben0it-T.
- Added week numbers to dates at card, minicard, Custom Field dates, DatePicker and Calendar.
  [Part 1](https://github.com/wekan/wekan/commit/d06ac09485dafb0256ae7fbe613ab2dbe00b70f3),
  [Part 2](https://github.com/wekan/wekan/commit/9e6744d1e33b37e0d23eea5869ccac3ff37f7d53).
  Thanks to xet7.
- [Confirm Archive Card](https://github.com/wekan/wekan/commit/6c3fcdcc4c446fd4c8dc4dca1b2846f6e3ea72e4).
  Thanks to xet7.

and fixes the following bugs:

- [Clean up /tmp after Docker build. This drastically reduces docker image size from ~280 MB to ~180 MB](https://github.com/wekan/wekan/pull/4026).
  Thanks to ilvar.
- [Removed extra quotes from Export menu](https://github.com/wekan/wekan/commit/553652556468ac88c0691d4d688d5a922ef6a0c2).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.61 2021-09-25 Wekan release

This release adds the following new features:

- [Search by name or username or emails address when adding a new user to a board](https://github.com/wekan/wekan/pull/4018).
  Thanks to Emile840.

and fixes the following bugs:

- [Fixed REST API, it shoud work now by Admin user](https://github.com/wekan/wekan/commit/e3a0dea85fa1f8e2f580f419b30cf5f36775d731).
  Reverted [Allow board members to use more of API of Wekan v5.35](https://github.com/wekan/wekan/commit/a719e8fda1f78bcbf9af6e7b4341f8be1d141e90).
  Thanks to tomhughes and xet7.
- [Wekan Gantt GPL: Fix Tasks not displayed in Gantt screen](https://github.com/wekan/wekan-gantt-gpl/commit/72d464f5eb55501f08eb0cfd31fd5340380d7f3b).
  Thanks to MrLovegreen and khjde1207.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.60 2021-09-22 Wekan release

This release adds the following new features:

- [Toggle opened card Custom Fields layout between Grid and one per row](https://github.com/wekan/wekan/commit/fc2fb9a081021663cc822bf2a687fda74cd0afa6).
  Thanks to xet7.

and adds the following updates:

- [Updated Docker base image to newer Ubuntu](https://github.com/wekan/wekan/commit/442e6bf983ada47c26a15dbc1982c554118fa84d).
  Thanks to xet7.
- [Try to add Docker image to GitHub Docker Image Registry](https://github.com/wekan/wekan/commit/70ba1eca787671879215726c16335a84e2b636c9).
  Thanks to xet7.
- [Update build scripts to install npm from NodeSource, and meteor with npm](https://github.com/wekan/wekan/commit/c062621dd5486b60bdd200a9279a38b98fc0d410).
  Thanks to Meteor developers.

and fixes the following bugs:

- [Try to fix Bug: Card number equal to #0 when creating a sub-task from a card](https://github.com/wekan/wekan/commit/4c659da5334641f558e77285f7ca47e562f7c853).
  Thanks to marcungeschikts, olivierlambert and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.59 2021-09-17 Wekan release

This release adds the following new features:

- [Admin Panel/People: Possibility of adding a team to all selected users](https://github.com/wekan/wekan/pull/3996).
  Thanks to Emile840.
- [Add / remove team members as board members when adding / removing team from board](https://github.com/wekan/wekan/pull/4000).
  Thanks to Emile840.
- [Added more translations to: Admin Panel/People: Possibility of adding a team to all selected users](https://github.com/wekan/wekan/commit/3d9b7eb7ab41c6450b473f6f349d894f516c5487).
  Thanks to xet7.
- [Enter new password 2 times when registering](https://github.com/wekan/wekan/commit/0da84f8f3eb91c5bf726e058f5ec74a7891d734b).
  Thanks to sh2515 and xet7.
- Sum of cards. In Progress, not ready yet.
  [Part 1: Add Custom Field options for field sum](https://github.com/wekan/wekan/commit/8626b466b830adf6c671211bbd61b53b96ac5a49).
  [Part 2: Show option for custom field sum only for currency and number custom fields](https://github.com/wekan/wekan/commit/9bee6ae6663a5e1c974de2811f6a5fdd2d66efe5).
  Thanks to xet7.
- [Admin Panel/Settings/Layout: Customize OIDC button text](https://github.com/wekan/wekan/pull/4011).
  Thanks to Emile840.
- [At card attachments, show play and fullscreen controls for video webm/mp4/ogg, and play controls for audio mp3/ogg](https://github.com/wekan/wekan/commit/bd9fbedbf9fbe0181913876b930b335261cd2a0a).
  Thanks to luistiktok and xet7.

and fixes the following bugs:

- [Links to devel branch are broken; use master instead](https://github.com/wekan/wekan/pull/3993).
  Thanks to garrison.
- [Fix first user creation for via OIDC](https://github.com/wekan/wekan/pull/3994).
  Thanks to ww-daniel-mora.
- [When list has just one card, to show 'card' instead of 'cards'](https://github.com/wekan/wekan/pull/3999).
  Thanks to helioguardabaxo.
- [Fix: Linked card cannot change date](https://github.com/wekan/wekan/pull/4002).
  Thanks to Ben0it-T.
- [Try to fix: Can't delete attachment](https://github.com/wekan/wekan/commit/889ec1339a025a68ec919f059b9d58e8d94a3376).
  Thanks to luistiktok and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.58 2021-09-01 Wekan release

This release fixes the following bugs:

- [1) Edit profile and modify password menus are not displayed if SSO authentication is used.
  2) Board filtering will be displayed only if user belongs to atleast one team or
  organization](https://github.com/wekan/wekan/pull/3983).
  Thanks to Emile840.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.57 2021-08-31 Wekan release

This release adds the following updates:

- [Updated build scripts](https://github.com/wekan/wekan/commit/52fafe997659e933e403acb0ee0cffc99f74e35f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.56 2021-08-31 Wekan release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/858967f4200783cadaa62d0e3436f661c772ede7).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.55 2021-08-31 Wekan release

This release adds to following CRITICAL SECURITY UPDATES:

- [Updated to Node.js v12.22.6](https://github.com/wekan/wekan/commit/48636892489dd01c6f6b930bafb94651c00859d8).
  Thanks to Node.js developers.

and fixes the following bugs:

- [Fixed bugs](https://github.com/wekan/wekan/pull/3981):
  1) Public Boards page shows only "Add Board" button, not any Public Boards.
  2) When at Admin Panel / Boards visibility / Private only, public board still accessible publicly by it's
  public board URL.
  Thanks to Emile840.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.54 2021-08-28 Wekan release

This release adds the following new features:

- [Admin panel: Added a parameter to display or not the visibility of a board in private mode only](https://github.com/wekan/wekan/pull/3976).
  Thanks to Emile840.

and fixes the following bugs:

- [Fix: Incorrect card numbers for sub tasks](https://github.com/wekan/wekan/pull/3977).
  Thanks to syndimann.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.53 2021-08-27 Wekan release

This release fixes the following bugs:

- [Try to fix MAIL_FROM](https://github.com/wekan/wekan/commit/787df044190915c46e22159f3c40fb611846dc07).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.52 2021-08-26 Wekan release

This release adds the following new features:

- Added MAIL_SERVICE settings for Well Known Email Services
  [Part 1](https://github.com/wekan/wekan/commit/ab8e56e16a02ef0afb7b4023a43b4adf2558a8ff),
  [Part 2](https://github.com/wekan/wekan/commit/1fadf204c2d5fa96ea41b9cb39f003cc05e2fe46).
  https://github.com/wekan/wekan/wiki/Troubleshooting-Mail . Please test.
  Thanks to xet7.
- [All Boards page: Possibility of filtering board by team or organization](https://github.com/wekan/wekan/pull/3964).
  Thanks to Emile840.
- [Fixed translation of "Clear Filter" for "All boards page: Possibility of filtering board by team or organization"](https://github.com/wekan/wekan/commit/b36a7621e0feca5c22fc4a24eceba1a9fc584ab0).
  Thanks to xet7.

and adds the following new translations:

- [Added Chinese (Simplified) (zh-Hans or zh-CN)](https://github.com/wekan/wekan/commit/f2c242f49e18e2197f1f90c9b2dac5934a08325d).
  Thanks to translators.

and fixes the following bugs:

- [Initials not required for new user that is created at Admin Panel](https://github.com/wekan/wekan/commit/9c7c481f48cb66406715f7571439f9d7fa332b87).
  Thanks to xet7.
- [Delete user is now possible at Admin Panel](https://github.com/wekan/wekan/commit/7808fdd22f04cc482b7df21187aaf3e9623f19e6).
  But you should remove user first from all boards, because otherwise there could be
  bug of empty avatars at boards, that need to be removed manually from database.
  Thanks to xet7.
- [Fixed Save button not clickable in maximized card view](https://github.com/wekan/wekan/commit/a59932af00c066871102970d252b78d262d06fa0).
  Thanks to hatl, urmel1960 and syndimann.
- [Fixed New wide card edit view is all jumbled on mobile](https://github.com/wekan/wekan/commit/241eb9df0fb446b3775704848281b0cc032c4921).
  Thanks to jdaviescoates and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.51 2021-08-17 Wekan release

This release fixes the following bugs:

- [Fixed exception in global search](https://github.com/wekan/wekan/pull/3949).
  Thanks to syndimann.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.50 2021-08-15 Wekan release

This release fixes the following bugs:

- [Fix: Save user initials and fullname when a new user is created](https://github.com/wekan/wekan/pull/3946).
  Thanks to syndimann.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.49 2021-08-14 Wekan release

This release adds the following new features:

- [Text "Search" now translatable at Card Add Member/Assignee](https://github.com/wekan/wekan/commit/9ce65c601a875a4259fb69fdda45124b8412ae6f).
  Thanks to xet7.
- [Add Card Comment Reactions](https://github.com/wekan/wekan/pull/3945).
  Thanks to syndimann.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.48 2021-08-11 Wekan release

This release adds the following CRITICAL SECURITY UPDATES:

- [Updated to Node.js v12.22.5](https://github.com/wekan/wekan/commit/91cad7b49e25cecdf417321dadcdd9ea5cd8b020).
  Thanks to Node.js developers.
- Also jszip update in some of included update commits.

and adds the following new features:

- [Searchfields for members and assignees card popups](https://github.com/wekan/wekan/pull/3942).
  Thanks to syndimann.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/b3cc01b04167bd67dde02c6c899baf8917ae09c1).
  Thanks to developers of dependencies.

and adds the following new translations:

- [French (Switzerland) (fr_CH)](https://github.com/wekan/wekan/commit/23c70ac252494b464cd2a268d7e680370775ddc4).
  Thanks to translators.

and fixes the following bugs:

- [Fixed: Can't save user without Initials](https://github.com/wekan/wekan/commit/9a03654062f9c8ac7aac257f11b386a054cd39e7).
  Thanks to devagleo and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.47 2021-08-05 Wekan release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/68d9de89466611521db7d942dcf8daf58ba15a3e).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.46 2021-08-05 Wekan release

This release adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/d5c0a5d377d31bedadf3730756406355a17a563a).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.45 2021-08-05 Wekan release

This release adds the following new features:

- [Special handles to notify board or card members in a comment](https://github.com/wekan/wekan/pull/3937).
  Thanks to syndimann.

and fixes the following bugs:

- [Fix: Show missing user mentions popover when posting comments in maximized card layout](https://github.com/wekan/wekan/pull/3939).
  Thanks to syndimann.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.44 2021-08-03 Wekan release

This release adds the following updates:

- [Wekan v5.43](https://github.com/wekan/wekan/commit/4e17d5a10f95fcea420c794ed8b30ea18dc2a725) and v5.44 for helm.
  Thanks to xet7.

and fixes the following bugs:

- [Fix: Consecutive Card numbering when a card is moved to another board or copied](https://github.com/wekan/wekan/pull/3936).
  Thanks to syndimann.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.43 2021-08-03 Wekan release

This release adds the following new features:

- [Consecutive boardwise card numbering](https://github.com/wekan/wekan/pull/3935).
  Thanks to syndimann.

and adds the following updates:

- [Update Helm Chart apiVersion, pin image version](https://github.com/wekan/wekan/pulls/3933).
  This makes this Chart compatible with [flux](https://fluxcd.io)
  [helm-controller](https://fluxcd.io/docs/components/helm), which requires v2 charts.
  Thanks to varac.
- [Wekan v5.42 for helm](https://github.com/wekan/wekan/commit/7a1f42fa4e153ff4a0fb481ca5a363ac62033b7f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.42 2021-08-01 Wekan release

This release adds the following CRITICAL SECURITY UPDATES:

- [Updated to Node.js v12.22.4](https://github.com/wekan/wekan/commit/b13f6913896f787e1cae485381d98345d9f8b830).
  Thanks to Node.js developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.41 2021-07-26 Wekan release

This release fixes the following bugs:

- [Fixed Wekan JSON import fails](https://github.com/wekan/wekan/commit/0fa8fc8b506831a60649d100ce93c96f8f7b76f5).
  Thanks to BartoszBroda and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.40 2021-07-25 Wekan release

This release fixes the following bugs:

- [Fixed Delete of Planning Poker doesn't work](https://github.com/wekan/wekan/commit/18b6381d790848062752b211d48c84a2de268bd0).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.39 2021-07-24 Wekan release

This release adds the following new features:

- [LDAP AD Simple Auth](https://github.com/wekan/wekan/pull/3909).
  Thanks to indika-dev.
- [LDAP AD Simple Auth: Added settings for all remaining Wekan Standalone (non-Sandstorm)
  platforms](https://github.com/wekan/wekan/commit/fe40f35d6d9b6293f3bdbf5bc0f3e8e708c59518)
  and Docs to https://github.com/wekan/wekan/wiki/LDAP-AD-Simple-Auth .
  Thanks to xet7.
- [Convert Checklist Item to Card](https://github.com/wekan/wekan/pull/3910).
  Thanks to helioguardabaxo.
- [Organizations and Teams are taken into account when displaying board at
  `All Boards` page](https://github.com/wekan/wekan/pull/3912).
  Thanks to Emile840.

and adds the following new translations:

- [English (Italy)](https://github.com/wekan/wekan/commit/ae73029dda63db361925e378202e6f8c137cf5bd).
  Thanks to translators.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.38 2021-07-18 Wekan release

This release adds the following new features:

- [Added Code View `</>` button when `RICHER_CARD_COMMENT_EDITOR=true` and in desktop view
  where is enough screen space for buttons (not added to mobile
  view)](https://github.com/wekan/wekan/commit/ec01e5182d6b8c848d752540887a8113472b0226).
  Thanks to xet7.

and adds the following updates:

- Updated dependencies
  [Part 1](https://github.com/wekan/wekan/commit/7024929881c05cad472de74c86517cf80c8e240c),
  [Part 2](https://github.com/wekan/wekan/commit/609adcdf100db226c5f310577195afa4b1a4aead).
  Thanks to developers of dependencies.
- [Updated to Node.js v12.22.3](https://github.com/wekan/wekan/commit/d538a01d1962464cf4cb001462669150eeafaa99).
  Thanks to Node.js developers.

and fixes the following bugs:

- [Fixed Line break which is wrongly added in Cards description and Cards
  comments](https://github.com/wekan/wekan/commit/ec01e5182d6b8c848d752540887a8113472b0226).
  Thanks to Emile840 and xet7.
- [Fixed rebuild-wekan.sh](https://github.com/wekan/wekan/commit/1d5dd5e60fec151de6c7dce7ef4e758b562923b9).
  Thanks to xet7.
- [Small fixes for ModernDark theme](https://github.com/wekan/wekan/pull/3902).
  Thanks to jghaanstra.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.37 2021-07-04 Wekan release

This release adds the following CRITICAL SECURITY UPDATES:

- [Updated to Node.js v12.22.2](https://github.com/wekan/wekan/commit/4feffd90e3f466609e09524e0ddccdafa2faef32).
  Thanks to Node.js developers.

and fixes the following bugs:

- [Building OpenAPI docs is broken in Wekan v3.56](https://github.com/wekan/wekan/pull/3889).
  Thanks to bentiss.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.36 2021-06-29 Wekan release

This release adds the following new features:

- [Added some controls and warning messages when user try to delete an organization or team that has
  at least one user belongs to it](https://github.com/wekan/wekan/pull/3865).
  Thanks to Emile840.
- Shared Templates. In Progress.
  [Part 1](https://github.com/wekan/wekan/commit/0a0cec6ef0eb55391608aade897004db430ba10a).
  Template Containers visible at All Boards page, with white border around board icon.
  [Part 2](https://github.com/wekan/wekan/commit/d1d4453120005de61eaf2cbadc6a7b9d80e75fc1).
  Ablity to Add Template Container, checkbox in Create Board popup.
  Do not create Template Container by default, when creating user.
  [Part 3](https://github.com/wekan/wekan/commit/7f17bc9fb03d6f4b43a2cd71ecc372e0f1b0f491).
  Template container titles "Card/List/Board Templates" automatically translated.
  Thanks to xet7.
  [Part 4](https://github.com/wekan/wekan/commit/3b4a44abb1c1c4339c3d1b00dfac1c69ec3684cd).
  Hide this Shared Templates feature while it's not finished yet.
  Added back creating Template Container by default, when creating user.
  Thanks to xet7.
- [Added testsuite](https://github.com/wekan/wekan/pull/3872).
  Thanks to jankapunkt.
- [Delete user at REST API and `Admin Panel/People/People`](https://github.com/wekan/wekan/commit/9e16a405d8ca32a4e1be9cf89f8f978a2985593c).
  There is still bug of leaving empty user avatars to boards: boards members, card members and assignees have
  empty users. So it would be better to delete user from all boards before deleting user.
  Thanks to darren-teo and xet7.

and adds the following improvements:

- [Removed unused exceljs from client bundle](https://github.com/wekan/wekan/pull/3871).
  This decreased Wekan browserside frontend amount of Javascript from 5.4 MB to 4.3 MB.
  Thanks to jankapunkt.
- Added note: With Docker, please don't use latest tag. Only use release tags.
  See https://github.com/wekan/wekan/issues/3874 .
  [Part 1](https://github.com/wekan/wekan/commit/f18a57b059994b8a6a3588a69cf095fe599b3a90),
  [Part 2](https://github.com/wekan/wekan/commit/c4cea9e71b467731fd8290538dd039b7691097af).
  Thanks to xet7.

and fixes the following bugs:

- [Fixed tests, that need to be in tests directory to not get build
  errors](https://github.com/wekan/wekan/commit/56197274b6c4782fa20c7d9b5b9d58255d1f830a).
  Thanks to xet7.
- Try to fix tests.
  [Part 1](https://github.com/wekan/wekan/commit/78555f57a7c2ba0fb3e3986608bcf11509af9a21),
  [Part 2](https://github.com/wekan/wekan/commit/7f648720afa42a2b53bfdee7e709fd891eb33373),
  [Part 3](https://github.com/wekan/wekan/commit/0f34d407a43c8a63d882e69ea64ea17fc4b22c7b).
  Thanks to xet7.
- [Fixed "Search All Boards" instructions are gone](https://github.com/wekan/wekan/commit/30ffcc924663f39406b250d93b14384a2f38ab6a).
  Thanks to ClaudiaK21 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.35 2021-06-14 Wekan release

This release adds the following new features:

- Wait Spinners can now be translated
  [Part 1](https://github.com/wekan/wekan/commit/8703dd42296d531450eb21a3d3adea17558a8500),
  [Part 1](https://github.com/wekan/wekan/commit/7f3f0825573b1f8a7b0388e4bacbb0bd2525e886).
  Added Wait Spinners docs: https://github.com/wekan/wekan/wiki/Wait-Spinners .
  Thanks to xet7.
- Maximize Card.
  [Part 1](https://github.com/wekan/wekan/commit/8c572502436a2eb22bd1eb1e4069c1c9145e2070),
  [Part 2](https://github.com/wekan/wekan/pull/3863).
  Thanks to mfilser and xet7.
- Export Card to PDF. In Progress, does not work yet.
  [Part 1](https://github.com/wekan/wekan/commit/a2f2ce11354a8dbfdd6759e3b65797e4be4cc6ec),
  [Part 2](https://github.com/wekan/wekan/commit/17acf1884850d8d95ae79493289adf18966df652).
  Thanks to xet7.

and removes some not needed files:

- [Reduced Wekan bundle size from 636 MB to 467 MB by deleting all dependencies of lucasantoniassi:accounts-lockout and including
  only required 10 files](https://github.com/wekan/wekan/commit/23e5e1e3bd081699ce39ce5887db7e612616014d).
  Wekan Docker image size changed from 269.6 MB to 165.1 MB.
  Thanks to xet7.

and adds the following improvements:

- [Add border and update label colors for better visibility](https://github.com/wekan/wekan/commit/2e1eb1e224c83f16a384316626d7a4183639d4cd).
  Thanks to xet7.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/f80fcfd7c0a83f4181c7a0b8beb52da9ba1446d3).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Manual sort number 0 accepted](https://github.com/wekan/wekan/pull/3861).
  Thanks to mfilser.
- Allow board members to use more of API. Please add issue (or pull request) if this allows too much.
  [Part 1](https://github.com/wekan/wekan/commit/a719e8fda1f78bcbf9af6e7b4341f8be1d141e90),
  [Part 2](https://github.com/wekan/wekan/commit/164b6e9070199dca36d12fa3048d6b22bf6850b0).
  Thanks to JayVii and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.34 2021-06-11 Wekan release

This release adds the following new features:

- [View and change card sort number](https://github.com/wekan/wekan/pull/3857).
  Thanks to mfilser.
- [More spinners + configureable in admin panel](https://github.com/wekan/wekan/pull/3858).
  Thanks to mfilser.
- [Added remaining spinner settings](https://github.com/wekan/wekan/commit/488b765f95ad67b19630cd125543836c04eaa24f).
  Thanks to xet7.

and adds the following new improvements:

- [Card Description has now the same color on view and editing](https://github.com/wekan/wekan/pull/3851).
  Thanks to mfilser.
- [Development in docker container](https://github.com/wekan/wekan/pull/3852).
  Thanks to mfilser.

and fixes the following bugs:

- [Fix Google SSO to access Wekan has not been working by reverting Wekan v5.31 not-working fixes
  to OAUTH2_LOGIN_STYLE=redirect Has No Effect](https://github.com/wekan/wekan/commit/1e837dec11dc5cb266b83efcff4f462aa02d733d).
  Thanks to unpokitodxfavor and xet7.
- [CustomFields were not created after adding 1 card](https://github.com/wekan/wekan/pull/3856).
  Thanks to mfilser.
- [Try to fix BUG: Database error attempting to change a account](https://github.com/wekan/wekan/commit/762391965e6ae3cd5682d5b164131500e7d92338).
  Thanks to bbyszio and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.33 2021-06-10 Wekan release

This release adds the following new features:

- [Assigning a user to a team or an organization](https://github.com/wekan/wekan/pull/3850).
  Thanks to Emile840.

and adds the following new improvements:

- [Custom Fields stringtemplate, autofocus the last input box](https://github.com/wekan/wekan/pull/3849).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.32 2021-06-09 Wekan release

This release adds the following new features:

- [Moved many button texts etc to tooltips. Added more tooltips](https://github.com/wekan/wekan/commit/6ce5ab40a7dc013247717b5107a306eb0402cd63).
  Thanks to JFa-Orkis and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.31 2021-06-09 Wekan release

This release adds the following new features:

- [Admin Panel: Edit Organizations and Teams](https://github.com/wekan/wekan/issues/802).
  Thanks to Emile840.
- [Admin Panel: Delete Organizations and Teams](https://github.com/wekan/wekan/commit/14b2c1309f0f910c1e46b5681d3612d7ff0cbf81).
  Thanks to xet7.
- [Admin Panel Organizations/Teams: Show confirm text above delete button](https://github.com/wekan/wekan/commit/16379201704ea1a43ce14859633ffb1b9fae6710).
  Thanks to xet7.
- [Gantt: Retain links created between tasks. Part 1: Database changes, not active in
  MIT Wekan](https://github.com/wekan/wekan/commit/07a3a0b3882147effac890514b19ff84f1d76bdb).
  Thanks to benjaminhrivera.

and adds the following updates:

- [Removed extra package](https://github.com/wekan/wekan/commit/646497c3f041e2f562d032fe28ef29169f671ac1).
  Thanks to xet7.
- [Updated dependencies](https://github.com/wekan/wekan/commit/122757ca9c091e98b31d34c3abc25caa295dbdc0).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Now new boards do not have any labels added by default](https://github.com/wekan/wekan/commit/481404e8d7bad7799c2ad34d6a94eaf5e87602c2).
  Thanks to tedkoch and xet7.
- [Try to fix OAUTH2_LOGIN_STYLE=redirect Has No Effect](https://github.com/wekan/wekan/commit/78324263c1c78e7e9e99f153e3158e39f564b67a).
  Thanks to 1ubuntuuser and xet7.
- [Try to fix: Wekan UI fails to finish import of closed Trello boards](https://github.com/wekan/wekan/commit/007e0f1c16c935ce580093a6aec31305c75d1e45).
  Thanks to berezovskyi and xet7.
- [Partial Fix: Vote and Planning Poker: Setting date and time now works for some languages that have
  ascii characters in date format](https://github.com/wekan/wekan/commit/57f31d443faaa32d6c7b53d81af3be133af5f040).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.30 2021-06-03 Wekan release

This release adds the following new features:

- [Planning Poker / Scrum Poker](https://github.com/wekan/wekan/pull/3836),
  see https://github.com/wekan/wekan/wiki/Planning-Poker .
  Thanks to helioguardabaxo.

and fixes the following bugs:

- [Fixed Python API example: Edit card, etc](https://github.com/wekan/wekan/commit/bf62a947fbfa7d387074550288376e682fd6ad47).
  Thanks to Lucky-Shi and xet7.
- [Default language is still used although this one has been modified previously](https://github.com/wekan/wekan/pull/3833).
  Thanks to Emile840.
- [Moved Keyboard Shortcuts from bottom to top of Sidebar](https://github.com/wekan/wekan/commit/659a65b8b919a49ba0beef5cc53d8e61e0f794aa).
  Thanks to ClaudiaK21 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.29 2021-05-29 Wekan release

This release adds the following new features:

- [Excel parent card name export](https://github.com/wekan/wekan/pull/3799).
  Thanks to marcungeschikts and Enishowk.

and adds the following updates:

- Updated dependencies
  [Part 1](https://github.com/wekan/wekan/commit/62150ce6c406359fba068552b4526c60faf392bb),
  [Part 2](https://github.com/wekan/wekan/commit/1d9346513e4f378379b9f5192e8dad5535287f8a),
  [Part 3](https://github.com/wekan/wekan/commit/6be1a330936c89fcf478efe98dd15244a98d266d).
  Thanks to developers of dependencies.
- Added updated `Forgot Password` page to GitHub issue template
  [Part 1](https://github.com/wekan/wekan/commit/6d0578fd5ad5f13f5ff9a285577e35fd62bba95f),
  [Part 2](https://github.com/wekan/wekan/commit/ea64b17b82cd52320c0495e16385f11031dfbe3a).
  Thanks to xet7.

and fixes the following bugs:

- [Try to fix Snap: Removed linting packages](https://github.com/wekan/wekan/commit/8911fe5c8de941808585a7d3462305d5b3d2763d).
  Thanks to xet7.
- [Removed not working GitHub workflow](https://github.com/wekan/wekan/commit/5dd6466c0aa7479015c72519f36c2485b16e3341).
  Thanks to xet7.
- [Fix typos](https://github.com/wekan/wekan/pull/3813).
  Thanks to spasche.
- [Fix: Impersonate user can now export Excel/CSV/TSV/JSON.
  Impersonate user and export Excel/CSV/TSV/JSON is now logged into database table
  impersonatedUsers](https://github.com/wekan/wekan/commit/3908cd5413b775d1ee549f0a95304cf9998d3855).
  Thanks to xet7.
- [Fixed Importing JSON exports fails](https://github.com/wekan/wekan/commit/bd1de94312e428e56d6cf5f343098475573cba0b).
  Thanks to KeptnArgo and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.28 2021-05-07 Wekan release

This release adds the following new features:

- [Mermaid Diagram](https://github.com/wekan/wekan/wiki/Mermaid-Diagram).
  Thanks to xuguotong and xet7.

and adds the following updates:

- Updated dependencies
  [Part 1](https://github.com/wekan/wekan/commit/521ef8b6dad4f00662f22702331193c16b91b482),
  [Part 2](https://github.com/wekan/wekan/commit/48255f6f1e4a0caf0be006196f28295d0825eb95),
  [Part 3](https://github.com/wekan/wekan/commit/a550c255e6c3bd2d609a1a45a213cdae7ab4f74d).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix: BG color of StartDate](https://github.com/wekan/wekan/pull/3793).
  Thanks to listenerri.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.27 2021-04-29 Wekan release

This release fixes the following bugs:

- [Fixed Non-ASCII attachment filename will crash when downloading](https://github.com/wekan/wekan/commit/c2da47773552a61d45b010a095f73d2e441f687c).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.26 2021-04-28 Wekan release

This release adds the following new features:

- [Feature/mini card subtask count](https://github.com/wekan/wekan/pull/3765).
  Thanks to ryanMushy.

and fixes the following bugs:

- [Bring back Almost-Due for Start Date](https://github.com/wekan/wekan/commit/8ca1b25daf3be60c2dc64f03830dea8437bbd8ad).
  Thanks to darren-teo.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.25 2021-04-27 Wekan release

This release adds the following new features:

- [Swimlane in Export to Excel](https://github.com/wekan/wekan/pull/3764).
  Thanks to Keelan and ryanMushy.

and adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/9f0f6841b01b88f5559724b047d5e245617a02c8).
  Thanks to xet7.

and fixes the following bugs:

- [Added missing PostgreSQL password to ToroDB](https://github.com/wekan/wekan/commit/995de525d96946702536f0cdcb98ef281b9df94e).
  Thanks to xet7.
- [Fixed language name of Deutsch (Schweiz)](https://github.com/wekan/wekan/commit/621c701bef1d09d4ddfc93be411cfad98869f0ae).
  Thanks to urmel1960.
- [Bugfix/Summernote on paste](https://github.com/wekan/wekan/pull/3761).
  Thanks to ryanMushy.
- [OpenAPI: Better handle nested schemas](https://github.com/wekan/wekan/pull/3762).
  Thanks to bentiss.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.24 2021-04-24 Wekan release

This release adds the following new features:

- [Copy Swimlane](https://github.com/wekan/wekan/pull/3753).
  Thanks to jrsupplee.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/e738177e081e4a7e83fed3389f47847403551fc2).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix Snap: Delete extra symlink that prevented building Snap](https://github.com/wekan/wekan/commit/45124a39f34a918b251a4a36fb016639b558f119).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.23 2021-04-22 Wekan release

This release adds the following new features:

- [Filtering by due date](https://github.com/wekan/wekan/pull/3731).
  Thanks to mcrute.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/676bf686c7a121b0da744afce5911807a6be48fe).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix: Trello data without labels definition](https://github.com/wekan/wekan/pull/3733).
  Thanks to jrsupplee.
- [Bug fix for Due Cards](https://github.com/wekan/wekan/pull/3741).
  Thanks to jrsupplee.
- [Fix: The bg color of start at button is almost-due](https://github.com/wekan/wekan/pull/3749).
  Thanks to listenerri.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.22 2021-04-16 Wekan release

This release adds the following new translations:

- Added German (Switzerland) (de_CH) (Schwiizerdütsch). Updated translations.
  [Part 1](https://github.com/wekan/wekan/commit/09506c78f3c3439db622574eb851fa0c20d3a066),
  [Part 2](https://github.com/wekan/wekan/commit/dce99c00be80cceba686fd73b4b78b6c778d78a6),
  [Part 3](https://github.com/wekan/wekan/commit/6ff9c5b58d25ba52b11e5429c9cfe6ed6a97000e).
  Thanks to translators.

and fixes the following bugs:

- [Remove allowedValues from Cards.type schema](https://github.com/wekan/wekan/pull/3724).
  Thanks to jrsupplee.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.21 2021-04-16 Wekan release

This release adds the following new features:

- [Summernote Rich Text Editor](https://github.com/wekan/wekan/pull/3720):
  1) Add new button to insert a URL link.
  2) Add new popover allowing you to edit existing URL links.
  3) Enable spell check.
  4) Allow client side grammerly extension.
  Thanks to ryanMushy.

and adds the following updates:

- [Upgraded to Meteor 2.2](https://github.com/wekan/wekan/commit/0e7c2b4b94b1c48e8839cfba635b53cdc1a797b1).
  Thanks to Meteor developers.

and fixes the following bugs:

- [Bugfix, date format not changed to local format](https://github.com/wekan/wekan/pull/3723).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.20 2021-04-14 Wekan release

This release fixes the following bugs:

- [OpenAPI: rework the allowedValues to allow for imported variables](https://github.com/wekan/wekan/pull/3715).
  Thanks to bentiss.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.19 2021-04-14 Wekan release

This release adds the following new features:

- [Custom Field "String Template"](https://github.com/wekan/wekan/pull/3701).
  Thanks to tod31.
- [1) Admin reports. An option added to the admin panel that has reports an admin can run.
      Right now it has two reports for attachments and broken cards.
  2) Add the creator avatar to `cardDetails` and `minicard`.  Avatar is only shown if it is selected in card settings.
  3) Added a new search operator `creator`.
  4) Bug fix for multiple label predicates](https://github.com/wekan/wekan/pull/3705).
  Thanks to jrsupplee.
- [Update Admin Panel Rules report icon and add missing translations](https://github.com/wekan/wekan/commit/8417fae89cc89adb4559874050ff7c56cc08eb00).
  Thanks to xet7.

and adds the following updates:

- [Upgraded to Meteor 2.1.1 an updated dependencies](https://github.com/wekan/wekan/commit/bb8c4325c60582cdcda5d406071586f18681e737).
  Thanks to developers of dependencies.
- [Updated to Node.js v12.22.1](https://github.com/wekan/wekan/commit/2201372744639ade3ba74b6ff9115988f011b9ac).
  Thanks to Node.js developers.
- [Updated release scripts](https://github.com/wekan/wekan/commit/9871bf196352edcb5475e1b0ee4983e8f312e449).
  Thanks to xet7.
- [Updated caniuse-lite etc dependencies](https://github.com/wekan/wekan/commit/0857a2ea91f672201ba96f2ba635165784b30fd8).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Revert stable tag, because it did break Wekan version numbers](https://github.com/wekan/wekan/commit/5ca90f4d2245910580cb0af885fac17dcec44ef0).
  Thanks to xet7.
- [Updating ARM Dockerfile](https://github.com/wekan/wekan/pull/3692).
  Thanks to loganballard.
- [Added latest arm64 bundle symlink](https://github.com/wekan/wekan/commit/6fe3edebb18414ebe7e69b2de3269438662b6163).
  Thanks to xet7.
- [Bug fix: Rules for moving from list/swimlane](https://github.com/wekan/wekan/pull/3706).
  Thanks to jrsupplee.
- [Fixed Elements are duplicated on the view "My cards".
  Rewrite routine for building the My Cards hierarchical list.
  Use a separate publication for retrieving My Cards.
  Fixed bug with limit and skip projection](https://github.com/wekan/wekan/pull/3708).
  Thanks to jrsupplee.
- [Popover needs to be destroyed anytime the details panel is closed](https://github.com/wekan/wekan/pull/3712).
  Thanks to ryanMushy.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.18 2021-04-14 Wekan release

Not released version, because some version numbers not changed in all release files.

# v5.17 2021-04-01 Wekan release

This release fixes the following bugs:

- [Fix Link dialog closes card when clicking in dialog](https://github.com/wekan/wekan/commit/454d3b5bbeed6cef8ecface7e6094cabfcc4847c).
  Thanks to ryanMushy.

and adds the following updates:

- [Added stable tag release script](https://github.com/wekan/wekan/commit/8dfb6916c5180f5d074748840d51dd04f9adb2bb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.16 2021-04-01 Wekan release

This release adds the following new features:

- [Added stable tag](https://github.com/wekan/wekan/commit/c40668be3fb9c35d44698f49ab06fec5bcabbe1b).
  Thanks to rynr and xet7.
- [Added back Summernote editor. Removed emoji picker](https://github.com/wekan/wekan/commit/47ecc654b825a875074dfd4826c36e2c5c55f599).
  Thanks to ryanMushy and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.15 2021-03-31 Wekan release

This release fixes the following bugs:

- [Fixed card sort reset](https://github.com/wekan/wekan/pull/3686).
  Thanks to ednamaeG.
- [Fix bug in My Cards and Global Search](https://github.com/wekan/wekan/pull/3687).
  Thanks to jrsupplee.
- [Fix bug in Due Cards introduced by last bug fix](https://github.com/wekan/wekan/pull/3688).
  Thanks to jrsupplee.
- [Fixed Bug: Move Swimlane to Archive does not work anymore. Fixed lint in
  router.js](https://github.com/wekan/wekan/commit/0b263cf582a9649ef72efbd289927105a27583af).
  Thanks to marcungeschikts and xet7.

and adds the following updates:

- Updated sandstorm release script and added new node update script
  [Part 1](https://github.com/wekan/wekan/commit/34b6aa0858678da937eacf9a87878bbcb476fd4b),
  [Part 2](https://github.com/wekan/wekan/commit/01de3f187c90af3ac94215ba7e8c7e780c98768d),
  [Part 3](https://github.com/wekan/wekan/commit/1d3673e9d320926127b46383321023f149287d6d),
  [Part 4](https://github.com/wekan/wekan/commit/09b9f690b162ae2797d1996e82c96ed8b8c74221),
  [Part 5](https://github.com/wekan/wekan/commit/6819303047eab17b03a0c28108fd9a2cfde23d20).
  Thanks to xet7.
- Updated to Node.js v12.22.0
  [Part 1](https://github.com/wekan/wekan/commit/7a9c3972642601e9d89d5e7a3816643f91448c63),
  [Part 2](https://github.com/wekan/wekan/commit/c2b7525864048694c39f9cbe8f8c4cd96e36f7aa).
  Thanks to Node.js developers.
- Fixed release website script
  [Part 1](https://github.com/wekan/wekan/commit/b6f60c08e55c2620fe6724ae2b5da0d9dfc9ec31),
  [Part 2](https://github.com/wekan/wekan/commit/91dae9795ebd1a98b8ed12c68b78ad90a6983402).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.14 2021-03-29 Wekan release

This release adds the following new features:

- [Clean-up Global Search, Due Cards, and My Cards. New environment variable `RESULTS_PER_PAGE` for search
  results](https://github.com/wekan/wekan/pull/3676).
  Thanks to jrsupplee.
- [Added environment variable `RESULTS_PER_PAGE` to all Wekan platforms](https://github.com/wekan/wekan/commit/ba05f383ca29211c5474e06c5ba6673e712afe7a).
  Thanks to xet7.

and adds the following updates:

- [Updated release scripts](https://github.com/wekan/wekan/commit/59580e4b0f711ca55e8cb0d73803a4ff8b56352d).
  Thanks to xet7.

and fixes the following bugs:

- [Require signed-in user for My Cards, Due Cards, and global search](https://github.com/wekan/wekan/pull/3677).
  Thanks to jrsupplee.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.13 2021-03-28 Wekan release

This release fixes the following bugs:

- [Fixed Sandstorm Wekan attachments upload](https://github.com/wekan/wekan/commit/d4a1611b86521cd5913277cfa2c86c43958eec7b).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.12 2021-03-28 Wekan release

This release fixes the following bugs:

- [Fix HTTP not defined](https://github.com/wekan/wekan/commit/4c609161915cc46ebfccad3d9e7ffdecdef1f85c).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.11 2021-03-28 Wekan release

This release adds the following new features:

- [Added emoji picker to card description edit and card comment edit.
  Removed and disabled Summernote wysiwyg editor, package-lock.json
  etc](https://github.com/wekan/wekan/commit/84fde1ecfc81e89ed1895cab3bcb328e4f166a87).
  Thanks to xet7.

and adds the following updates:

- [Updated dependencies. Fixed lint](https://github.com/wekan/wekan/commit/4e1c0fdce82e3b4add8c4ffd1832752181573e88).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.10 2021-03-28 Wekan release

This release adds the following new features:

- [Move swimlane from one board to another](https://github.com/wekan/wekan/pull/3674).
  Thanks to jrsupplee.
- [Added translatable Move Swimlane popup title](https://github.com/wekan/wekan/commit/16665bccf912c5e907739c35f7ef5a376c81740e).
  Thanks to xet7.
- [REST API: Export one attachment](https://github.com/wekan/wekan/pull/3673).
  Thanks to vagnernascimento.

and adds the following updates:

- [Updated package-lock.json](https://github.com/wekan/wekan/commit/3145ec65a3defb8ac8d97aed7e43595f661f7100).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.09 2021-03-26 Wekan release

This release adds the following improvements:

- [Replace edit icon by plus-square on new links](https://github.com/wekan/wekan/pull/3671).
  Thanks to sim51.

and fixes the following bugs:

- [Fix openapi docs generation](https://github.com/wekan/wekan/pull/3672).
  Thanks to bentiss.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.08 2021-03-26 Wekan release

This release adds the following new features:

- [Admin Panel/Settings/Accounts: Hide system messages of all users](https://github.com/wekan/wekan/commit/a249ffc8054189d8e3db9b4c8f082cc7ce7dcb52).
  Thanks to bbyszio, r4nc0r and xet7.

and adds the following improvements:

- [Add Trello attached links to the card description](https://github.com/wekan/wekan/pull/3669).
  Thanks to jrsupplee.
- [Added package-lock.json and updated .gitignore](https://github.com/wekan/wekan/commit/d532a3591f338cec9a3839d43d9a1e9d69f59dc2).
  Thanks to xet7.

and adds the following new translations:

- [Added translation: español de América Latina](https://github.com/wekan/wekan/commit/ccc9efb2703efda4e199a861920b9ec88e634b59).
  Thanks to translators.

and fixes the following bugs:

- [Fix typos in translations](https://github.com/wekan/wekan/commit/a0e1b6f918dbb252a13db05d6b9e1f832c28654f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.07 2021-03-19 Wekan release

This release fixes the following bugs:

- [Fixed sort cards feature](https://github.com/wekan/wekan/pull/3662).
  Thanks to ednamaeG.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.06 2021-03-18 Wekan release

This release fixes the following bugs:

- [Fixed Bug: Calendar & parent cards URLs used absolute URLs](https://github.com/wekan/wekan/pull/3648).
  Thanks to Majed6.
- [Fixed Bug: copy to clipboard uses pathname](https://github.com/wekan/wekan/pull/3661).
  Thanks to Majed6.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.05 2021-03-11 Wekan release

This release fixes the following bugs:

- [Change URL scheme recognition for allowing abasurl to link](https://github.com/wekan/wekan/pull/3641).
  Thanks to tod31 and chrisi51.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.04 2021-03-07 Wekan release

This release adds the following speed improvements:

- [Speed improvement: Delete presences older than one week, and add database index to presences
  serverId](https://github.com/wekan/wekan/commit/9db3c931161adfbeb6fc52d3e4cf621fb9a4955f).
  Thanks to xet7.

and adds the following new features:

- [Added autolinking settings in Admin Panel](https://github.com/wekan/wekan/pull/3633).
  Thanks to chrisi51.
- [Add custom field editing to the REST API](https://github.com/wekan/wekan/pull/3593).
  Thanks to dudeofawesome.
- [Related to custom field editing, Fixed generating API docs and Wekan Custom Fields
  REST API](https://github.com/wekan/wekan/commit/0bb3b670753c6ba20b0ad63f63d273036f609ee5).
  Thanks to xet7.

and adds back the following platforms:

- [OpenPower Minicloud emergency maintenance has finished, so can now build Wekan for
  ppc64le](https://github.com/wekan/wekan/commit/ac9b23f00f10b0170b8693e1e997bfb54f807adc).
  Thanks to OpenPower Minicloud.

and fixes the following bugs:

- [Try to fix Snap: Removed fibers multi arch from Snap, because Snap build servers do not build correctly with
  it](https://github.com/wekan/wekan/commit/a44ca39eb84508441f0f8bdac852745f417f12e7).
  Thanks to xet7.
- [Fix search on labels server error](https://github.com/wekan/wekan/pull/3634).
  Thanks to jrsupplee.
- [Fixed Bug: inconsistent use of relative/absolute URLs](https://github.com/wekan/wekan/pull/3635).
  Thanks to Majed6.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.03 2021-03-03 Wekan release

This release adds the following changes:

- [Hide email settings from Sandstorm Wekan Admin Panel](https://github.com/wekan/wekan/commit/626f435edf75fac68448ba2e14c62acb749f9c9b).
  Thanks to ocdtrekkie and xet7.

and fixes the following bugs:

- [Revert Removed extra imports of Meteor. Hopefully fixes email notifications and rules
  on old cars not working](https://github.com/wekan/wekan/commit/e4a9dc25ecc230829afea07dbb3915b96115f7f7).
  Thanks to xet7.
- [Fixed Bug: Link at board title can not be edited](https://github.com/wekan/wekan/commit/7d3917adb79be09356d32612585029392bac1e49).
  Thanks to jonesrussell42, aiac, bbyszio and xet7.

Thanks to above GitHub and Wekan vanila.io community users for their contributions and translators for their translations.

# v5.02 2021-03-02 Wekan release

This release adds the following improvements:

- [Added sort to edit card REST API](https://github.com/wekan/wekan/pull/3618).
  Thanks to ChrisMagnuson.
- [Add attachmentId to the Webhook data](https://github.com/wekan/wekan/pull/3620).
  Thanks to n8ores.

and fixes the following bugs:

- [Fix SMTP port lost after upgrade. STMP settings are made only with environment variables on non-Sandstorm platforms.
  Note: Sending email on Sandstorm Wekan does not work yet](https://github.com/wekan/wekan/commit/65b8220fe53349695a335bdb8b9692f82d4b3329).
  Thanks to jrsupplee and xet7.
- [Removed extra imports of Meteor](https://github.com/wekan/wekan/commit/de13b8b9bafbfb186a037ae20e845846b296ac69).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.01 2021-02-26 Wekan release

This release fixes the following bugs:

- [Fix typo in activities code. Fixes can not edit Custom Field](https://github.com/wekan/wekan/pull/3610).
  Thanks to n8ores.

Thanks to above GitHub users for their contributions and translators for their translations.

# v5.00 2021-02-25 Wekan release

This release fixes the following bugs:

- [Fixed Unable to remove old Board, reappears](https://github.com/wekan/wekan/commit/332f830cc2e44ab66ca891690b09a425b9fd7e68).
  Thanks to chirrut2, uusijani, cimm, anicolaides, Philipoo0 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.99 2021-02-25 Wekan release

This release fixes the following CRITICAL SECURITY ISSUES:

- [Fixed SMTP password visible to Admin at Admin Panel by using browser inspect
  to see behind asterisks](https://github.com/wekan/wekan/commit/71725f1b262b385162b2544f10658a0bc22f6b41).
  Thanks to Georg Krause and xet7.

and adds the following updates:

- [Update wekan/releases/up.sh script: Can not build ppc64le version because OpenPower Minicloud
  is having emergency maintenance](https://github.com/wekan/wekan/commit/a43736b5c6196c65770d8ae17af927406dce2c43).
  Thanks to xet7.
- [Updated to Meteor 2.1](https://github.com/wekan/wekan/commit/f2241ba3de82e393161ee1c456e1a947c6bdb5fc).
  Thanks to Meteor developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.98 2021-02-24 Wekan release

This release adds the following CRITICAL SECURITY FIXES:

- [Updated Node.js to v12.21.0](https://github.com/wekan/wekan/commit/fde6a6593379277d601408ec83f6f5a4347afef0).
  Thanks to Node.js developers.

and adds the following new features:

- [Added sort feature for viewing of cards](https://github.com/wekan/wekan/pull/3586).
  Thanks to ednamaeG.
- [Made sort cards feature translatable](https://github.com/wekan/wekan/commit/09a13ef75f478b0fc02ae3cdbfe918367664aa0c).
  Thanks to xet7.

and fixes the following bugs:

- [Fix development script to escape character](https://github.com/wekan/wekan/commit/2e9ad941c0b63b384ee215548a3f31b4a635b28b).
  Thanks to xet7.
- [Fix bugs with customFields in Webhooks](https://github.com/wekan/wekan/pull/3584).
  Thanks to n8ores.

and adds the following improvements:

- [Global Search Updates](https://github.com/wekan/wekan/pull/3597).
  Thanks to jrsupplee.
- [Updated GitHub issue template links](https://github.com/wekan/wekan/commit/c23aca78babd51857271134aed9247615b87b895).
  Thanks to atlantsecurity and xet7.
- [Admin Panel/People/People/New User: Added Initials](https://github.com/wekan/wekan/commit/3a2deb00399eb213472ef169826bd15ad655e490).
  Thanks to xet7.

and adds the following updates:

- [Update release-bundle.sh script: Can not build ppc64le version because OpenPower Minicloud
  is having emergency maintenance](https://github.com/wekan/wekan/commit/799ae886c5fedad3bafa18a14f8fbbca7ad2c227).
  Thanks to xet7.
- [Update release.sh script: Also build Sandstorm version of Wekan with same
  script](https://github.com/wekan/wekan/commit/b105088c2858bc04120551a8a8e5a75f187041e5).
  Thanks to xet7.

and adds the following new translations:

- [Added translation: Persian (Iran)](https://github.com/wekan/wekan/commit/0a728f805b336588741ca93f2ecbd1ca31ee53f2).
  Thanks to translators.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.97 2021-02-24 Wekan release

Release skipped, because not all required files had new version number updated yet.

# v4.96 2021-02-13 Wekan release

This release adds the following new features:

- [Add /api/boards_count endpoint for statistics](https://github.com/wekan/wekan/pull/3556).
  Thanks to pichouk.
- [Added possibility to specify hours in single digits in 24 hour format](https://github.com/wekan/wekan/pull/3557).
  Thanks to lindhork.
- [Added replacement from comma to dot](https://github.com/wekan/wekan/pull/3564).
  Thanks to lindhork.

and adds the following improvements:

- [Checklistitems are now inserted always at the end of the checklist](https://github.com/wekan/wekan/pull/3551).
  Thanks to mfilser.
- [Teams/Organizations: Added more code to Admin Panel for saving and editing. In Progress, does not work yet](https://github.com/wekan/wekan/commit/1bc07b1b4a3e8cd1a177f3f1776ed8e189bc627a).
  Thanks to xet7.
- [Mobile View, list header is now always at top and only lists/cards view have a scroll area](https://github.com/wekan/wekan/pull/3563).
  Thanks to mfilser.
- [Added ChangeLog update script](https://github.com/wekan/wekan/commit/c7ec07ed4748fe9b00f622af7472fd291cf1a3ce).
  Thanks to xet7.
- [Helm: Made SecretEnv a secret and added default mongodb name as Wekan](https://github.com/wekan/wekan/pull/3570).
  Thanks to meerkampdvv.
- [Checklist drag handle now at the left side (same place as for the checklist items)](https://github.com/wekan/wekan/pull/3571).
  Thanks to mfilser.
- [Lists, show also 0 cards at column description](https://github.com/wekan/wekan/pull/3572).
  Thanks to mfilser.

and adds the following updates:

- [Updated Node.js to v12.20.2](https://github.com/wekan/wekan/commit/011f86f368a83c2e70f597c11ec60ec857e0fab0).
  Thanks to Node.js developers.

and fixes the following bugs:

- [Minicard, remove red line below member avatar icon](https://github.com/wekan/wekan/pull/3560).
  Thanks to mfilser.
- [Added padding](https://github.com/wekan/wekan/pull/3559).
  Thanks to lindhork.
- [Changed default behaviour for BIGEVENTS that no activity matches it](https://github.com/wekan/wekan/pull/3561).
  Thanks to bronger.
- [Modern theme: Remove font color when the card has a color](https://github.com/wekan/wekan/pull/3569).
  Thanks to helioguardabaxo.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.95 2021-02-08 Wekan release

This release adds back the following features:

- [Added back Custom Fields sorting, because it now does not prevent loading boards](https://github.com/wekan/wekan/pull/3547).
  Thanks to mfilser.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/1c494803b091d987e26ccb783432434e7fee15a5).
  Thanks to xet7.
- [Fix typo](https://github.com/wekan/wekan/commit/0bd0a70564d3dda67706deb1bbfbd1d5a96f811f).
  Thanks to xet7.
- Updated release scripts
  [Part 1](https://github.com/wekan/wekan/commit/d0df3a2915d08b255d7ab92f9bcac195a1e7f442),
  [Part 2](https://github.com/wekan/wekan/commit/e34a2840366351c0e069515ac2210db3911dbc0f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.94 2021-02-08 Wekan release

This release adds the following new features:

- [Settings, "Show cards count" now works at mobile view too](https://github.com/wekan/wekan/pull/3545).
  Thanks to mfilser.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/b4352ada27545fadc425ca7024532aede3cc1a6f).
  Thanks to developers of dependencies.
- [Update release scripts](https://github.com/wekan/wekan/commit/dcec5b5cb05ac9e0dfae8f360def169f5f9b6fa2).
  Thanks to xet7.

and fixes the following bugs:

- [Fix bug in adding new users](https://github.com/wekan/wekan/pull/3544).
  Thanks to jrsupplee.
- [Fixed Board does not load, by disabling Custom Fields sorting](https://github.com/wekan/wekan/commit/d57eb6a2fc73c7b25c957ad42b5f7a06f680e1a1).
  Thanks to marcungeschikts, olivierlambert and xet7.
- [Fixed lint](https://github.com/wekan/wekan/commit/60fedad3fe384a2b0652941e57ecaa5fc4b7897a).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# 4.93 2021-02-06 Wekan release

This release adds the following new features:

- [Add the ability to call get_user operation with username](https://github.com/wekan/wekan/pull/3530).
  Thanks to magicbelette.

and adds the following updates:

- [Updated Ubuntu base image in Dockerfile](https://github.com/wekan/wekan/commit/bcdaf77a9c675530cfa21d038e8abd7c62aef70d).
  Thanks to Ubuntu and xet7.

and fixes the following bugs:

- [Set the language on `TAPi18n` when user selects language](https://github.com/wekan/wekan/pull/3525).
  Thanks to jrsupplee.
- [Fix bug in `uniqueTitle`](https://github.com/wekan/wekan/pull/3526).
  Thanks to jrsupplee.
- [Fixed file permissions in build scripts](https://github.com/wekan/wekan/commit/ea697f2238842893953dee76bed03ffd5b4a107e).
  Thanks to xet7.
- [Red line below the avatar now correctly on FireFox](https://github.com/wekan/wekan/pull/3532).
  Thanks to mfilser.
- [Notifications, enable line wrapping](https://github.com/wekan/wekan/pull/3533).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.92 2021-02-03 Wekan release

This release adds the following improvements:

- [Import user mapping improvements](https://github.com/wekan/wekan/pull/3510).
  Thanks to jrsupplee.
- Added Createtoken API.
  [Part 1](https://github.com/wekan/wekan/pull/3520),
  [Part 2](https://github.com/wekan/wekan/commit/3774060d32abcfee17dc1c31958d4673794d8619).
  Thanks to magicbelette and xet7.
- Sorted archives.
  [Part 1](https://github.com/wekan/wekan/pull/3518),
  [Part 2](https://github.com/wekan/wekan/commit/3da66a0fe30c2b54b63e5d098232b375d899925e).
  Thanks to bronger, jrsupplee and xet7.

and adds the following updates:

- [Updated dependencies](https://github.com/wekan/wekan/commit/05ebae7329ba0dd3fe9b04cd63b1f983830cdeee).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Don't reload page when returning default sort](https://github.com/wekan/wekan/pull/3509).
  Thanks to jrsupplee.
- [Avatar overlaped notifications](https://github.com/wekan/wekan/pull/3516).
  Thanks to mfilser.
- [Hopeful fix for i18n not working in `onRendered()`](https://github.com/wekan/wekan/pull/3519).
  Thanks to jrsupplee.
- [Disable some console.log code, that is only needed while developing](https://github.com/wekan/wekan/commit/f40c9804f848fdb91229c5718ad97495337109ba).
  Thanks to xet7.
- [Try fix removed nonexistent document error](https://github.com/wekan/wekan/commit/f274b3c26be60813829dcf2b0e68a8dd876ff614).
  Thanks to Brulf, TheMasterFX and xet7.
- [Fixed Cards and CustomFields sorted alphabetically](https://github.com/wekan/wekan/pull/3521).
  Thanks to mfilser.
- [Notifications avatar overlaped at mobile view](https://github.com/wekan/wekan/pull/3523).
  Thanks to mfilser.

and improves some security related info:

- [Added badge for CII Best Practices](https://github.com/wekan/wekan/commit/ee2f7c077fe56d6fedb8b75ae3cba6bab56f9363).
  Thanks to CII and xet7.
- [Added PGP public key for sending security vulnerability reports](https://github.com/wekan/wekan/commit/a385d6f4fd76e2bb0f374963848513b9373d6b5a).
  Thanks to xet7.
- [Updated security report email address](https://github.com/wekan/wekan/commit/7031b7a3c77acc0ddeabe436572dd4057001e9f5).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.91 2021-01-29 Wekan release

This release fixes the following bugs:

- [Use `new RegExp(...)` to define a regex](https://github.com/wekan/wekan/pull/3505).
  Thanks to jrsupplee.
- [Fixed typos in docker-compose.yml](https://github.com/wekan/wekan/commit/4acf8526509ffe852e6e48e3503560448239d8cd).
  Thanks to farfoodyou and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.90 2021-01-28 Wekan release

This release adds the following new features:

- [Create unique board names when importing](https://github.com/wekan/wekan/pull/3499).
  Thanks to jrsupplee.

and fixes the following bugs:

- [Added missing backtick quotes](https://github.com/wekan/wekan/commit/bf7b1789ec16e3c52397318c799ec5a0fc2de3a5).
  Thanks to xet7.
- [Fix some bugs when importing Wekan JSON](https://github.com/wekan/wekan/pull/3500).
  Thanks to jrsupplee.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.89 2021-01-28 Wekan release

This release fixes the following bugs:

- [Try to fix quotes in Global Search](https://github.com/wekan/wekan/commit/0ff215f78f03c81d153dfc0ffa08fac94b542ec2).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.88 2021-01-28 Wekan release

This release adds the following new features:

- [Additional URL schemes: SolidWorks PDM (conisio:) and abas ERP (abasurl:)](https://github.com/wekan/wekan/pull/3487).
  Thanks to tod31.

and adds the following improvements:

- [Mobile and Desktop have now the same Quick Access view + scrollable](https://github.com/wekan/wekan/pull/3491).
  Thanks to mfilser.
- [Global Search Update](https://github.com/wekan/wekan/pull/3492).
  Thanks to jrsupplee.
- [Added many more fields to Export to Excel, and better formatting. Does not yet have all
  fields](https://github.com/wekan/wekan/commit/37372466ccd15c7d5d4a55510b349fac0953c425).
  Thanks to xet7.

and fixes the following bugs:

- [Changed method to create initials same as others for new user of oidc](https://github.com/wekan/wekan/pull/3489).
  Thanks to sato-64bit.
- [Removed quotes from docker-compose.yml settings](https://github.com/wekan/wekan/commit/b1cdcda8ed78d48505a8da5180d7aed46a24fd64).
  Thanks to XL-Reaper, Vinc89 and xet7.
- [Repair LDAP_REJECT_UNAUTHORIZED=false CVE-2021-3309](https://github.com/wekan/wekan/pull/3497).
  Thanks to robert-scheck.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.87 2021-01-26 Wekan release

This release fixes the following bugs:

- [Reject by default LDAP connections not authorized via CA trust store](https://github.com/wekan/wekan/pull/3483).
  Thanks to robert-scheck.
- [Handle '\n' line breaks in PEM-encoded SSL/TLS certificates](https://github.com/wekan/wekan/pull/3485).
  Thanks to robert-scheck.

and adds the following improvements

- [Try parallel build of releases, does it work](https://github.com/wekan/wekan/commit/be238ac7439ce38b4403d9a611dec9bb421a856f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.86 2021-01-25 Wekan release

This release adds the following improvements:

- [Added PWA related category, orientation, screenshots, maskable icon and
  IARC rating ID](https://github.com/wekan/wekan/commit/027771b3021a709d9049015e7d7e6faccf1ad7f3).
  Thanks to xet7.
- [Added PWA related monochrome icon](https://github.com/wekan/wekan/commit/2977f7cf47626b429159cb7b7496919c07ece914).
  Thanks to xet7.
- [Mention Wekan GitHub Discussions at readme](https://github.com/wekan/wekan/commit/4c0bd359f921ae0ea722f78946fcc1168e8b939e).
  Thanks to xet7.

and adds the following updates:

- [Use Node 12.20.1 in rebuild-wekan.sh](https://github.com/wekan/wekan/commit/37d76e9e061d31c11fca8e704e9b4c54f17c0023).
  Thanks to xet7.

and fixes the following bugs:

- [Move call to URL search to onRendered](https://github.com/wekan/wekan/pull/3478).
  Thanks to jrsupplee.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.85 2021-01-23 Wekan release

This release adds the following new features:

- [Option to add custom field to all cards](https://github.com/wekan/wekan/pulls/3466).
  Thanks to jrsupplee.
- [Added checkbox as an option to custom field create dialog](https://github.com/wekan/wekan/pull/3472).
  Thanks to jrsupplee.

and adds the following improvements:

- [Display My Cards lists using inline-grid](https://github.com/wekan/wekan/pull/3474).
  Thanks to jrsupplee.
- [Added board title link and background color to My Cards](https://github.com/wekan/wekan/pull/3471).
  Thanks to helioguardabaxo.
- [Use simple border at My Cards](https://github.com/wekan/wekan/pull/3475).
  Thanks to helioguardabaxo.

and adds the following updates:

- Updated dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/7a66cb46a0ec334f4e95a73322641ba029f770ad),
  [Part 2](https://github.com/wekan/wekan/commit/953cfd6ecd291196ce2ad1d4a5eac19ca21a20d9).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [WIP Limit: Limited number of cards highlighting to true overbooking](https://github.com/wekan/wekan/pull/3468).
  Thanks to bronger.
- [Revert table-cell back to inline-block at my-cards-list-wrapper](https://github.com/wekan/wekan/commit/da12c84609674bdf5121ad6b74c97c65b9fc0164).
  Thanks to jrsupplee and xet7.
- [Fix for search operators with uppercase letters](https://github.com/wekan/wekan/pull/3470).
  Thanks to jrsupplee.
- [Boards.copyTitle - escape string used in regex](https://github.com/wekan/wekan/pull/3473).
  Thanks to jrsupplee.
- [Bug fix: import regex escape function](https://github.com/wekan/wekan/pull/3476).
  Thanks to jrsupplee.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.84 2021-01-22 Wekan release

This release adds the following new features:

- [Search All Boards: Added list of board, list and color names. Added operators for due, created and modified.
  Added support for clicking list titles, label names and board titles. Make some heading translatable.
  Set focus back to search phrase input after clicking a predicate. Fixed some spacing issues](https://github.com/wekan/wekan/pull/3459).
  Thanks to jrsupplee.

and fixes the following bugs:

- [Fixed Upper/lowercase errors in some languages due to .toLowerCase](https://github.com/wekan/wekan/commit/a5f6dd6399142b3b05e9b6a0d106d931106807d6).
  Thanks to bronger and xet7.
- [Tried to fix possible prototype pollution reported by Deepcode.ai](https://github.com/wekan/wekan/commit/8f553497e4f21d44e78243d22d80b18f729a3d6a).
  Thanks to Deepcode.ai and xet7.
- [Disable some logs that are not needed anymore](https://github.com/wekan/wekan/commit/0373da44b38f7300f69470fed3cabab9b63c8783).
  Thanks to xet7.
- [Rules not copied during board copy](https://github.com/wekan/wekan/pull/3458).
  Thanks to jrsupplee.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.83 2021-01-20 Wekan release

This release adds the following new features:

- [When copying a board, copy Custom Fields to new board](https://github.com/wekan/wekan/pull/3451).
  Thanks to jrsupplee.

and adds the following updates:

- [Upgrade to Meteor 2.0](https://github.com/wekan/wekan/commit/23c1723ae1ee09101d5ad6334eee782763d0b354).
  Thanks to Meteor developers.

and fixes the following bugs:

- [Custom field definitions duplicated on copy and move](https://github.com/wekan/wekan/pull/3449).
  Thanks to jrsupplee.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.82 2021-01-20 Wekan release

This release adds the following new features:

- Export to Excel XLSX. Does work, but does not export all fields yet correctly. In Progress.
  [Part 1](https://github.com/wekan/wekan/commit/855151a8d18c14ec26a1ef09977b0f98f4c32759).
  [Part 2](https://github.com/wekan/wekan/commit/56a530058b219696146ab8f8df17b3745b538d0e).
  Thanks to gameendman, alfredgu and xet7.
- [Trello Import Custom Fields. Adds a new custom field type of checkbox to make importing Trello checkbox fields easier](https://github.com/wekan/wekan/pull/3444).
  Thanks to jrsupplee and xet7.

and adds the following features back after fixing:

- [Cards, custom fields are displayed in alphabetic order](https://github.com/wekan/wekan/pull/3442).
  This was added in Wekan v4.71, removed in Wekan v4.81 and added back at Wekan v4.82.
  Thanks to mfilser.

and adds the following new translations:

- [Translations: Added ar-EG = Arabic (Egypt), simply Masri (مَصرى, [ˈmɑsˤɾi], Egyptian, Masr refers to Cairo)](https://github.com/wekan/wekan/commit/fc68354e836fa8f03e72d5af33b6c28e1c52f10b).
  Thanks to translators and xet7.

and fixes the following bugs:

- [Display custom date fields in a shortened form on minicard](https://github.com/wekan/wekan/pull/3446).
  Thanks to jrsupplee and xet7.
- [Fixed Card activity shows only 20 last entries of activities and comments, by changing limit to 500 entries](https://github.com/wekan/wekan/commit/8e4eade00252353be5cfda1de768fea1bb87095e).
  Thanks to xet7.
- [Fixed LDAP Group Filters not working in docker](https://github.com/wekan/wekan-ldap/issues/86).
  Thanks to Sancretor.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.81 2021-01-18 Wekan release

This release adds the following new features:

- [Global Search: Use translated color names](https://github.com/wekan/wekan/pull/3440).
  Thanks to jrsupplee and xet7.

and fixes the following bugs:

- [Restore original working Dockerfile](https://github.com/wekan/wekan/commit/c4ea7457dcf1db200c87784c35b7d3c390e94d80).
  Thanks to gpalyu and xet7.
- [Reverted Cards, custom fields are displayed in alphabetic order from Wekan v4.71
  https://github.com/wekan/wekan/pulls/3417 because it caused board not
  loading](https://github.com/wekan/wekan/commit/413f91d0c8f2d3f9df9bf036bb20551dba29bc2e).
  Thanks to olivierlambert and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.80 2021-01-18 Wekan release

This release adds the following improvements:

- [Global Search fixes and updates](https://github.com/wekan/wekan/pulls/3437).
  Thanks to jrsupplee.
- [Use table-cell instead of inline-block in my-cards-list-wrapper CSS](https://github.com/wekan/wekan/commit/3866ed31965eb5b722e88c4d3e7628d516375088).
  Thanks to johappel and xet7.
- [Use multi stage build based on Node images](https://github.com/wekan/wekan/pull/3438).
  Thanks to GavinLilly.
- [Try to use buster base images, because when using Wekan Alpine, registering new user of Wekan does not work,
  maybe because of glibc/musl](https://github.com/wekan/wekan/commit/254a9abad2dec620d95c02ac9209e9f569407986).
  Thanks to GavinLilly and xet7.
- [Use MongoDB setFeatureCompatibilityVersion 4.2 on Snap. TODO: Docker](https://github.com/wekan/wekan/commit/2791b7da22ddb0ff5588eca56f1dc90ff5ffdd2d).
  Thanks to GuidoDr and xet7.

and adds the following updates:

- [Update dependencies](https://github.com/wekan/wekan/commit/c0f748bcb5dfebe7fa90be647a1ed23f0edcc304).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fixed Linked card makes board not load when CustomField definition is undefined](https://github.com/wekan/wekan/commit/0d5f33299ee25e1bee4ca4fc3b3c2483c29e367c).
  Thanks to olivierlambert and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.79 2021-01-17 Wekan release

This release adds the following new features:

- [At Search All Cards, now it's possible to click found card to open it](https://github.com/wekan/wekan/commit/10f74f5152117358e9c6b9bb0e81b8c284841aff).
  Thanks to xet7.

and fixes the following bugs:

- [Fixed: Linked card makes board not load](https://github.com/wekan/wekan/commit/be03d2ae9aa708119992548145cbaf82e1f87419).
  Thanks to akitzing, galletl, pdonias, olivierlambert and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.78 2021-01-16 Wekan release

This release adds the following new features:

- [Search All Boards](https://github.com/wekan/wekan/pull/3433). Currently limited to 50 results. Will be improved later.
  Thanks to jrsuplee and xet7.

and fixes the following bugs:

- [HTML is not needed in Rules translations, so disabled it](https://github.com/wekan/wekan/commit/a2894bf0cb11161f2f9382e900ffbae2a1570d38).
  Thanks to jrsuplee and xet7.
- [Limit amount of data in publications where possible](https://github.com/wekan/wekan/commit/4115d62bac882ceaaec531b1f9df2666097be51a).
  Thanks to xet7.
- [Fixed Display issues with assignee on minicard](https://github.com/wekan/wekan/commit/aa34da61fe80a2ab2a87b6413b3b9c25fb8ea96f).
  Thanks to bronger and xet7.
- [Limit visibility of Global Search, My Cards and Due Cards to logged in users, because they do not work without
  logging in](https://github.com/wekan/wekan/commit/4180224fd9841a3e6cab9eacb1447978482e1e91).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.77 2021-01-13 Wekan release

This release adds the following new features:

- [Show membertype (admin, normal etc) in avatar/initials tooltip for board members](https://github.com/wekan/wekan/commit/afd5d1d0c0a14702a2ea6960a58b78153975dc0d).
  Thanks to bronger and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.76 2021-01-13 Wekan release

This release adds the following new features:

- [Try to allow links to onenote, mailspring and file](https://github.com/wekan/wekan/commit/3977f2187aa4dc0bd9ddfcd02065437df0f1a5c0).
  Thanks to lime918, rgalonso, ocdtrekkie, gkarachuk and xet7.

and adds the following improvements:

- [Removed wekan- from export filenames for whitelabeling](https://github.com/wekan/wekan/commit/de27be0911053195838d6d0d4f1b6eae8a1d773a).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.75 2021-01-11 Wekan release

This release adds the following CRITICAL SECURITY FIXES:

- [Due Cards and Broken Cards: In All Users view, fixed to show cards only from other users Public Boards. Not anymore from private
  boards](https://github.com/wekan/wekan/commit/801d0aacf00eace05ec70d6f0229f2a752f119cd).
  Thanks to xet7.

and adds the following updates:

- [Upgrade to Meteor 1.12.1](https://github.com/wekan/wekan/commit/3105548c98091773e86e4556c2980d5f533e98f1).
  Thanks to Meteor developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.74 2021-01-10 Wekan release

This release adds the following improvements:

- [My Cards and Due Cards: Added popup title and horizontal line between menu
  options](https://github.com/wekan/wekan/commit/9293de541b3fcccee52751808f0e95b04986c1bb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.73 2021-01-10 Wekan release

This release adds the following new features:

- [Broken Cards](https://github.com/wekan/wekan/pull/3426) for debugging.
  Thanks to jrsupplee.
- ["Broken Cards" to be translatable](https://github.com/wekan/wekan/commit/d09e448fbd37ae84419aa3909b9a4594cd7ddb92).
  Thanks to xet7.
- [Added Broken Cards to User Settings menu](https://github.com/wekan/wekan/commit/b98df8ef87fc0c501d4f06e3e5af292605bd21cf).
  Thanks to xet7.

and adds the following improvements:

- [My Cards: Make code forgiving of possible null values for a card's board, swimlane, or list.
  Added a new Due Cards page that displays cards with a Due date for either just the user or all
  users](https://github.com/wekan/wekan/pull/3425).
  Thanks to jrsupplee.

and fixes the following bugs:

- [Fixed Spanish language names to lowercase español](https://github.com/wekan/wekan/commit/9ec1904119e6bec4c00600cb8ea81c28e631ae2e).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.72 2021-01-09 Wekan release

This release fixes the following bugs:

- [Fixed badges at readme](https://github.com/wekan/wekan/pull/3421).
  Thanks to kuchengrab.
- [Changed Sandstorm menus to be more similar like other Wekan versions, make Export visible, etc](https://github.com/wekan/wekan/commit/103d03d4c86df445b9d28d506f7d3098ab56368b).
  Thanks to PizzaProgram and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.71 2021-01-08 Wekan release

This release adds the following new features:

- [My Cards add Due Date sort](https://github.com/wekan/wekan/pull/3419).
  Thanks to jrsupplee.

and adds the following improvements:

- [Update to My Cards](https://github.com/wekan/wekan/pulls/3416).
  Thanks to jrsupplee.
- [Cards, custom fields are displayed in alphabetic order](https://github.com/wekan/wekan/pulls/3417).
  Thanks to mfilser.

and fixes the following bugs:

- [Fixed Color picker of lists is empty. Fixed error about existing file at Wekan Docker version](https://github.com/wekan/wekan/issues/3418).
  Thanks to bronger and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.70 2021-01-04 Wekan release

This release adds the following CRITICAL SECURITY FIXES:

- [Upgrade to Node.js 12.20.1](https://github.com/wekan/wekan/commit/4bfe017b08f573991fd1f9229ae53573798f475e).
  Thanks to Node developers.

and adds the following new features:

- [Added many new translations to Wekan, now there is total 60 translations in Wekan. Updated translations. Organized pull-translations.sh alphabetically by
  language name](https://github.com/wekan/wekan/commit/d171f4088f40512d321969df3f0c280a620c0c5f).
  Thanks to translators and xet7.
- [Added markdown and emoji to My Cards board, swimlane and list names](https://github.com/wekan/wekan/commit/763dc9c8e0122990c5f496392f2cce980c535dce).
  Thanks to xet7.
- [Show Admin Panel / People and Version also on mobile MiniScreen](https://github.com/wekan/wekan/commit/754a91dbdc3d7111c367cb5dd0a02250a837e42a).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.69 2021-01-02 Wekan release

This release adds the following new features:

- Teams/Organizations to Admin Panel. In Progress.
  [Part 2](https://github.com/wekan/wekan/commit/ad482d5cfb72591f1b5c749c3c0156000dbf660a).
  [Part 3](https://github.com/wekan/wekan/commit/b64cd358ed0af4395357423ad172b8dac9dc3178).
  Thanks to xet7.
- [My Cards](https://github.com/wekan/wekan/pull/3413).
  Thanks to jrsupplee.

and adds the following UI changes:

- [Moved Public/Archive/Templates/etc options to click right top username Member Settings menu, where My Cards also
  is](https://github.com/wekan/wekan/commit/0592b0c56ac372c87dea17f0a090e7d7569430d1).
  Thanks to xet7.
- [Reorder My Cards to be first at menu](https://github.com/wekan/wekan/commit/bfc16fc5442e8cc8c3cc03df992d5b1d1724338b).
  Thanks to xet7.

and fixes the following bugs:

- [New Checklistitems are now autoresized too](https://github.com/wekan/wekan/pull/3411).
  Thanks to mfilser.
- [Swimlane + and = Icons resized for better handling at mobile view](https://github.com/wekan/wekan/pull/3412).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.68 2020-12-29 Wekan release

This release fixes the following bugs:

- [Checklist-Items, Drag-Drop Handle now at the left side](https://github.com/wekan/wekan/pull/3407).
  Thanks to mfilser.
- [Checklist-Items, Autoresize the textarea vertically to fit the user-input](https://github.com/wekan/wekan/pull/3408).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.67 2020-12-29 Wekan release

This release adds the following new features:

- Teams/Organizations to Admin Panel. In Progress.
  [Part 1](https://github.com/wekan/wekan/commit/9e2093d6aed38e66fc4d63823315c9382e013a32).
  Thanks to xet7.

and fixes the following bugs:

- [Checklist Mini-Screen, appendTo: 'parent' not necessary anymore](https://github.com/wekan/wekan/pull/3405).
  Thanks to mfilser.
- [Allow to edit email verified and initials at Admin Panel/People/People](https://github.com/wekan/wekan/commit/d03e2170dd10741bd78722cc35b52cffa220a2e7).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.66 2020-12-27 Wekan release

This release fixes the following bugs:

- [Fix Mobile miniscreen: Drag handle not visible in long checklist item
  text](https://github.com/wekan/wekan/commit/a8453657c95a4bde2ae86b4c77e55bb2174adf26).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.65 2020-12-26 Wekan release

This release fixes the following bugs:

- [Fixed Drag and drop between checklists closes the card sometimes on
  Firefox](https://github.com/wekan/wekan/commit/c7808c5c03f98eae709e5ef89e8e17af4689cb2e).
  xet7 thanks mfilser about [similar fix of appendTo parent](https://github.com/wekan/wekan/pull/3342)
  that did work here too to fix this.
  Thanks to mfilser and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.64 2020-12-24 Wekan release

This release fixes the following bugs:

- [Dark theme button background fix](https://github.com/wekan/wekan/pull/3401).
  Thanks to jasontamez.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.63 2020-12-21 Wekan release

This release fixes the following bugs:

- [Fixed Remove Cover button gives JS error](https://github.com/wekan/wekan/commit/28850e5510f2aaefcae404efac1973c12f1cca65).
  Thanks to tsukasa1989 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.62 2020-12-18 Wekan release

This release fixes the following bugs:

- [Treat unknown attachment types as binary on board
  import/clone](https://github.com/wekan/wekan/pull/3395).
  Thanks to daniel-eder.
- [Fix Move card from a board to another does not work anymore](https://github.com/wekan/wekan/commit/9dd0fb88d6cb3378a8fc96aaf60214020efeaed1).
  Thanks to lezioul and xet7.
- [Add some permission code, to see does it fix something](https://github.com/wekan/wekan/commit/7f3c4acf62deefa2f7b36b986e06336fd3b2754f).
  Thanks to xet7.
- [Fix delete board button not visible](https://github.com/wekan/wekan/commit/53a925cf7ff95167cbf2f65f7c7e169e18b14b44).
  Thanks to airtraxx and xet7.
- [Board: When removing member from board, remove also from assignees.
  Admin Panel/People: 1) Allow edit user that does not have email address.
  2) When creating new user, require username and email address, and save also fullname.
  3) Some in progress code for deleting user, that does not work correctly yet, so deleting user is not enabled
  yet](https://github.com/wekan/wekan/commit/61ae62a83aaddb2c6f679ce9d05b675c845ba8bf).
  Thanks to airtraxx and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.61 2020-12-16 Wekan release

This release fixes the following bugs:

- [Removed cookie code that is not in use](https://github.com/wekan/wekan/commit/3c406d955ec602d4b86c164acb9e94e715086f8e).
  Thanks to xet7.
- [Allow normal user to delete checklist item](https://github.com/wekan/wekan/commit/f9ba17177e8f1146be1e571f47d26c13a9337034).
  Thanks to Samunosuke and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.60 2020-12-15 Wekan release

This release adds the following updates:

- Update dependencies.
  [Part 1](https://github.com/wekan/wekan/commit/2e1e703e3591258462b3167f72e2b2319bf57bec),
  [Part 2](https://github.com/wekan/wekan/commit/a75c162483795775db1631686f8e7017b42c87ca).
  Thanks to developers of dependencies.

and fixes the following bugs:

- Prevent normal user deleting or modifying too much. Allow normal user to export board.
  [Part1](https://github.com/wekan/wekan/commit/4a205fcfcb40438faead3bf8973b10b8e42974f0),
  [Part2](https://github.com/wekan/wekan/commit/6cb4b9fe4a086202d642de54464088e0a1122ec0).
  Thanks to Samunosuke, pgh2357 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.59 2020-12-10 Wekan release

This release fixes the following bugs:

- [Fix not all checklist items being imported/cloned](https://github.com/wekan/wekan/pull/3389).
  Thanks to daniel-eder.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.58 2020-12-09 Wekan release

This release fixes the following bugs:

- [Fix issues when duplicating board](https://github.com/wekan/wekan/pull/3387).
  Thanks to daniel-eder.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.57 2020-12-08 Wekan release

This release adds the following new features:

- [Helm: Introduce secretEnv for secret value provisioning](https://github.com/wekan/wekan/pull/3382).
  Thanks to ThoreKr.
- REST API: List attachments of a board, with download URLs of attachments. In Progress.
  [Part 1](https://github.com/wekan/wekan/commit/bf94161f30adf9dec6aa41af6946ba54c1573a44),
  [Part 2](https://github.com/wekan/wekan/commit/2ec53b27d14049bc9622861492cac301512a1e33),
  [Part 3](https://github.com/wekan/wekan/commit/36e29a405ee943d15e6e1bd9ac02ecefb7a7a06f).
  For using this, Python code example:
  https://github.com/wekan/wekan/wiki/New-card-with-Python3-and-REST-API .
  Thanks to xet7.
- REST API: Added Wekan REST API Python CLI, for adding card, etc. In Progress,
  downloading attachments does not work yet.
  [Part1](https://github.com/wekan/wekan/commit/051f7b2769c51404063e7f0ddf85fbd0f9508a88),
  [Part2](https://github.com/wekan/wekan/commit/387f0600ce1389aab955cc125d331dcd5eeeafdd).
  Thanks to xet7.
- [Drag handles at checklist items on mobile view](https://github.com/wekan/wekan/pull/3342).
  Thanks to mfilser.

and adds the following updates:

- [Upgrade to Meteor 1.12](https://github.com/wekan/wekan/commit/7a6abaac44b1235021dc7cc25e3224515c64a068).
  Thanks to Meteor developers.
- [Upgrade to Node 12.20.0](https://github.com/wekan/wekan/commit/015f4d671d136a4a344fe82e2a6bcbe0c2be6cfd).
  Thanks to Node developers.

and fixes the following bugs:

- [Fixed Quay Docker builds that failed](https://github.com/wekan/wekan/issues/3380)
  because of Docker Hub rate limits by copying base images from Docker Hub to Quay.
  [Part1](https://github.com/wekan/wekan/commit/4537971300c6ffcc85b7dd930867eb942bd22f86),
  [Part2](https://github.com/wekan/wekan/commit/2b2884d996b8fc6101eff50db058639631eb5945),
  [Part3](https://github.com/wekan/wekan/commit/c09758fb913d73e9229f43d17663b3c4715a62b9).
  Thanks to xet7.
- [Hide duplicate create board button, because it did not show board templates
  correctly](https://github.com/wekan/wekan/commit/a7977a8fc7f171d046a228f81fb0cd481b0ccc41).
  Thanks to xet7.
- [Minicard, reduce space after assignees label](https://github.com/wekan/wekan/pull/3385).
  Thanks to mfilser.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.56 2020-11-30 Wekan release

This release adds the following new features:

- [Added date notification icons](https://github.com/wekan/wekan/pull/3366).
  This partially resolves [#3363](https://github.com/wekan/wekan/issues/3363).
  Thanks to helioguardabaxo.
- Attempt to implement date activities notification [Part1](https://github.com/wekan/wekan/pull/3372)
  and [Part2](https://github.com/wekan/wekan/pull/3373).
  Thanks to helioguardabaxo.
- [Sticky swimlane](https://github.com/wekan/wekan/pull/3370).
  Thanks to progressify and xet7.
- [1) New default: sudo snap set wekan mongo-log-destination='devnull'.
  Other options: syslog/snapcommon.
  This should lower amount of disk usage and logs.
  2) Tried to fix command:
  `sudo snap set wekan mongo-url='...'`](https://github.com/wekan/wekan/commit/5510c2a37dc6bcfa0ec588eceb8dc9f32cec9851).
  Thanks to xet7.

and adds the following improvements:

- [Improvements in activities design](https://github.com/wekan/wekan/pull/3374).
  Thanks to helioguardabaxo.

and fixes the following bugs:

- [Fix typo on MONGO_URL on Snap](https://github.com/wekan/wekan/commit/05a72f7c627e05ac4ce38cb9588f2aac45273ce8).
  Thanks to xet7.
- [Fix: Update helm mongodb dependency](https://github.com/wekan/wekan/pull/3369).
  Thanks to jiangytcn.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.55 2020-11-21 Wekan release

This release adds the following improvements:

- [Set minimum height to icons at All Boards page](https://github.com/wekan/wekan/commit/6193a0b64e85df2f2353192e7efb16680b436622).
  Thanks to xet7.
- [Increase avatar size](https://github.com/wekan/wekan/pull/3360).
  Thanks to centralhardware.
- [Modern Dark theme: card details as lightbox](https://github.com/wekan/wekan/pull/3359).
  Thanks to jghaanstra.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.54 2020-11-17 Wekan release

This release adds the following new features:

- [Add keyboard shortcut / for search](https://github.com/wekan/wekan/pull/3354).
  Thanks to helioguardabaxo.
- [Added back variable auto height of icons at All Boards page](https://github.com/wekan/wekan/commit/9dbb10c59b4bb1b16b7942cc0b60741a1fbe9110).
  Thanks to xet7.

and adds the following updates:

- [Upgrade to Node.js 12.19.1](https://github.com/wekan/wekan/commit/f786afc4b9d0e5e4a057b5f3d7995377873022cf).
  Thanks to Node.js developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.53 2020-11-15 Wekan release

This release adds the following updates:

- [Use Quay for Docker builds, because Docker Hub builds show ENOMEM error](https://github.com/wekan/wekan/commit/22501749da708a51b89ef9ff0aee4ac6ba529ed9).
  Thanks to xet7.
- [Update Docker upgrade info](https://github.com/wekan/wekan/commit/d0040754ea75a26926a187ce47dbe529a15e0926).
  Thanks to xet7.
- [Use latest MongoDB on Docker](https://github.com/wekan/wekan/commit/8250cbcf6e417d21ffdc4f14495792768b0bc9ef).
  Thanks to xet7.
- [In rebuild-wekan.sh install dependencies, Install npm](https://github.com/wekan/wekan/commit/345e2357c8fd030e943f9729f790db980d3a727c).
  Thanks to xet7.
- [In rebuild-wekan.sh install dependencies, uncomment chown](https://github.com/wekan/wekan/commit/21aebe845f3f4911d9bb824f0f33bdb19a3a9af6).
  Thanks to xet7.
- [Update markdown-it and markdown-it-emoji dependencies](https://github.com/wekan/wekan/commit/222fca3ad7aa2b67329dca64e84eb72899fd8137).
  Thanks to developers of markdown-it and markdown-it-emoji.

and adds the following improvements:

- [Minor improvements to Modern Dark theme](https://github.com/wekan/wekan/pull/3348).
  Thanks to jghaanstra.
- [Added missing bottom padding to lists](https://github.com/wekan/wekan/pull/3351).
  Thanks to danger89.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.52 2020-11-12 Wekan release

This release adds the following improvements:

- [Some more small improvements to Modern Dark theme](https://github.com/wekan/wekan/pull/3346).
  Thanks to jghaanstra.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.51 2020-11-11 Wekan release

This release adds the following new features:

- [Board admin can edit and delete comments as well](https://github.com/wekan/wekan/pull/3340).
  Thanks to mfilser.
- [Drag handles for checklist](https://github.com/wekan/wekan/pull/3341).
  Thanks to mfilser.
- [Custom URL Schemes autolinked](https://github.com/wekan/wekan/pull/3339).
  Thanks to brian-j.

and adds the following improvements:

- [Improvements to Modern Dark Theme](https://github.com/wekan/wekan/pull/3344).
  Thanks to jghaanstra.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.50 2020-11-10 Wekan release

This release adds the following new features:

- Add 'Modern Dark' theme [Part1](https://github.com/wekan/wekan/pulls/3335)
  and [Part2](https://github.com/wekan/wekan/commit/6801c960b115be4265bf18ba05c444ac79aef887).
  Thanks to jghaanstra, helioguardabaxo and xet7.

and fixes the following bugs:

- [Fix edit description to require only one click](https://github.com/wekan/wekan/commit/0ef248574c2751be1245c5748a9cbbe5ba2969b5).
  Thanks to uusijani and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.49 2020-11-04 Wekan release

This release adds the following new features:

- [LDAP: Sync email address](https://github.com/wekan/wekan/pull/3329).
  Thanks to gramakri.

and adds the following changes:

- [Changed board icons bigger at All Boards page](https://github.com/wekan/wekan/commit/76273300e749ebe3b1d711dee84336d03b31ed49).
  Thanks to xet7.

and adds the following translations:

- [Translate some part of Gantt chart of Wekan Gantt GPL version](https://github.com/wekan/wekan/commit/fd363c69cc6e1cf3a283e3dbcc323edb1eae896e).
  This only adds translations to all Wekan versions, not any GPL code to MIT version.
  Thanks to xet7.

and fixes the following bugs:

- [Fix Trello import](https://github.com/wekan/wekan/commit/faad739f974a0392ca73e4db03e5267edcc5dec7).
  Thanks to elct9620 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.48 2020-11-02 Wekan release

This release adds the following new features:

- [Smaller board icons to All Boards Page, and use full page width, so more board icons fit visible at once.
  Removed variable height, because different heights made it look a little unbalanced](https://github.com/wekan/wekan/commit/0a5f9307d27a4b77aa7ff005701fea8ce0d50ec8).
  Thanks to xet7.
- [Admin Panel / Settings / Layout / Custom Top Left Corner Logo Height](https://github.com/wekan/wekan/commit/4cfddf1d8d37bdbbb58c050333ee6ea2afc3e6f9).
  Thanks to xet7.
- [When RICHER_CARD_COMMENT_EDITOR=true, use richer editor also when editing card description](https://github.com/wekan/wekan/commit/4e2d337620ac490b8e99ee968e6f92477e09b900).
  Thanks to xet7.

and removes the following dependencies:

- [Removed hot-module-replacement and mdg:meteor-apm-agent](https://github.com/wekan/wekan/commit/aa454a5542e5ab1d581eef50cdb5c96ac2ada940).
  Thanks to xet7.

and fixes the following bugs:

- [Fix Clone Board](https://github.com/wekan/wekan/commit/f4fdb94a3fcd63432ef7ded4df970b3491700020).
  Thanks to e-gaulue and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.47 2020-11-01 Wekan release

This release fixes the following bugs:

- [Fix: OAuth2 fails with self-signed server certificate](https://github.com/wekan/wekan/pull/3325) and
  [Added related settings for OAUTH2_CA_CERT that is optional OAuth2 CA Cert](https://github.com/wekan/wekan/commit/55252300c601ea40dc8adad1887397b31ceb0bb2).
  Thanks to faust64 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.46 2020-10-30 Wekan release

This release adds the following updates:

- [Upgrade to Meteor 2.0-beta.4](https://github.com/wekan/wekan/commit/af583145ed2b36af8e6c72765fd35d70a292fad6).
  Thanks to Meteor developers.

and fixes the following bugs:

- [Fix: Use current boardId when a worker moves a card](https://github.com/wekan/wekan/pull/3323).
  Thanks to jtbairdsr.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.45 2020-10-30 Wekan release

This release fixes the following bugs:

- [Fix can not upload and download files, by changing back to Node.js 12.19.0 and adding
  fast-render](https://github.com/wekan/wekan/commit/d2f434879caa20d69651f23fa2124074f55c9893).
  Current file storing to MongoDB code was not yet compatible with newer Node.js.
  Thanks to eskogito and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.44 2020-10-28 Wekan release

This release adds the following new features:

- For development, [add Meteor 2.0 Hot Module Replacement](https://github.com/wekan/wekan/commit/e6162472548d9dff497dd76e82d23044f779f757).
  More info at https://forums.meteor.com/t/meteor-2-0-beta-with-hot-module-replacement-hmr/54313/8 .
  Thanks to zodern.

and adds the following updates:

- [Upgrade to Node.js 14.15.0](https://github.com/wekan/wekan/commit/045e9db7b8f0de852ef4486cb1ad200d6ca7296d).
  Thanks to Node.js and Meteor.js developers.
- [Upgrade to Meteor 2.0-beta.3. Removed fast-render and ostrio:cookies](https://github.com/wekan/wekan/commit/a463f2a855498935db5b66e5fad446ce465adab1).
  Thanks to Meteor.js developers and xet7.

and fixes the following bugs:

- [Fixed: With ORACLE_OIM_ENABLED, allow setting OAUTH2_REQUEST_PERMISSIONS with environment variable](https://github.com/wekan/wekan/commit/1b429b3f99c32840ebb0ff9a29015aa8c28ec644).
  Thanks to xet7.
- [Changed public board changing Swimlanes/Lists/Calendar view and changing Hide minicard label text
  from using cookies to using browser localStorage](https://github.com/wekan/wekan/commit/460b1d3a664b648bc03c40422b9d175401e229c1),
  to remove some errors from browser inspect console.
  Thanks to xet7.
- [Fix Modern theme board canvas background](https://github.com/wekan/wekan/pull/3312).
  Thanks to helioguardabaxo.
- [Fix: 1) Expose moving cards on mobile to workers. 2) Hide the move to another board functionality
  in the submenu (only from the worker) so that the worker is still constrained to a single
  board](https://github.com/wekan/wekan/pull/3315).
  Thanks to jtbairdsr.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.43 2020-10-20 Wekan release

This release adds the following new features:

- [Allow more than one assignee](https://github.com/wekan/wekan/commit/acf9e7caeaf59e1030ae1014c0cb2fb7dae27147).
  Thanks to xet7.

and fixes the following bugs:

- [Fixed CSV/TSV export](https://github.com/wekan/wekan/commit/d7333dec84328ca191f430d96aaf9e550840631a).
  Please test and report any problems [at issue #3173](https://github.com/wekan/wekan/issues/3173).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.42 2020-10-14 Wekan release

This release adds the following updates:

- [Upgrade to Node.js 12.19.0](https://github.com/wekan/wekan/commit/b8a209249e968b90917af319adf24fedf2157396).
  Thanks to Node.js developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.41 2020-10-03 Wekan release

This release adds the following new features:

- [Login with OIDC OAuth2 Oracle on premise identity manager OIM, with setting ORACLE_OIM_ENABLED=true](https://github.com/wekan/wekan/commit/ec8a78537f1dc40e967de36a02ea09cf7398318a).
  More info [at wiki](https://github.com/wekan/wekan/wiki/Oracle-OIM).
  Thanks to xet7.
- [At Admin Panel / Layout: Text below Custom Login Logo. Can have markdown formatting](https://github.com/wekan/wekan/commit/7223d6e75057d1412862a97b8a43c34ec23b16e9).
  Thanks to xet7.

and adds the following updates:

- [Update dependencies](https://github.com/wekan/wekan/commit/b796a6cbf4911c14ff036a51db0252e08d3a5ef8).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.40 2020-09-18 Wekan release

This release adds the following new features:

- Custom Logo for Login and Top Left Corner. Optional link when clicking logo.
  Settings at Admin Panel / Layout.
  [Part 1](https://github.com/wekan/wekan/commit/a7c3317ed696fad8e211b22afbb3012f3a4f2ddb),
  [Part 2](https://github.com/wekan/wekan/commit/05e3fc31b4633978a6b002a0325aad8e74d57ec4),
  [Part 3](https://github.com/wekan/wekan/commit/3fc80e1145b23f8e6c7492ef4e3313b02f3d8772).
  Thanks to xet7.

and adds the following updates:

- [Upgrade to Meteor v1.11.1](https://github.com/wekan/wekan/commit/185cf163b23280af5a7910381209984e2362a452).
  Thanks to Meteor developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.39 2020-09-17 Wekan release

This release adds the following new features:

- [Impersonate one user](https://github.com/wekan/wekan/pull/3280) and
  [related translatable strings](https://github.com/wekan/wekan/commit/81ac0fdba9b52477dbbe7b6ed01b6d299288bcca).
  Thanks to Akuket and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.38 2020-09-16 Wekan release

This release fixes the following CRITICAL VULNERABILITIES:

- [Upgrade to Node.js v12.18.4](https://github.com/wekan/wekan/commit/5cd9f89b21e6f800c2b78da49a1c0cf7f6fba955).
  Thanks to Node.js developers.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.37 2020-09-15 Wekan release

This release adds the following UI improvements:

- [UI improvements in filter, multi-selection and rules](https://github.com/wekan/wekan/pull/3279).
  Thanks to helioguardabaxo and xet7.

and adds the following updates:

- [Update release scripts](https://github.com/wekan/wekan/commit/e79b7fad0a35f29020c48a4a4eedb435573c9bf1).
  Thanks to xet7.

and fixes the following bugs:

- [Fix parse error in docker-compose.yml](https://github.com/wekan/wekan/pull/3278).
  Thanks to devilmengcry.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.36 2020-09-15 Wekan release

This release adds the following new features:

- [Added translations for date selection popups](https://github.com/wekan/wekan/commit/f9b0da65f1de48a2af11aa7afbd767559ba95b79).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.35 2020-09-14 Wekan release

This release tries to fix the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/7173e293ef6b0d3c1fe82b5320340589c72c9326).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.34 2020-09-14 Wekan release

This release tries to fix the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/d2b84c7773f20b34bca8be23078469a8809005a6).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.33 2020-09-14 Wekan release

This release adds the following login settings:

- [Added some CAS and SAML settings](https://github.com/wekan/wekan/commit/214c86cc22f4c721a79ec0a4a4f3bbd90d673f93).
  Not tested. Please test and send pull requests if it does not work.
  See https://github.com/wekan/wekan/wiki/SAML and https://github.com/wekan/wekan/wiki/CAS .
  Thanks to xet7.

and updates some dependencies:

- [Update dependencies](https://github.com/wekan/wekan/commit/cca041e21a66087ca4008a22cb0f5b4176801101).
  Thanks to developers of dependencies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.32 2020-09-13 Wekan release

This release tried to fix the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.31 2020-09-13 Wekan release

This release tried to fix the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/fe62e12ab46c41ea30ba79795b0dc39b3451d4a2).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.30 2020-09-13 Wekan release

This release adds the following new features and improvements:

- [Add setting for OAUTH2_ADFS_ENABLED=true](https://github.com/wekan/wekan/pull/3269)
  for [SSO Integration with ADFS 4.0 using OAuth 2 and OpenID](https://github.com/wekan/wekan/issues/3184).
  Thanks to phaseshift3r.
- [Add setting OAUTH2_ADFS_ENABLED=false for most platforms. Remove mouse scroll settings of already removed custom scrollbar.
  Add testing for both string and boolean version of true](https://github.com/wekan/wekan/commit/f6bdb4d694453d73f4bfa6a75814833594cf5000).
  Thanks to xet7.
- [Design improvements in templates, card details and custom fields](https://github.com/wekan/wekan/pull/3271)
  and [related change to translation](https://github.com/wekan/wekan/commit/fe40c5fd37a7c54240c080caf98b6130229f5d31).
  Thanks to helioguardabaxo and xet7.

and adds the following updates:

- [Use forked & updated version of gridfs-stream](https://github.com/wekan/wekan/pull/3270).
  Thanks to blaggacao.
- [Update dependencies](https://github.com/wekan/wekan/pull/3268).
  Thanks to blaggacao.
- [Update npm-mongo dependency](https://github.com/wekan/wekan/commit/9fdafd20081b20302af3d1a6397fb840348f1209).
  Thanks to filipenevola.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.29 2020-09-11 Wekan release

This release adds the following new features:

- [Changed markdown from marked to markdown-it](https://github.com/wekan/wekan/commit/20b01771055ca4d8871d13abb559ab92ecee10f4) and
  added emoji support https://github.com/wekan/wekan/wiki/Emoji .
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.28 2020-09-11 Wekan release

This release updates some dependencies:

- [Update some dependencies](https://github.com/wekan/wekan/commit/125c4684bd6815a8f49241bc2663e82112afe67b).
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Fix card scrollbar on Windows](https://github.com/wekan/wekan/pull/3264).
  Thanks to tborychowski.
- [Try to fix language names](https://github.com/wekan/wekan/commit/f81fd8084fd6cd1ad57daefcc22ed1fb0acaaeca).
  Thanks to buplet, xoas and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.27 2020-09-09 Wekan release

This release fixes the following bugs:

- [Reverted incomplete fix for "Checklist + card title with starting number and point", because it disabled some markdown.
  Also more fixes to GFM checklist not displayed properly](https://github.com/wekan/wekan/commit/bf18792d7733d6e6cfb61a8d6db4caafdcc19b34).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.26 2020-09-05 Wekan release

This release adds the following quality checks:

- [Added GitHub automatic code quality analysis](https://github.com/wekan/wekan/commit/df35683043603f6ecb9bd4f2a4b357e374397ad1).
  Thanks to xet7.

and updates the following dependencies:

- [bl](https://github.com/wekan/wekan/commit/7ec671bb9f8a33c5eb28c26b98143f9b4cd9b958).
  Thanks to developers of dependencies.
- [Delete markdown demo that is not in use](https://github.com/wekan/wekan/commit/d344c39d497cc291ee7927fdda900dc8bac22bc2).
  Thanks to xet7.
- [Update markdown and xss](https://github.com/wekan/wekan/commit/cfcbf640d64bdfc4f3a482c32e35f396e1a22191)
  Thanks to developers of dependencies.

and fixes the following bugs:

- [Disable list formatting and converting to HTML. This fixes markdown numbering and viewing bugs](https://github.com/wekan/wekan/commit/41b1c55988a9a65005ac0b9e1ddcc0596c047a49).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.25 2020-08-31 Wekan release

This release adds the following docker-compose.yml changes:

- [Mongo 4.4 does not work. Mongo 4.2 and 3.x works](https://github.com/wekan/wekan/commit/5d2daa4a80c819f0610ff2f17589de1e1085836c).
  Thanks to GuidoDr for info. Related https://github.com/wekan/wekan/issues/3247

and adds the following Nextcloud documentation:

- [Improving documentation for Nextcloud integration](https://github.com/wekan/wekan/pull/3248).
  Thanks to relikd.

and removes the following code and allows double quotes in code:

- Removed custom scrollbar [1](https://github.com/wekan/wekan/pull/3246) and [2](https://github.com/wekan/wekan/commit/5870d38e8e63159ede8c18d1766a4f9f6ba8987c).
  Also in eslint settings allowed double quotes in code. Thanks to tborychowski and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.24 2020-08-27 Wekan release

This release adds the following updates:

- [Upgrade to Meteor 1.11](https://github.com/wekan/wekan/commit/4d49265b25595444553e1c2d6e48c7a699949654).
  Thanks to Meteor developers.
- [Update bcrypt](https://github.com/wekan/wekan/commit/dee7020a5aaa90c8580ef42fa73aff0ca4ae3e12).
  Thanks to bcrypt developers.
- [Update dependencies](https://github.com/wekan/wekan/commit/60b2787c559b9966d6040a622c5b971fa95241c3).
  Thanks to developers of dependencies.

and adds the following translations:

- [Add Trigger and Action header words to Rule Details](https://github.com/wekan/wekan/pull/3244).
  Thanks to helioguardabaxo.
- [Add Spanish (Peru) (es_PE)](https://github.com/wekan/wekan/commit/b9f87bf310b4f071c8219bb7511b15a7fa27340d).
  Thanks to translators.

and adds the following mouse scroll settings:

- [Add setting for mouse scroll deltafactor. Fix snap setting for mouse scroll amount](https://github.com/wekan/wekan/commit/7e4b791c2964f4b130abbaee62ffdff1536450c4).
  Thanks to danger89 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.23 2020-08-13 Wekan release

This release fixes following CRITICAL VULNERABILITIES:

- [Update vulnerable dependency elliptic that is dependency of meteor-node-stubs that is dependency of
  Wekan](https://github.com/wekan/wekan/commit/910f0cecbe7a4b3fdff603e5e74c2cb1c40b660b).
  Thanks to filipenevola, neeldug, L25inux and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.22 2020-07-23 Wekan release

This release adds back these features:

- [Export to JSON and HTML .zip file](https://github.com/commit/1624fc82f7c319e84a78f29445c7867f7da15c32)
  that also fixes #3216 Clone Boards not working.
  Thanks to xet7.

and hides these features temporarily:

- [Hide CSV export until it's fixed in EdgeHTML compatible way](https://github.com/wekan/wekan/commit/045b8a84a29dde09201dd5108c757719d00e6f55).
  Thanks to xet7.

and adds the following updates:

- [Upgrade to Node 12.18.3](https://github.com/wekan/wekan/commit/6f503ca818abff17a20b6612aeea1f9e2c4a8234).
  Thanks to Node developers.

and fixes the following bugs:

- [Fix Snap](https://github.com/wekan/wekan/commit/68391a943bd37d9f98819ffb7b7a29692d0bd380).
  This fix was already included to Wekan v4.21 to get it released.
  TODO: Sometime migrate from Caddy v1 to Caddy v2.
  Thanks to xet7.
- [Fix detecting current IP address on rebuild-wekan.sh](https://github.com/wekan/wekan/commit/ec1d8f275ff4cd720a8cd3bc918b32f9c5f5d099).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.21 2020-07-21 Wekan release

This release adds the following new features:

- [REST API: Changed edit_card and get_card_by_customfields to return full documents](https://github.com/wekan/wekan/pull/3215).
  Thanks to gvespignani70.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.20 2020-07-20 Wekan release

This release adds the following updates:

- Update dependencies [Part1](https://github.com/wekan/wekan/commit/419615bed43b6e9de4030193c47137a066b85bde) and
  [Part2](https://github.com/wekan/wekan/commit/116372e11e09ce9b8376a8694553add595e02815).
  Thanks to developers of dependencies and xet7.

and fixes the following bugs:

- [Change slug on card rename](https://github.com/wekan/wekan/pull/3214).
  Thanks to NicoP-S.
- [Add missing Wekan logo sizes for PWAs and Apps](https://github.com/wekan/wekan/commit/de28bf8569a7373a5d6fd60a4f413e76673adc26).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.19 2020-07-18 Wekan release

This release adds the following features:

- [Add support for EdgeHTML browser (Microsoft Legacy Edge, not based on Chromium) by removing incompatible csv-stringify package.
  CSV export will be fixed later](https://github.com/wekan/wekan/commit/b9a4b0b51d3692fcbb715b1afc875f21cd204ae5).
  Thanks to xet7.

and adds the following updates:

- Update dependencies [Part1](https://github.com/wekan/wekan/commit/23ee93ca3d4ea161a93627a8e28e1ce93eea1bab),
  [Part2](https://github.com/wekan/wekan/commit/6646d48ccbaf04c4935de35fe037eff3bd7fd469),
  [Part3](https://github.com/wekan/wekan/commit/87cb4598f745a362aaac06b8b457198c40aaf61e),
  [Part4](https://github.com/wekan/wekan/commit/f57ed2990f5c6e1af10d270b24c7092805711afe).
  Thanks to developers of dependencies and xet7.

and fixes the following bugs:

- [Checklist Item PUT API: boolean cast on isFinished](https://github.com/wekan/wekan/pull/3211).
  Thanks to Robert-Lebedeu.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.18 2020-07-10 Wekan release

This release adds the following updates:

- [Upgrade to Node 12.18.2](https://github.com/wekan/wekan/commit/6e4407ed9cb3c95a99e0dbbb4383324dd57d6be1).
  Thanks to Node developers and xet7.
- [Update dependencies](https://github.com/wekan/wekan/commit/05cd1247ab935f586d747743bb9cd79d23e0b1e6).
  Thanks to dependency developers and xet7.

and fixes the following bugs:

- [All logged in users are now allowed to reorder boards by dragging at All Boards page and Public Boards page](https://github.com/wekan/wekan/commit/ba24c4e40c728d030504ed21ccf79247d0449e1b).
  Thanks to xet7.
- [Fix running meteor for dev in rebuild-wekan.sh](https://github.com/wekan/wekan/commit/a77cf56fbdaf0b74d8b97aa41b0a88fee85e3ee1).
  Thanks to xet7.
- [Fix start-wekan.bat](https://github.com/wekan/wekan/commit/0be1c00fccef8797a1b3612593a6623a9b465e0d) and
  [Windows bundle install](https://github.com/wekan/wekan/wiki/Windows#a-bundle-with-windows-nodemongodb).
  Thanks to xet7.
- [Fix typo](https://github.com/wekan/wekan/pull/3197).
  Thanks to Lua00808.
- [Fix creating user misbehaving in some special case](https://github.com/wekan/wekan/pull/3206).
  Thanks to salleman33.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.17 2020-06-18 Wekan release

This release fixes the following bugs:

- [Revert finding correct user changes that were made at Wekan v4.16](https://github.com/wekan/wekan/commit/5eb378452761ad1d6d67a491316007fdf6dfd689).
  Thanks to xet7.
- [Fix activities view on mobile devices](https://github.com/wekan/wekan/pull/3183).
  Thanks to marc1006.
- [Add back checks about can user export CSV/TSV](https://github.com/wekan/wekan/commit/afe00d02cddf016a3ccc1ed9a98a7f10d3339f26).
  Thanks to marc1006 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.16 2020-06-17 Wekan release

This release adds the following features:

- [Add find-replace.sh script for development](https://github.com/wekan/wekan/commit/bda49ed60947e0438206b2f55119f5c5c132c734).
  Thanks to xet7.

and adds the following updates:

- [Upgrade to Node 12.18.1](https://github.com/wekan/wekan/commit/b11ae567c9b2d16a115ea4f3f7f88e67d076f326).
  Thanks to Node developers and xet7.

and fixes the following bugs:

- [OpenAPI: Fix jsdoc/operation matching](https://github.com/wekan/wekan/pull/3171).
  Thanks to bentiss.
- Fix finding corrent user [Part1](https://github.com/wekan/wekan/pull/3180) and
  [Part2](https://github.com/wekan/wekan/commit/f245b6b7faa29b4f276527daca48c305fe9689c1).
  Thanks to salleman33 and xet7.
- [Try to prevent errors on CSV/TSV export](https://github.com/wekan/wekan/commit/b00db983c8506e0cdc9968e452c3c8025fc10776).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.15 2020-06-16 Wekan release

This release fixes the following bugs:

- Fix lint errors [Part1](https://github.com/wekan/wekan/commit/f1587753cb0bba38e4b1df2e0300d3dc2826da72) and
  [Part2](https://github.com/wekan/wekan/commit/e6629779f77676eadfe4465c407f0bee0ec64061).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.14 2020-06-16 Wekan release

This release adds the following new features:

- [Add user option to hide finished checklist items. Strikethrough checked items](https://github.com/wekan/wekan/pull/3167).
  Thanks to marc1006.
- [Added the possibility to start a vote via API edit_card. And added some better visibility to see what was voted](https://github.com/wekan/wekan/pull/3170).
  Thanks to NicoP-S.

and adds the following updates:

- [Update dependencies](https://github.com/wekan/wekan/commit/8f34cdc279602e97085e0a504f7716495349f83c).
  Thanks to xet7.

and fixes the following bugs:

- [Fix infinite scrolling for activities](https://github.com/wekan/wekan/pull/3168).
  Thanks to marc1006.
- [Remove top and bottom margin for hidden checklist items](https://github.com/wekan/wekan/pull/3172).
  Thanks to marc1006.
- [Alignment and spacing of minicard labels](https://github.com/wekan/wekan/pull/3174).
  Thanks to hgustafsson.
- [Fix: Unable to delete a custom field in a board](https://github.com/wekan/wekan/commit/3b2b1087447bc8613baa8254bfec55e3d485bdc4).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.13 2020-06-09 Wekan release

This release adds the following updates:

- [OpenShift template updates](https://github.com/wekan/wekan/pull/3158), Thanks to jimmyjones2:
  1) Remove status fields (this is created by Kubernetes at run time)
  2) The latest MongoDB by default available with OpenShift is 3.6
  3) Change MongoDB service name to contain wekan to avoid potentially conflicting with other mongodb instances in the same project.

and fixes the following bugs:

- [Copy the labels only if the target board is different](https://github.com/wekan/wekan/pull/3154).
  Thanks to marc1006.
- [Fix condition whether a card is in list](https://github.com/wekan/wekan/pull/3165).
  Thanks to marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.12 2020-06-08 Wekan release

This release fixes the following CRITICAL SECURITY VULNERABILITIES:

- Fix XSS bug reported 2020-05-24 by [swsjona](https://twitter.com/swsjona):
  [Part 1](https://github.com/wekan/wekan/commit/1f85b25549b50602380f1745f19e5fe44fe36d6f),
  [Part 2](https://github.com/wekan/wekan/commit/fb44df981581354bf23a6928427ad2bf73c4550f),
  [Part 3](https://github.com/wekan/wekan/commit/99f68f36b028d6c75acf2e5b83585b1acee65f97),
  [Part 4](https://github.com/wekan/wekan/commit/8a622ec7c3043bf8f34399ef34563e6a9a19dcd8).
  Logged in users could run javascript in input fields. This was partially fixed at v3.85,
  but at some fields XSS was still possible. This affects at least Wekan versions v3.12-v4.12.
  After this fix, Javascript in input fields is not executed.
  Thanks to swsjona, marc1006 and xet7.

and adds the following new features:

- Change default view to Swimlanes:
  [Part 1](https://github.com/wekan/wekan/commit/8c3322f9a93c321e8a2cc5cfcd4b1d6316a5fb7c),
  [Part 2](https://github.com/wekan/wekan/commit/61e682470cdaef42cce2d74b41fb752cfc61848b),
  [Part 3 Change dropdown order to Swimlanes/Lists/Calendar](https://github.com/wekan/wekan/commit/7f6d500cbec15496ae357b05b9df3f10e51ed1f1),
  [Part 4.1. Public board default view to Swimlane. Part 4.2. When changing Public board
  view (sets view cookie), also reload page so view is changed
  immediately](https://github.com/wekan/wekan/commit/39519d1cc944c567837be0f88ab4a037e2144c61).
  Thanks to xet7.
- [Use markdown in Swimlane titles](https://github.com/wekan/wekan/commit/6b22f96313354b45b851b93c25aa392bbe346bdb).
  Thanks to xet7.

and adds the following updates:

- [Update minifier-css](https://github.com/wekan/wekan/commit/cb1e91fee83eaad1e926c288c0abfc1e4f2a8bd4).
  Thanks to xet7.

and fixes the following bugs:

- Fix indent [Part1](https://github.com/wekan/wekan/commit/415e94d187ffcb9a4afaecc5c6960a50a87ca7eb),
  [Part 2](https://github.com/wekan/wekan/commit/96494bacf550cde65598e6d59199517f311aa33d).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.11 2020-06-04 Wekan release

This release adds the following new platforms:

- [Using arm64 bundle on Raspberry Pi OS arm64 with MongoDB 4.2.x for RasPi3 and
  RasPi4](https://github.com/wekan/wekan/wiki/Raspberry-Pi#raspberry-pi-os-arm64-with-mongodb-42x).
  Thanks to Raspberry Pi OS devs, MongoDB devs and xet7.
- [s390x RHEL 8](https://github.com/wekan/wekan/wiki/s390x#rhel-8).
  Thanks to IBM, Red Hat Linux, Linux Foundation and xet7.

and adds the following updates:

- [Upgrade to Node v12.18.0](https://github.com/wekan/wekan/commit/d9d451a206cabe7f6ca8ad5d35eb76443198e4c1).
  Thanks to Node developers and xet7.
- [Update `markedjs` package](https://github.com/wekan/wekan/pull/3149).
  Thanks to marc1006.
- [Add fibers](https://github.com/wekan/wekan/commit/cd49018306f826fff37b7024dfde9de05d88b620).
  Thanks to xet7.

and adds the following new features:

- [Add Calendar Month Event List view](https://github.com/wekan/wekan/commit/f73ea218eefba3f0d6c642849dfede9e03052d25).
  Thanks to xet7.
- [Added dates & assignees to REST API calls](https://github.com/wekan/wekan/pull/3146).
  Thanks to GitGramm.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.10 2020-05-30 Wekan release

This release adds the following new features:

- [Added an API to get the cards for a specific custom field value](https://github.com/wekan/wekan/pulls/3131).
  Thanks to gvespignani70.

and adds the following updates:

- [Upgrade to Node v12.17.0](https://github.com/wekan/wekan/commit/3ade9d95a69b269c345127e1755e1b539dc07263).
  Thanks to Node developers and xet7.

and fixes the following bugs:

- [Fix email verification in `sendSMTPTestEmail`](https://github.com/wekan/wekan/pull/3135).
  Thanks to marc1006.
- [Try to Fix Registration broken "Templates board id is required" with ugly hack. If it works, ugly becomes
  beautiful](https://github.com/wekan/wekan/pull/3140).
  Thanks to marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.09 2020-05-27 Wekan release

This release fixes the following bugs:

- [Fix vote export & export/import currency custom field to CSV/TSV](https://github.com/wekan/wekan/pull/3128).
  Thanks to brymut.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.08 2020-05-26 Wekan release

This release adds the following new features:

- [Add the 'Currency' Custom Field type](https://github.com/wekan/wekan/pull/3123).
  Thanks to habenamare.

and adds the following updates:

- [Add some changes to Modern theme](https://github.com/wekan/wekan/commit/6a1bc167cf10e75d61b3196db9eac2978d70ad8e).
  Thanks to jeroenstoker and xet7.

and fixes the following bugs:

- [Fix typo that caused parse error](https://github.com/wekan/wekan/commit/351d9d0c9577c9d543d543bc12a51388b0141324).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.07 2020-05-26 Wekan release

This release fixes the following bugs:

- [Fix move selection](https://github.com/wekan/wekan/pull/3120).
  Thanks to marc1006.
- [Fix Python API generation](https://github.com/wekan/wekan/pull/3121).
  Thanks to marc1006.
- [Fix default value of `sort`](https://github.com/wekan/wekan/pull/3122).
  Thanks to marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.06 2020-05-25 Wekan release

This release fixes the following bugs:

- [Fix Card export CSV, check for vote
  undefined](https://github.com/wekan/wekan/commit/8eafa1ac66fdcf5fb5f0a95aa6cfee454ddad67f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.05 2020-05-25 Wekan release

This release adds the following new features:

- [Import/Export Custom Fields in CSV/TSV](https://github.com/wekan/wekan/pull/3115).
  Thanks to brymut.

and adds the following updates:

- [Update packages](https://github.com/wekan/wekan/commit/3b44acd87c35340bf9fe5d210f4402f1b1a1dfdf).
  Thanks to xet7.

and fixes the following bugs:

- Try to fix Snap [1](https://github.com/wekan/wekan/commit/6fad68b9b9afd8de7074037d73eeac40f6a3f7c1), [2](https://github.com/wekan/wekan/commit/b737adfcdfc9b8084a7eb84420a89c014bbec1fb). Later reverted those like other ostrio-files changes too.
  Thanks to xet7.
- [Add default attachments store path /var/snap/wekan/common/uploads where attachments will be
  stored](https://github.com/wekan/wekan/commit/c61a126c8bcb25a1eda0203b89c990ae31de7a70).
  Thanks to xet7.
- [Make scrollParentContainer() more robust as it's used in a timeout callback. Example exception: Exception in setTimeout callback: TypeError: Cannot read property 'parentComponent' of null. Probably there is a better fix for this](https://github.com/wekan/wekan/commit/d5fbd50b760b1d3b84b5b4e8af3a8ed7608e2918).
  Thanks to marc1006.
- [Fix error link not available. Fixes: Exception in template helper: TypeError: Cannot read property 'link' of
undefined](https://github.com/wekan/wekan/commit/b7105d7b5712dcdbf9dadebfddaba7691810da5c).
  Thanks to marc1006.
- [Fix minicard cover functionality. Otherwise, if `this.coverId` is undefined then `Attachments.findOne()` would return any
attachment](https://github.com/wekan/wekan/commit/66d35a15280795b76a81c3e59cebbd2a29e4dff8).
  Thanks to marc1006.
- [Some fixes suggested by deepcode.ai](https://github.com/wekan/wekan/pull/3112).
  Thanks to marc1006.
- [Sorry marc1006, I had to revert deepcode.ai arrow function fixes because Python API docs generator does not work all when code has arrow functions](https://github.com/wekan/wekan/commit/f9018fc3a87080d8d97c371e29a8f3f0a20ca932).
  Thanks to xet7.
- [Move In Progress ostrio-files changes to separate branch, and revert ostrio-files changes, so that:
  Export to CSV/TSV with custom fields works, Attachments are not exported to disk,
  It is possible to build arm64/s390x versions
  again](https://github.com/wekan/wekan/commit/d52affe65893f17bab59bb43aa9f5afbb54993d3).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.04 2020-05-24 Wekan release

Please use v4.05 or newer instead, that works better.

This release adds the following features:

- [Found Time Tracking GPLv3 software "Titra" with integration to Wekan](https://github.com/wekan/wekan/wiki/Time-Tracking).
  Thanks to willhseitz.
- [Theme: Natural](https://github.com/wekan/wekan/pull/3098).
  You can select it from Board Settings / Change color / natural.
  Thanks to compumatter and helioguardabaxo.
- [Theme: Modern](https://github.com/wekan/wekan/pull/3106).
  Thanks to jeroenstoker com and helioguardabaxo.
- [Export board to HTML static page .zip archive](https://github.com/wekan/wekan/pull/3043).
  Thanks to Lewiscowles1986.

and fixes the following bugs:

- [Change the swimlaneid of a card only if a new target swimlaneid is selected](https://github.com/wekan/wekan/pull/3108).
  Thanks to marc1006.
- [Set '*' as default value for swimlane and list name in card move action](https://github.com/wekan/wekan/pull/3109).
  Thanks to hickorysb and marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.03 2020-05-16 Wekan release

This release adds the following features:

- [Theme: Clearblue](https://github.com/wekan/wekan/pull/3093).
  You can select it from Board Settings / Change color / clearblue.
  Thanks to CidKramer.

and fixes the following bugs:

- [Fix Can't Scroll on All Boards on mobile phone. Added drag handles](https://github.com/wekan/wekan/issues/3096).
  Thanks to xet7.
- [Try to fix Sandstorm Wekan Export menu](https://github.com/wekan/wekan/commit/1ac11d92ba8f38981c87db25e5b5e1fa2adb6968).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.02 2020-05-15 Wekan release

This release adds the following server platforms:

- [Android arm64/x64](https://github.com/wekan/wekan/wiki/Android).
  Thanks to xet7.

and adds the following features:

- [Install Wekan to mobile homescreen icon and use fullscreen
  PWA](https://github.com/wekan/wekan/commit/8d5adc04645e3e71423f16869f39b8d79969bccd).
  [Docs for iOS and Android at wiki PWA page](https://github.com/wekan/wekan/wiki/PWA).
  Thanks to xet7.
- [Add options to rebuild-wekan.sh to run Meteor in development mode where after
  file change it rebuilds](https://github.com/wekan/wekan/commit/5f915ef966170ea7baca7ddeb11319bc08a26fef).
  Thanks to xet7.

and adds the following updates:

- [Update dependencies](https://github.com/wekan/wekan/commit/75bdd33fda58ea0233f5b38c466bcb1a9b0406ab).
  Thanks to xet7.

and adds the following translations:

- [Add Spanish (Chile)](https://github.com/wekan/wekan/commit/96507e6777ed77a324eaec9799c5b46b0d25ad26).
  Thanks to isos, Transifex user.

and fixes the following bugs:

- [Fix Deleting linked card makes board not load](https://github.com/wekan/wekan/issues/2785).
  Thanks to marc1006 and xet7.
- [Fix getStartDayOfWeek once again](https://github.com/wekan/wekan/pull/3061).
  Thanks to marc1006.
- [Fix shortcuts list and support card shortcuts when hovering
  a card](https://github.com/wekan/wekan/pull/3066).
  Thanks to marc1006.
- [Add white-space:normal to copy-to-clipboard button in card
  details](https://github.com/wekan/wekan/pull/3075).
  Thanks to helioguardabaxo.
- [Fix avatar-image class](https://github.com/wekan/wekan/pull/3083).
  Thanks to krupupakku.
- [Fix Swimlanes ID missing in new boards](https://github.com/wekan/wekan/pull/3088).
  Thanks to krupupakku.
- [Fix REST API so Create card does now allow an empty member
  list](https://github.com/wekan/wekan/pull/3084).
  Thanks to wackazong.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.01 2020-04-28 Wekan release

This release adds the following updates:

- [Upgrade to Node v12.16.3](https://github.com/wekan/wekan/commit/1d89e96dd101c11913f1acdd6d16b5650eaf18a7).
  Thanks to Node developers and xet7.

and fixes the following bugs:

- [Fix Docker builds](https://github.com/wekan/wekan/commit/280e66947e3afa878c41e876cf827ebcec81a2c6).
  Thanks to xet7.
- [Fix Cards and Users API docs at https://wekan.github.io/api/ not generated because of
  syntax error and new Javascript syntax](https://github.com/wekan/wekan/commit/9ae20a3f51e63c29f536e2f5b3e66a2c7d88c691).
  Wekan uses wekan/releases/generate-docs*.sh Python code to generate OpenAPI docs,
  it did not show any errors while generating docs, only left out parts of API docs.
  This affected Wekan versions v3.94-v4.00.
  Thanks to pvcon13 and xet7.
- [Fix list header height when cards count is shown](https://github.com/wekan/wekan/pull/3056).
  Thanks to marc1006.
- [Smaller height for Add Board button](https://github.com/wekan/wekan/commit/6afc9259f084717a0cc3ce6d66979fd7c1471939).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.00 2020-04-27 Wekan release

This release fixes the following bugs:

- [Make sure that the board header buttons fit into one line even for devices with 360px width
  resolution](https://github.com/wekan/wekan/pull/3052).
  Thanks to marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.99 2020-04-27 Wekan release

This release fixes the following bugs:

- [Fix Boards are very hard to tap in mobile](https://github.com/wekan/wekan/pull/3051).
  Thanks to marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.98 2020-04-25 Wekan release

News:

- There is now many mobile and desktop webbrowser fixes. Please test does your
  favourite Javascript enabled webbrowser work, and add issues if something
  does not work, and there is no existing issue about that yet.
- Desktop browser mode has setting for Show/Hide drag handles:
  top right click username / Change Settings / Show desktop drag handles.
  You can request desktop website also at mobile webbrowsers on Android.
  At iOS requesting desktop website did not seem to work yet.
- At iOS Safari and Chrome, to see swimlane buttons you need to scroll to right.
  Fixes to this and other issues are welcome as pull request.

This release adds the following new features:

- [Pre-fill the title of checklists (Trello-style)](https://github.com/wekan/wekan/pull/3030).
  Thanks to boeserwolf.
- [Implement option to change the first day of the week in user settings](https://github.com/wekan/wekan/pull/3032).
  Thanks to marc1006.
- [Add babel to build chain and linter. Enables fancy Javascript language
  features like optional chaining, for developer happiness](https://github.com/wekan/wekan/pull/3034).
  Thanks to boeserwolf.
- [Use only one 'Apply' button for applying the user settings](https://github.com/wekan/wekan/pull/3039).
  Thanks to marc1006.
- [Allow variable height for board list items. Allow words in title/description to be able to break
  and wrap onto the next line](https://github.com/wekan/wekan/pull/3046).
  Thanks to marc1006.

and adds the following updates:

- [Upgrade to Meteor 1.10.2](https://github.com/wekan/wekan/commit/d1f98d0c472fb41e25fb29a9a6f6dae7db003f6f).
  Thanks to Meteor developers and xet7.
- [Set Snap MongoDB compatibility to 4.2 according to Meteor ChangeLog](https://github.com/wekan/wekan/commit/7de18eccea3854db3be6197bf21afbfd3ddb65a6).
  Thanks to xet7.

and fixes the following bugs:

- [Multiple lint issue fixes](https://github.com/wekan/wekan/pull/3031).
  Thanks to marc1006.
- [Fix lint errors in lint error fix](https://github.com/wekan/wekan/commit/9e95c06415e614e587d684ff9660cc53c5f8c8d3).
  Thanks to xet7.
- [Fix getStartDayOfWeek function](https://github.com/wekan/wekan/pull/3038).
  Thanks to marc1006 and boeserwolf.
- Improve mobile devices support [Part1](https://github.com/wekan/wekan/pull/3040) and [Part2](https://github.com/wekan/wekan/pull/3045).
  Thanks to marc1006.
- [Fix Wekan not load at all in Firefox v.68 for Android](https://github.com/wekan/wekan/commit/1235363465b824d26129d4aa74a4445f362c1a73).
  Thanks to xet7.
- [Fix comment typo in docker-compose.yml](https://github.com/wekan/wekan/pull/3044).
  Thanks to VictorioBerra.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.97 2020-04-19 Wekan release

This release adds the following new features:

- [Sortable boards](https://github.com/wekan/wekan/pull/3027).
  Thanks to boeserwolf.
- [Added dockerfiles for multi-arch builds and manifest](https://github.com/wekan/wekan/pull/3023).
  [In Progress](https://github.com/wekan/wekan/issues/2999).
  Thanks to brokencode64.
- [Make linked card clickable](https://github.com/wekan/wekan/pull/3025).
  Thanks to boeserwolf.

and fixes the following bugs:

- [Fix using checklists on mobile and iPad](https://github.com/wekan/wekan/pull/3019).
  Thanks to devinsm.
- [Improve card layout on mobile devices](https://github.com/wekan/wekan/pull/3024).
  Thanks to marc1006.
- [Make OCP OAuth work with Openshift 4.x](https://github.com/wekan/wekan/pull/3020).
  Thanks to ckavili.
- [Remove old warning from Sandstorm import board data loss, because bug has been already
  fixed](https://github.com/wekan/wekan/commit/960fe5163b6a2f7c3dca03b5e31d69611b49f079).
  Thanks to aputsiaq and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.96 2020-04-15 Wekan release

This release adds the following Sandstorm updates:

- This is the first Sandstorm Wekan release that uses newest Meteor 1.10.1 and Node 12.x.
  Now all Wekan platforms use newest Meteor and Node 12.x LTS.
  Thanks to kentonv and xet7.
- [Fix capnp workaround to work with newest Meteor and
  Node 12.x](https://github.com/wekan/wekan/commit/b2d546579c4957352c29b36c0c8a4a08b944dbb4).
  Thanks to kentonv.
- [Update Sandstorm release script for newest Meteor and
  Node 12.x](https://github.com/wekan/wekan/commit/c5f782976b971fa3f2323e80a013bbf6a49c0596).
  Thanks to xet7.
- [Remove Meteor 1.8.x files because Sandstorm Wekan now uses newest
  Meteor](https://github.com/wekan/wekan/commit/1a836969e10215bad47ac56a9b0d9de801b66fd2).
  Thanks to xet7.

and adds the following new features:

- [Hide password auth with environment variable PASSWORD_LOGIN_ENABLED=false](https://github.com/wekan/wekan/pull/3014).
  Snap example: `sudo snap set wekan password-login-enabled='false'` .
  Thanks to salleman33.

and fixes the following bugs:

- [Fix Board admins can not clone or archive their boards at All Boards
  page](https://github.com/wekan/wekan/pull/3013).
  Thanks to salleman33.
- [Fix `<p>` margin in card labels](https://github.com/wekan/wekan/pull/3015).
  Thanks to boeserwolf.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.95 2020-04-12 Wekan release

This release adds the following new features:

- [Add gitpod config](https://github.com/wekan/wekan/pull/3009).
  This adds support for Gitpod.io, a free automated
  dev environment that makes contributing and generally working on GitHub
  projects much easier. It allows anyone to start a ready-to-code dev
  environment for any branch, issue and pull request with a single click.
  Thanks to juniormendonca.
- [Public boards overview](https://github.com/wekan/wekan/pull/3008).
  Thanks to NicoP-S.

and fixes the following bugs:

- [Fix styling issue in notifications drawer](https://github.com/wekan/wekan/pull/3012).
  Thanks to boeserwolf.
- [Fix error in notifications cleanup cron](https://github.com/wekan/wekan/pull/3010).
  Thanks to jtbairdsr.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.94 2020-04-12 Wekan release

This release adds the following new features:

- [Public vote](https://github.com/wekan/wekan/pull/3006).
  Thanks to NicoP-S.
- [Add robots.txt disallow all](https://github.com/wekan/wekan/commit/3fae5355d40055757bf4a5f0c503581195609720).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.93 2020-04-10 Wekan release

This release adds the following new features:

- [Trello vote import & hide export button if with_api is
  disabled](https://github.com/wekan/wekan/pull/3000).
  Thanks to NicoP-S.
- [When adding a user to a board that has subtasks, also add user to the subtask
  board](https://github.com/wekan/wekan/pull/3004).
  Thanks to slvrpdr.

and adds the following updates:

- Upgrade to Node v12.16.2 [Part1](https://github.com/wekan/wekan/commit/6db717b9b384fe1491063e507b80e67791a07e3a)
  and [Part2](https://github.com/wekan/wekan/commit/268d7fcb32186a902a84e7f6d80c50b1f3790bad).
  Thanks to Node developers and xet7.

and fixes the following bugs:

- [Fix bug that prevents editing or deleting
  comments](https://github.com/wekan/wekan/pull/3005).
  Thanks to jtbairdsr.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.92 2020-04-09 Wekan release

This release adds the following new features:

- [Scheduler to clean up read notifications. Also added a button to manually remove all
  read notifications, and a fix to prevent users form getting notifications for their own
  actions](https://github.com/wekan/wekan/pull/2998).
  Thanks to jtbairdsr.
- [Add setting](https://github.com/wekan/wekan/commit/5ebb47cb0ec7272894a37d99579ede872251f55c)
  default [NOTIFICATION_TRAY_AFTER_READ_DAYS_BEFORE_REMOVE=2](https://github.com/wekan/wekan/pull/2998)
  to all Wekan platforms.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.91 2020-04-08 Wekan release

This release adds the following new features:

- [OpenShift: Route template added to helm chart for Openshift v4x
  cluster](https://github.com/wekan/wekan/pull/2996).
  Thanks to ckavili.
- [Filter by Assignee](https://github.com/wekan/wekan/pull/2997).
  Thanks to daniel-eder.
- [Vote on Card](https://github.com/wekan/wekan/pull/2994).
  Thanks to NicoP-S and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.90 2020-04-06 Wekan release

This release makes the following updates:

- [Update dependencies](https://github.com/wekan/wekan/commit/d798f6e3ef09595ce4f1d1fbc053eec70fc91fb9).

and updates the following translations:

- [Update layouts.js for zh-TW language name](https://github.com/wekan/wekan/pull/2988).
  Thanks to doggy8088.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.89 2020-04-05 Wekan release

This release adds the following new features:

- [Create subtasks in parenttask swimlane](https://github.com/wekan/wekan/issues/1953).
  Thanks to TOSCom-DanielEder.
- [When searching cards in a board, also search from Custom Fields](https://github.com/wekan/wekan/pull/2985).
  Thanks to slvrpdr.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.88 2020-04-02 Wekan release

This release adds the following new features:

- [Notification drawer](https://github.com/wekan/wekan/pull/2975) [like Trello](https://github.com/wekan/wekan/issues/2471).
  Thanks to jtbairdsr and xet7.

and makes the following UI changes:

- [Minicard labels on the top and title on bottom](https://github.com/wekan/wekan/issues/2980).
  Thanks to helioguardabaxo and xet7.

and fixes the following bugs:

- [Fix start-wekan.sh MongoDB port to 27017](https://github.com/wekan/wekan/commit/c60a092fc0ed9fe15c417bcb443b1e3e3aaedf7e).
  Thanks to Keelan and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.87 2020-04-01 Wekan release

This release makes the following UI changes:

- [Move "Rules" from "Board View" to "Board Settings"](https://github.com/wekan/wekan/issues/2973).
  Thanks to helioguardabaxo and xet7.
- [Improvements on card details visualization](https://github.com/wekan/wekan/issues/2974).
  Thanks to helioguardabaxo and xet7.
- [Hide duplicate "Hide system messages" at Change Settings/Member Settings, because it's also on card
  slider](https://github.com/wekan/wekan/issues/2837).
  Thanks to notohiro and xet7.

and fixes the following bugs:

- [Fix Browser always reload the whole page when I change one of the card
  color](https://github.com/wekan/wekan/commit/3546d7aa02bc65cf1183cb493adeb543ba51945d).
  Fixed by making label colors and text again editable.
  Regression from [Wekan v3.86 2)](https://github.com/wekan/wekan/commit/b9099a8b7ea6f63c79bdcbb871cb993b2cb7e325).
  Thanks to javen9881 and xet7.
- [Fix richer editor submit did not clear edit area](https://github.com/wekan/wekan/commit/033d6710470b2ecd7a0ec0b2f0741ff459e68b32).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.86 2020-03-24 Wekan release

This release fixes the following bugs:

- [Fix Rich editor can not be disabled, regression from changes yesterday at Wekan v3.85](https://github.com/wekan/wekan/commit/12ab8fac5db9c5ac8069d0ca2bca340d6004a25b).
  Thanks to uusijani, vjrj and xet7.
- [1) Fix Pasting text into a card is adding a line before and after
      (and multiplies by pasting more) by changing paste "p" to "br".
   2) Fixes to summernote and markdown comment editors, related
       to keeping them open when adding comments, having
       @member mention not close card, and disabling clicking of
       @member mention](https://github.com/wekan/wekan/commit/b9099a8b7ea6f63c79bdcbb871cb993b2cb7e325).
  Thanks to xet7 !

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.85 2020-03-23 Wekan release

This release fixes the following CRITICAL SECURITY VULNERABILITIES:

- [Fix XSS bug reported today 4 hours ago by Cyb3rjunky](https://github.com/wekan/wekan/commit/482682e50079d70c5113169020d6834013b57c11).
  Logged in users could run javascript in input fields.
  This affects Wekan versions v3.12-v3.84.
  In [Wekan v3.12](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v312-2019-08-09-wekan-release)
  there was [changes for XSS filter to allow inserting images, videos etc
  on comment WYSIWYG editor](https://github.com/wekan/wekan/pull/2593)
  so features related to that are now removed.
  After this fix, Javascript in input fields is not executed.
  Thanks to Cyb3rjunky and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.84 2020-03-16 Wekan release

This release adds the following features:

- Add settings for mouse wheel scroll inertia and scroll
  amount [Part1](https://github.com/wekan/wekan/commit/9d13001b903f9ec50f5fa3a4bdbacae32b27ac65)
  and [Part2](https://github.com/wekan/wekan/commit/aaecac091209e90c0c2123830728f5e7a835ccb4).
  For example: sudo snap set wekan scrollinertia='200' , sudo snap set wekan scrollamount='200' .
  Thanks to danger89 and xet7.

and adds the following updates:

- [Upgrade to Meteor 1.10.1](https://github.com/wekan/wekan/commit/e16c65babc1f021c35a3d46bc61e649ec94d1e82).
  Thanks to xet7.
- [Update markdown](https://github.com/wekan/wekan/commit/6e0fa78022ea487176eb0a32ec5a4a441f8e0c3c).
  Thanks to xet7.
- [Update minimist](https://github.com/wekan/wekan/commit/ea6baa5c2b956ee28b0a7e63f988e2fc1998201a).
  Thanks to xet7.
- [Update acorn](https://github.com/wekan/wekan/commit/369a29707bbec3bf89717c16e8b698fb4666087a).
  Thanks to xet7.
- [Update prettier-eslint](https://github.com/wekan/wekan/commit/8183b7bdaa01d2ce53ac7215beafd5efe21373e8).
  Thanks to xet7.
- [Update ostrio:cookies](https://github.com/wekan/wekan/commit/14b8610837117616d436e2bac6a9dc653e315662).
  Thanks to xet7.
- [Add build time profiling to build script](https://github.com/wekan/wekan/commit/f968109e7390139e50375ee29bc7bc3cf1e1ab41).
  Thanks to zodern.

and fixes the following bugs:

- [Downgrade stylus to v1.1.0 to speed up building Wekan](https://github.com/wekan/wekan/commit/fca4cdcebf1cc6642aefeb78b911cb5b95ebe473).
  This is because building newer stylus v2 takes 52 minutes. After this change, building Wekan takes 3 minutes.
  Thanks to zodern.
- [Fix: Error when retrieve token from some OIDC due to not necessary scope
  parameter](https://github.com/wekan/wekan/pull/2955).
  Thanks to benoitm76.
- [Fix: img tag did not allow width and height. Removed swipebox from markdown editor
  img tag and updated marked markdown to newest version](https://github.com/wekan/wekan/commit/2b26bbe78a1a2b8b427963a6c44c3853efdb737e).
  Thanks to hradec and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.83 2020-03-01 Wekan release

This release tries to revert remaining the following changes:

- [Revert](https://github.com/wekan/wekan/88573ad2cdb8596b795a82ef40a0662180e8a7d7) change made at Wekan v3.81,
  because building did not work: [Try to make Meteor build time shorter
  by excluding legacy and cordova. This was made possible by
  Meteor 1.10-rc.2](https://github.com/wekan/wekan/commit/0d3002f69d97e646fa7368bfdade4f78c51e9884).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.82 2020-03-01 Wekan release

This release reverts the following changes:

- Revert change made at Wekan v3.81, because building did not work: [Try to make Meteor build time shorter
  by excluding legacy and cordova. This was made possible by
  Meteor 1.10-rc.2](https://github.com/wekan/wekan/commit/0d3002f69d97e646fa7368bfdade4f78c51e9884).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.81 2020-03-01 Wekan release

This release [fixes](https://github.com/wekan/wekan/commit/aac7c380c8c389b0683b2bd64e2cc856993f0e30) the following CRITICAL SECURITY VULNERABILITIES and other bugs:

- Fix critical and moderate security vulnerabilities reported at 2020-02-26 with
  responsible disclosure by [Dejan Zelic](https://twitter.com/dejandayoff),
  Justin Benjamin and others at [Offensive Security](https://twitter.com/offsectraining),
  that follow standard 90 days before public disclosure.
  Thanks to xet7.
- Fix webhook error that prevented some card etc deleting from web UI of board.
  Thanks to xet7.
- Add missing Font Awesome icon to Board Settings Menu.
  Thanks to xet7.
- Remove autofocus from many form input boxes so that they would not cause warnings.
  Thanks to xet7.

and does the following upgrades:

- [Upgrade Meteor to 1.10-rc.2](https://github.com/wekan/wekan/commit/26b521e86e6ac40b7ba25bbe8dac7bf4d48d43ce).
  Thanks to xet7.
- [Try to make Meteor build time shorter by excluding legacy and cordova. This was made possible by
  Meteor 1.10-rc.2](https://github.com/wekan/wekan/commit/0d3002f69d97e646fa7368bfdade4f78c51e9884).
  Thanks to xet7.

and fixes the following bugs:

- [Try to fix afterwards loading of cards by adding fallback when requestIdleCallback is not
  available](https://github.com/wekan/wekan/commit/2b9540ce02de604bf84ea082f2dcb1d01673708c).
  Thanks to xet7.
- [Make profile.initials available in publications](https://github.com/wekan/wekan/pull/2948).
  Thanks to NicoP-S.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.80 2020-02-22 Wekan release

This release adds the following features:

- [Create New User in Admin Panel](https://github.com/wekan/wekan/commit/e0ca960a35cf006880019ba28fc82aa30f289a71).
  Works, but does not save fullname yet, so currently it's needed to edit add fullname later.
  Thanks to xet7.

and adds the following updates:

- [Update to Meteor 1.9.1, Node 12.16.1 etc newest dependencies](https://github.com/wekan/wekan/commit/cbbb5deff7d84a91c40becc9caaf70f5b6738b63).
  Thanks to xet7.
- [Update to Meteor 1.9.2](https://github.com/wekan/wekan/commit/9be3f3714ae680ff9fc1855c960c9831e84c2b07).
  Thanks to xet7.

and fixes the following bugs:

- [Update Sandstorm release build script](https://github.com/wekan/wekan/commit/a4ff6cc0af8545ca4d3e97fa2cabbe7981c025b2).
  Thanks to xet7.
- [Fix docker-compose link](https://github.com/wekan/wekan/pull/2937).
  Thanks to pbek.
- [Remove alethes:pages package, that had some indentation error.
  Package is about pagination, but I did not find any pagination related code in Wekan
  yet](https://github.com/wekan/wekan/commit/ec012060305bc16fbf8d2ac218f5c847e02c4301).
  Thanks to xet7 !

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.79 2020-02-13 Wekan release

This release fixes the following bugs:

- [Fix Card Opened Webhook can not be disabled](https://github.com/wekan/wekan/commit/178f376e2138b5522c2e92ddfd2babb113df8d9f).
  Thanks to mvanvoorden and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.78 2020-02-12 Wekan release

This release adds the following features:

- [Card Settings / Show on Card: Description Title and Description Text](https://github.com/wekan/wekan/commit/e89965f6422fd95b4ad2112ae407b1dde4853510).
  Thanks to e-stoniauk, 2020product and xet7.

and fixes the following bugs:

- [Remove card element grouping to create compact card layout](https://github.com/wekan/wekan/commit/e89965f6422fd95b4ad2112ae407b1dde4853510).
  Thanks to e-stoniauk, 2020product and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.77 2020-02-10 Wekan release

This release removes the following features:

- [Remove hiding comments and activities](https://github.com/wekan/wekan/commit/2a54218f3f68547032bd53a04a968b233be21e15).
  Thanks to xet7.

and fixes the following bugs:

- Fix Copy Card Link to Clipboard button at card title did not
  work [Part 1](https://github.com/wekan/wekan/commit/9a21b0a1c933e7f778e4e57a8258e150ccea1620)
  and [Part2](https://github.com/wekan/wekan/commit/4467a68b97a3fbf0fbae7f05177d978f2aa80287).
  Thanks to 2020product and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.76 2020-02-07 Wekan release

This release adds the following updates:

- [Use Meteor 1.9 and Node.js 12.15.0 on Snap and Docker](https://github.com/wekan/wekan/commit/8384d68a060ef8f2c202ce2fa6064c5c823d28dc).
  This also fixes bug that exporting some boards was not possible, downloading export file failed.
  Thanks to xet7.

and fixes the following bugs:

- [Fix Bug enable/disable Comments in Card Settings](https://github.com/wekan/wekan/issues/2923).
  Thanks to warnt, mdurokov and xet7.
- [Try to disable dragging Swimlanes/Lists/Cards/Checklists/Subtasks on small mobile smartphones webbrowsers,
  and hide drag handles on mobile web](https://github.com/wekan/wekan/commit/bf78b093bad7d463ee325ad96e8b485264d4a3be).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.75 2020-02-05 Wekan release

This release adds the following new features:

- [Fix](https://github.com/wekan/wekan/commit/f22785dbcde42e425c9ead209ec224aef6e11c16)
  [adding comments](https://github.com/wekan/wekan/issues/2918).
  Thanks to xet7.

and fixes the following bugs:

- [Added some working layout changes like activities using less space from https://github.com/wekan/wekan/pull/2920](https://github.com/wekan/wekan/commit/f22785dbcde42e425c9ead209ec224aef6e11c16).
  Thanks to 2020product.
- [Fixed Card Settings not working at Sandstorm](https://github.com/wekan/wekan/commit/f22785dbcde42e425c9ead209ec224aef6e11c16).
  Thanks to xet7.
- Add [Card Description title](https://github.com/wekan/wekan/issues/2918#issuecomment-582346577)
  [back](https://github.com/wekan/wekan/commit/f22785dbcde42e425c9ead209ec224aef6e11c16).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.74 2020-02-05 Wekan release

This release adds the following new features:

- [For BoardAdmin, add way to hide parts of a card, at Board Settings/Card Settings/Show on Card: Received, Start, ... etc.
  Add to card title bar Copy card to Clipboard button](https://github.com/wekan/wekan/pull/2915).
  Thanks to 2020product and xet7.
- [Set default to RICHER_CARD_COMMENT_EDITOR=false](https://github.com/wekan/wekan/commit/65fa2f626f503b8089e0d982901cffb3990426cb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.73 2020-01-29 Wekan release

This release adds the following new features:

- [Login to Wekan with Nextcloud](https://github.com/wekan/wekan/pull/2897).
  Thanks to bogie.
- [Add rule action to move cards to other boards](https://github.com/wekan/wekan/pull/2899).
  Thanks to peterverraedt.

and fixes the following bugs:

- [Show System Wide Announcement in one line](https://github.com/wekan/wekan/pull/2891).
  Thanks to tsia.
- [Fixed board export with attachment in Wekan Meteor 1.9.x version](https://github.com/wekan/wekan/pull/2898).
  Thanks to izadpoor.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.72 2020-01-19 Sandstorm-only Wekan release

This release fixes the following bugs:

- Try to fix Wekan at Sandstorm.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.71 2020-01-18 Sandstorm-only Wekan release

This release fixes the following bugs:

- [Try to fix Wekan at Sandstorm by using Meteor 1.8.x and Node 8.17.0 at Sandstorm](https://github.com/wekan/wekan/commit/5e5ab95410c715a4379631456fc5547c497898b0).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.70 2020-01-18 Wekan release

This release fixes the following bugs:

- [Add missing LD_LIBRARY_PATH to use libssl and libcurl](https://github.com/wekan/wekan/10f142a1a05acb98a175ccb0326fb0c1d3e3713f).
  Thanks to xet7.
- [Use Meteor 1.8.x](https://github.com/wekan/wekan/commit/55a2aa90cbbf44200e9b0b9f4bd08b6177f1bb95)
  [on Snap](https://github.com/wekan/wekan/commit/6a01170d8696322462c4065ce0cf4a637a058975), because
  Snap builds do not work yet for Meteor 1.9, Node 12.14.1 and MongoDB 4.2.2.
  Docker version works with Meteor 1.9.
  Thanks to xet7.
- [Try to fix Node 12 Buffer() deprecation errors](https://github.com/wekan/wekan/commit/9b905c2833d54cf34d1875148075b2bf756d943a).
  Thanks to xet7.
- [Add Snap Meteor 1.8.x files to lint ignore files](https://github.com/wekan/wekan/commit/48f8050c25e40f737dfdd3a98923cb87cd4e77e2).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.69 2020-01-10 Wekan release

This release fixes the following bugs:

- [Fix docker-compose.yml to not use --smallfiles that is not supported in
  MongoDB 4.x](https://github.com/wekan/wekan/commit/ecb76842fcbd81701afcab8db0ed106e6be0fdec).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.68 2020-01-10 Wekan release

This release tries to fix the following bugs:

- [Try to fix Snap by removing MongoDB option --smallfiles that is not supported
  in MongoDB 4.x](https://github.com/wekan/wekan/commit/031df54a2e0a03dcb7a2586667e60e5bd4eef706)
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.67 2020-01-10 Wekan release

This release tries to fix the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/2b382b940be9af575fab4c2e955702d8cde55ae9).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.66 2020-01-10 Wekan release

This release tries to fix the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/39bf1e375e2962f824e6f8cfa425ea51aa4efa24).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.65 2020-01-10 Wekan release

This release adds the following features:

- [More keyboard shortcuts: c for archive card](https://github.com/wekan/wekan/commit/d16a601c04aeb1d3550c5c541be02a67276a34cf).
  Thanks to xet7.

and adds the following updates:

- [Upgrade to Meteor 1.9, Node 12.14.1 and MongoDB 4.2.2](https://github.com/wekan/wekan/commit/785f3cf88b61f687ef5ad4a529768221d1a54c86).
  Thanks to xet7.
- [Add more issue repo links to GitHub issue template](https://github.com/wekan/wekan/commit/5724674e73246f4e52843a6d6906c0ecdd85cccc).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.64 2020-01-06 Wekan release

This release adds the following warning for CentOS 7 users:

- [WARNING: DO NOT USE SNAP ON CENTOS 7, THERE IS UPDATE BUG](https://github.com/wekan/wekan-snap/wiki/CentOS-7).
  Thanks to andy-twosticks and xet7.

and adds the following features:

- [Wider sidebar](https://github.com/wekan/wekan/commit/5058233509e44916296e38fb8a6c5dd591c46d8b).
  Thanks to vjrj.

and removes the following features:

- [Removed Custom HTML feature that does not work](https://github.com/wekan/wekan/commit/ddce0ada094e6450be260b4cda21fdfa09ae0133).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.63 2020-01-06 Wekan release

This release fixes the following bugs:

- [Fix: Unable to find Archive Card/List/Swimlane in board
  settings](https://github.com/wekan/wekan/commit/8ce993921718f3e10c2daa5fabb145b939d789dd).
  Thanks to neobradley and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.62 2020-01-05 Wekan release

This release adds the following features:

- [Add Worker role](https://github.com/wekan/wekan/issues/2788).
  This was originally added at Wekan v3.58, reverted at Wekan v3.60 because of bugs,
  and now after fixes added back.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.61 2020-01-03 Wekan release

This release adds the following features:

- [Add more Font Awesome icons. This was originally added
  at Wekan v3.58, removed at Wekan v3.60, and now
  added back at Wekan v3.61](https://github.com/wekan/wekan/commit/cd253522a305523e3e36bb73313e8c4db500a717).
  Thanks to xet7.

and fixes the following bugs:

- [Fix browser javascript console errors when editing profile. This was originally added
  at Wekan v3.58, removed at Wekan v3.60, and now added back at
  Wekan v3.61](https://github.com/wekan/wekan/commit/cd253522a305523e3e36bb73313e8c4db500a717).

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.60 2020-01-03 Wekan release

This release fixes the following bugs:

- [Revert to Wekan v3.57 version of client and models directories,
  removing Worker role temporarily, because Worker role changes
  broke saving card](https://github.com/wekan/wekan/commit/27943796ade78ca3c503637a1340918bf06a1267).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.59 2020-01-03 Wekan release

This release fixes the following bugs:

- [Fix not being able to edit received date](https://github.com/wekan/wekan/commit/5376bc7b7905c0dd99fae1aeae3f63b4583a3e3f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.58 2020-01-03 Wekan release

This release adds the following features:

- [Add Worker role](https://github.com/wekan/wekan/issues/2788). Thanks to xet7.
- [Add more Font Awesome icons](https://github.com/wekan/wekan/commit/2bf004120d5a43cd3c3c060fc7c0c30d1b01f220).
  Thanks to xet7.

and fixes the following bugs:

- [Fix: k8s templates update for helm](https://github.com/wekan/wekan/pull/2867).
  1. Upgrade mongo replica version.
  2. Access mongo via service url.
  3. Change the expose servicePort to numeric.
  Thanks to jiangytcn.
- [Fix browser console errors when editing user profile name](https://github.com/wekan/wekan/commit/2bf004120d5a43cd3c3c060fc7c0c30d1b01f220).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.57 2019-12-22 Wekan release

This release adds the following features:

- [Allow card and checklist API creation for authorized board members](https://github.com/wekan/wekan/pull/2854).
  Thanks to Robert-Lebedeu.
- [Visual difference for inactive user in Administration: strikethrough](https://github.com/wekan/wekan/commit/1f1aea87a421ca5e7931d220d10c838574208e2c).
  Thanks to hever and xet7.

and adds the following updates:

- [Upgrade to Meteor 1.8.3 and Node 8.17.0. Update release scripts. Fix ldap background sync documentation part 2](https://github.com/wekan/wekan/commit/782d0b620988628f40f50f9cd824f6652cfb0dd9).
  Thanks to xet7.

and fixes the following bugs:

- [Fix: Don't add a blank space for empty custom fields on minicards](https://github.com/wekan/wekan/commit/e2a374f0aad8489a84d6de9966c281a812b5eca3).
  Thanks to roobre and xet7.
- [Fix: Allow to set empty card title, AssignedBy and RequestedBy](https://github.com/wekan/wekan/commit/25561946edf37351f67cf7500902dde7d9114d2f).
  Thanks to justinr1234 and xet7.
- [Fix comment text disappearing when clicking outside of comment text area.
  Fix lint error](https://github.com/wekan/wekan/commit/3b3950369ce07aa9e6fc4ab1bef9fb8a4993e398).
  Thanks to xet7.
- [Fix ldap background sync documentation](https://github.com/wekan/wekan/pull/2855).
  Thanks to koelle25.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.56 2019-11-21 Wekan release

This release adds the following updates:

- [Update to Meteor 1.8.2. Update dependencies](https://github.com/wekan/wekan/commit/38dfe0b9a71a083adc2de1a81170fea0e4a8e53f).
  Thanks to xet7.
- [Fix lint errors and update travis NPM version](https://github.com/wekan/wekan/commit/b0f345ba21830b033c9edcc8ee5252b280111ae7).
  Thanks to xet7.
- [Change base image to rolling, that is currently Ubuntu eoan
  version](https://github.com/wekan/wekan/commit/c66cc3d4dadb15b669256530cfda89359cdb9340).
  Thanks to xet7.
- [It seems Ubuntu eoan package bsdtar has been renamed to
  libarchive-tools](https://github.com/wekan/wekan/commit/c60967e935bdc0e7e9aea0a1c23178aee8a73c29).
  Thanks to xet7.

and fixes the following bugs:

- [Fix slow scroll on card detail by setting scrollInertia to 0](https://github.com/wekan/wekan/commit/599ace1db7918df41d9708d14b0351acb0f8688e).
  Thanks to cafeoh.
- [Fix lint errors](https://github.com/wekan/wekan/commit/788dd0a81a06efee165007a92780f9e8c2c754ac).
  Thanks to xet7.
- [Remove eslint option that does not work](https://github.com/wekan/wekan/commit/a06daff92e5f7cca55d1698252e3aa6526877c8b).
  Thanks to xet7.
- [Try to fix lint errors](https://github.com/wekan/wekan/commit/58e505f79a0617011576bdded9427b0d448d6107).
  Thanks to xet7.
- [Add to Snap MongoDB logging option --quiet](https://github.com/wekan/wekan/commit/c7ded515022fff2c1167ce8938405a846185a710).
  Thanks to fmeehan and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.55 2019-11-19 Wekan release

This release fixes the following bugs:

- [When logged in, use database for setting, so that changes are immediate. Only on public board use cookies.
  Comment out Collapse CSS that is not in use](https://github.com/wekan/wekan/commit/351d4767d7e93c90ac798769d6071da8730d834f).
  Thanks to xet7.
- [Use database when logged in. Part 2](https://github.com/wekan/wekan/commit/4786b0c18ddeb8f48525216eabebdced7159467d).
  Thanks to xet7.
- [Use database when logged in. Part 3](https://github.com/wekan/wekan/commit/115d23f9293cad8a93f18f75a47a8a65756f71ce).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.54 2019-11-18 Wekan release

This release adds the following new features:

- [New feature: Now there is popup selection of Lists/Swimlanes/Calendar/Roles](https://github.com/wekan/wekan/commit/96abe3c6914ce37d9fb44da8fda375e40ad65c9e).
  Thanks to xet7.
- [New feature, not set visible yet, because switching to it does not
  work properly yet: Collapsible Swimlanes](https://github.com/wekan/wekan/issues/2804).
  Thanks to xet7.

and fixes the following bugs:

- [Fix: Public board now loads correctly. When you select one of Lists/Swimlanes/Calendar view and
  reload webbrowser page, it can change view](https://github.com/wekan/wekan/issues/2311).
  Thanks to xet7.
- [Fix: List sorting commented out](https://github.com/wekan/wekan/issues/2800).
  Thanks to xet7.
- [Fix: Errors hasHiddenMinicardText, hasShowDragHandles, showSort, hasSortBy, profile,
  FirefoxAndroid/IE11/Vivaldi/Chromium browsers not working by using cookies instead of
  database](https://github.com/wekan/wekan/issues/2643#issuecomment-554907955).
  Note: Cookie changes are not always immediate, if there is no effect, you may need to
  reload webbrowser page. This could be improved later.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.53 2019-11-14 Wekan release

This release fixes the following bugs:

- [Revert list sorting change of Wekan v3.51 because it reversed alphabetical sorting of
  lists](https://github.com/wekan/wekan/commit/ab2a721a1443b903cdbbbe275f41ffd3269012c6).
  Thanks to Dalisay and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.52 2019-11-14 Wekan release

This release fixes the following bugs:

- [Add database migration for assignee](https://github.com/wekan/wekan/commit/5b41d72e8de93833e1788962427422cff62c09a2).
  Thanks to ocdtrekkie and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.51 2019-11-14 Wekan release

This release fixes the following bugs:

- [Change sorting lists to work on desktop drag handle page instead,
  where it seems to work better](https://github.com/wekan/wekan/commit/bbc3ab3f994c5a61a4414bc64b05f5a03d259e46).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.50 2019-11-13 Wekan release

This release adds the following new features:

- [Allowing lists to be sorted by modifiedAt when not in draggable
  mode](https://github.com/wekan/wekan/commits/77f8b76d4e13c35ea3451622176bbb69a4d39a32).
  Thanks to whowillcare.
- Allow user to sort Lists in Board by his own preference boardadmin can star
  list [1](https://github.com/wekan/wekan/commit/bc2a20f04e32607f8488a9cecd815647fb43e40e),
  [2](https://github.com/wekan/wekan/commit/bc2a20f04e32607f8488a9cecd815647fb43e40e).
  Thanks to whowillcare.
- [Allowing user to filter list in Filter function not just cards
  commit](https://github.com/wekan/wekan/commit/d2d4840758b0f5aed7feb4f6a459bb2b2d1a3f0b).
  Thanks to whowillcare.
- [Allow user to search Lists in Board](https://github.com/wekan/wekan/commit/32f50e16586696ec7d100ce0438d1030ae1f606e).
  Thanks to whowillcare.
- Enhancement: [Set card times more sensible using the 'Today' button in
  datepicker](https://github.com/wekan/wekan/pull/2747).
  Thanks to liske.
- [At card, added Assignee field like Jira, and REST API for it](https://github.com/wekan/wekan/issues/2452).
  Parts:
  [Add assignee](https://github.com/wekan/wekan/commit/9e1aaf163f3bd0b3c2d2aee8225d111f83b3d421),
  [Remove Assignee. Avatar icon is at card and assignee details](https://github.com/wekan/wekan/commit/3e8f9ef1a5275a5e9b691c7e74dc73b97a43689a),
  [When selecting new assignee (+) icon, list shows names who to add](https://github.com/wekan/wekan/commit/32ce2b51d8bff5e8851732394a8bae3c56f8b0b6),
  [More progress](https://github.com/wekan/wekan/commit/ea823ab68fd5243c8485177e44a074be836836b8),
  [In add assignee popup, avatars are now visible](https://github.com/wekan/wekan/commit/56efb5c41075151eeb259d99990a7e86695b2b69),
  [Add assignee popup title](https://github.com/wekan/wekan/commit/31dbdc835d5a092b8360a4dbe93e9fbcce068855),
  [Prevent more than one assignee](https://github.com/wekan/wekan/commit/1728298659521ee8e6fc94fedad3160030b9a2c3),
  [When there is one selected assignee on card, don't show + button for adding more assignees, because there can only be one
  assignee](https://github.com/wekan/wekan/commit/3cf09efb13438d66db6cf739591c679ea538d812),
  [Now assignee is visible also at minicard](https://github.com/wekan/wekan/commit/9fd14f7ecb593d3debf5adff8f6c61adb0c3feca),
  [Update REST API docs, there can only be one assignee in array](https://github.com/wekan/wekan/commit/de7509dc60257667192054e320b381f9dd0f0a31).
  Thanks to xet7.
- [More mobile drag handles, and optional desktop drag handles](https://github.com/wekan/wekan/issues/2081): In Progress.
  Parts:
  [Some drag handle fixes](https://github.com/wekan/wekan/commit/6a8960547729148bd3085cb469f9e93d510ed66c),
  [Fix desktop swimlane drag handle position](https://github.com/wekan/wekan/commit/2ec15602d284122fce1a45bed352d0d4050162e2),
  [Fix card, list and swimlane move. Allow moving cards in multiselect mode](https://github.com/wekan/wekan/commit/537a48bede250155b30ec264904ba320625bab73).
  Thanks to xet7.

and adds the following updates:

- [Update Node.js to v8.16.2](https://github.com/wekan/wekan/commit/1eb3d25b40797fdab41d7dd59405cfcea81dcc61).
  Thanks to xet7.

and fixes the following bugs:

- Bug Fix [#2093](https://github.com/wekan/wekan/issues/2093), need to [clean up the
  temporary file](https://github.com/wekan/wekan/commit/2737d6b23f3a0fd2314236a85fbdee536df745a2).
  Thanks to whowillcare.
- Bug Fix [#2093](https://github.com/wekan/wekan/issues/2093): the broken [should be prior to file attachment feature introduced](https://github.com/wekan/wekan/commit/f53c624b0f6c6ebcc20c378a153e5cda8d73463c).
  Thanks to whowillcare.
- [Fix typo on exporting subtasks](https://github.com/wekan/wekan/commit/00d581245c1fe6a01ef372ca87d8a25bc7b937e4).
  Thanks to xiorcala.
- [Change the radom to random typo in export.js](https://github.com/wekan/wekan/commit/e195c731de88aba4026c239f4552ae821d522ec7).
  Thanks to whowillcare.
- Fix: [List last modify time will be affected by cards dueAt, endAt](https://github.com/wekan/wekan/commit/3308d90a3a6a1ddeed33966767937cd2c2c90cb5).
  Thanks to whowillcare.
- Revert creating new list to left, now creates again to right. Thanks to whowillcare.
  Revert New List item moved from right to left. Thanks to derbolle and xet7.
  [1](https://github.com/wekan/wekan/commit/806df30ba3499cef193eaf1b437cdef65282510f).
- REST API: [Fix deletion of a single board card](https://github.com/wekan/wekan/pull/2778).
  Thanks to liske.
- [cardDate: endDate coloring change](https://github.com/wekan/wekan/pull/2779).
  If no due-date timestamp is set => Gray.
  If end-date timestamp is younger than due-date timestamp => Green.
  If end-date timestamp is older than due-date timestamp => Red.
  Thanks to bandresen.
- [Fixed Card Open Webhook Error](https://github.com/wekan/wekan/issues/2780).
  Thanks to jymcheong.
- [Fixed OpenAPI docs generation](https://github.com/wekan/wekan/pull/2783).
  Thanks to bentiss.
- [Fixed close card button not visible on mobile web](https://github.com/wekan/wekan/36b5965dd07e3f0fd90069353310739c394c220f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.49 2019-10-09 Wekan release

This release fixes the following bugs:

- [Fix prettier errors](https://github.com/wekan/wekan/commits/36e006fa4e78fe94e627625d1cc589654668f22a).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.48 2019-10-09 Wekan release

This release fixes the following bugs:

- [Make possible to upload attachments using drag-and-drop or Ctrl+V without setting the environmental-variable MAX_IMAGE_PIXEL](https://github.com/wekan/wekan/pull/2754).
  Thanks to moserben16.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.47 2019-10-09 Wekan release

This release fixes the following bugs:

- [REST API: fix handling of members property on card creation](https://github.com/wekan/wekan/pull/2751).

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.46 2019-10-07 Wekan release

This release fixes the following bugs:

- [More black minicard badges](https://github.com/wekan/wekan/commit/68be12d166b21a41b4e2c4021b0966807e5ed1e6).
  Thanks to sfahrenholz and xet7.
- [REST API: fix creation of Checklists](https://github.com/wekan/wekan/pull/2747).
  Thanks to liske.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.45 2019-10-03 Wekan release

This release adds the following new features:

- [Cards due timeline will be shown in Calendar view](https://github.com/wekan/wekan/pull/2738).
  Thanks to whowillcare.
- [Modified due day reminders in cards.js, so wekan server admin can control the reminder more flexibly](https://github.com/wekan/wekan/pull/2738).
  i.e. NOTIFY_DUE_DAYS_BEFORE_AND_AFTER = 0 notification will be sent on due day only.
  NOTIFY_DUE_DAYS_BEFORE_AND_AFTER = 2,0 it means notification will be sent on both due day and two days before.
  Thanks to whowillcare.
- [Added modifications the help files, related to NOTIFY_DUE_DAYS_BEFORE_AND_AFTER](https://github.com/wekan/wekan/pull/2740).
  Thanks to whowillcare.

and fixes the following bugs:

- [Modified list.style regarding .list-header-name when in mobile mode. It was too close to left arrow](https://github.com/wekan/wekan/pull/2740).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.44 2019-09-17 Wekan release

This release adds the following languages:

- [Add language: Slovenian](https://github.com/wekan/wekan/commit/125231beff0fb84a18a46fe246fa12e098246985).
  Thanks to translators.

and fixes the following bugs:

- [Fix: in richer editor @ autocomplete doesn't really insert the username properly](https://github.com/wekan/wekan/pull/2717).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.43 2019-09-17 Wekan release

This release fixes the following bugs:

- [In richer editor, @user might not get pickup correctly, if it's formated](https://github.com/wekan/wekan/pull/2715).
  Thanks to whowillcare.
- [Table content should have word-wrap](https://github.com/wekan/wekan/pull/2715).
  Thanks to whowillcare.
- [Two-way hooks locking mechanism will fail sometime, therefore, change all comment insert or update to direct, which means it won't invoke any hook](https://github.com/wekan/wekan/pull/2715).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.42 2019-09-14 Wekan release

This release removed the following new features:

- [Revert drag handle changes of Wekan v3.41](https://github.com/wekan/wekan/commit/57119868bbb49f47c7d0b51b9952df9bd83d46f5).
  Thanks to Keelan.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.41 2019-09-13 Wekan release

This release adds the following new features:

- [More Mobile and Desktop drag handles for Swimlanes/Lists/Cards. Part 1](https://github.com/wekan/wekan/commit/ff550e91103115e7b731dd80c4588b93b2d4c64f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.40 2019-09-11 Wekan release

This release fixes the following bugs:

- [Fix subcard selector](https://github.com/wekan/wekan/pull/2697).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.39 2019-09-11 Wekan release

This release fixes the following bugs:

- [To load all boards, revert Wekan v3.37 Fix Linked cards make load all cards of database](https://github.com/wekan/wekan/commit/6ce8eeee6c477cd39b684c47bf122b5872818ada).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.38 2019-09-11 Wekan release

- Update translations. Thanks to translators.

# v3.37 2019-09-07 Wekan release

This release fixes the following bugs:

- LDAP: [Fix USERDN example, when parameters contain spaces](https://github.com/wekan/wekan/commit/6cbd4cabc716c755e547abb798f657fe5476ed04).
  LDAP_AUTHENTIFICATION_USERDN="CN=ldap admin,CN=users,DC=domainmatter,DC=lan" .
  Thanks to compumatter.
- [Fix: Linked cards make load all cards of database](https://github.com/wekan/wekan/commit/a56988c487745b2879cebe1943e7a987016e8bef).
  Thanks to Akuket.
- [Fix Unable to drag select text without closing card details](https://github.com/wekan/wekan/pull/2690).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.36 2019-09-05 Wekan release

This release adds the following new features:

- [Complete the original author's webhook functions and add two-way webhook type](https://github.com/wekan/wekan/pull/2665):
  1. Make webhook function more complete by allowing user to specify name and token of
  a webhook to increase security.
  1. Allow wekan admin to sepcify a global webhook.
  3. Add new type of two-way webhook that can act on the JSON webhook return payload:
  3.1. If the payload data contains cardId, boardId, and comment key words,
  3.2. If it has commentId, an existing comment will be modified
  3.3. If it doesn't have commentId, then a new comment will be added, otherwise, does nothing.
  Thanks to whowillcare.
- [Patch admin search feature to Search in all users, not just "loaded" users
  in the client](https://github.com/wekan/wekan/pull/2667).
  Thanks to Akuket.
- [Devcontainer: Moved MAIL-Vars to not-committed file, and added PATH with meteor to
  Environment](https://github.com/wekan/wekan/pull/2672).
  Thanks to road42.

and fixes the following bugs:

- [Fix incorrect date types for created and updated, so now newest card comments are at top](https://github.com/wekan/wekan/pull/2679).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.35 2019-08-29 Wekan release

This release fixes the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/71d32c6bc8e6affd345026797ff31e94a0a10d77).

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.34 2019-08-29 Wekan release

This release fixes the following bugs:

- [Snap: Delete all .swp files](https://github.com/wekan/wekan/commit/d5403bbfc53390aeaaf68eb452bc24d88f1e0942).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.33 2019-08-29 Wekan release

This release adds the following new features:

- [Add card color to calendar event. The color of the calendar event will match the card
  color](https://github.com/wekan/wekan/pull/2664).
  Thanks to grmpfhmbl.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.32 2019-08-29 Wekan release

This release fixes the following bugs:

- [Fix Snap adopt-info](https://github.com/wekan/wekan/commit/79d4cd83b1fa83bb814230683b7449ed7f3e1ede).
  Thanks to [popey at Snapcraft forum](https://forum.snapcraft.io/t/dirty-snap-release/12975/12).

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.31 2019-08-29 Wekan release

This release fixes the following bugs:

- [Try](https://github.com/wekan/wekan/commit/be5f435bc5f500b24bc838ac1dc8bf3bb9a33a22) to
  [fix adopt-info](https://forum.snapcraft.io/t/dirty-snap-release/12975/8).
  Thanks to ogra at Snapcraft forum.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.30 2019-08-29 Wekan release

This release fixes the following bugs:

- Snap: [Change version-script to adopt-info](https://github.com/wekan/wekan/commit/0ff5ce8fde6cc9a05a3c8b93e18ebce7282d3a67)
  to [fix dirty](https://forum.snapcraft.io/t/dirty-snap-release/12975/4).
  Thanks to popey and daniel at Snapcraft forum.
- [Delete another phantomjs binary from Snap](https://github.com/wekan/wekan/commit/5084102e6e17fa2cb3bc8c1180745e15379fab5f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.29 2019-08-29 Wekan release

This release fixes the following bugs:

- [Fix Snap](https://github.com/wekan/wekan/commit/7761a22bb4e88ad9a5a39ed84e1ff244015c3a58).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.28 2019-08-29 Wekan release

This release fixes the following bugs:

- Fix broken Sandstorm release by reverting upgrading MongoDB.
  Thanks to xet7

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.27 2019-08-29 Wekan release

This release adds the following upgrades:

- [Upgrade Node, Mongo, fibers and qs](https://github.com/wekan/wekan/commit/e21c47d3cfe0f228ce5ab394142c6ec6ee090d65).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.26 2019-08-28 Wekan release

This release adds the following new features:

- [Add devcontainer](https://github.com/wekan/wekan/pull/2659) and some [related fixes](https://github.com/wekan/wekan/pull/2660).
  Thanks to road42.

and fixes the following bugs:

- [Add missing modules](https://github.com/wekan/wekan/pull/2653).
  Thanks to GhassenRjab.
- [Add package-lock.json](https://github.com/wekan/wekan/commit/ad01526124216abcc8b3c8230599c4eda331a86d).
  Thanks to GhassenRjab and xet7.
- [Fix last label undefined](https://github.com/wekan/wekan/pull/2657).
  Thanks to justinr1234.
- [Default to BIGEVENTS_PATTERN=NONE so that Wekan sends less email notifications](https://github.com/wekan/wekan/commit/0083215ea3955a950d345d44a8663e5b05e8f00f).
  Thanks to rinnaz and xet7.
- [Fix app hang when Meteor.user() is null and list spinner is loaded bug](https://github.com/wekan/wekan/pull/2654).
  Thanks to urakagi.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.25 2019-08-23 Wekan release

This release adds the following new features:

- [Limit card width to fixed size](https://github.com/wekan/wekan/commit/0dd3ff29f2b558bc912b330f178347035dcc46c7).
  Thanks to xet7.

and fixes the following bugs:

- [Fix](https://github.com/wekan/wekan/pull/2645) [selecting user accounts when importing from Trello](https://github.com/wekan/wekan/issues/2638).
  Thanks to justrinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.24 2019-08-22 Wekan release

This release fixes the following bugs:

- [Snap: Delete old MongoDB log, and log to syslog instead, because syslog usually already has
  log rotation](https://github.com/wekan/wekan/commit/cc792ddd57691bb54972c73b9c861c768fce8c34).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.23 2019-08-20 Wekan release

This release fixes the following bugs:

- [Fix login did not work](https://github.com/wekan/wekan/commit/b2deab544bfeea49017bec27f92f1269b0b7ec43).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.22 2019-08-20 Wekan release

This release adds the following new features:

- [Wrap minicard text labels to multiple rows](https://github.com/wekan/wekan/commit/af830812dbbf7d766a754d937308b11373c66e5a).
  Thanks to xet7.

and fixes the following bugs:

- [Fix: Some users cannot switch views or languages](https://github.com/wekan/wekan/issues/2630).
  Thanks to xet7 and justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.21 2019-08-16 Wekan release

This release adds the following new features:

- [In the filter menu, 1) Turning on "show archive" will request archived lists and show them on the ListView.
  2) Turning on "hide empty lists" will hide empty lists on the ListView](https://github.com/wekan/wekan/pull/2632).
  Thanks to urakagi.

and fixes the following bugs:

- [Fix mismatched queries](https://github.com/wekan/wekan/pull/2628).
  Thanks to justinr1234.
- [Fix Summernote too wide when in mobile screen](https://github.com/wekan/wekan/issues/2621).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.20 2019-08-15 Wekan release

This release fixes the following security issues:

- [Revert permission change](https://github.com/wekan/wekan/commit/d302d6f857657ada229f78d9fcd32f63753d9779),
  related [#2590](https://github.com/wekan/wekan/issues/2590) and
  [these comments](https://github.com/wekan/wekan/commit/9f6d615ee5bbdb7552e6bdcae75a76a7f74fef7a#commitcomment-34636513).
  Thanks to road42, justinr1234 and xet7.

and adds the following new features:

- On board, BoardAdmin and normal user can now [invite new user directly
  with email address](https://github.com/wekan/wekan/issues/2060),
  [without using Admin Panel or registering
  at /sign-up](https://github.com/wekan/wekan/commit/5c696e5a3c70d31a7af6e47cbcf691f6c18eb384).
  Thanks to xet7.

and fixes the following bugs:

- [Fix bug: When on board, clicking Admin Panel redirects to All Boards page, so it did require
  to click Admin Panel again](https://github.com/wekan/wekan/commit/d302d6f857657ada229f78d9fcd32f63753d9779).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.18 2019-08-15 Wekan release

This release adds the following new features:

- [Send webhook message](https://github.com/wekan/wekan/issues/2518) when
  [cardDetails is rendered](https://github.com/wekan/wekan/pull/2620).
  Thanks to jymcheong.
- Related to [above new feature](https://github.com/wekan/wekan/issues/2518),
  Add [setting CARD_OPENED_WEBHOOK_ENABLED=false as
  default](https://github.com/wekan/wekan/commit/b8c527d52bec7272c890385f11e26acec65822ae).
  Thanks to xet7.

and adds the following updates:

- [Update base64 dependency](https://github.com/wekan/wekan/commit/c87001fa9f8d1fa13640ae604b1ba46556c7813c).
  Thanks to xet7.

and fixes the following bugs:

- [Time line is missing delete/edit comments, add English i18n for these two activities,
  For html email msg needs](https://github.com/wekan/wekan/pull/2615).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.17 2019-08-13 Wekan release

This release fixes the following bugs:

- [Fix ReferenceError: cardAssignees is not defined](https://github.com/wekan/wekan/issues/2612).
  Reverted In-Progress Assignee field, moving it to feature branch.
  Thanks to saschafoerster and to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.16 2019-08-13 Wekan release

This release adds the following new features:

- [Make Admin Panel text like version etc selectable](https://github.com/wekan/wekan/commit/5aa090e91184764afeac8b7c7bf4b4cb947c8f17).
  Thanks to xet7.
- [Add to Admin Panel / Version: Meteor version, MongoDB version, MongoDB storage engine, MongoDB Oplog
  enabled](https://github.com/wekan/wekan/commit/20294d833a2bf0bd1720444f4ffe018b025dacca).
  Thanks to RocketChat developers for MongoDB detection code and xet7 for other code.
- [Use Meteor 1.8.1 and MongoDB 3.2.22 in Snap](https://github.com/wekan/wekan/commit/39ffe1d80dad5759b338d4ed2d6c576717af2a07).
  Removed Meteor 1.6.x files.
  Thanks to xet7.
- [Enable HTML email content for richer comment](https://github.com/wekan/wekan/pull/2611).
  Thanks to whowillcare.

and fixes the following bugs:

- [Fix scrollHeight error when the sidebar is not visible](https://github.com/wekan/wekan/pull/2609).
  Thanks to Trekky12.
- [Fix insert action for CustomFields API](https://github.com/wekan/wekan/pull/2610).
  Thanks to JimCircadian.
- [Fixed a few issues related summernote enabled: 1) @ user couldn't send out email sometime, due to html format.
  2) @ user link wasn't able to show user info by clicking](https://github.com/wekan/wekan/pull/2611).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.15 2019-08-11 Wekan release

This release fixes the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/a1d883b22f73f4bef6d547f94dcb900f475fcb41).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.14 2019-08-11 Wekan release

This release adds the following new features:

- [On wekan master specifying ATTACHMENTS_STORE_PATH, it will try its best keeping original attachments, only newer
  attachments will be stored into specified path](https://github.com/wekan/wekan/pull/2607).
  Thanks to whowillcare.
- [Made image upload in summernote as attachment to wekan board instead of base64 string,
  which would make the comments use less bytes and be able to take advantage of using local file system feature
  as attachment](https://github.com/wekan/wekan/pull/2608).
  Thanks to whowillcare.

and fixes the following bugs:

- [Fix bug: Unable to disable richer comment editor](https://github.com/wekan/wekan/pull/2607).
  Thanks to whowillcare.
- [Changed rm to rm -f in wekan snap build, and add packages that somehow didn't get install during snapcraft
  build](https://github.com/wekan/wekan/pull/2608).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.13 2019-08-09 Wekan release

Update translations. Thanks to translators.

# v3.12 2019-08-09 Wekan release

This release adds the following new features:

- [Allowing wekan server admin to specify the attachments to be uploaded to server
  file system instead of mongodb by specifying a system
  env var: ATTACHMENTS_STORE_PATH](https://github.com/wekan/wekan/pull/2603).
  The only caveat for this is if it's not a brand new wekan, if the wekan
  server admin switchs to this setting, their old attachments won't be available
  anymore, unless someone make a script to export them out to the filesystem.
  Thanks to whowillcare.
- [Allowing user to insert video, link and image, or paste in html with sanitization.
  In user comments display area, images can be clicked and shown as
  swipebox](https://github.com/wekan/wekan/pull/2593).
  Thanks to whowillcare.

and fixes the following bugs:

- [Fix comment-editor marking issue](https://github.com/wekan/wekan/issues/2575).
  Thanks to whowillcare.
- [Bugfix: style kbd font color became white after introduced summernote editor
  to card comments](https://github.com/wekan/wekan/pull/2600).
  Thanks to whowillcare.
- [Show All Boards / Clone Board and Archive Board only to BoardAdmin/Admin/Sandstorm users
  on desktop webbrowser view, so that it's not possible for normal users to make accidental
  clicks to those](https://github.com/wekan/wekan/issues/2599).
  Thanks to derbolle and xet7.
- [Fix bug on editing users informations, switching to other view, staring
  a board](https://github.com/wekan/wekan/issues/2590).
  Thanks to road42.
- [Fix null access with board body](https://github.com/wekan/wekan/pull/2602).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.11 2019-08-07 Wekan release

This release fixes the following bugs:

- [Remove non-existing file from snapcraft.yaml to get Snap to build](https://github.com/wekan/wekan/commit/ad82a900e8ec636a72c6e74bb8489559ce2a8bf0).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.10 2019-08-07 Wekan release

This release fixes the following bugs:

- [Add missing dependencies back and revert deleting phantomjs](https://github.com/wekan/wekan/commit/32e9aa0ddaf1b015825b8c62ad17ed74b449e4b1).
  Thanks to whowillcare and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.09 2019-08-07 Wekan release

This release adds the following features:

- [Hide minicard label text: per user checkbox setting at sidebar](https://github.com/wekan/wekan/commit/f7e0b837d394d55d66d451c34f43fa8afd357e5b).
  Thanks to xet7.

and fixes the following bugs:

- [Make Save button visible again at Admin Panel People Edit](https://github.com/wekan/wekan/commit/716fc32968e7dd51b64a11c6c33e59aee849c982).
  Thanks to sclerc-chss and xet7.
- [Fix checking if API is enabled](https://github.com/wekan/wekan/pull/2588).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.08 2019-08-07 Wekan release

This release fixes the following bugs:

- [Removed removing phantomjs from snap, because snap build did stop to error
  no phantomjs could be removed](https://github.com/wekan/wekan/commit/7d8f1dee62f285a4587fb40e7331d0f500b2e5fb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.07 2019-08-07 Wekan release

This release fixes the following bugs:

- [Try to make release sizes smaller by deleting phantomjs](https://github.com/wekan/wekan/commit/1fc3a1db2e663f149287b6e14053d536fb1a8a81).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.06 2019-08-07 Wekan release

This release fixes the following bugs:

- [Fix board query](https://github.com/wekan/wekan/pull/2587).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.05 2019-08-07 Wekan release

This release fixes the following bugs:

- [Fixed LDAP group filtering bug on Snap settings](https://github.com/wekan/wekan/pull/2584).
  Thanks to KuenzelIT.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.04 2019-08-06 Wekan release

This release fixes the following bugs:

- [Fixed Snap: Use Meteor 1.6.0.1 dependencies on Snap on master branch](https://github.com/wekan/wekan/commit/74a4b28313e9cfedcb927e4496c0dd3800b1e6f9).
  Thanks to xet7.
- [Hide Admin Panel user delete button until someone has time to fix it](https://github.com/wekan/wekan/commit/b9a25ecfaca067d0392c83d97a0deb65e6e296dd).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.03 2019-08-04 Wekan release

This release adds the following new features:

- [Add RICHER_CARD_COMMENT_EDITOR=true to docker-compose.yml](https://github.com/wekan/wekan/commit/268f9de23c8167dca9499587ee31fb74edb6b83e).
  Thanks to xet7.
- [Add popup to confirm deleting one account](https://github.com/wekan/wekan/pull/2573).
  Thanks to Akuket.
- [Add admin setting to prevent users to self deleting their account](https://github.com/wekan/wekan/pull/2573).
  Thanks to Akuket.
- [Add Packager.io DEB/RPM Wekan packages for Debian/Ubuntu/CentOS/SLES](https://packager.io/gh/wekan/wekan).
  Does not work yet, [debugging in progress here](https://github.com/wekan/wekan/issues/2582).
  Thanks to xet7 and sfahrenholz.
- [Add setting field LDAP_USER_AUTHENTICATION_FIELD=uid](https://github.com/wekan/wekan/pull/2581).
  Thanks to Trekky12.

and adds the following upgrades:

- [Upgrade MongoDB to 4.0.11](https://github.com/wekan/wekan/commit/ec35c544b780e563a973fd887c5190f429431bfb).
  Thanks to xet7.

and fixes the following bugs:

- [Remove mixmax:smart-disconnect, previously it did disconnect Wekan when
  browser tab was not active, but because now users are working on multiple
  boards at different browser tabs and switching all time time, there was
  constant loading, so now after removing all tabs keeps active. This can
  increase server CPU usage](https://github.com/wekan/wekan/commit/669cd76018cbbfbd3ee58610a35959fa8a84ea36).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.02 2019-07-26 Wekan release

This release adds the following updates:

- [Updated Wekan on OpenShift](https://github.com/wekan/wekan/commit/85ca2b1363ed0bad8639ba7ed65c55e445816947).
  Thanks to xet7.

and fixes the following bugs:

- [Set LDAP_BACKGROUND_SYNC_INTERVAL='' (empty string) so it works](https://github.com/wekan/wekan/commit/fff144a8279ac36ce83e6b975f17f6dbc35f39d6)
  and [does not crash](https://github.com/wekan/wekan/issues/2354#issuecomment-515305722).
  Also updated wekan-postgresql docker-compose.yml to use devel branch docker image, because ToroDB requires MongoDB 3.2,
  it's not tested yet could newest master branch docker image work with MongoDB 3.2.
  Thanks to benh57 and xet7.

and tries to fix following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/7cf6850cdf77ef51808784e3d275c5be86ff6c92).
  This [will be tested soon, does this work](https://github.com/wekan/wekan/issues/2533#issuecomment-515329490).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.01 2019-07-26 Wekan release

This release adds the following new features:

- [Rich text editor at card comments, based on
  Summernote](https://github.com/wekan/wekan/pull/2560).
  Thanks to whowillcare.
- [Add setting RICHER_CARD_COMMENT_EDITOR=true to
  Source/Snap/Docker/Sandstorm](https://github.com/wekan/wekan/commit/4aba290358455433c0fc676e8c9cf1bd627eddde).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.00 2019-07-25 Wekan release

This release:

- works with source, and docker-compose.yml at master branch.
- Docker release uses Meteor 1.8.1 and MongoDB 4.0.10, so you need to backup your old MongoDB database and
  restore with --noIndexRestore as described at https://github.com/wekan/wekan/wiki/Backup
- Snap and Sandstorm builds are not fixed yet, see progress at https://github.com/wekan/wekan/issues/2533

This release adds the following new features:

- [Added label text to labels on minicard](https://github.com/wekan/wekan/commit/c48d5a73cab04db1a1e113e4367dc88573110438).
  Thanks to xet7.
- [Allow to shrink attached/pasted image](https://github.com/wekan/wekan/pull/2544).
  Thanks to whowillcare.

and fixes the following bugs:

- [Fix invites](https://github.com/wekan/wekan/pull/2549).
  Thanks to justinr1234.
- [Makes LDAP background sync work. If the sync interval is unspecified, falls back to a hourly default](https://github.com/wekan/wekan/pull/2555).
  Thanks to pshunter.
- [Prevent isCommentOnly user adding attachments, editing list names, moving lists,
  and seeing board settings menu. Show non-editable Custom Fields to isCommentOnly user](https://github.com/wekan/wekan/commit/a68c928896a94c377134f29a7183aa0b5a423720).
  Thanks to xet7.
- [Many](https://github.com/wekan/wekan/pull/2546) [Snap](https://github.com/wekan/wekan/pull/2552) [fixes](https://github.com/wekan/wekan/pull/2553).
  In Progress. Thanks to justrinr1234.
- [Fixed Dockerfile](https://github.com/wekan/wekan/commit/7df6f305c5cf41ac213623aeffaa7e48c981e0b6) and
  [docker-compose.yml](https://github.com/wekan/wekan/commit/95698911f92ca728dbaab69406fd09bcbf81339d).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.99 2019-07-17 Wekan release

This release adds the following new features:

- [Add Corteza theme. In progress](https://github.com/wekan/wekan/commit/289e78dbd29cca9d97d3b5787c3368583d43b40f).
  Thanks to xet7.
- [Notify Due Days: System timelines will be showing any user modification for duat startat endat receivedat,
  also notification to the watchers and if any card is due, about due or past due](https://github.com/wekan/wekan/pull/2536).
  ENV variables: NOTIFY_DUE_DAYS_BEFORE_AND_AFTER (default is 2, if 0, will turn off notification for and dued cards),
  NOTIFY_DUE_AT_HOUR_OF_DAY (any number between 0 - 23, standing for at what hour of a day that the notification will
  be sent to the watchers). Also [bug fix for this, timeOldValue needs to set to "" in params when it's
  not set](https://github.com/wekan/wekan/pull/2541).
  Thanks to whowillcare.
- [Notify Due Days: Add settings to Snap/Docker/Source. Rename env variables to NOTIFY_DUE_DAYS_BEFORE_AND_AFTER and
  NOTIFY_DUE_AT_HOUR_OF_DAY](https://github.com/wekan/wekan/commit/5084cddf37ba16ce0855f8575c39f5e62d1b7f67).
  Thanks to xet7.
- [BIGEVENTS_PATTERN: When user being @ in comment, as long as it's not himself, a notification will be
  sent out no matter this user is watching the board or not](https://github.com/wekan/wekan/pull/2541).
  Introduced a system env var BIGEVENTS_PATTERN default as "due", so any activityType matches the pattern,
  system will send out notifications to all board members no matter they are watching or tracking
  the board or not. Owner of the Wekan server can disable the feature by setting this variable to "NONE"
  or change the pattern to any valid regex. i.e. '|' delimited activityType names.
  Thanks to whowillcare.
- [Add BIGEVENTS_PATTERN to Source/Snap/Docker](https://github.com/wekan/wekan/commit/d7c09df7d2649bf2d2b61772c251f81793a6ed77).
  Thanks to xet7.

and adds the following updates:

- [Update Meteor mongo package version](https://github.com/wekan/wekan/commit/96065d11a543852c1069cbab528bd08508b4a27c).
  Thanks to xet7.
- [Update dependencies](https://github.com/wekan/wekan/commit/d82c72f1c1df908e92045e5034fa12b33fc7f70c).
  Thanks to xet7.

and fixes the following bugs:

- RELAX THEME: Use [only in this theme](https://github.com/wekan/wekan/commit/3ad6e554dceea822dee7390872260e872a792dcd)
  the aggressive [red color and big bold serif font style
  number](https://github.com/wekan/wekan/commit/bbc68309af0029f2bc4194db4c7e79689f888ea4#commitcomment-34216371) and
  [card details text emphasis](https://github.com/wekan/wekan/commit/48ebc5f11745b125ce01d08d60e2d8e3a9419a5f#commitcomment-34268095)
  Thanks to hever and xet7.
- [Try to fix docker-compose.yml to use correct master branch that has
  meteor 1.8.1](https://github.com/wekan/wekan/commit/202cc5a797b6269ec422c6f2e532a49f09d4e30a).
  Thanks to xet7.
- [Outgoing Webhooks setCustomField: Add board name, card name, custom field name to be
  visible](https://github.com/wekan/wekan/commit/2003d90467debeadf51b69630c80ee6040524f52).
  Still missing: custom field value, list name, swimlane name.
  Thanks to xet7.
- [Don't remove boardoverlay when mouse leaves carddetails](https://github.com/wekan/wekan/pull/2540).
  This reduces Wekan board flashiness.
  Thanks to newhinton.
- [Limit the board list to 2 or 1 for mobile clients](https://github.com/wekan/wekan/pull/2542).
  As a mobile user, the board size of in the home page too small, so the user is easily to
  click on archive or copy button by accident. Increase the board size to 50% for pixel
  greater than 360 and lesser than 800 and height to 8rem, 100% for any screen is even smaller.
  This will reduce the accident much more.
  Thanks to whowillcare.
- [Add check for board member isActive](https://github.com/wekan/wekan/commit fe42eb1d014c06dfed8114a00b29eac9b08baec6).
  Thanks to xet7.

and has the following features in progress, not anything visible yet:

- [Teams/Organizations: Add beginnings of database structure](https://github.com/wekan/wekan/issues/802#issuecomment-505986270).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.98 2019-07-02 Wekan release

This release adds the following new features, thanks to xet7:

- [Add Wekan v2.95-v2.97 master branch features and fixes to meteor-1.8 branch](https://github.com/wekan/wekan/commit/34b2168d0dda253dedabbee47031873efa4ae446).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.97 2019-07-01 Wekan release

This release [adds the following new features](https://github.com/wekan/wekan/commit/3e8cb8c6e1617ef03ebce045d3b93aeb2cf91228), thanks to xet7:

- Add background color names to background colors.
- Add new background colors: moderatepink, strongcyan, limegreen.
- Add new background colors with themes: dark, relax.

Note: Due Date etc on cards is visible on all background colors and themes. Hiding is not implemented yet.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.96 2019-07-01 Wekan release

This release removes the following features, that were added at Wekan v2.95:

- [Remove RELAX MODE and DARK MODE](https://github.com/wekan/wekan/commit/8477e94f3b8f531a4209f49758200009d274c1cf),
  because [they changed look of all existing boards](https://github.com/wekan/wekan/issues/1149#issuecomment-507255114).
  At some later Wekan release they will be added back as separate themes
  that can be selected, without changing existing boards.
  Thanks to chirrut2 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.95 2019-07-01 Wekan release

This release adds the following new features, thanks to xet7:

- [Make list header add card + button more black, to make it more visible](https://github.com/wekan/wekan/commit/b260d05a8b2f87c29dd998d42103d1220b20cc08).
- [On minicard, make comment icon and number of comments have red color
  on white rounded background, so it is more visible when there is comments on card](https://github.com/wekan/wekan/commit/bbc68309af0029f2bc4194db4c7e79689f888ea4).
- [Make card description text more visible with black borders and more white text area](https://github.com/wekan/wekan/commit/48ebc5f11745b125ce01d08d60e2d8e3a9419a5f).

and adds the following [themes to board background colors](https://github.com/wekan/wekan/commit/c04292e98832e3aa7952e8a7858d47a853f40aad), thanks to xet7:

- RELAX MODE, so when green background selected, list background is light green.
- [DARK MODE](https://github.com/wekan/wekan/issues/1149), when dark background color selected. Please test and send color visibility fixes as pull requests.
- In RELAX MODE and DARK MODE, [hide card fields: received, start, due, end, members, requested, assigned](https://github.com/wekan/wekan/commit/b42ecb7948ad194433dc4460305174965106a751).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.94 2019-06-29 Wekan release

This release adds the following updates:

- [Prettier & eslint project style update](https://github.com/wekan/wekan/pull/2520).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.93 2019-06-28 Wekan release

This release fixes the following bugs:

- [LDAP: Check if email attribute is an array, that has many email addresses](https://github.com/wekan/wekan/pull/2519).
  Thanks to tdemaret and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.92 2019-06-27 Wekan release

This release fixes the following bugs:

- [Fix Outgoing Webhook messages for Checlists, Checklist Items, Card comments, Add/Remove CustomField to board](https://github.com/wekan/wekan/commit/5283ba9ebbedf11540ffef1d4d87891c5ce9efc7).
  Not yet fixed is Outgoing Webhook message about setting CustomField value.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.91 2019-06-27 Wekan release

This release fixes the following bugs:

- [Fix Attachment Outgoing Webhook missing list and swimlane name](https://github.com/wekan/wekan/commit/6a2f120d00b5ce9089ad2e12d01edb1ed9f94800).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.90 2019-06-21 Wekan release

This release reverts the following Sandstorm changes:

- [Revert v2.89 setting every Sandstorm Wekan user as admin](https://github.com/wekan/wekan/commit/e5c0d0ea18fe74a47afdfe101160280854e2c74f).
  Thanks to xet7. [Related #2405](https://github.com/wekan/wekan/issues/2405).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.89 2019-06-21 Wekan release

This release adds the following Sandstorm features:

- [Sandstorm Wekan: Set everyone as Admin](https://github.com/wekan/wekan/commit/60d62a6ae3a79059e68b2cd1d554d67b7d50b6aa).
  Please test does this help with [Problem with the user management: can't add users or give wekan admin rights](https://github.com/wekan/wekan/issues/2405).
  Thanks to xet7.
- [If board does not exist, redirect to All Boards page, at all Wekan platforms](https://github.com/wekan/wekan/commit/4f46adc389126597266d71110f9754841f86857c).
  So now at Sandstorm when loading Wekan grain, if first Sandstorm board is found,
  it is opened. If first Sandstorm board is not found (it's deleted or archived),
  then redirect automatically to All Boards page. [Closes #3132](https://github.com/wekan/wekan/issues/3132).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.88 2019-06-21 Wekan release

This release adds the following updates:

- Update translations.

Thanks to translators for their translations.

# v2.87 2019-06-21 Wekan release

This release adds the following new features:

- [Rule cardAction - SetDate](https://github.com/wekan/wekan/pull/2506).
  Thanks to road42.

and fixes the following bugs:

- [Fix Move card to top/bottom of list](https://github.com/wekan/wekan/pull/2508).
  Thanks to road42.
- [Translation fixes](https://github.com/wekan/wekan/pull/2507).
  Thanks to road42.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.86 2019-06-19 Wekan release

This release fixes the following bugs:

- [Fix Wekan unable to Select Text from Description edit box](https://github.com/wekan/wekan/issues/2451)
  by removing feature of card description submit on click outside. This is because when selecting text
  and dragging up did trigger submit of description, so description was closed and selecting text failed.
  This did affect all Chromium-based browsers: Chrome, Chromium, Chromium Edge.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.85 2019-06-19 Wekan release

This release fixes the following bugs:

- [Fixed bug: rule doesn't move card to top/bottom](https://github.com/wekan/wekan/pull/2502).
  Thanks to road42.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.84 2019-06-18 Wekan release

This release fixes the following bugs:

- [Buttons for adding rules to a board where missing for isBoardAdmin](https://github.com/wekan/wekan/pull/2500).
  Thanks to road42.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.83 2019-06-17 Wekan release

This release fixes the following bugs:

- [Fix Bug: Unable to click board submenu on mobile](https://github.com/wekan/wekan/commit/7ff6f24a90374ae95edbb87b37e0c235e7aee434).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.82 2019-06-14 Wekan release

This release fixes the following bugs:

- [Fix OIDC Docker login. Empty string results to empty array at wekan/server/authentication.js](https://github.com/wekan/wekan/commit/bddbaa7bc2f3cfe8553a2265e168231ab51876f3).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.81 2019-06-13 Wekan release

This release fixes the following bugs:

- [Change OAuth2 whitelist default to empty string at snap, so it would be used as array on
  wekan/server/authentication.js](https://github.com/wekan/wekan/commit/4334fbbb9dacf45b0262019526a9697b015049a1).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.80 2019-06-13 Wekan release

This release fixes the following bugs:

- [Fix OAuth2 typos in snap-src/bin/config](https://github.com/wekan/wekan/commit/44dbd462b19e613fcb47161d44e4046d5d91a319).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.79 2019-06-13 Wekan release

This release fixes the following bugs:

- [Fix OAuth2 typos in Dockerfile and docker-compose.yml](https://github.com/wekan/wekan/pull/2488).
  Thanks to DominikPf.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.78 2019-06-12 Wekan release

This release fixes the following bugs:

- [Try to fix OIDC login](https://github.com/wekan/wekan/commit/8b31c0768c34fc4557b54cec936a0b4288a8e722).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.77 2019-06-11 Wekan release

This release fixes the following bugs:

- [Fix Snap build](https://github.com/wekan/wekan/commit/e1e20275a673d3065c6cf239db8d2f1a505baa69).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.76 2019-06-11 Wekan release

This release adds the following new features:

- [Add support for CORS headers "Access-control-allow-headers" and
  "Access-control-expose-headers"](https://github.com/wekan/wekan/pull/2429).
  Thanks to risacher and xet7.
- [Support scopes in OAuth2, so that Authentication via OAuth2 with Google is now possible](https://github.com/wekan/wekan/pull/2483).
  Thanks to moserben16.

and fixes the following bugs:

- [Fix Scope parsing Issue for OAuth2 Login with simple String](https://github.com/wekan/wekan/pulls/2427).
  Thanks to DominikPf.
- [Show attachment name in Outgoing Webhook when attachment is added to card](https://github.com/wekan/wekan/commit/992ecfefa2e46ee7321ec9b8bfc3400532e5645e).
  Thanks to xet7. Related [#2285](https://github.com/wekan/wekan/issues/2285).
- [Show attachment name in Outgoing Webhook when attachment is removed from card](https://github.com/wekan/wekan/commit/23ccb3b991be6d7196e59f7d68df17b8949df049).
  Thanks to xet7. Related [#2285](https://github.com/wekan/wekan/issues/2285).
- [Allow BoardAdmin to create board rules](https://github.com/wekan/wekan/pull/2433).
  Thanks to road42.
- [Fix typo](https://github.com/wekan/wekan/pull/2442).
  Thanks to Jason-Cooke.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.75 2019-05-22 Wekan release

This release adds the following new features:

- [CAS allowed LDAP groups](https://github.com/wekan/meteor-accounts-cas/pull/4).
  Thanks to ppoulard. Please test. Related [#2356](https://github.com/wekan/wekan/issues/2356).

and fixes the following bugs:

- [Fix](https://github.com/wekan/wekan/commit/634df8f6f26a7a7a2df6f87a705d322d88638425):
  [OAuth2 Requested Scopes are wrong / cannot be configured](https://github.com/wekan/wekan/issues/2412).
  Thanks to DominikPf and xet7. Please test.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.74 2019-05-14 Wekan release

This release fixes the following bugs:

- Add missing [wekan-ldap#40](https://github.com/wekan/wekan-ldap/pull/40) code about
  [LDAP_SYNC_ADMIN_STATUS](https://github.com/wekan/wekan/commit/0fe40ad9ec82ef2045578f4cc1e2ebb6cc80d47a).
  Thanks to JulianJacobi, n-st, chirrut2 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.73 2019-05-14 Wekan release

This release fixes the following bugs with Apache I-CLA:

- [Card count placement and export API functionality back](https://github.com/wekan/wekan/pulls/2406).
  Thanks to bentiss.
- [Few fixes for Dockerfile](https://github.com/wekan/wekan/pulls/2407).
  Thanks to bentiss.

and fixes the following bugs:

- Fixed [#2338](https://github.com/wekan/wekan/issues/2338) -> [Slow opening of big boards with too many archived items](https://github.com/wekan/wekan/pull/2402).
  If some Wekan users see errors with this, please empty your browser cache.
  Thanks to nerminator.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.72 2019-05-13 Wekan release

This release adds the following new features:

- [Added BIDI support to "Add Card"](https://github.com/wekan/wekan/pull/2401).
  Related [#884](https://github.com/wekan/wekan/issues/884).
  Thanks to guyzyl.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.71 2019-05-12 Wekan release

This release adds the following new features:

- [Add partentId support on card web API](https://github.com/wekan/wekan/pulls/2400).
  Thanks to atilaromero.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.70 2019-05-11 Wekan release

This release adds the following new features:

- [View markdown on List names, Custom Fields (Text and Dropdown), Label names,
  All Boards view Board names and Board descriptions](https://github.com/wekan/wekan/commit/b795115042c2eb6bccbf029f21d78849a44128ca).
  Related [#2334](https://github.com/wekan/wekan/issues/2334).
  Thanks to shaygover and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.69 2019-05-11 Wekan release

This release fixes the following translation names:

- [Fix translation name in Wekan menu: oc to Occitan](https://github.com/wekan/wekan/commit/db40ca25ac5df17fcc8b7c93f12b7e2bffc349d2).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.68 2019-05-10 Wekan release

This release adds the following new features:

- [Option to login to the LDAP server with the user's own username and password, instead of an administrator
  key](https://github.com/wekan/wekan/pull/2399). Default: false (use administrator key).
  With new setting: LDAP_USER_AUTHENTICATION=true.
  Thanks to thiagofernando.
- [Added above new LDAP_USER_AUTHENTION=true option to Snap, Docker and Source settings](https://github.com/wekan/wekan/commit/3bbc805ee42e3c1638b50260d3fafc2b5f936923).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.67 2019-05-10 Wekan release

This release adds the following new features:

- [Move board to Archive button at each board at All Boards page](https://github.com/wekan/wekan/commit/828f6ea321020eda77fea399df52889e2081dfac).
  Thanks to xet7. Related [#2389](https://github.com/wekan/wekan/issues/2389).
- [If adding Subtasks does not work on old board, added wiki page how to make it work again](https://github.com/wekan/wekan/wiki/Subtasks).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.66 2019-05-09 Wekan release

This release adds the following new features:

- [Delete user feature](https://github.com/wekan/wekan/pull/2384).
  Thanks to Akuket.
- Change to Delete user feature: [When last board admin is removed, board is not deleted, other board users can
  still use it](https://github.com/wekan/wekan/commit/e1b016cf3d4ff93e9e0fe1feb96372e3e1625233).
  Thanks to xet7.

and adds the following new translations:

- Add Chinese (Hong Kong).
  Thanks to translators.

and fixes the following bugs:

- [Fix OIDC login](https://github.com/wekan/wekan/pull/2385). Related [#2383](https://github.com/wekan/wekan/issues/2383).
  Thanks to faust64.
- [Fix missing profile checks](https://github.com/wekan/wekan/pull/2396).
  Thanks to justinr1234.
- [Fix RTL issue #884, part 1](https://github.com/wekan/wekan/pull/2395).
  Thanks to guyzyl.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.65 2019-04-24 Wekan release

This release adds the following new features:

- [Now a loading animation is displayed when the authentication is performed. This allows users
  to know that it's in progress](https://github.com/wekan/wekan/pull/2379).
  Thanks to Akuket.

and removes the following UI duplicates:

- [Remove from card menu, because they also exist at card:
  members, labels, attachments, dates received/start/due/end](https://github.com/wekan/wekan/issues/2242).
  Thanks to sfahrenholz, jrsupplee and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.64 2019-04-23 Wekan release

This release adds the following new features:

- [Board Archive: Restore All/Delete All of Cards/Lists/Swimlanes](https://github.com/wekan/wekan/pull/2376).
  Thanks to Akuket.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.63 2019-04-23 Wekan release

This release removes the following Caddy plugins:

- [Remove Caddy plugins http.filter, http.ipfilter and http.realip from Caddy](https://github.com/wekan/wekan/commot/6a94500170509d2d82bd9a0fdc94a7ce66215b3d)
  because they are currently broken, preventing download of Caddy during Wekan Snap build.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.62 2019-04-23 Wekan release

This release fixes the following bugs:

- [Mobile UI: Center cards in list view](https://github.com/wekan/wekan/issues/2371).
  Thanks to hupptechnologies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.61 2019-04-20 Wekan release

This release adds the following new features:

- Admin Panel/People: Can now search users by username, full name or email and using regex to find them.
  Display the number of users. All registered users by default else the number of users selected by the search.
  Thanks to Akuket.

and adds the following updates:

- [Update to use newest GitHub flawored markdown](https://github.com/wekan/wekan/commit/fea2ad3d7d09b44c3de1dbcdd3f8750aaa6776d5),
  because [it was found old version was in use](https://github.com/wekan/wekan/issues/2334).
  Thanks to shaygover and xet7.
- [Upgrade to Node 8.16.0](https://github.com/wekan/wekan/commit/6117097a93bfb11c8bd4c87a23c44a50e22ceb87).
  Thanks to Node developers and xet7.
- [Upgrade Docker base image to ubuntu:disco](https://github.com/wekan/wekan/commit/bd14ee3b1f450ddc6dec26ccc8da702b839942e5).
  Thanks to Ubuntu developers and xet7.

and fixes the following bugs:

- [Fix Full width of lists and space before first list](https://github.com/wekan/wekan/pull/2343).
  Thanks to hupptechnologies.
- Remove [extra](https://github.com/wekan/wekan/pull/2332) [quotes](https://github.com/wekan/wekan/pull/2333) from docker-compose.yml.
  Thanks to hibare.
- Fix Docker builds by moving all separately cloned wekan/packages/* repos like ldap, oidc, etc code to wekan repo code,
  so that in build scripts it's not needed to clone those. Also archived those wekan repos and moved issues
  to https://github.com/wekan/wekan/issues because changes and development to those packages now happends on wekan/wekan repo.
  There was also fixes to repo urls etc. Thanks to xet7.
- [Additional updates](https://github.com/wekan/wekan/pull/2347) to meteor-1.8 branch, that contains
  Meteor 1.8.1 version that works in Docker but not yet at Snap and Sandstorm. Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.60 2019-04-08 Wekan release

This release fixes the following bugs:

- [Fix: Description of Board is out of visible after Feature "Duplicate Board"](https://github.com/wekan/wekan/issues/2324).
  Thanks to sfahrenholz and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.59 2019-04-06 Wekan release

This release fixes the following bugs:

- [Add variables for activity notifications, Fixes #2285](https://github.com/wekan/wekan/pull/2320).
  Thanks to rinnaz.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.58 2019-04-06 Wekan release

This release adds the following new features:

- [Duplicate Board](https://github.com/wekan/wekan/issues/2257). Related #2225.
  Thanks to Angtrim.
- [Add Duplicate Board tooltip, and remove adding text "Copy" to duplicated board](https://github.com/wekan/wekan/commit/0f15b6d1982c383f76e8411cb501ff27e8febd42).
  Thanks to xet7.

and fixes the following bugs:

- [Add proper variables for unjoin card](https://github.com/wekan/wekan/pull/2313).
  Thanks to chotaire.
- [Center reduce left margin in card view on mobile browser](https://github.com/wekan/wekan/pull/2314).
  Thanks to hupptechnologies.
- [Remove not needed ARGS from Dockerfile to reduce amount of Docker layers](https://github.com/wekan/wekan/issues/2301).
  Thanks to folhabranca and xet7.
- [Fix Swimlane Rules don't work](https://github.com/wekan/wekan/issues/2225).
  Thanks to Angtrim.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.57 2019-04-02 Wekan release

This release fixes the following bugs, thanks to justinr1234:

- [Add proper variables for join card](https://github.com/wekan/wekan/commit/289f1fe1340c85eb2af19825f4972e9057a86b7a),
  fixes [Incorrect variable replacement on email notifications](https://github.com/wekan/wekan/issues/2285).

and fixes the following bugs with Apache I-CLA, thanks to bentiss:

- [List: Do not use IntersectionObserver to reduce CPU usage](https://github.com/wekan/wekan/pull/2302).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.56 2019-03-27 Wekan release

This release [fixes the following bugs](https://github.com/wekan/wekan/pull/2287), thanks to bentiss with Apache I-CLA:

- [#2250 -> the spinner could be shown on startup and never goes away](https://github.com/wekan/wekan/issues/2250).
- The code will now only load extra cards that will be in the current viewport.
- When 2 users were interacting on the same board, there was a situation where the spinner could show up on the other user, without being able to load the extra cards.
- The code is now much simpler, thanks to the IntersectionObserver, and all of this for fewer lines of code :)

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.55 2019-03-25 Wekan release

This release fixes the following bugs, thanks to bentiss with Apache I-CLA:

- [Use older api2html@0.3.0](https://github.com/wekan/wekan/commit/625682a4dab43c525494af10121edbfd547786d7)
  to fix [broken snap and docker build](https://github.com/wekan/wekan/issues/2286),
  because newer api2html caused
  [breaking change](https://github.com/tobilg/api2html/commit/a9a41bca18db3f9ec61395d7262eff071a995783)
  at api2html/bin/api2html.js:23 has error about "php": "PHP".

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.54 2019-03-25 Wekan release

This release fixes the following bugs:

- Fix typos.
- [Fix Outgoing Webhook message about created new swimlane](https://github.com/wekan/wekan/issues/1969).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.53 2019-03-23 Wekan release

This release fixes the following bugs:

- [Fix filename and URLs](https://github.com/wekan/wekan/ccommit/994314cfa339e52a2ad124194af4e89f57ddd213).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.52 2019-03-22 Wekan release

This release adds the following new features:

- [More whitelabeling: Hide Wekan logo and title by default, and don't show separate option to hide logo at
  Admin Panel/Layout](https://github.com/wekan/wekan/commit/2969161afbe60a1aa2e7da6cedc3ab48941faf3e).
  Thanks to xet7.
- Added and then reverted option to redirect OIDC OAuth2 login [part1](https://github.com/wekan/wekan-ldap/commit/82a894ac20ba9e7c6fdf053cff1721cab709bf8a),
  [part 2](https://github.com/wekan/wekan-ldap/commit/36900cc360d0d406f8fba5e43378f85c92747870) and
  [part3](https://github.com/wekan/wekan/commit/7919ae362866c0cacf2a486bf91b12e4d25807d7).
  This does not work yet. In Progress.
  Thanks to xet7.
- [Add LDAP config example, remove extra text](https://github.com/wekan/wekan/commit/506acda70b5e78737c52455e5eee9c8758243196).
  Thanks to xet7.

and fixes the following bugs:

- [Fix IFTTT email sending](https://github.com/wekan/wekan/pull/2279).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions.

# v2.51 2019-03-21 Wekan release

This release fixes the following bugs:

- [Fix Unable to change board card title (=Board name) at Templates page](https://github.com/wekan/wekan/issues/2275).
  and [Unable to change card title in Template](https://github.com/wekan/wekan/issues/2268) part 2.
  Thanks to andresmanelli.

Thanks to above GitHub users for their contributions.

# v2.50 2019-03-21 Wekan release

This release fixes the following bugs:

- [Fix](https://github.com/wekan/wekan/pull/2269) [Unable to change card title in Template](https://github.com/wekan/wekan/issues/2268)
  and [Fix Unable to create a new board from a template](https://github.com/wekan/wekan/issues/2267).
  Thanks to andresmanelli.

Thanks to above GitHub users for their contributions.

# v2.49 2019-03-21 Wekan release

This release fixes the following bugs:

- [The invitation code doesn't exist - case-sensitive eMail](https://github.com/wekan/wekan/issues/1384). Thanks to neurolabs.
- [Don't swallow email errors](https://github.com/wekan/wekan/pull/2272). Thanks to justinr1234.
- [Migrate customFields model](https://github.com/wekan/wekan/pull/2264).
  Modifies the customFields model to keep an array of boardIds where the customField can be used.
  Adds name matching for labels when copying/moving cards between boards.
  This way, customFields are not lost when copying/moving a card. Particularly useful when templates have customFields or labels with specific names (not tested for templates yet).
  Thanks to andresmanelli.
- [Fix dissapearing subtasks](https://github.com/wekan/wekan/pull/2265). Thanks to andresmanelli.
- [Cards disappear when rearranged on template board](https://github.com/wekan/wekan/issues/2266). Thanks to andresmanelli.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.48 2019-03-15 Wekan release

This release fixes the following bugs, thanks to GitHub user xet7:

- [Fix LDAP login](https://github.com/wekan/wekan/commit/216b3cfe0121aa026139536c383aa27db0353411).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.47 2019-03-14 Wekan release

This release fixes the following bugs, thanks to GitHub user xet7:

- [Remove ordering of cards by starred/color/description, so that cards would not reorder all the time](https://github.com/wekan/wekan/issues/2241).
- Try to fix [LDAP Login: "Login forbidden", ReferenceError: req is not defined](https://github.com/wekan/wekan-ldap/44).

# v2.46 2019-03-13 Wekan release

This release fixes the following bugs:

- [Fix watchers undefined](https://github.com/wekan/wekan/pull/2253).
  Thanks to justinr1234.
- [Revert hiding of Subtask boards](https://github.com/wekan/wekan/commit/1968b7da31d75757fd6383417d729ff6af6bbc5b)
  because of feedback from Wekan users, that need Subtask boards to be visible.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.45 2019-03-11 Wekan release

This release fixes the following bugs, thanks to andresmanelli:

- [Rename circular card migration to re run the fix](https://github.com/wekan/wekan/commit/a347ae367654258b7768e7571831ed8f75fb5b84).

# v2.44 2019-03-11 Wekan release

This release adds the following new features and fixes with Apache I-CLA, thanks to bentiss:

- [Activities: register customFields changes in the activities](https://github.com/wekan/wekan/pull/2239).
- [customFields: fix leftover from lint](https://github.com/wekan/wekan/commit/4c72479d1206850d436261dc5c6a4127f246f6da).
  Looks like I forgot to use the camelCase notation here, and this leads to an exception while updating a custom field.
- [Fix imports](https://github.com/wekan/wekan/pull/2245).

and adds the following new features:

- Add language: Occitan. Thanks to translators.

and fixes the following bugs:

- [Fix removed checklistItem activity => dangling activities created](https://github.com/wekan/wekan/commit/2ec1664408d9515b5ca77fbb46ef99208eb8cff0).
  Closes #2240. Thanks to andresmanelli.
- [Avoid set self as parent card to cause circular reference, for real](https://github.com/wekan/commit/97822f35fd6365e5631c5488e8ee595f76ab4e34).
  Thanks to andresmanelli.
- Try to fix [Order All Boards by starred, color, board name and board description. Part 2](https://github.com/wekan/wekan/commit/8f337f17e45f8af8d96b6043d54466e5878b7e0b).
  Works on new Wekan install. Could still have boards keeping reording happening all the time on old Wekan installs.
  Thanks to xet7. Note: Ordering by starred/color/description was removed at Wekan v2.47.
- [Changed brute force protection package from eluck:accounts-lockout to lucasantoniassi:accounts-lockout that is maintained and works.
  Added Snap/Docker/Source settings](https://github.com/wekan/wekan/commit/b7c000b78b9af253fb115bbfa5ef0d4c0681abbb).
  Thanks to xet7.

Thanks to above Wekan contributors for their contributions.

# v2.43 2019-03-08 Wekan release

This release adds the following new features, thanks to xet7:

- [Hide Subtask boards from All Boards](https://github.com/wekan/wekan/issues/1990). This was reverted in Wekan v2.46 to make Subtask boards visible again.
- [Order All Boards by Starred, Color, Title and Description](https://github.com/wekan/wekan/commit/856872815292590e0c4eff2848ea1b857a318dc4).
  This was removed at Wekan v2.47.
- [HTTP header automatic login](https://github.com/wekan/wekan/commit/ff825d6123ecfd033ccb08ce97c11cefee676104)
  for [3rd party authentication server method](https://github.com/wekan/wekan/issues/2019) like siteminder, and any webserver that
  handles authentication and based on it adds HTTP headers to be used for login. Please test.

and adds the following partial fix, thanks to andresmanelli:

- [Add migration to fix circular references](https://github.com/wekan/wekan/commit/a338e937e508568d1f6a15c5464126d30ef69a7d).
  This [runs only once](https://github.com/wekan/wekan/issues/2209#issuecomment-470445989),
  so later there will be another fix to make it run every time.

and reverts the following change of v2.42, because they did not fix anything, thanks to xet7:

- [Revert: Tried to fix snap mongodb-control not starting database](https://github.com/wekan/wekan/commit/4055f451fdadfbfdef9a10be29a0eb6aed91182c).

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.42 2019-03-07 Wekan release

This release tried to fix the following bugs:

- [Tried to fix snap mongodb-control not starting database](https://github.com/wekan/wekan/commit/2c5628b5fbcc25427021d0b22e74577a71149c21).
  Reverted in v2.43, because it did not fix anything.

Thanks to xet7 and qurqar[m] at IRC #wekan.

# v2.41 2019-03-07 Wekan release

This release tried to fix the following bugs:

- [Partial Fix: Card was selected as parent card (circular reference) and now board can be not opened anymore](https://github.com/wekan/wekan/issues/2202)
  with [Avoid setting same card as parentCard. Avoid listing templates board in copy/move/more menus](https://github.com/wekan/wekan/commit/745f39ed20169f56b99c0339f2043f8c4ed43873).
  This does not fully work yet, it will be fixed later.
  Thanks to andresmanelli.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.40 2019-03-06 Wekan release

This release fixes the following bugs:

- Part 2: [Fix](https://github.com/wekan/wekan/commit/e845fe3e7130d111be4c3a73e2551738c980ff7b)
  [manifest](https://github.com/wekan/wekan/issues/2168) and
  [icon](https://github.com/wekan/wekan/issues/1692) paths. Thanks to xet7.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.39 2019-03-06 Wekan release

This release fixes the following bugs:

- [Fix](https://github.com/wekan/wekan/commit/e845fe3e7130d111be4c3a73e2551738c980ff7b)
  [manifest](https://github.com/wekan/wekan/issues/2168) and
  [icon](https://github.com/wekan/wekan/issues/1692) paths. Thanks to xet7.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.38 2019-03-06 Wekan release

This release adds the following new features:

- [Added a Helm Chart to the project](https://github.com/wekan/wekan/pull/2227), thanks to TechnoTaff.
- [Added support for LDAP admin status sync](https://github.com/wekan/wekan-ldap/pull/40).
  Examples: [LDAP_SYNC_ADMIN_STATUS=true, LDAP_SYNC_ADMIN_GROUP=group1,group2](https://github.com/wekan/wekan/commit/7e451d9033eb6162cd37de3e5ffabdc22e272948).
  Thanks to JulianJacobi and xet7.

and fixes the following bugs:

- [Fix card deletion from archive](https://github.com/wekan/wekan/commit/77754cf32f28498e550a46325d90eb41f08f8552). Thanks to andresmanelli.
- [Fix card move with wrong swimlaneId](https://github.com/wekan/wekan/commit/1bef3a3f8ff4eac43bf97cc8b86d85e618b0e2ef). Thanks to andresmanelli.
  NOTE: This does not yet fix card move [with Custom Field](https://github.com/wekan/wekan/issues/2233), it will be fixed later.
- [Fix: LDAP Authentication with Recursive Group Filtering Does Not Work on Snap](https://github.com/wekan/wekan/issues/2228). Thanks to apages2.
- [Use ubuntu:cosmic base in Dockerfile](https://github.com/wekan/wekan/commit/df00776e6ca47080435eca9a31a16fd24c0770ed). Thanks to xet7.
- [Remove phantomjs binary from Docker/Snap/Stackerfile to reduce size](https://github.com/wekan/wekan/issues/2229). Thanks to soohwa.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.37 2019-03-04 Wekan release

This release fixes the following bugs:

- [Fix Adding Labels to cards is not possible anymore](https://github.com/wekan/wekan/issues/2223).

Thanks to GitHub user xet7 for contributions.

# v2.36 2019-03-03 Wekan release

This release adds the following UI changes:

- [Combine hamburger menus at right](https://github.com/wekan/wekan/issues/2219):
  - Hamburger button open sidebar;
  - Sidebar has at top right Cog icon that opens Board Settings;
  - Hide sidebar arrows.

and fixes the following bugs:

- [Add more Webhook translations](https://github.com/wekan/wekan/issues/1969).
  In progress.

and moved the following code around:

- [Forked salleman-oidc](https://github.com/wekan/wekan/commit/8867bec8e65f1ef6be0c731918e8eefcacb7acb0)
  to https://github.com/wekan/meteor-accounts-oidc where salleman also has write access,
  xet7 can make changes directly and GitHub issues are enabled.

Thanks to GitHub user xet7 for contributions.

# v2.35 2019-03-01 Wekan release

This release fixes the following bugs:

- [Add Filter fix back](https://github.com/wekan/wekan/issues/2213),
  because there was no bug in filter fix.

Thanks to GitHub user xet7 for contributions.

# v2.34 2019-03-01 Wekan release

This release tried to fix following bugs, but did not fix anything:

- Revert [Filter fix](https://github.com/wekan/wekan/issues/2213) because of
  [mongodb data tampered](https://github.com/wekan/wekan-snap/issues/83).
  This was added back at Wekan v2.35.

Thanks to GitHub user xet7 for contributions.

# v2.33 2019-02-28 Wekan release

This release adds the following upgrades:

- [Upgrade Node.js to v8.15.1](https://github.com/wekan/wekan/commit/5cafdd9878ab4b6123024ec33279ccdae75f554f).

Thanks to Node.js developers and GitHub user xet7 for contributions.

# v2.32 2019-02-28 Wekan release

This release adds the following [performance improvements](https://github.com/wekan/wekan/pull/2214), thanks to justinr1234:

- New indexes for queries that were missing an index;
- Bulk querying documents to reduce the number of mongo queries when loading a board;
- Ensure oplog is being used to query the database by providing a `sort` key when `limit` is used querying the `boards` collection.

and fixes the following bugs related to [Template features](https://github.com/wekan/wekan/issues/2209), thanks to andresmanelli:

- [Fix filtering in swimlane view](https://github.com/wekan/wekan/commit/49229e1723de14cdc66dc6480624bba426d35e36) that was [broken since v2.29](https://github.com/wekan/wekan/issues/2213).

Thanks to above GitHub users for their contributions.

# v2.31 2019-02-28 Wekan release

This release fixes the following bugs related to [Template features](https://github.com/wekan/wekan/issues/2209), thanks to GitHub user andresmanelli:

- [Fix copy card](https://github.com/wekan/wekan/issues/2210).

# v2.30 2019-02-28 Wekan release

This release adds the following new [Template features](https://github.com/wekan/wekan/issues/2209), thanks to GitHub user andresmanelli:

- [Fix popup title. Add element title modification](https://github.com/wekan/wekan/commit/888e1ad5d3e32be53283aa32198057f669f3d706);
- [Copy template attachments](https://github.com/wekan/wekan/commit/abb71083215462d91b084c4de13af0b130638e4d);
- [Standarize copy functions. Match labels by name](https://github.com/wekan/wekan/commit/da21a2a410c9b905de89d66236748e0c8f5357ea).

# v2.29 2019-02-27 Wekan release

This release adds the following new features:

- Swimlane/List/Board/Card templates. In Progress, please test and [add comment if you find not listed bugs](https://github.com/wekan/wekan/issues/2165).
  Thanks to GitHub user andresmanelli.

# v2.28 2019-02-27 Wekan release

This release adds the following new Sandstorm features and fixes:

- All Boards page [so it's possible to go back from subtask board](https://github.com/wekan/wekan/issues/2082).
- Board favorites.
- New Sandstorm board first user is Admin and [has IFTTT Rules](https://github.com/wekan/wekan/issues/2125) and Standalone Wekan Admin Panel.
  Probably some Admin Panel features do not work yet. Please keep backup of your grains before testing Admin Panel.
- Linked Cards and Linked Boards.
- Some not needed options like Logout etc have been hidden from top bar right menu.
- [Import board now works. "Board not found" is not problem anymore](https://github.com/wekan/wekan/issues/1430), because you can go to All Boards page to change to imported board.

and removes the following features:

- Remove Welcome Board from Standalone Wekan, [to fix Welcome board not translated](https://github.com/wekan/wekan/issues/1601).
  Sandstorm Wekan does not have Welcome Board.

Thanks to GitHub user xet7 for contributions.

# v2.27 2019-02-27 Wekan release

This release fixes the following bugs:

- [Fix OIDC error "a.join is not a function"](https://github.com/wekan/wekan/issues/2206)
  by reverting configurable OAUTH2_ID_TOKEN_WHITELIST_FIELDS and
  OAUTH2_REQUEST_PERMISSIONS from Wekan v2.22-2.26.
  Thanks to GitHub user xet7.

# v2.26 2019-02-25 Wekan release

This release adds the following new features:

- Add setting [EMAIL_NOTIFICATION_TIMEOUT](https://github.com/wekan/wekan/issues/2203).
  Defaut 30000 ms (30s). Thanks to GitHub users ngru and xet7.

and fixes the following bugs:

- REVERTED in v2.27 ([Fix OAuth2 requestPermissions](https://github.com/wekan/wekan/commit/5e238bfbfea16940ae29647ae347bbdc0d78efb0).
  This makes [Auth0 login possible](https://github.com/wekan/wekan/issues/1722)
  with [OIDC](https://github.com/wekan/wekan/wiki/OAuth2#auth0). Needs testing.
  Thanks to GitHub user xet7.)

# v2.25 2019-02-23 Wekan release

This release fixes the following bugs:

- Revert file permission changes from v2.24 LDAP changes that
  caused snap version to not build.

Thanks to GitHub user xet7 for contributions.

# v2.24 2019-02-23 Wekan release

This release adds the following new features:

- [Add LDAP email] matching support](https://github.com/wekan/wekan-ldap/pull/39) and
  [related env variables](https://github.com/wekan/wekan/pull/2198).
  Thanks to GitHub user stevenpwaters.

and fixes the following bugs:

- REVERTED in v2.27 ([Add missing text .env to wekan/server/authentication.js](https://github.com/wekan/wekan/commit/4e6e78ccd216045e6ad41bcdab4e524f715a7eb5).
  Thanks to Vanila Chat user .gitignore.)

Thanks to above contributors, and translators for their translation.

# v2.23 2019-02-17 Wekan relase

This release fixes the following bugs:

- [Fix authentication dropdown](https://github.com/wekan/wekan/pull/2191).
  Thanks to Akuket.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.22 2019-02-13 Wekan release

This release adds the following new features:

- [Kadira integration](https://github.com/wekan/wekan/issues/2152). Thanks to GavinLilly.
- REVERTED in v2.27 (Add [configurable](https://github.com/wekan/wekan/issues/1874#issuecomment-462759627)
  settings [OAUTH2_ID_TOKEN_WHITELIST_FIELDS and
  OAUTH2_REQUEST_PERMISSIONS](https://github.com/wekan/wekan/commit/b66f471e530d41a3f12e4bfc29548313e9a73c35).
  Thanks to xet7.)

and fixes the following bugs:

- [Fix: Remove overlap of side bar button with card/list menu button on
   mobile browser](https://github.com/wekan/wekan/issues/2183). Thanks to xet7.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.21 2019-02-12 Wekan release

This release adds the following new features:

- [Bump salleman-oidc to 1.0.12](https://github.com/wekan/wekan/commit/352e5c6cb07b1a09ef692af6f6c49c3b1f3e91c1). Thanks to danpatdav.
- [Added parameters for OIDC claim mapping](https://github.com/wekan/wekan/commit/bdbbb12f967f7e4f605e6c3310290180f6c8c6d1).
  These mapping parameters take advantage of new code in salleman-oidc 1.0.12 to override the default claim names provided by the userinfo endpoint.
  Thanks to danpatdav.
- [Add OIDC claim mapping parameters to docker-compose.yml/Snap/Source](https://github.com/wekan/wekan/commit/59314ab17d65e9579d2f29b32685b7777f2a06a1).
  Thanks to xet7.

Thanks to above GitHub users for their contributions.

# v2.20 2019-02-11 Wekan release

This release adds the following new features:

- [Add OIDC / OAuth2 optional setting DEBUG=true to salleman-oidc and Dockerfile](https://github.com/wekan/wekan/pull/2181).
  Thanks to danpatdav.
- [Add OIDC / OAuth2 optional setting DEBUG=true to docker-compose.yml/Snap/Source](https://github.com/wekan/wekan/commits/8e02170dd1d5a638ba47dcca910e6eecbfd03baf).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.19 2019-02-09 Wekan release

This release removes the following new features:

- [Remove oplog from snap](https://github.com/wekan/wekan/commit/f1bd36a3b87f97927dfe60572646a457e1f7ef66). Need to think how to do it properly.

Thanks to GitHub user xet7 for conrtibutions.

# v2.18 2019-02-08 Wekan release

This release adds the folloging new features:

- [Improve Authentication: Admin Panel / Layout / Set Default Authentication / Password/LDAP](https://github.com/wekan/wekan/pull/2172). Thanks to Akuket.
- [Add oplog to snap mongodb](https://github.com/wekan/wekan/commit/79ffb7d50202471c7b7f297286f13e66ce30922e). Thanks to xet7.

and fixes the following bugs with Apache I-CLA, thanks to bentiss:

- [Fix swimlanes sorting](https://github.com/wekan/wekan/pull/2174)
  since "[Properly fix horizontal rendering on Chrome and Firefox](https://github.com/wekan/wekan/commit/7cc185ac)".
  The rendering of the new design of the swimlanes was correct, but this
  commit broke the reordering capability. Having the swimlane header at
  the same level than the lists of cards makes the whole sortable
  pattern fail.
  - 2 solutions:
    - revert to only have 1 div per swimlane. But this introduces [the firefox
      bug mentioned](https://github.com/wekan/wekan/commit/7cc185ac), so not ideal
    - force the sortable pattern to do what we want.
  - To force the sortable pattern, we need:
    - add in the helper a clone of the list of cards (to not just move the
      header)
    - make sure the placeholder never get placed between the header and the
      list of cards in a swimlane
    - fix the finding of the next and previous list of cards.
    For all of this to be successful, we need to resize the swimlanes to a
    known value. This can lead to some visual jumps with scrolling when you
    drag or drop the swimlanea. I tried to remedy that by computing the new
    scroll value. Still not ideal however, as there are still some jumps when
    dropping.
    Fixes [#2159](https://github.com/wekan/wekan/issues/2159).

Thanks to above GitHub users and translators for contributions.

# v2.17 2019-02-04 Wekan release

This release fixes the following bugs:

- [OIDC/OAuth2 BoardView Fix](https://github.com/wekan/wekan/issues/1874).

Thanks to GitHub gil0109 for contributions, and translator for their translations.

# v2.16 2019-02-03 Wekan release

This release fixes the following bugs:

- [Part 2](https://github.com/ChronikEwok/wekan/commit/9a6ac544dd5618e58ce107352124fd9b495e5c30):
  [Fix: Not displaying card content of public board: Snap, Docker and Sandstorm Shared Wekan Board
  Link](https://github.com/wekan/wekan/issues/1623) with
  [code from ChronikEwok](https://github.com/ChronikEwok/wekan/commit/cad9b20451bb6149bfb527a99b5001873b06c3de).

Thanks to GitHub user ChronikEwok for contributions.

# v2.15 2019-02-03 Wekan release

This release fixes the following bugs:

- [Fix: Not displaying card content of public board: Snap, Docker and Sandstorm Shared Wekan Board
  Link](https://github.com/wekan/wekan/issues/1623) with
  [code from ChronikEwok](https://github.com/ChronikEwok/wekan/commit/cad9b20451bb6149bfb527a99b5001873b06c3de).

Thanks to GitHub user ChronikEwok for contributions.

# v2.14 2019-02-02 Wekan release

This release fixes the following bugs:

- [Fix Sandstorm export board from web](https://github.com/wekan/wekan/issues/2157).
- [Fix Error when logging in to Wekan REST API when using Sandstorm Wekan](https://github.com/wekan/wekan/issues/1279).
  Sandstorm API works this way: Make API key, and from that key copy API URL and API KEY to below. It saves Wekan board to file.
  `curl http://Bearer:APIKEY@api-12345.local.sandstorm.io:6080/api/boards/sandstorm/export?authToken=#APIKEY > wekanboard.json`
  If later API key does not work, you need to remove it and make a new one.

Thanks to GitHub user xet7 for contributions.

# v2.13 2019-02-01 Wekan release

This release adds the following new features with Apache I-CLA, thanks to bentiss:

- [Use infinite-scrolling on lists](https://github.com/wekan/wekan/pull/2144).
  This allows to reduce the loading time of a big board.
  Note that there is an infinite scroll implementation in the mixins,
  but this doesn't fit well as the cards in the list can have arbitrary
  height.
  The idea to rely on the visibility of a spinner is based on
  http://www.meteorpedia.com/read/Infinite_Scrolling
- [When writing to minicard, press Shift-Enter on minicard to go to next line
  below](https://github.com/wekan/wekan/commit/7a35099fb9778d5f3656a57c74af426cfb20fba3),
  to continue writing on same minicard 2nd line.

Thanks to GitHub user bentiss for contributions.

# v2.12 2019-01-31 Wekan release

This release fixes the following bugs:

- [Bumped the salleman oidc packages versions to include an upstream bug fix](https://github.com/wekan/wekan/commit/361faa6646556de68ad78dc90d9eb9f78956ce0f).

Thanks to GitHub user danpatdav for contributions.

# v2.11 2019-01-31 Wekan release

This release fixes the following bugs:

- [Fix: Bug: Not logged in public board page has calendar](https://github.com/wekan/wekan/issues/2061). Thanks to xet7.

Thanks to above GitHub users and translators for contributions.

# v2.10 2019-01-30 Wekan release

This release adds the following new features:

- Translations: Add Macedonian. [Copied Bulgarian to Macedonian](https://github.com/wekan/wekan/commit/6e4a6515e00fe68b8615d850cfb3cb290418e176)
  so that required changes will be faster to add. Thanks to translators and therampagerado;

and fixes the following bugs:

- Revert [Sandstorm API changes](https://github.com/wekan/wekan/commit/be03a191c4321c2f80116c0ee1ae6c826d882535)
  that were done at [Wekan v2.05](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v205-2019-01-27-wekan-release)
  to fix #2143. Thanks to pantraining and xet7.

Thanks to above GitHub users and translators for contributions.

# v2.09 2019-01-28 Wekan release

This release fixes the following bugs with Apache I-CLA, thanks to bentiss:

- [Fix vertical automatic scrolling when opening a card](https://github.com/wekan/wekan/commit/820d3270935dc89f046144a7bbf2c8277e2484bc).

Thanks to GitHub user bentiss for contributions.

# v2.08 2019-01-28 Wekan release

This release fixes the following bugs with Apache I-CLA, thanks to bentiss:

- Make the max height of the swimlane not too big](https://github.com/wekan/wekan/commit/ae82f43078546902e199d985a922ebf7041a4917).
  We take a full screen minus the header height;
- [Properly fix horizontal rendering on Chrome and Firefox](https://github.com/wekan/wekan/commit/7cc185ac57c77be85178f92b1d01d46e20218948).
  This reverts [commit 74cf9e2573](https://github.com/wekan/wekan/commit/74cf9e2573) "- Fix Firefox left-rigth scrollbar."
  This reverts [commit 9dd8216dfb](https://github.com/wekan/wekan/commit/9dd8216dfb)
  "- Fix cards below swimlane title in Firefox" by making
  [previous fix](https://github.com/wekan/wekan/pull/2132/commits/f7c6b7fce237a6dbdbbd6d728cfb11ad3f4378eb)"
  And this partially reverts [commit dd88eb4cc](https://github.com/wekan/wekan/commit/dd88eb4cc).
  The root of the issue was that I was adding a new div and nesting
  the list of lists in this new list. This resulted in some
  weird behavior that Firefox could not handled properly
  Revert to a code colser to v2.02, by just having the
  swimlane header in a separate line, and keep only one
  flex element.
  Fixes #2137

Thanks to GitHub user bentiss for contributions, and translators for their translations.

# v2.07 2019-01-28 Wekan release

This release fixes the following bugs:

- [Fix Firefox left-rigth scrollbar](https://github.com/wekan/wekan/issues/2137).

Thanks to GitHub user xet7 for contributions.

# v2.06 2019-01-27 Wekan release

This release fixes the following bugs:

- [Fix cards below swimlane title in Firefox](https://github.com/wekan/wekan/commit/9dd8216dfb80855999998ed76d8a3c06a954a002)
  by making [previous fix](https://github.com/wekan/wekan/pull/2132/commits/f7c6b7fce237a6dbdbbd6d728cfb11ad3f4378eb)
  Firefox-only.

Thanks to GitHub user xet7 for contributions.

# v2.05 2019-01-27 Wekan release

This release fixes the following bugs partially:

- Add back scrollbars that [were hidden when trying to fix another
  bug](https://github.com/wekan/wekan/pull/2132/commits/f7c6b7fce237a6dbdbbd6d728cfb11ad3f4378eb).
  This makes scrollbars work in Chromium/Chrome, but adds back bug to Firefox
  that cards are below of swimlane title - this Firefox bug is fixed in Wekan v2.06.
- [Try to have some progress on Wekan Sandstorm API](https://github.com/wekan/wekan/commit/be03a191c4321c2f80116c0ee1ae6c826d882535).
  I did not get it fully working yet.

Thanks to GitHub user xet7 for contributions.

# v2.04 2019-01-26 Wekan release

This release fixes the following bugs with Apache I-CLA, thanks to bentiss:

- [Bugfix for swimlanes, simplify setting color, fix rendering on Firefox](https://github.com/wekan/wekan/pull/2132).

Thanks to GitHub user bentiss for contributions, and translators for their translations.

# v2.03 2019-01-25 Wekan NOT RELEASED because of [bug](https://github.com/wekan/wekan/pull/2126#issuecomment-457723923) that was fixed in v2.04 above

This release adds the following new features with Apache I-CLA, thanks to bentiss:

- Change [Swimlane](https://github.com/wekan/wekan/issues/1688)/[List](https://github.com/wekan/wekan/issues/328)/[Card](https://github.com/wekan/wekan/issues/428)
  color with color picker at webbrowser and [REST API](https://github.com/wekan/wekan/commit/5769d438a05d01bd5f35cd5830b7ad3c03a21ed2);
- Lists-Color: [Only colorize the bottom border](https://github.com/wekan/wekan/commit/33977b2282d8891bf507c4d9a1502c644afd6352),
  and make the background clearer to visually separate the header from the list of cards;
- [Change Swimlane to Horizontal](https://github.com/wekan/wekan/commit/dd88eb4cc191a06f7eb84213b026dfb93546f245);
- [Change IFTTT wizard color names to color picker](https://github.com/wekan/wekan/commit/4a2576fbc200d397bcf7cede45316d9fb7e520dd);
- REST API: [Add new card to the end of the list](https://github.com/wekan/wekan/commit/6c3dbc3c6f52a42ddbeeaec9bbfcc82c1c839f7d).
  If we keep the `0` value, the card might be inserted in the middle of the list, making it hard to find it later on.
  Always append the card at the end of the list by setting a sort value based on the number of cards in the list.

and fixes the following bugs with Apache I-CLA, thanks to bentiss:

- [Fix set_board_member_permission](https://github.com/wekan/wekan/commit/082aabc7353d1fe75ccef1a7d942331be56f0838);
- [Fix the sort field when inserting a swimlane or a list](https://github.com/wekan/wekan/commit/b5411841cf6aa33b2c0d29d85cbc795e3faa7f4f).
  This has the side effect of always inserting the element at the end;
- [Make sure Swimlanes and Lists have a populated sort field](https://github.com/wekan/wekan/commit/5c6a725712a443b4d03b4f86262033ddfb66bc3d).
  When moving around the swimlanes or the lists, if one element has a sort
  with a null value, the computation of the new sort value is aborted,
  meaning that there are glitches in the UI.
  This happens on the first swimlane created with the new board, or when
  a swimlane or a list gets added through the API;
- UI: Lists: [Make sure all lists boxes are the same height](https://github.com/wekan/wekan/commit/97d95b4bcbcab86629e368ea41bb9f00450b21f6).
  When `Show card count` is enabled, the lists with the card counts have
  two lines of text while the lists without have only one.
  This results in the box around the list headers are not of the same size
  and this is visible when setting a color to the list.

Thanks to GitHub user bentiss for contributions, and translators for their translations.

# v2.02 2019-01-22 Wekan release

This release adds the following new features with Apache I-CLA, thanks to bentiss:

- [Add per card color: Card / Hamburger menu / Set Color](https://github.com/wekan/wekan/pull/2116) with [color picker](https://github.com/wekan/wekan/pull/2117);
- [OpenAPI and generating of REST API Docs](https://github.com/wekan/wekan/pull/1965);
- [Allow to retrieve full export of board from the REST API](https://github.com/wekan/wekan/pull/2118) through generic authentication.
  When the board is big, retrieving individual cards is heavy for both the server and the number of requests.
  Allowing the API to directly call on export and then treat the data makes the whole process smoother.

and adds the following new features with Apache I-CLA, thanks to xet7 and bentiss:

- [Translate and add color names to IFTTT Rules dropdown](https://github.com/wekan/wekan/commit/44e4df2492b95226f1297e7f556d61b1afaab714), thanks to xet7.
  [Fix to this feature blank item](https://github.com/wekan/wekan/pull/2119), thanks to bentiss.

and adds these updates:

- Update translations. Thanks to translators.
- Added missing translation for 'days'. Thanks to Chartman123.

and fixes these typos;

- Fix typo, changelog year to 2019. Thanks to xorander00.
- Fix License to 2019. Thanks to ajRiverav.

Thanks to above GitHub users for their contributions.

# v2.01 2019-01-06 Wekan release

Update translations. Thanks to translators.

# v2.00 2019-01-04 Wekan release

Update translations. Thanks to translators.

# v1.99 2019-01-04 Wekan release

This release adds the following new features:

- [IFTTT Rules improvements](https://github.com/wekan/wekan/pull/2088). Thanks to Angtrim.
- Add [find.sh](https://github.com/wekan/wekan/blob/main/find.sh) bash script that ignores
  extra directories when searching. xet7 uses this a lot when developing. Thanks to xet7.

Thanks to above GitHub users for their contributions.

# v1.98 2019-01-01 Wekan release

This release adds the following new features:

- Add optional Nginx reverse proxy config to docker-compose.yml and nginx directory. Thanks to MyTheValentinus.

and fixes the following bugs:

- docker-compose.yml back to MongoDB 3.2.21 because 3.2.22 MongoDB container does not exist yet. Thanks to xet7.
- [Mobile fixes](https://github.com/wekan/wekan/pull/2084), thanks to hupptechnologies:
  - Move home button / avatar bar from bottom to top. So at top first is home button / avatar, then others.
  - When clicking Move Card, go to correct page position. Currently it's at empty page position, and there is
    need to scroll page up to see Move Card options. It should work similarly like Copy Card, that is visible.
  - Also check that other buttons go to visible page.

Thanks to above GitHub users for their contributions.

# v1.97 2018-12-26 Wekan release

This release adds the following new features:

- Upgrade to Node 8.15.0 and MongoDB 3.2.22.
- Stacksmith: back to Meteor 1.6.x based Wekan, because Meteor 1.8.x based is currently broken.

Thanks to GitHub user xet7 for contributions.

# v1.96 2018-12-24 Wekan release

This release adds the following new features:

- [Combine all docker-compose.yml files](https://github.com/wekan/wekan/commit/3f948ba49ba7266c436ff138716bdcae9e879903).

and tries to fix following bugs:

- Revert "Improve authentication", remove login dropdown and "Default Authentication Method" that were added
  in Wekan v1.95 because login did not work with email address.
  It was later found that login did work with username, so later this could be fixed and added back.
- Fixes to docker-compose.yml so that Wekan Meteor 1.6.x version would work.
  Most likely Meteor 1.8.x version is still broken.

Thanks to GitHub user xet7 for contributions.

# v1.95 2018-12-21 Wekan release

This release adds the following new features:

- [Improve authentication](https://github.com/wekan/wekan/pull/2065): remove login dropdown,
  and add setting `DEFAULT_AUTHENTICATION_METHOD=ldap` or
  `sudo snap set wekan default-authentication-method='ldap'`. Thanks to Akuket. Closes wekan/wekan-ldap#31
  NOTE: This was reverted in Wekan v1.96 because login did not work with email address.
  It was later found that login did work with username, so later this could be fixed and added back.
- [Drag handles and long press on mobile when using desktop mode of mobile
  browser](https://github.com/wekan/wekan/pull/2067). Thanks to hupptechnologies.
- Upgrade to node v8.14.1 . Thanks to xet7.

Thanks to above GitHub users for their contributions.

# v1.94 2018-12-18 Wekan release

This release adds the following new features:

- Admin Panel / Layout / Custom HTML after `<body>` start, and Custom HTML before `</body>` end.
  In progress, does not work yet. Thanks to xet7.
- Add Bitnami Stacksmith. In progress test version, that does work, but is not released yet. Thanks to j-fuentes.

Thanks to above GitHub users for their contributions.

# v1.93 2018-12-16 Wekan release

This release adds the following new features:

- In translations, only show name "Wekan" in Admin Panel Wekan version.
  Elsewhere use general descriptions for whitelabeling.

Thanks to GitHub user xet7 and translators for their contributions.

# v1.92 2018-12-16 Wekan release

This release fixes the following bugs:

- Fix [Popup class declares member name _current but use current instead](https://github.com/wekan/wekan/issues/2059). Thanks to peishaofeng.
- Fix [Card scrollbar ignores mousewheel](https://github.com/wekan/wekan-scrollbar/commit/94a40da51627c6322afca50a5b1f4aa55c7ce7bf). Thanks to rinnaz and xet7. Closes #2058
- Fix [favicon paths for non-suburl cases](https://github.com/wekan/wekan/commit/c1733fc89c4c73a1ab3f4054d0a9ebff7741a804). Thanks to xet7. Related #1692

Thanks to above GitHub users for their contributions.

# v1.91 2018-12-15 Wekan release

This release fixes the following bugs:

- [Add back mquandalle:perfect-scrollbar package](https://github.com/wekan/wekan/issues/2057)
  so that Firefox and Chrome stop complaining in browser dev tools console.

Thanks to GitHub users uusijani and xet7 for their contributions.

# v1.90 2018-12-15 Wekan release

This release fixes the following bugs:

- [Remove not working duplicate saveMailServerInfo](https://github.com/wekan/wekan/commit/ab031d9da134aa13490a26dbe97ad2d7d01d534a),
  to remove error from browser dev tools console.

Thanks to GitHub user xet7 for contributions.

# v1.89 2018-12-15 Wekan release

This release adds the following new features:

- Admin Panel / Layout / Custom Product Name [now changes webpage title](https://github.com/wekan/wekan/commit/dbb1a86ca377e551063cc04c5189fad4aa9148c0).
  Related #1196

Thanks to GitHub user xet7 for contributions.

# v1.88 2018-12-14 Wekan release

This release fixes the following bugs:

- Fix: [Scrollbar used](https://github.com/wekan/wekan/issues/2056) [remote file from CDN](https://github.com/MaazAli/Meteor-Malihu-Custom-Scrollbar/blob/master/jquery.mCustomScrollbar.js#L50),
  so forked package to https://github.com/wekan/wekan-scrollbar and included
  non-minified file locally to Wekan, so that using scrollbar works without direct connection
  to Internet. Wekan should not load any external files by default, as was case before
  new scrollbar, and is again now [after this fix](https://github.com/wekan/wekan/commit/c546464d9f56117a8bf580512cd62fc1102559c3).

Thanks to GitHub user xet7 for contributions.

# v1.87 2018-12-13 Wekan release

This release fixes the following bugs:

- Fix Reference error.

Thanks to GitHub user Akuket for contributions.

# v1.86 2018-12-13 Wekan release

This release fixes the following bugs:

- Fix [Cannot login with new LDAP account when auto-registration disabled (request invitation code)](https://github.com/wekan/wekan-ldap/issues/29);
- Fix [Unable to create new account from LDAP](https://github.com/wekan/wekan-ldap/issues/32).

Thanks to GitHub user Akuket for contributions.

# v1.85 2018-12-09 Wekan release

This release fixes the following bugs:

- Fix [Clicking the scrollbar closes the card on Chrome](https://github.com/wekan/wekan/issues/1404)
  by changing [mquandalle:perfect-scrollbar to malihu-jquery-custom-scrollbar](https://github.com/wekan/wekan/pull/2050).
  that works also when clicking scrollbar in Chrome. Also added back required packages that were removed in PR.

Thanks to GitHub users hupptechnologies and xet7 for their contributions.

# v1.84 2018-12-07 Wekan release

This release fixes the following bugs:

- Fix 2/8: IFTTT Rule action/trigger ["Remove all members from the card"](https://github.com/wekan/wekan/issues/1972).

Thanks to GitHub user BurakTuran9 for contributions.

# v1.83 2018-12-06 Wekan release

This release fixes the following bugs:

- Fix 1/8: IFTTT Rule action/trigger [When a checklist is completed](https://github.com/wekan/wekan/issues/1972).
  And partial incomplete fix to when all of checklist is set as uncompleted. Help in fixing welcome.

Thanks to GitHub users BurakTuran9 and xet7 for their contributions.

# v1.82 2018-12-05 Wekan release

This release fixes the following bugs:

- Partially #2045 revert [Improve authentication](https://github.com/wekan/wekan/issues/2016),
  adding back password/LDAP dropdown, because login did now work.
  NOTE: This was added in v1.71, reverted at v1.73 because login did not work, added back at v1.79,
  and then reverted partially at v1.82 because login did not work.
  Related LDAP logout timer does not work yet.

Thanks to GitHub user xet7 for contributions.

# v1.81 2018-12-04 Wekan release

This release fixes the following bugs:

- Remove extra commas `,` and add missing backslash `\`.
  Maybe after that login, logout and CORS works.

Thanks to GitHub user xet7 for contributions.

Related #2045,
related wekan/wekan-snap#69

# v1.80 2018-12-03 Wekan release

This release adds the following new features:

- Upgrade Node from v8.12 to v8.14

and fixes the following bugs:

- Revert non-working architectures that were added at v1.79, so now Wekan is just amd64 as before.

Thanks to GitHub user xet7 for contributions.

# v1.79 2018-12-03 Wekan release

This release adds the following new features:

- [Improve authentication, removing Login password/LDAP dropdown](https://github.com/wekan/wekan/issues/2016).
  NOTE: This was added in v1.71, then reverted at v1.73 because login did not work, and after fix added back at v1.79.
  Thanks to Akuket.
- Thanks to xet7:
  - Build snap also on i386, armhf and arm64. Ignore if it fails. More fixes will be added later.
  - Add CORS https://enable-cors.org/server_meteor.html to Standalone Wekan settings.
  - Add missing LDAP and TIMER environment variables.

and fixes the following bugs:

- Fix: Message box for deleting subtask unreachable.
  Thanks to hupptechnologies. Closes #1800
- Fix wrong dates in ChangeLog. Thanks to kelvinhammond.

Thanks to above GitHub users for their contributions.

# v1.78 2018-11-20 Wekan release

- Update translations (de).

# v1.77 2018-11-20 Wekan release

- Update version number. Trying to get Snap automatic review working, so that
  it would accept new Wekan release.

# v1.76 2018-11-20 Wekan release

This release adds the following new features:

- Add [LDAP_FULLNAME_FIELD](https://github.com/wekan/wekan-ldap/issues/10) to
  [configs](https://github.com/wekan/wekan/commit/8e3f53021775069dba125efd4b7200d0d70a1ed1)
  and other options that were not in all config files. Thanks to alkemyst and xet7.

and fixes the following bugs:

- Fix: When saving Custom Layout, save also SMTP settings. Thanks to xet7.

Thanks to above GitHub users for their contributions.

# v1.75 2018-11-20 Wekan release

This release adds the following new features:

- Admin Panel / Layout: Hide Logo: Yes / No. This does hide Wekan logo on Login page and Board page. Thanks to xet7.

and fixes the following bugs:

- [Fix Snap database-list-backups command](https://github.com/wekan/wekan-snap/issues/26). Thanks to WaryWolf.

Thanks to above GitHub users for their contributions.

# v1.74.1 2018-11-18 Wekan Edge release

This release adds the following new features:

- [Full Name from LDAP server via environment variable](https://github.com/wekan/wekan-ldap/pull/18).

Thanks to GitHub user alkemyst for contributions.

# v1.74 2018-11-17 Wekan release

- Update version number to get this released to snap. Thanks to xet7.

# v1.73 2018-11-17 Wekan release

This release fixes the following bugs:

- Revert Improve authentication to [fix Login failure](https://github.com/wekan/wekan/issues/2004).
  NOTE: This was added in v1.71, then reverted at v1.73 because login did not work, and after fix added back at v1.79.

Thanks to GitHub users Broxxx3 and xet7 for their contributions.

# v1.72 2018-11-17 Wekan release

- Update translations (fi).

# v1.71 2018-11-17 Wekan release

This release adds the following new features and bugfixes:

- Add languages, thanks to translators:
  - Danish
  - Swahili / Kiswahili
- Rename Recycle Bin to Archive. Thanks to xet7.
- Update readme for clarity. Thanks to xet7.
- [Improve authentication](https://github.com/wekan/wekan/pull/2003), thanks to Akuket:
  - Removing the select box: Now it just checks the user.authenticationMethod value to choose the authentication method.
  - Adding an option to choose the default authentication method with env var.
  - Bug fix that allowed a user to connect with the password method while his user.authenticationMethod is "ldap" for example.
  - Adding a server-side method which allows disconnecting a user after a delay defined by env vars.
  - NOTE: This was added in v1.71, then reverted at v1.73 because login did not work, and after fix added back at v1.79.
- [Improve shell scripts](https://github.com/wekan/wekan/pull/2002). Thanks to warnerjon12.

Thanks to above GitHub users and translators for their contributions.

# v1.70 2018-11-09 Wekan release

This release adds the following new features:

- [Auto create Custom Field to all cards. Show Custom Field Label on
   minicard](https://github.com/wekan/wekan/pull/1987).

and fixes the following bugs:

- Some fixes to Wekan import, thanks to xet7:
  - isCommentOnly and isNoComments are now optional
  - Turn off import error checking, so something is imported anyway, and import does not stop at error.
  - Now most of Sandstorm export do import to Standalone Wekan, but some of imported cards, dates etc are missing.
  - Sandstorm Import Wekan board warning messages are now translateable. But bug "Board not found" still exists.
- LDAP: Added INTERNAL_LOG_LEVEL. Fix lint and ldap group filter options. Thanks to Akuket.

Thanks to above mentioned GitHub users for their contributions.

# v1.69 2018-11-03 Wekan release

- Update translations.

# v1.68 2018-11-03 Wekan release

- Update translations.

# v1.67 2018-11-03 Wekan release

This release adds the following new features to all Wekan platforms:

- Add Hindi language. Thanks to saurabharch.

and hides the following features at Sandstorm:

- Hide Linked Card and Linked Board on Sandstorm, because they are only
  useful when having multiple boards, and at Sandstorm
  there is only one board per grain. Thanks to ocdtrekkie and xet7. Closes #1982

Thanks to above mentioned GitHub users for their contributions.

# v1.66 2018-10-31 Wekan release

This release fixes the following bugs:

- docker-compose.yml and docker-compose-build.yml, thanks to xet7:
  - Remove single quotes, because settings are quoted automatically.
  - Comment out most settings that have default values.
- Fix typos in CHANGELOG.md, thanks to Hillside502 and loginKing.
- [Fix typo about ldaps](https://github.com/wekan/wekan/pull/1980).
  Documentation said to set LDAP_ENCRYPTION to true if we want to use
  ldaps, but the code in wekan-ldap does not check if it is set to true,
  but if the value equals to 'ssl' instead. Thanks to imkwx.

Thanks to above mentioned GitHub users for their contributions.

# v1.65 2018-10-25 Wekan release

This release adds the [following new features](https://github.com/wekan/wekan/pull/1967), with Apache I-CLA:

- UI: list headers: show the card count smaller in grey color below list name
- UI: lists: only output the number of cards for each swimlane

Thanks to GitHub user bentiss for contributions.

# v1.64.2 2018-10-25 Wekan Edge release

This release fixes the following bugs:

- Additional fix to [Impossible to connect to LDAP if UserDN contain space(s)](https://github.com/wekan/wekan/issues/1970).

Thanks to GitHub users Akuket and xet7 for their contributions.

# v1.64.1 2018-10-25 Wekan Edge release

This release fixes the following bugs:

- [Impossible to connect to LDAP if UserDN contain space(s)](https://github.com/wekan/wekan/issues/1970).

Thanks to GitHub users Akuket and xet7 for their contributions.

# v1.64 2018-10-24 Wekan release

- Update translations.

# v1.63 2018-10-24 Wekan release

This release adds the following new features:

REST API: [Allow to remove the full list of labels/members through the API](https://github.com/wekan/wekan/pull/1968), with Apache I-CLA:

- [Models: Cards: an empty string in members or label deletes the list](https://github.com/wekan/wekan/commit/e5949504b7ed42ad59742d2a0aa001fe6c762873).
  There is currently no way to remove all members or all labels attached
  to a card. If an empty string is provided, we can consider as a hint to
  remove the list from the card.
- [Models: Cards: allow singletons to be assigned to members and labelIds](https://github.com/wekan/wekan/commit/2ce1ba37a1d0a09f8b3d2a1db4c8a11d1f98caa0).
  If we need to set only one member or one label, the data provided will
  not give us an array, but the only element as a string.
  We need to detect that and convert the parameter into an array.

Thanks to GitHub user bentiss for contributions.

# v1.62 2018-10-24 Wekan release

- Fix missing dropdown arrow on Chrome. Thanks to xet7. Closes #1964

# v1.61 2018-10-24 Wekan release

- Fix lint error. Thanks to xet7.

# v1.60 2018-10-24 Wekan release

- Update translations.

# v1.59 2018-10-24 Wekan release

This release adds the beginning of following new features:

- Custom Product Name in Admin Panel / Layout. In Progress, setting does not affect change UI yet. Thanks to xet7.

and fixes the following bugs:

- Fix LDAP User Search Scope. Thanks to Vnimos and Akuket. Related #119
- Fix Save Admin Panel SMTP password. Thanks to saurabharch and xet7. Closes #1856

Thanks to above mentioned GitHub users for contributions.

# v1.58 2018-10-23 Wekan release

This release adds the [following new features and fixes](https://github.com/wekan/wekan/pull/1962), with Apache I-CLA:

- Also export the cards created with an older wekan instance (without linked cards) (related to #1873);
- Fix the GET customFields API that was failing;
- Allow to directly overwrite the members of cards and boards with a PUT call (this avoids to do multiple calls to add and remove users);
- Allow to change the swimlane of a card from the API.

Thanks to GitHub user bentiss for contributions.

# v1.57 2018-10-23 Wekan release

This release adds the following new features:

- Merge edge into stable. This brings LDAP, Rules, Role "No Comments", etc.
- Go back to Meteor 1.6.x and MongoDB 3.2.21 that works in Snap etc.

Thanks to GitHub user xet7 for contributions.

# v1.55.1 2018-10-16 Wekan Edge release

This release adds the following new features:

- [Automatically close the sidebar](https://github.com/wekan/wekan/pull/1954).

and fixes the following bugs:

- [LDAP: Include missing LDAP PR so that LDAP works](https://github.com/wekan/wekan-ldap/pull/6);
- [Improve notifications](https://github.com/wekan/wekan/pull/1948);
- [Fix deleting Custom Fields, removing broken references](https://github.com/wekan/wekan/issues/1872);
- [Fix vertical text for swimlanes in IE11](https://github.com/wekan/wekan/issues/1798);
- [Update broke the ability to mute notifications](https://github.com/wekan/wekan/pull/1954).

Thanks to GitHub users Akuket, Clement87 and tomodwyer for their contributions.

# v1.53.9 2018-10-11 Wekan Edge release

This release adds the following new features:

- docker-compose.yml in this Edge branch now works with Wekan Edge + Meteor 1.8.1-beta.0 + MongoDB 4.0.3;
- [Snap is still broken](https://forum.snapcraft.io/t/how-to-connect-to-localhost-mongodb-in-snap-apparmor-prevents/7793/2). Please use latest Snap release on Edge branch, until this is fixed.

Thanks to GitHub user xet7 for contributions.

# v1.53.8 2018-10-10 Wekan Edge release

This release tries to fix the following bugs:

- Try to fix Docker.

Thanks to GitHub user xet7 for contributions.

# v1.53.7 2018-10-10 Wekan Edge release

This release adds the following new features:

- Try MongoDB 4.0.3

Thanks to GitHub user xet7 for contributions.

# v1.53.6 2018-10-10 Wekan Edge release

This release adds the following new features:

- [Add LDAP to Snap Help](https://github.com/wekan/wekan/commit/809c8f64f69721d51b7d963248a77585867fac53).

and tries to fix the following bugs:

- Try to fix snap.

Thanks to GitHub users Akuket and xet7 for their contributions.

# v1.53.5 2018-10-10 Wekan Edge relase

This release tries to fix the following bugs:

- Try to fix snap.

Thanks to GitHub user xet7 for contributions.

# v1.53.4 2018-10-10 Wekan Edge release

This release adds the following new features:

- [Upgrade Hoek](https://github.com/wekan/wekan/commit/0b971b6ddb1ffc4adad6b6b09ae7f42dd376fe2c).

Thanks to GitHub user xet7 for contributions.

# v1.53.3 2018-10-10 Wekan Edge release

This release adds the following new features:

- [Upgrade](https://github.com/wekan/wekan/issues/1522) to [Meteor](https://blog.meteor.com/meteor-1-8-erases-the-debts-of-1-7-77af4c931fe3) [1.8.1-beta.0](https://github.com/meteor/meteor/issues/10216).
  with [these](https://github.com/wekan/wekan/commit/079e45eb52a0f62ddb6051bf2ea80fac8860d3d5)
  [commits](https://github.com/wekan/wekan/commit/dd47d46f4341a8c4ced05749633f783e88623e1b). So now it's possible to use MongoDB 2.6 - 4.0.

Thanks to GitHub user xet7 for contributions.

# v1.53.2 2018-10-10 Wekan Edge release

This release adds the following new features:

- [Add LDAP package to Docker and Snap](https://github.com/wekan/wekan/commit/f599391419bc7422a6ead52cdefc7d380e787897).

Thanks to GitHub user xet7 for contributions.

# v1.53.1 2018-10-10 Wekan Edge release

This release adds the following new features:

- [LDAP](https://github.com/wekan/wekan/commit/288800eafc91d07f859c4f59588e0b646137ccb9).
  Please test and [add info about bugs](https://github.com/wekan/wekan/issues/119);
- [Add LDAP support and authentications dropdown menu on login page](https://github.com/wekan/wekan/pull/1943);
- [REST API: Get cards by swimlane id](https://github.com/wekan/wekan/pull/1944). Please [add docs](https://github.com/wekan/wekan/wiki/REST-API-Swimlanes).

and fixes the following bugs:

- [OpenShift: Drop default namespace value and duplicate WEKAN_SERVICE_NAME parameter.commit](https://github.com/wekan/wekan/commit/fcc3560df4dbcc418c63470776376238af4f6ddc);
- [Fix Card URL](https://github.com/wekan/wekan/pull/1932);
- [Add info about root-url to GitHub issue template](https://github.com/wekan/wekan/commit/4c0eb7dcc19ca9ae8c5d2d0276e0d024269de236);
- [Feature rules: fixes and enhancements](https://github.com/wekan/wekan/pull/1936).

Thanks to GitHub users Akuket, Angtrim, dcmcand, lberk, maximest-pierre, InfoSec812, schulz and xet7 for their contributions.

# v1.52.1 2018-10-02 Wekan Edge release

This release adds the following new features:

- REST API: [Add member with role to board. Remove member from board](https://github.com/wekan/wekan/commit/33caf1809a459b136b671f7061f08eb5e8d5e920).
  [Docs](https://github.com/wekan/wekan/wiki/REST-API-Role). Related to [role issue](https://github.com/wekan/wekan/issues/1861).

and reverts previous change:

- OAuth2: [Revert Oidc preferred_username back to username](https://github.com/wekan/wekan/commit/33caf1809a459b136b671f7061f08eb5e8d5e920).
  This [does not fix or break anything](https://github.com/wekan/wekan/issues/1874#issuecomment-425179291),
  Oidc already works with [doorkeeper](https://github.com/doorkeeper-gem/doorkeeper-provider-app).

Thanks to GitHub user xet7 for contributions.

# v1.51.2 2018-09-30 Wekan Edge release

This release adds the following new features:

- [REST API: Change role of board member](https://github.com/wekan/wekan/commit/51ac6c839ecf2226b2a81b0d4f985d3b942f0938).
  Docs: https://github.com/wekan/wekan/wiki/REST-API-Role

Thanks to GitHub users entrptaher and xet7 for their contributions.

# v1.51.1 2018-09-28 Wekan Edge release

This release adds the following new features:

- [Add CAS with attributes](https://github.com/wekan/wekan/commit/bd6e4a351b984b032e17c57793a70923eb17d8f5);
- [Move Add Board button to top left, so there is no need to scroll to bottom when there is a lot of boards](https://github.com/wekan/wekan/commit/fb46a88a0f01f7f74ae6b941dd6f2060e020f09d).

Thanks to GitHub users ppoulard and xet7 for their contributions.

# v1.50.3 2018-09-23 Wekan Edge release

This release tries to fix the following bugs:

- [Remove "Fix Cannot setup mail server via snap variables"](https://github.com/wekan/wekan/commit/6d88baebc7e297ffdbbd5bb6971190b18f79d21f)
  to see does Wekan Snap start correctly after removing it.

Thanks to GitHub user xet7 for contributions.

# v1.50.2 2018-09-23 Wekan Edge release

This release tries to fix the following bugs:

- Build Wekan and release again, to see does it work.

Thanks to GitHub user xet7 for contributions.

# v1.50.1 2018-09-22 Wekan Edge release

This release adds the following new features:

- [Change from Node v8.12.0 prerelease to use official Node v8.12.0](https://github.com/wekan/wekan/commit/7ec7a5f27c381e90f3da6bddc3773ed87b1c1a1f).

and fixes the following bugs:

- [Fix Dockerfile Meteor install by changing tar to bsdtar](https://github.com/wekan/wekan/commit/1bad81ca86ca87c02148764cc03a3070882a8a33);
- Add [npm-debug.log and .DS_Store](https://github.com/wekan/wekan/commit/44f4a1c3bf8033b6b658703a0ccaed5fdb183ab4) to .gitignore;
- [Add more debug log requirements to GitHub issue template](https://github.com/wekan/wekan/commit/1c4ce56b0f18e00e01b54c7059cbbf8d3e196154);
- [Add default Wekan Snap MongoDB bind IP 127.0.0.1](https://github.com/wekan/wekan/commit/6ac726e198933ee41c129d22a7118fcfbf4ca9a2);
- [Fix Feature Rules](https://github.com/wekan/wekan/pull/1909);
- [Fix Cannot setup mail server via snap variables](https://github.com/wekan/wekan/issues/1906);
- [Try to fix OAuth2: Change oidc username to preferred_username](https://github.com/wekan/wekan/commit/734e4e5f3ff2c3dabf94c0fbfca561db066c4565).

Thanks to GitHub users Angtrim, maurice-schleussinger, suprovsky and xet7 for their contributions.

# v1.49.1 2018-09-17 Wekan Edge release

This release adds the following new features:

- Change from Node v8.12.0 prerelease to use official Node v8.12.0.

Thanks to GitHub user xet7 for contributions.

# v1.49 2018-09-17 Wekan release

This release fixes the following bugs:

- Fix lint errors.

Thanks to GitHub user xet7 for contributions.

# v1.48 2018-09-17 Wekan release

This release removes the following new features:

- Remove IFTTT rules, until they are fixed.
- Remove OAuth2, until it is fixed.

Thanks to GitHub user xet7 for contributions.

# v1.47 2018-09-16 Wekan release

This release adds the following new features:

- [IFTTT Rules](https://github.com/wekan/wekan/pull/1896). Useful to automate things like
  [adding labels, members, moving card, archiving them, checking checklists etc](https://github.com/wekan/wekan/issues/1160).
  Please test and report bugs. Later colors need to be made translatable.

Thanks to GitHub users Angtrim and xet7 for their contributions.

# v1.46 2018-09-15 Wekan release

This release adds the following new features:

- [Upgrade MongoDB to 3.2.21](https://github.com/wekan/wekan/commit/0cb3aee803781e4241c38a3e1e700703d063035a);
- [Add source-map-support](https://github.com/wekan/wekan/issues/1889);
- [Allow Announcement to be markdown](https://github.com/wekan/wekan/issues/1892).
  Note: xet7 did not yet figure out how to keep announcement on one line
  when markdown was added, so now Font Awesome icons are above and below.

and fixes the following bugs:

- [Turn of http/2 in Caddyfile](https://github.com/wekan/wekan/commit/f1ab46d5178b6fb7e9c4e43628eec358026d287a)
  so that Firefox Inspect Console does not [show errors about wss](https://github.com/wekan/wekan/issues/934)
  websocket config. Chrome web console supports http/2.
  Note: If you are already using Caddy and have modified your Caddyfile, you need to edit your Caddyfile manually.
- [Partially fix: Cannot move card from one swimline to the other if moving in the same list](https://github.com/wekan/wekan/issues/1887);
- [Fix: Linking cards from empty board is possible and makes current board not load anymore](https://github.com/wekan/wekan/issues/1885).

Thanks to GitHub users andresmanelli, HLFH and xet7 for their contributions.

# v1.45 2018-09-09 Wekan release

This release fixes the following bugs:

- [Fix lint error](https://github.com/wekan/wekan/commit/45c0343f45b4cfc06d83cf357ffb50d6fca2f23b).

Thanks to GitHub user xet7 for contributions.

# v1.44 2018-09-09 Wekan release

This release adds the following new features:

- REST API: [Add startAt/dueAt/endAt etc](https://github.com/wekan/wekan/commit/1e0fdf8abc10130ea3c50b13ae97396223ce7fa9).
  Docs at https://github.com/wekan/wekan/wiki/REST-API-Cards
- [Fix cards export and add customFields export](https://github.com/wekan/wekan/pull/1886).

Thanks to GitHub users ymeramees and xet7 for their contributions.

# v1.43 2018-09-06 Wekan release

This release fixes the following bugs:

- [Fix "No Comments" permission on Wekan and Trello import](https://github.com/wekan/wekan/commit/0a001d505d81961e6bd6715d885fffee0adb702d).

Thanks to GitHub user xet7 for contributions.

# v1.42 2018-09-06 Wekan release

This release adds the following new features:

- REST API: [Create board options to be modifiable](https://github.com/wekan/wekan/commit/9cea76e4efaacaebcb2e9f0690dfeb4ef6d62527),
  like permissions, public/private board - now private by default,
  and board background color.
  Docs at https://github.com/wekan/wekan/wiki/REST-API-Boards
- [Add swimlaneId in activity. Create default swimlaneId in API](https://github.com/wekan/wekan/pull/1876).

Thanks to GitHub users andresmanelli and xet7 for their contributions.

# v1.41 2018-09-05 Wekan release

This release tries to fix the following bugs:

- [Try to fix Wekan Sandstorm API](https://github.com/wekan/wekan/issues/1279#issuecomment-418440401).

Thanks to GitHub users ocdtrekkie and xet7 for their contributions.

# v1.40 2018-09-04 Wekan release

This release adds the following new features:

- [Add permission "No comments"](https://github.com/wekan/wekan/commit/77efcf71376d3da6c19ad1a4910567263e83c0ca).
  It is like normal user, but [does not show comments and activities](https://github.com/wekan/wekan/issues/1861).

Thanks to GitHub user xet7 for contributions.

# v1.39 2018-08-29 Wekan release

This release fixes the following bugs:

- [Only allow ifCanModify users to add dates on cards](https://github.com/wekan/wekan/pull/1867).

Thanks to GitHub user rjevnikar for contributions.

# v1.38 2018-08-29 Wekan release

This release adds the following new features:

- Add [msavin:userCache](https://github.com/msavin/userCache) to speedup Wekan.
  See [meteor forums post](https://forums.meteor.com/t/introducing-a-new-approach-to-meteor-user-this-simple-trick-can-save-you-millions-of-database-requests/45336/7).

and fixes the following bugs:

- [Fix Delete Board](https://github.com/wekan/wekan/commit/534b20fedac9162d2d316bd74eff743d636f2b3d).

Thanks to GitHub users msavin, rjevnikar and xet7 for their contributions.

# v1.37 2018-08-28 Wekan release

This release fixes the following bugs:

- [Add Missing Index on cards.parentId since Swimlane integration
  to speedup Wekan](https://github.com/wekan/wekan/issues/1863);
- [Update OpenShift template to add Route and parameterize](https://github.com/wekan/wekan/pull/1865);
- [Fix typos in Wekan snap help](https://github.com/wekan/wekan/commit/0c5fc6d7fd899a6bc67a446ab43e53290d8571e4).

Thanks to GitHub users Clement87, InfoSec812 and xet7 for their contributions.

# v1.36 2018-08-25 Wekan release

This release adds the following new features:

- [OAuth2 Login on Standalone Wekan](https://github.com/wekan/wekan/wiki/OAuth2). For example, Rocket.Chat can provide OAuth2 login to Wekan.
  Also, if you have Rocket.Chat using LDAP/SAML/Google/etc for logging into Rocket.Chat, then same users can login to Wekan when
  Rocket.Chat is providing OAuth2 login to Wekan.

and fixes the following bugs:

- [Move labels back to original place at minicard](https://github.com/wekan/wekan/issues/1842);
- [Fix typos in security documentation](https://github.com/wekan/wekan/pull/1857).

Thanks to GitHub users hever, salleman33, tlevine and xet7 for their contributions.

# v1.35 2018-08-23 Wekan release

This release adds the following new features:

Add Caddy plugins:
- [http.filter](https://caddyserver.com/docs/http.filter)
  for changing Wekan UI on the fly, for example custom logo,
  or changing to all different CSS file to have custom theme;
- [http.ipfilter](https://caddyserver.com/docs/http.ipfilter)
  to block requests by ip address;
- [http.realip](https://caddyserver.com/docs/http.realip)
  for showing real X-Forwarded-For IP to behind proxy;
- Turn off Caddy telemetry.

Add configuring webhooks:
- [Make the attributes that the webhook sends configurable](https://github.com/wekan/wekan/pull/1852).

Thanks to Caddy contributors, and Github users omarsy and xet7 for their contributions.

# v1.34 2018-08-22 Wekan release

This release add the following new features:

- [Add Favicon for pinned tab on Safari browser](https://github.com/wekan/wekan/issues/1795).

and fixes the following bugs:

- [Restored SMTP settings at Admin Panel, and disabled showing password](https://github.com/wekan/wekan/issues/1790);
- [Move color labels on minicard to bottom of minicard](https://github.com/wekan/wekan/issues/1842);
- [Fix and improve linked cards](https://github.com/wekan/wekan/pull/1849);
- [Allow Sandstorm to serve Wekan HTTP API](https://github.com/wekan/wekan/pull/1851);

Thanks to GitHub users andresmanelli, ocdtrekkie, therampagerado, woodyart and xet7 for their contributions.

# v1.33 2018-08-16 Wekan release

This release fixes the following bugs:

- [Change default value of label ids](https://github.com/wekan/wekan/pull/1837).

Thanks to GitHub user omarsy for contributions.

# v1.32 2018-08-16 Wekan release

This release fixes the following bugs:

- [Content Policy: Allow inline scripts, otherwise there is errors in browser/inspect/console](https://github.com/wekan/wekan/commit/807c6ce09e4b5d49049d343d73bbca24fa84d527);
- [Use only framing policy, not all of content policy](https://github.com/wekan/wekan/commit/b3005f828dbf69bdf174d4bcd7654310fa9e0968);
- [Set default matomo settings to disabled](https://github.com/wekan/wekan/commit/807c6ce09e4b5d49049d343d73bbca24fa84d527);
- Fix [hidden](https://github.com/wekan/wekan/commit/be00465e67931f2a5655ed47f6e075ed1c589f54)
  [system](https://github.com/wekan/wekan/commit/9fc3de8502919f9aeb18c9f8ea3b0678b66ce176) [messages](https://github.com/wekan/wekan/issues/1830);
- Fix [Requested By](https://github.com/wekan/wekan/commit/e55d7e4f72a4b425c4aca5ba04a7be1fc642649b) and
  [Assigned By](https://github.com/wekan/wekan/commit/5c33a8534186920be642be8e2ac17743a54f16db) [fields](https://github.com/wekan/wekan/issues/1830);
- [Fix Date and Time Formats are only US in every language](https://github.com/wekan/wekan/commit/b3005f828dbf69bdf174d4bcd7654310fa9e0968).

Thanks to GitHub users andresmanelli and xet7 for their contributions.

# v1.31 2018-08-14 Wekan release

This release fixes the following bugs:

- [Export of Board does not work on Docker](https://github.com/wekan/wekan/issues/1820).

Thanks to GitHub user xet7 for contributions.

# v1.30 2018-08-14 Wekan release

This release add the following new features:

- [When Content Policy is enabled, allow one URL to have iframe that embeds Wekan](https://github.com/wekan/wekan/commit/b9929dc68297539a94d21950995e26e06745a263);
- [Add option to turn off Content Policy](https://github.com/wekan/wekan/commit/b9929dc68297539a94d21950995e26e06745a263);
- [Allow always in Wekan markdown `<img src="any-image-url-here">`](https://github.com/wekan/wekan/commit/b9929dc68297539a94d21950995e26e06745a263).

and fixes the following bugs:

- [Fix Import from Trello error 400](https://github.com/wekan/wekan/commit/2f557ae3a558c654cc6f3befff22f5ee4ea6c3d9).

Thanks to GitHub user xet7 for contributions.

# v1.29 2018-08-12 Wekan release

This release fixes the following bugs:

- [Revert Fix lint errors, that caused breakage](https://github.com/wekan/wekan/commit/b015b5b7240f5fb5a715843dce5d35907345eb4a).

Thanks to GitHub user xet7 for contributions.

# v1.28 2018-08-12 Wekan release

This release fixes the following bugs:

- [Fix lint errors](https://github.com/wekan/wekan/commit/f5515cb95fc93882e5e1098d6043267b9260b9d7).

Thanks to GitHub user xet7 for contributions.

# v1.27 2018-08-12 Wekan release

This release add the following new features:

- [Linked Cards and Linked Boards](https://github.com/wekan/wekan/pull/1592).

Thanks to GitHub user andresmanelli for contributions.

# v1.26 2018-08-09 Wekan release

This release fixes the following bugs:

- [Set WITH_API=true setting on Sandstorm, and so that export works](https://github.com/wekan/wekan/commit/a300b73d56750a1a5645767d375be60839314e84);
- [Set Matomo blank settings on Sandstorm](https://github.com/wekan/wekan/commit/acd105e61b9dca5a78354047bbc23b0a01e71d8c).

Thanks to GitHub user xet7 for contributions.

# v1.25 2018-08-09 Wekan release

This release fixes the following bugs:

- [Fix showing only the cards of the current board in calendar view](https://github.com/wekan/wekan/pull/1822).

Thanks to GitHub user Yanonix for contributions.

# v1.24 2018-08-09 Wekan release

This release add the following new features:

- [Update node to v8.12.0 prerelease build](https://github.com/wekan/wekan/commit/04d7c47f4ca990311079be8dd6dc383448ee342f).

and fixes the following bugs:

- [Enable Wekan API by default, so that Export Board to JSON works](https://github.com/wekan/wekan/commit/b2eeff96977592deaeb23a8171fc3b13f8c6c5dc);
- [Fix the flagging of dates](https://github.com/wekan/wekan/pull/1814);
- [Use new WITH_API and Matomo env variables at Dockerfile](https://github.com/wekan/wekan/issues/1820);
- For OpenShift compliance, [change](https://github.com/wekan/wekan/commit/53d545eeef7e796bd910f7cce666686ca05de544)
  [run user](https://github.com/wekan/wekan/pull/1816)
  and [Docker internal port to 8080](https://github.com/wekan/wekan/commit/95b21943ee7a9fa5a27efe5276307febc2fbad94).

Thanks to GitHub users rjevnikar, tdemaret, xadagaras and xet7 for their contributions.

# v1.23 2018-07-30 Wekan release

This release tries to fix the following bugs:

- Checking for [existing](https://github.com/wekan/wekan/commit/a48f560a85860451914dbaad8cae6ff5120a0c38)
  [directories](https://github.com/wekan/wekan/commit/5bfb6c6411c928bfffa7ed6fe829f030e3ea57da) when
  building snap etc, trying to [get snap to build somehow](https://github.com/wekan/wekan-snap/issues/58).
  This is just a test, does it build this time correctly.

Thanks to GitHub user xet7 for contributions.

# v1.22 2018-07-30 Wekan release

This release adds the following new features:

- [Backup script now uses mongodump from snap to
   do backups](https://github.com/wekan/wekan/wiki/Backup);
- [Integration of Matomo](https://github.com/wekan/wekan/pull/1806);
- [Enable/Disable API with env var](https://github.com/wekan/wekan/pull/1799).

Thanks to GitHub user Akuket and xet7 for their contributions.

# v1.21 2018-07-18 Wekan release

This release adds the following new features:

- [Add logo from Wekan website to login logo](https://github.com/wekan/wekan/commit/4eed23afe06d5fab8d45ba3decc7c1d3b85efbd8).

and fixes the following bugs:

- [Allow to resend invites](https://github.com/wekan/wekan/pull/1785).

Thanks to GitHub users Akuket and xet7 for their contributions.

# v1.20 2018-07-18 Wekan release

This release fixes the following bugs:

- [Remove SMTP settings from Admin Panel, because they are set in environment
   variable settings like source/snap/docker already, and password was
   exposed in plain text](https://github.com/wekan/wekan/issues/1783);
- [Added info how to limit snap to root
   user](https://github.com/wekan/wekan-snap/wiki/Limit-snap-to-root-user-only);
- [Add scrolling to long cards](https://github.com/wekan/wekan/pull/1782).

Thanks to GitHub users jnso, LyR33x and xet7 for their contributions.

# v1.19 2018-07-16 Wekan release

This release adds the following new features:

- [Build from source on macOS](https://github.com/wekan/wekan/wiki/Mac);
- [Wekan integration with OpenShift](https://github.com/wekan/wekan/pull/1765);
- [Snap Caddy: set -agree flag for Let's Encrypt](https://github.com/wekan/wekan-snap/issues/54).

and fixes the following mobile bugs:

- [Fix missing utility function](https://github.com/wekan/wekan/commit/5c774070617357c25c7bb35b43f4b122eb4b3e34);
- [Avoid default behavior](https://github.com/wekan/wekan/commit/9c204d9bbe4845bc3e352e839615dfb782a753f4);
- [Hotfix more sortable elements](https://github.com/wekan/wekan/commit/616dade81c25b10fc409aee1bcc9a93ddbfee81b);
- [Hotfix for mobile device](https://github.com/wekan/wekan/commit/43d86d7d5d3f3b34b0500f6d5d3afe7bd86b0060).

and fixes the following bugs:

- [Fix invitation code](https://github.com/wekan/wekan/pull/1777).

Thanks to GitHub users adyachok, Akuket, halunk3, Haocen and xet7 for their contributions.

# v1.18 2018-07-06 Wekan release

This release fixes the following bugs:

- Fix [Title is required](https://github.com/wekan/wekan/issues/1576)
  by [setting Checklist title during migration](https://github.com/wekan/wekan/issues/1753).

Thanks to GitHub users centigrade-kdk and xet7 for their contributions.

# v1.17 2018-07-06 Wekan release

This release adds the following new features:

- [Made Subtask Settings visible at Board menu at Sandstorm](https://github.com/wekan/wekan/commit/884cd0e6b888edc9752cbed80e7ac75e2ce232de).

Thanks to GitHub user xet7 for contributions.

# v1.16 2018-07-06 Wekan release

This release fixes the following bugs:

- Fix: [Boards.forEach is not function](https://github.com/wekan/wekan/commit/a41190cdf024df65ad1c9931b3065c6ababeaf25).

Thanks to GitHub user xet7 for contributions.

# v1.15 2018-07-06 Wekan release

This release fixes the following bugs:

- Fix [Title is required](https://github.com/wekan/wekan/issues/1576)
  by making [Checklist title optional](https://github.com/wekan/wekan/issues/1753).

Thanks to GitHub users centigrade-kdk and xet7 for their contributions.

# v1.14 2018-07-06 Wekan release

This release fixes the following bugs:

- Fix [Checklists.forEach is not a function](https://github.com/wekan/wekan/issues/1753).

Thanks to GitHub user xet7 for contributions.

# v1.13 2018-07-06 Wekan release

This release adds the following new features:

- Added snapcraft.yml new node version changes, that were missing from v1.12.

Thanks to GitHub user xet7 for contibutions.

# v1.12 2018-07-06 Wekan release

This release adds the following new features:

- [Nested tasks](https://github.com/wekan/wekan/pull/1723);
- [Calendar improvements](https://github.com/wekan/wekan/pull/1752);
- [SSO CAS](https://github.com/wekan/wekan/pull/1742).

and fixes the following bugs:

- [Fix warning about missing space in jade file](https://github.com/wekan/wekan/commit/067aef9de948ef0cb6037d52602100b00d214706);
- Revert [Fix vertical align of user avatar initials](https://github.com/wekan/wekan/pull/1714), so that [initials are again
  visible](https://github.com/wekan/wekan/commit/122a61b3333fb77c0f08bbdc6fe0d3c2f6db97df);
- Fix lint warning: [EditCardDate is assigned a value but never used
  no-unused-vars](https://github.com/wekan/wekan/commit/dd324aa581bed7ea31f20968c6b596f373e7054f);
- Fix [Minimize board sidebar actually just moves it over](https://github.com/wekan/wekan/issues/1589).

Thanks to GitHub users dagomar, ppoulard, pravdomil, TNick and xet7 for their contributions.

# v1.11 2018-06-30 Wekan release

This release fixes the following bugs:

* [Remove card shadow](https://github.com/wekan/wekan/pull/1726), Wekan users now prefer not to have it;
* [Revert](https://github.com/wekan/wekan/commit/928d88cfe1da4187797519c929cd2fdd9ffe9c2e) previous
  [Less margin-bottom after minicard](https://github.com/wekan/wekan/pull/1713).

Thanks to GitHub users pravdomil and xet7 for their contributions.

# v1.10 2018-06-28 Wekan release

This release fixes the following bugs:

* Fix migration error "TypeError: Checklists.foreach" at [Snap](https://github.com/wekan/wekan-snap/issues/51),
  [Docker](https://github.com/wekan/wekan/issues/1736) etc.

Thanks to GitHub users Jubi94, kestrelhawk and xet7 for their contributions.

# v1.09 2018-06-28 Wekan release

This release adds the following new features:

* [Calendar](https://github.com/wekan/wekan/pull/1728). Click Lists / Swimlanes / Calendar.

and fixes the following bugs:

* To fix ["title is required"](https://github.com/wekan/wekan/issues/1576) fix only
  [add-checklist-items and revert all other migration changes](https://github.com/wekan/wekan/issues/1734);
* [Restore invitation code logic](https://github.com/wekan/wekan/pull/1732). Please test and add comment
  to those invitation code issues that this fixes.

Thanks to GitHub users TNick and xet7 for their contributions.

# v1.08 2018-06-27 Wekan release

This release adds the following new features:

* [Add more card inner shadow](https://github.com/wekan/wekan/commit/6a587299b80a49fce0789628ff65885b5ed2c837);
* [Less margin-bottom after minicard](https://github.com/wekan/wekan/pull/1713);
* Updated newest node fork binary from Sandstorm to Wekan, see https://releases.wekan.team/node.txt
* Add Georgian language.

and fixes the following bugs:

* [Fix typo in English translation](https://github.com/wekan/wekan/pull/1710);
* [Fix vertical align of user avatar initials](https://github.com/wekan/wekan/pull/1714);
* [Submit inline form on click outside](https://github.com/wekan/wekan/pull/1717), fixes
  ["You have an unsaved description" doesn't go away after saving](https://github.com/wekan/wekan/issues/1287);
* [Fix "Error: title is required" by removing find() from all of migrations](https://github.com/wekan/wekan/commit/97922c90cb42be6c6615639bb164173748982f56).

Thanks to GitHub users pravdomil, xet7 and zypA13510 for their contributions.

# v1.07 2018-06-14 Wekan release

This release adds the following new features:

* [Regex for Advanced filter. It aims to solve search in bigger text fields, and using wildcards.
   A change to translations was made for adding info about regex and escaping characters
   with \\](https://github.com/wekan/wekan/pull/1702).

Thanks to GitHub users feuerball11 and xet7 for their contributions.

# v1.06 2018-06-14 Wekan release

This release fixes the following bugs:

* [Fix CardDetail of Mobile View](https://github.com/wekan/wekan/pull/1701).

Thanks to GitHub users feuerball11 and xet7 for their contributions.

# v1.05 2018-06-14 Wekan release

This release adds the following new features:

* [Markdown support in Custom Fields, and view on minicard](https://github.com/wekan/wekan/pull/1699);
* [Fixes to Advanced Filter, you are now able to filter for Dropdown and Numbers,
   also Dropdown are now correctly displayed on minicard](https://github.com/wekan/wekan/pull/1699).

and fixes the following bugs:

* [Fix data colour changes on cards](https://github.com/wekan/wekan/pull/1698);
* [Fix for migration error "title is required" and breaking of Standalone and
   Sandstorm Wekan](https://github.com/wekan/wekan/commit/8d5cbf1e6c2b6d467fe1c0708cd794fd11b98a2e#commitcomment-29362180);
* [Fix Issue with custom fields shown on card](https://github.com/wekan/wekan/issues/1659);
* [Fix showing public board in list mode](https://github.com/wekan/wekan/issues/1623);
* [Fix for not able to remove Custom Field "Show on Card"](https://github.com/wekan/wekan/pull/1699);
* [Fix minicardReceivedDate typo in 1.04 regression: Socket connection error and boards
   not loading](https://github.com/wekan/wekan/issues/1694).

Thanks to GitHub users feuerball11, Fran-KTA, oec, rjevnikar and xet7 for their contributions.

# v1.04 2018-06-12 Wekan release

This release adds the following new features:

* [Add Khmer language](https://github.com/wekan/wekan/commit/2156e458690d0dc34a761a48fd7fa3b54af79031);
* [Change label text colour to black for specific label colours for better
   visibility](https://github.com/wekan/wekan/pull/1689).

and fixes the following bugs:

* [SECURITY FIX: Do not publish all of people collection. This bug has probably been present
   since addition of Admin Panel](https://github.com/wekan/wekan/commit/dda49d2f07f9c50d5d57acfd5c7eee6492f93b33);
* [Modify card covers/mini-cards so that: 1) received date is shown unless there is a start date
   2) due date is shown, unless there is an end date](https://github.com/wekan/wekan/pull/1685).

Thanks to GitHub users rjevnikar and xet7 for their contributions.
Thanks to Adrian Genaid for security fix, he's now added to [Hall of Fame](https://wekan.github.io/hall-of-fame/).
Thanks to translators.

# v1.03 2018-06-08 Wekan release

This release adds the following new features:

* [Update to newest Sandstorm fork of Node.js that includes performance
   etc fixes](https://github.com/wekan/wekan/commit/90d55777f7298d243ed0de03c934cea239a31272);
* [Additional label colors. Assigned By and Requested By text fields
   on card. Delete board from Recycle Bin](https://github.com/wekan/wekan/pull/1679).

and possibly fixes the following bugs, please test:

* [Try to fix: Missing board-view-lists Field after DB updated to
   Wekan 1.02](https://github.com/wekan/wekan/issues/1675).

Thanks to GitHub users JamesLavin, rjevnikar and xet7 for their contributions.

# v1.02 2018-05-26 Wekan release

This release fixes the following bugs:

* [Remove binary version of bcrypt](https://github.com/wekan/wekan/commit/4b2010213907c61b0e0482ab55abb06f6a668eac)
  because of [vulnerability](https://nodesecurity.io/advisories/612) that has [issue that is not fixed
  yet](https://github.com/kelektiv/node.bcrypt.js/issues/604)
  and [not yet merged pull request](https://github.com/kelektiv/node.bcrypt.js/pull/606).
  This may cause some slowdown;
* [Snap: Filtering out swap file created at build time, adding stage package](https://github.com/wekan/wekan/pull/1660);
* [Fix Received Date and End Date on Cards](https://github.com/wekan/wekan/issues/1654).

Thanks to GitHub users kubiko, xadagaras and xet7 for their contributions.

# v1.01 2018-05-23 Wekan release

This release possibly fixes the following bugs, please test:

* [Possible quickfix for all customFields Import errors, please test](https://github.com/wekan/wekan/pull/1653).

Thanks to GitHub users feuerball11 and xet7 for their contributions.

# v1.00 2018-05-21 Wekan release

This release fixes the following bugs:

* [Typo in English translation: brakets to brackets](https://github.com/wekan/wekan/issues/1647).

Thanks to GitHub user yarons for contributions.

# v0.99 2018-05-21 Wekan release

This release adds the following new features:

* [Advanced Filter for Custom Fields](https://github.com/wekan/wekan/pull/1646).

Thanks to GitHub users feuerball11 and xet7 for their contributions.

# v0.98 2018-05-19 Wekan release

This release adds the following new features:

* [Filtering by Custom Field](https://github.com/wekan/wekan/pull/1645);
* Update to NPM 6.0.1 and MongoDB 3.2.20.

Thanks to GitHub users feuerball11 and xet7 for their contributions.

# v0.97 2018-05-19 Wekan release

Updated translations.

# v0.96 2018-05-19 Wekan release

This release adds the following new features:

* [Custom Fields](https://github.com/wekan/wekan/issues/807). Note: Import/Export is not implemented yet.

and fixes the following bugs:

* [Fix: checklistItems broken after upgrade](https://github.com/wekan/wekan/issues/1636).

Thanks to GitHub users feuerball11, franksiler, papoola and xet7 for their contributions.

# v0.95 2018-05-08 Wekan release

This release adds the following new features:

* [REST API Edit Card Labels](https://github.com/wekan/wekan/pull/1626);
* [Add a new API route to create a new label in a given board](https://github.com/wekan/wekan/pull/1630);
* [Admin Panel: Option to block username change](https://github.com/wekan/wekan/pull/1627).

and fixes the following bugs:

* [Error: title is required](https://github.com/wekan/wekan/issues/1576).

Thanks to GitHub users Shahar-Y, thiagofernando and ThisNeko for their contributions.

# v0.94 2018-05-03 Wekan release

This release adds the following new features:

* [REST API POST /cards: allow setting card members](https://github.com/wekan/wekan/pull/1622).

Thanks to GitHub user couscous3 for contributions.

# v0.93 2018-05-02 Wekan release

This release adds the following new features:

* [Checklist items lineheight to 18px, and positioning
   improvements](https://github.com/wekan/wekan/issues/1619).

Thanks to GitHub user lichtamberg for contributions.

# v0.92 2018-05-01 Wekan release

This release tries to fix the following bugs, please test:

* [Users who register with an invitation code can't see lists/cards](https://github.com/wekan/wekan/issues/1610).

Thanks to GitHub user andresmanelli for contributions.

# v0.91 2018-05-01 Wekan release

This release fixes the following bugs:

- [Fix Wekan Import / Export lists not being sortable](https://github.com/wekan/wekan/commit/539c1ab87a098a7ddfd23cdbd663441bd609b73d).

Thanks to GitHub user zebby76 for contributions.

# v0.90 2018-05-01 Wekan release

This release adds the following new features:

- [Remove space from between checklist items, so longer checklists can be seen
   at once](https://github.com/wekan/wekan/commit/1124f4120cd77622c0a6313e228e1a00690ff566).

Thanks to GitHub user xet7 for contributions.

# v0.89 2018-04-29 Wekan release

This release fixes the following bugs:

- [Fix Wekan import / Export for ChecklistItems](https://github.com/wekan/wekan/pull/1613).

Thanks to GitHub user zebby76 for contributions.

# v0.88 2018-04-27 Wekan release

This release fixes the following bugs:

- [Fix Trello import of ChecklistItems](https://github.com/wekan/wekan/pull/1611).

Thanks to GitHub user zebby76 for contributions.

# v0.87 2018-04-27 Wekan release

This release fixes the following bugs:

- [Sandstorm: Copy Card, Move Card and Copy Checklist Template to Many Cards - No longer works in
   menu](https://github.com/wekan/wekan/commit/db80e738048e2729917c5e8fc18cf8ee44df7992);
- [Snap: Use override-build instead of old deprecated
   prepare/build/install](https://github.com/wekan/wekan/commit/075ea1c43d827099e0030c750a4c156bd3340fed);
- [Removed not-used plugins part of Caddy download
   URL](https://github.com/wekan/wekan/commit/7b91b341fe9c0cde42f91bf14d228820653c883d).

Thanks to GitHub users kyrofa and xet7 for their contributions.

# v0.86 2018-04-20 Wekan release

This release adds the following new features:

- Updated translations: German and Turkish;
- Updated Caddy to newest version for Snap.

Thanks to translators and Caddy developers.

# v0.85 2018-04-18 Wekan release

This release fixes the following bugs:

- [Fix Switch List/swimlane view only working with admin privileges](https://github.com/wekan/wekan/issues/1567);
- [Fix Wekan logo positioning](https://github.com/wekan/wekan/issues/1378);
- [Tried to fix, but fix did not work: Fix checklists items migration error "title is required"](https://github.com/wekan/wekan/issues/1576);
- [Removed paxctl alpine fix #1303 , because it did not work anymore, so Docker container
   did not build correctly](https://github.com/wekan/wekan/commit/ce659632174ba25ca9b5e85b053fde02fd9c3928);
- [Use curl to download 100% CPU fibers fixed node in snap, and remove paxctl from
   snap package](https://github.com/wekan/wekan/commit/179ff7a12457be1592f04e1bdc15a5bb4fe9d398).

Thanks to GitHub users andresmanelli, iwkse and xet7 for their contributions.

# v0.84 2018-04-16 Wekan release

This release adds the following new features:

- [Add Checklist Items REST API](https://github.com/wekan/wekan/commit/9eef5112dc1c1c30590d19fbfd2f615714112a3f).

and fixes the following bugs:

- [Fix Node Fibers 100% CPU issue](https://github.com/wekan/wekan/commit/e26a4824cfb119a15767c4827190a6b9ab65b904);
- [Plus button on a Swimlane row, always add an element on the first row](https://github.com/wekan/wekan/issues/1577);
- [Fix Checklist REST API](https://github.com/wekan/wekan/commit/9eef5112dc1c1c30590d19fbfd2f615714112a3f);
- [Fix Disabling "show cards count" not possible, now zero means disable](https://github.com/wekan/wekan/issues/1570);
- [Fix Checklist not copied when copied a card and Copy Checklist Template to Many Cards](https://github.com/wekan/wekan/issues/1565);
- [Fix Filter cards hides checklist items](https://github.com/wekan/wekan/issues/1561).

Thanks to GitHub users andresmanelli, kentonv and xet7 for their contributions.

# v0.83 2018-04-12 Wekan release

- Updated translations: Czech and French.

Thanks to translators!

# v0.82 2018-04-11 Wekan release

- [Restore original font and font sizes. Admin panel people and version texts
  to darker](https://github.com/wekan/wekan/commit/db74c86e555f45a5aaaef84d2f3d4128cec77782).

Thanks to GitHub users apn3a and xet7 for their contributions.

# v0.81 2018-04-10 Wekan release

This release adds the following new features:

- [Removed checkbox from checklist name to have more of material design look](https://github.com/wekan/wekan/issues/1568);
- [Renamed Archives to Recycle Bin](https://github.com/wekan/wekan/issues/1429);
- [Separate translations for cards in Recycle Bin and cards count](https://github.com/wekan/wekan/commit/49c7a6c223061b9c1769143fea32fecc7d0f3c3e);
- [Use lighter and smaller font sizes](https://github.com/wekan/wekan/commit/7b94b0470198bc22b6a52db6661f35076f7c6388);
- [Board title as markdown in board view](https://github.com/wekan/wekan/commit/7b94b0470198bc22b6a52db6661f35076f7c6388).

and fixes the following bugs:

- [Removed forcing "cards" translations to lowercase in count of cards](https://github.com/wekan/wekan/issues/1571).

Thanks to GitHub users BruceZCQ, Chartman123, quantazelle and xet7 for their contributions.

# v0.80 2018-04-04 Wekan release

This release adds the following new features:

- [Changed icon of checklist name to unchecked](https://github.com/wekan/wekan/pull/1559/commits/f9539aa2a8d806e5a158d1c32f74788d051d40cb);
- [Added meteor packages](https://github.com/wekan/wekan/commit/40d438a517f0d807894e04873358aecf44fa7c4d)
  for security: [browser-policy](https://atmospherejs.com/meteor/browser-policy) and
  [eluck:accounts-lockout](https://atmospherejs.com/eluck/accounts-lockout).

Thanks to GitHub users quantazelle and xet7 for their contributions.

# v0.79 2018-03-31 Wekan release

This release adds the following new features:

- [Checklist items sort fix, and checklist sort capability](https://github.com/wekan/wekan/pull/1543);
- [Add Received Date and End Date. Between them is already existing Start and Due Date](https://github.com/wekan/wekan/pull/1550).

and fixes the following bugs:

- [Fix drag in lists view](https://github.com/wekan/wekan/pull/1559/commits/679e50af6449a680f958256570e8b9f1944a3a92);
- [Set fixed width for swimlane header](https://github.com/wekan/wekan/pull/1559/commits/2e8f8924dd0d985ae4634450cfbef04e88e5d954).

Thanks to GitHub users andresmanelli, rjevnikar and xet7 for their contributions.

# v0.78 2018-03-17 Wekan release

This release adds the following new features:

- [Allow swimlanes reordering](https://github.com/wekan/wekan/commit/37c94622e476f50bf2387bc8b140454d66200e78);
- [Import missing card fields: isOvertime, startAt and spentTime](https://github.com/wekan/wekan/commit/b475127c53031fa498da139a7d16f3e54d43b90d);
- [Lists view is the default view when creating boards](https://github.com/wekan/wekan/commit/1ca9e96f35389c0eec2290e8e1207801ee25f907);
- [Enabled import at Sandtorm. Keep there big DANGER warning about data loss bug.](https://github.com/wekan/wekan/commit/22923d08af4f1a63ded1d92fe6918436b598592b);
- [Add language: Armenian](https://github.com/wekan/wekan/commit/75693d16e2a0f3d201c1036ab06e6d40eb1c0adc).

and fixes the following bugs:

- [Fix lint errors related to sandstorm](https://github.com/wekan/wekan/commit/0a16147470246c8f49bb918f5ddc7bb2e54fba14);
- [Add Swimlanes to globals](https://github.com/wekan/wekan/commit/373e9782dcf87a9c1169b5d1f8175ce14e4898c9);
- [Fix lint errors related to trello creator](https://github.com/wekan/wekan/commit/951a0db380d60f3d948ae38d50b85a54983a51de);
- [Fix lint errors related to language names](https://github.com/wekan/wekan/commit/c0d33d97f2c8d4e9371a03d4ad3022df3ed64d3d);
- [Avoid swimlane title overlap](https://github.com/wekan/wekan/commit/c4fa9010f34966b633c7bf7e46ad49fc101127c9);
- [Fix scrollbar inside list and outer scroll](https://github.com/wekan/wekan/commit/a033c35a3411902b9bf8f62a40cd68f641e573d3);
- [Remove list max-height 350px](https://github.com/wekan/wekan/commit/b6d3e79548d1e88c93fa2965a936595176a95565);
- [Snap: Adding network hooks for configure hook to fix security denials](https://github.com/wekan/wekan/commit/9084158aece8a642dc49bf7ecc2196bf9d1af63e);
- [Snap: Fixing problem when mongodb was not started at install/refresh](https://github.com/wekan/wekan/commit/1be8e5625fd20797910009a8221ca706fd52ab11);
- [Fix Add Card Button dissapearing when dragging](https://github.com/wekan/wekan/commit/58e5e9b308113e5a8af5166328a68a0aafcc2558);
- [Fix Scrollbar near top of screen when using internet explorer on Win7](https://github.com/wekan/wekan/commit/128a356b9222fa0ed824b477c2d0e1e6a0368021);
- [Fix scroll when dragging elements. Remove scrollbars from swimlanes.](https://github.com/wekan/wekan/commit/ed8471be9b79243b016a275e5b11a6912717fbb9);
- [Partial fix for scroll bar inside cardDetails](https://github.com/wekan/wekan/commit/ac7d44f8a8d809cd94ed5ef3640473f34c72403b);
- [Fix swimlane header rotation on Google Chrome. After this change both Firefox 58 and Google Chrome 64
   have properly rotated swimlane header.](https://github.com/wekan/wekan/commit/9a1b1a5bedbe44827de109731a3c3b1a07790d3e);
- [Fix card copy and move with swimlanes](https://github.com/wekan/wekan/commit/4b53b0c90a57593c0fe2d808d2298e85f488bfa9).
- [Fix scroll board when opening cardDetails](https://github.com/wekan/wekan/commit/454523dd4744b2bccb6805dad59abd664fdacb31);
- [Fix swimlane info not displayed in activities](https://github.com/wekan/wekan/commit/bb37d8fa964c0d03721a664387e74300fde09eef);
- [Fix sandstorm default swimlane creation](https://github.com/wekan/wekan/commit/f470323ee746c4e79f07d166d511867408194eb6);
- [Extend lists to bottom of frame in lists view](https://github.com/wekan/wekan/commit/c62a2ee11febf7f98456c97dc3973509b4bfe119);
- [Fix drag and drop issues when re-enter board](https://github.com/wekan/wekan/commit/5b0f7f8aef115b202aaff6bc25bb514426dc2009).

Thanks to GitHub users andresmanelli, GhassenRjab, kubiko, lumatijev, lunatic4ever and xet7 for their contributions.

# v0.77 2018-02-23 Wekan release

This release adds the following new features:

- [Search from card titles and descriptions on this board](https://github.com/wekan/wekan/pull/1503).
- Add Bulgarian language.

and adds the following [Snap updates](https://github.com/wekan/wekan/pull/1495):

- Cleanup of snap helper scripts
- Cleanup and snapctl settings handling
- Fix for snap store auto review refusal
- Adding support for automatic restart of services when setting(s) are changed.
  No need to call systemctl restart anymore
- Fixing snap set functionality
- Adding optional caddy service support (by default caddy service is disabled),
  it can be enabled by calling: snap set wekan caddy-enabled=true
- [Service life cycle improvements](https://github.com/wekan/wekan/pull/1495)
- [Wekan help text changes and tweaks](https://github.com/wekan/wekan/pull/1495).

and fixes the following bugs:

- [Fix: card-shadow no longer covered the page if you scroll down](https://github.com/wekan/wekan/pull/1496).

Thanks to GitHub users GhassenRjab, kubiko and stefano-pogliani for their contributions.

# v0.76 2018-02-21 Wekan release

This release adds the following new features:

- [Add swimlaneId to POST /api/boards/:boardId/lists/:listId/cards route](https://github.com/wekan/wekan/commit/ee0f42eeb1b10107bd8fc38cdefbdbc4f3fde108);
- [Added path to capnp.js to make Wekan work on Sandstorm](https://github.com/wekan/wekan/commit/11e9811f82858a3d98036e142b0da69d867adebc).

Known bugs:

- [Disabled Import temporarily on Sandstorm because of data loss bug](https://github.com/wekan/wekan/commit/e30f6515c623de7a48f25e0b2fc75313ae5d187c);
- [Swimlane not visible at Sandstorm](https://github.com/wekan/wekan/issues/1494).

Thanks to GitHub users couscous3 and xet7 for their contributions.

# v0.75 2018-02-16 Wekan release

This release adds the following new features:

- [Checklist templates](https://github.com/wekan/wekan/pull/1470);
- Added [Finnish language changelog](https://github.com/wekan/wekan/tree/devel/meta/t9n-changelog)
  and [more Finnish traslations](https://github.com/wekan/wekan/blob/main/sandstorm-pkgdef.capnp)
  to Sandstorm.

Thanks to GitHub users erikturk and xet7 for their contributions.

# v0.74 2018-02-13 Wekan release

This release fixes the following bugs:

- [Remove Emoji support, so MAC addresses etc show correctly](https://github.com/wekan/wekan/commit/056843d66c361594d5d4478cfe86e2e405333b91).
  NOTE: You can still add Unicode Emojis, this only removes broken autoconversion to Emojis.

Thanks to GitHub user xet7 for contributions.

# v0.73 2018-02-08 Wekan release

This release fixes the following bugs:

- [Fix Ubuntu snap build](https://github.com/wekan/wekan/pull/1469).

Thanks to GitHub user kubiko for contributions.

# v0.72 2018-02-07 Wekan release

This release fixes the following bugs:

- [Fix card sorting](https://github.com/wekan/wekan/pull/1465);
- [Fix import Trello board without swimlanes](https://github.com/wekan/wekan/commit/5871a478e1280818f12fcb7250b7cbccf6907cf0);
- [Fix swimlane move parameters](https://github.com/wekan/wekan/commit/fcebb2a5373d6dea41b98b530c176cbee31bee4b).

Thanks to GitHub users andresmanelli and ViViDboarder for their contributions.

# v0.71 2018-02-03 Wekan release

This release fixes the following bugs:

- [Fix Welcome board is not editable: Added default swimlane to Welcome board](https://github.com/wekan/wekan/commit/9df3e3d26bffb2268cdcc7fa768eda60e4f0975c);
- [Fix Import Wekan board with swimlanes](https://github.com/wekan/wekan/commit/ec0a8449ba98aea708e484d386e5a209e2be8fff).

Thanks to GitHub user andresmanelli for contributions.

# v0.70 2018-02-02 Wekan release

This release adds the following new features:

- [Add ability to edit swimlane name](https://github.com/wekan/wekan/commit/3414cb84ad8ac800e23bbda6ce12822f40d1bd19);
- [Add swimlane popup menu and archive icon](https://github.com/wekan/wekan/commit/5953fb8a44a3582ed0d8816ffb32a5b7f41f50a3).

and fixes the following bugs:

- [Two empty columns in swimlane view](https://github.com/wekan/wekan/issues/1459).

Thanks to GitHub user andresmanelli for contributions.

# v0.69 2018-02-01 Wekan release

This release fixes the following bugs:

- [Fix swimlanes card details bug](https://github.com/wekan/wekan/commit/f6fb05d3f49c656e9890351f5d7c0827bf2605c1);
- [Workaround to avoid swimlanes drag bug](https://github.com/wekan/wekan/commit/d3c110cd8f3ad16a4ced5520c27ab542cc79b548);
- [Fix swimlanes details view in lists only mode](https://github.com/wekan/wekan/commit/ff9ca755f338e3c45a1bd726dfbce1c607f2ff4c).
- [Fix typo in issue template](https://github.com/wekan/wekan/pull/1451).

Thanks to GitHub users andresmanelli and d-Rickyy-b for their contributions.

# v0.68 2018-01-30 Wekan release

This release fixes the following bugs:

* [Partial fix: Trello board import fails because of missing "Swimlane id"](https://github.com/wekan/wekan/issues/1442), still needs some work.

Thanks to GitHub user xet7 for contributions.

# v0.67 2018-01-28 Wekan release

This release fixes the following bugs:

* [Fix Igbo language name at menu](https://github.com/wekan/wekan/commit/9d7ff75d3fed1285273245fbe6f6a757b6180039).

Thanks to GitHub user xet7 for contributions.

# v0.66 2018-01-28 Wekan release

This release fixes the following bugs:

* [Fix Dockerfile for Debian](https://github.com/wekan/wekan/pull/1439).

Thanks to GitHub user soohwa for contributions.

# v0.65 2018-01-28 Wekan release

This release adds the following new features:

* [Swimlanes, part 1](https://github.com/wekan/wekan/issues/955);
* Added new language: Igbo.

Thanks to GitHub user andresmanelli for contributions.

# v0.64 2018-01-22 Wekan release

This release adds the following new features:

* [Different icons for start and due date](https://github.com/wekan/wekan/pull/1420).
* Added new languages: Mongolian and Portuguese;
* Upgraded to Meteor 1.6.0.1, Node 8.9.3, NPM 5.5.1 and fibers 2.0.0.

and fixes the following bugs:

* [Fix for dragging into scrolled-down list](https://github.com/wekan/wekan/pull/1424).
* [Fix double slash bug on snap](https://github.com/wekan/wekan/issues/962#issuecomment-357785748).

Thanks to GitHub users dpoznyak, mmarschall and xet7 for their contributions.

# v0.63 2017-12-20 Wekan release

This release adds the following new features:

* [Auto update card cover with new image uploaded via drag&drop](https://github.com/wekan/wekan/pull/1401);
* Update to Node 4.8.7.

Thanks to GitHub users thuanpq and xet7 for their contributions.

# v0.62 2017-12-12 Wekan release

This release fixes the following bugs:

* Added missing packages to build script.

Thanks to GitHub user xet7 for contributions.

# v0.61 2017-12-12 Wekan release

This release adds the following new features:

* [Change password of any user in Standalone Wekan Admin Panel](https://github.com/wekan/wekan/pull/1372);
* [Performance optimization: Move more global subscriptions to template subscription](https://github.com/wekan/wekan/pull/1373);
* [Auto update card cover with latest uploaded image attachment](https://github.com/wekan/wekan/pull/1387);
* [Always display attachment section for uploading file quickly](https://github.com/wekan/wekan/pull/1391);
* [Make it easier to see the Add Card button at top of list](https://github.com/wekan/wekan/pull/1392);
* [Add mixmax:smart-disconnect to lower CPU usage when browser tab is not selected](https://github.com/wekan/wekan-mongodb/issues/2);
* Update tranlations. Add Latvian language;
* Update to Node 4.8.6 and MongoDB 3.2.18.

and fixes the following bugs:

* [Bug on not being able to see Admin Panel if not having access to Board List](https://github.com/wekan/wekan/pull/1371);
* [Bug on not able to see member avatar on sidebar activity](https://github.com/wekan/wekan/pull/1380);
* [Don't open swipebox on update card cover / download file / delete file](https://github.com/wekan/wekan/pull/1386);
* [Boards subscription should be placed at header for all other component can be used](https://github.com/wekan/wekan/pull/1381);
* [Bug on long url of attachment in card activity log](https://github.com/wekan/wekan/pull/1388).

Thanks to GitHub users mfshiu, thuanpq and xet7 for their contributions.
Thanks to translators for their translations.

# v0.60 2017-11-29 Wekan release

This release adds the following new features:

* [Add SMTP test email button to Standalone Wekan Admin Panel](https://github.com/wekan/wekan/pull/1359);
* [Optimize for mobile web, show single list per page with navigate bar](https://github.com/wekan/wekan/pull/1365).

and fixes the following bugs:

* [User with comment only permissions can remove another user from a card](https://github.com/wekan/wekan/pull/1352);
* [Frequent Subscriptions problem that make Excessive CPU usage](https://github.com/wekan/wekan/pull/1363).

Thanks to GitHub users floatinghotpot, mfshiu and nztqa for their contributions.

# v0.59 2017-11-23 Wekan release.

This release fixes the following bugs:

* [Remove incomplete logger fix](https://github.com/wekan/wekan/pull/1352).

Thanks to GitHub user pierreozoux for contributions.

# v0.58 2017-11-23 Wekan release

This release adds the following new features:

* Updated translations.

Thanks to all translators.

# v0.57 2017-11-23 Wekan release

This release adds the following new features:

* [Gogs Integration](https://github.com/wekan/wekan-gogs) as separate project. Please test and submit issues and pull requests to that project.

and fixes the following bugs:

* [Fix Winston logger](https://github.com/wekan/wekan/pull/1350).

Thanks to GitHub users andresmanelli and pierreozoux for their contributions.

# v0.56 2017-11-21 Wekan release

This release adds the following new features:

* [Copy/Move cards to other board in Standalone Wekan](https://github.com/wekan/wekan/pull/1330);
* [Spent time/Overtime on card](https://github.com/wekan/wekan/pull/1344);
* New translation: Greek.

and fixes the following bugs:

* [Board list with long-description boards not visible](https://github.com/wekan/wekan/pull/1346);
* [Remove erroneous minicard title whitespace](https://github.com/wekan/wekan/pull/1347);
* [Fix title editing with shift key at card details](https://github.com/wekan/wekan/pull/1348).

Thanks to GitHub users couscous3, GhassenRjab, thuanpq and xet7 for their contributions.

# v0.55 2017-11-19 Wekan release

This release adds the following new features:

* [Markdown in card/minicard/checlist titles and checklist items. Next line: Shift+Enter. Submit: Enter.](https://github.com/wekan/wekan/pull/1334);
* [User Admin to Admin Panel: List users. Change: is user admin, name, fullname, email address, is user active. Not changing password yet.](https://github.com/wekan/wekan/pull/1325);
* [REST API better error output](https://github.com/wekan/wekan/pull/1323).

and fixes the following bugs:

* [Emoji detection breaks MAC addresses](https://github.com/wekan/wekan/issues/1248); - this has not yet fixed all cases.
* [Codeblocks should not be scanned for emoji](https://github.com/wekan/wekan/issues/643);
* [Whitespace trimming breaks Markdown code block indentation](https://github.com/wekan/wekan/issues/1288):
* [Helper to list boards for user](https://github.com/wekan/wekan/pull/1327);
* [Error after sending invitation and joining board: Exception while invoking method 'login' TypeError: Cannot read property 'loginDisabled' of undefined](https://github.com/wekan/wekan/issues/1331);
* [Invitation /sign-up page did not show input for invitation code](https://github.com/wekan/wekan/commit/99be745f0299b32a8a7b30204b43bff7fd5ba638).

Thanks to Github users brooksbecton, milesibastos, nztqa, soohwa, thuanpq and xet7 for their contributions.

# v0.54 2017-11-02 Wekan release

This release adds the following new features:

* [Soft WIP Limit](https://github.com/wekan/wekan/pull/1319).

Thanks to GitHub users amadilsons and xet7 for their contributions.

# v0.53 2017-11-02 Wekan release

(This was canceled, it had some missing version numbers).

# v0.52 2017-10-31 Wekan release

This release adds the following new features:

* [Permit editing WIP limit](https://github.com/wekan/wekan/pull/1312);
* [Image attachment resize on smaller screens and swipebox](https://github.com/wekan/wekan/pull/1315);
* [Add iPhone favicon for Wekan](https://github.com/wekan/wekan/issues/1317).

and fixes the following bugs:

* [Members do not get included on board import from Wekan](https://github.com/wekan/wekan/pull/1316).

Thanks to GitHub users brooksbecton, guillaumebriday, nztqa, ocdtrekkie and Tentoe for their contributions.

# v0.51 2017-10-25 Wekan release

This release adds the following new features:

* [REST API: Disable and enable user login. Take ownership boards of a user. List boards of user.](https://github.com/wekan/wekan/pull/1296);
* [Add translation: Spanish of Argentina](https://github.com/wekan/wekan/commit/b105f0e2e72c49a2f1ba3f6c87532a5418192386);
* [Add more languages to Roboto font](https://github.com/wekan/wekan/issues/1299).

and fixes the following bugs:

* [Segfault on Alpine Linux](https://github.com/wekan/wekan/issues/1303);
* [Change invitation link from sign-in to sign-up](https://github.com/wekan/wekan/issues/1300);
* [User with comment only permission can add cards](https://github.com/wekan/wekan/issues/1301).

Thanks to GitHub users chromas-cro, soohwa, wenerme and xet7 for their contributions.

# v0.50 2017-10-10 Wekan release

This release fixes the following bugs:

* [Fix and update translations](https://github.com/wekan/wekan/issues/1286).

Thanks to GitHub user xet7 for contributions.

# v0.49 2017-10-09 Wekan release

This release fixes the following bugs:

* [When WIP limit in use, hide also add card + button at top of list](https://github.com/wekan/wekan/commit/a5daf5dc29278b82e133fbe4db09a91ffc0c0d3b).

Thanks to GitHub user xet7 for contributions.

# v0.48 2017-10-09 Wekan release

This release adds the following new features:

* [WIP Limits](https://github.com/wekan/wekan/pull/1278);
* [REST API: Create user despite disabling registration](https://github.com/wekan/wekan/issues/1232);
* [User can leave board on Standalone Wekan](https://github.com/wekan/wekan/pull/1283).

and fixes the following bugs:

* [Admin announcement can be viewed without signing in](https://github.com/wekan/wekan/issues/1281).

Thanks to GitHub users amadilsons, nztqa and soohwa for their contributions.

# v0.47 2017-10-04 Wekan release

This release adds the following new features:

* [Use theme color for Slider for Comments only](https://github.com/wekan/wekan/pull/1275).

Thanks to GitHub user nztqa for contributions.

# v0.46 2017-10-03 Wekan release

This release adds the following new features:

* [Webhook parameters and response order](https://github.com/wekan/wekan/pull/1263).

and fixes the following bugs:

* SECURITY FIX: [Meteor allow/deny](https://blog.meteor.com/meteor-allow-deny-vulnerability-disclosure-baf398f47b25) fixed
  [here](https://github.com/wekan/wekan/commit/c3804dc0fad0817285460d86dc1b3bdc96361f49);
* [Fix: Slider for Comments only does not work correctly with over 21 activities](https://github.com/wekan/wekan/pull/1247).

Thanks to GitHub users andresmanelli and nztqa for their contributions.

# v0.45 2017-10-01 Wekan release

This release adds the following new features:

* [Slider for Comments only in activity feed](https://github.com/wekan/wekan/issues/1247);
* [Site Wide Announcement](https://github.com/wekan/wekan/pull/1260).

and fixes the following bugs:

* [Data inconsistency when copying card](https://github.com/wekan/wekan/pull/1246). Note: There is no feature for copying card attachment yet;
* [Hide create label from normal users, because only board admin can create labels](https://github.com/wekan/wekan/pull/1261).

Thanks to GitHub user nztqa for contributions.

# v0.44 2017-09-30 Wekan release

This release adds the following new features:

* [Confirm popup appears before Checklist Delete](https://github.com/wekan/wekan/pull/1257).

and fixes the following bugs:

* [Fix errors when importing from Trello](https://github.com/wekan/wekan/pull/1259).

Thanks to GitHub users amadilsons and GhassenRjab for their contributions.

# v0.43 2017-09-25 Wekan release

This release fixes the following bugs:

* [Add emojis back, because removing them broke local dev Sandstorm](https://github.com/wekan/wekan/issues/1248).

Thanks to GitHub user xet7 for contributions.

# v0.42 2017-09-25 Wekan release

This release fixes the following bugs:

* [Remove emoji support, because it breaks MAC addresses, urls, code etc](https://github.com/wekan/wekan/issues/1248).

Thanks to GitHub user xet7 for contributions.

# v0.41 2017-09-25 Wekan release

This release fixes the following bugs:

* [Can't create user and login after install. Reverting REST API: Create user despite disabling registration](https://github.com/wekan/wekan/issues/1249).

Thanks to GitHub user xet7 for contributions.

# v0.40 2017-09-25 Wekan release

This release adds the following new features:

* [Add translations (en/de/fi) for email notifications regarding checklists and checklist
   items](https://github.com/wekan/wekan/pull/1238);
* [Added plus button to add card on top of the list](https://github.com/wekan/wekan/pull/1244);
* [REST API: Create user despite disabling registration](https://github.com/wekan/wekan/issues/1232).

and fixes the following bugs:

* [Checklist items are lost when moving items to another checklist](https://github.com/wekan/wekan/pull/1240);
* [Keep state of checklist items when moved to another checklist](https://github.com/wekan/wekan/pull/1242).

Thanks to GitHub users GhassenRjab, mario-orlicky, soohwa, umbertooo and xet7 for their contributions.

# v0.39 2017-09-18 Wekan release

This release adds the following new features:

* [Import checklist sort attributes from Wekan and Trello](https://github.com/wekan/wekan/pull/1226).

Thanks to GitHub user GhassenRjab for contributions.

# v0.38 2017-09-14 Wekan release

This release adds the following new features:

* [Reorder checklists. Move checklist item to another checklist.](https://github.com/wekan/wekan/pull/1215);
* [Card title is now pre-filled in copy card dialog](https://github.com/wekan/wekan/pull/1214).

Thanks to GitHub user frmwrk123 for contributions.

# v0.37 2017-09-09 Wekan release

This release adds the following new features:

* [Copy card within one board](https://github.com/wekan/wekan/pull/1204).

Thanks to GitHub user frmwrk123 for contributions.

# v0.36 2017-09-02 Wekan release

This release adds the following new features:

* [Import attachments related activities from Wekan and
   Trello](https://github.com/wekan/wekan/pull/1202).

Thanks to GitHub user GhassenRjab for contributions.

# v0.35 2017-09-02 Wekan release

This release adds the following new features:

* [Add more than one Outgoing Webhook](https://github.com/wekan/wekan/pull/1199).

and fixes the following bugs:

* [Fix errors caused by checklist items activities](https://github.com/wekan/wekan/pull/1200).

Thanks to GitHub users andresmanelli, GhassenRjab and nztqa for contributions.

# v0.34 2017-08-30 Wekan release

This release adds the following new features:

* [Import Trello and Wekan board times of creation of activities](https://github.com/wekan/wekan/pull/1187);
* Newest Wekan is available at Sandstorm App Market.

Known issues:

* [Attachment creation times are not imported to Trello and Wekan](https://github.com/wekan/wekan/issues/1157).
  - This is fixed in v0.36.

Thanks to GitHub user GhassenRjab for contributions.

# v0.33 2017-08-29 Wekan release

This release adds the following new features:

* [Add Bounties and Commercial Support to wiki](https://github.com/wekan/wekan/wiki);
* [Add display Wekan version number and runtime
   environment to Admin Panel](https://github.com/wekan/wekan/pull/1156);
* [Change Email address](https://github.com/wekan/wekan/pull/1161);
* [Ubuntu snap: Use version scriptlet](https://github.com/wekan/wekan/pull/1164);
* [Gogs integration part 1](https://github.com/wekan/wekan/pull/1189);
* [Add web manifest so Wekan can be used like standalone app on Desktop
   with Chrome or Firefox](https://github.com/wekan/wekan/pull/1184);
* [Copy card link to clipboard](https://github.com/wekan/wekan/issues/1188);
* [Usernames can now include dots (.)](https://github.com/wekan/wekan/pull/1194).

and fixes the following bugs:

* [Fix Squeezed tickbox in Card](https://github.com/wekan/wekan/pull/1171);
* [Percent-encode SMTP password to prevent URI malformed
   errors](https://github.com/wekan/wekan/pull/1190);
* [Fix Wekan Import Export on Standalone and Sandstorm](https://github.com/wekan/wekan/pull/1197).

Thanks to GitHub users andresmanelli, danhawkes, GhassenRjab, jonasob, kubiko, nztqa,
pkuhner and xet7 for their contributions.

# v0.32 2017-07-30 Wekan release

This release adds the following new features:

* [Add dwrensha's Sandstorm patch to Wekan so it does not need to be maintained
   separately](https://github.com/wekan/wekan/commit/bda15daa78556223117a5846941aafd1212f14d3).

and fixes the following bugs:

* [FIX SECURITY ISSUE Files accessible without authentication](https://github.com/wekan/wekan/issues/1105);
* [Fix showing card activity history in IE11](https://github.com/wekan/wekan/pull/1152).

Thanks to GitHub users dwrensha, GhassenRjab and nztqa for their contributions.

# v0.31 2017-07-30 Wekan release

* This was broken, having lint errors.

# v0.30 2017-07-27 Wekan release

SECURITY ISSUE [Files accessible without authentication](https://github.com/wekan/wekan/issues/1105)
IS NOT FIXED YET.

This release adds the following new features:

* [More screenshots at Features page](https://github.com/wekan/wekan/wiki/Features);
* [Export and import boards in Sandstorm](https://github.com/wekan/wekan/pull/1144);
* [GitHub Issue template](https://github.com/wekan/wekan/pull/1146);
* [Add checklist items to activity log](https://github.com/wekan/wekan/pull/1148).

and fixes the following bugs:

* [Double shashes on ROOT_URL](https://github.com/wekan/wekan/issues/962).

Thanks to GitHub users GhassenRjab, nztqa and xet7 for their contributions.

# v0.29 2017-07-21 Wekan release

SECURITY ISSUE [Files accessible without authentication](https://github.com/wekan/wekan/issues/1105)
IS NOT FIXED YET.

This release adds the following new features:

* [Export and import attachments as base64 encoded files](https://github.com/wekan/wekan/pull/1134);
* [Export and import checklists](https://github.com/wekan/wekan/pull/1140).

and fixes the following bugs:

* [Activity user messed up when creating a card using the REST-API](https://github.com/wekan/wekan/pull/1116).

Thanks to GitHub users GhassenRjab and zarnifoulette for their contributions.

# v0.28 2017-07-15 Wekan release

SECURITY ISSUE [Files accessible without authentication](https://github.com/wekan/wekan/issues/1105)
IS NOT FIXED YET.

This release adds the following new features:

* [REST API: Add PUT method to update a card](https://github.com/wekan/wekan/pull/1095) and
  [related fix](https://github.com/wekan/wekan/pull/1097);
* [When finished input of checklist item, open new checklist
  item](https://github.com/wekan/wekan/pull/1099);
* [Improve UI design of checklist items](https://github.com/wekan/wekan/pull/1108);
* [Import Wekan board](https://github.com/wekan/wekan/pull/1117);
* [Outgoing Webhooks](https://github.com/wekan/wekan/pull/1119);
* [Wekan wiki now has menu with categories](https://github.com/wekan/wekan/wiki).

and fixes the following bugs:

* [SECURITY: Upgrade Node.js, MongoDB and Debian on Docker and Ubuntu snap edge](https://github.com/wekan/wekan/pull/1132);
* [Possible to add empty item to checklist](https://github.com/wekan/wekan/pull/1107);
* [Double-slash issue](https://github.com/wekan/wekan/pull/1114);
* [Node.js crash when adding new user to board](https://github.com/wekan/wekan/issues/1131).

Thanks to GitHub users GhassenRjab, johnleeming, jtickle, nztqa, xet7 and zarnifoulette
for their contributions.

# v0.27 2017-06-28 Wekan release

This release adds the following new features:

* [Snapcraft build support from source](https://github.com/wekan/wekan/pull/1091).

and fixes the following bugs:

* [Fix incorrect attachment link with subfolder in the url](https://github.com/wekan/wekan/pull/1086);
* [Fix link to card](https://github.com/wekan/wekan/pull/1087);
* [Fix duplicate id generation](https://github.com/wekan/wekan/pull/1093).

Thanks to GitHub users kubiko and nztqa for their contributions.

# v0.26 2017-06-26 Wekan release

This release fixes the following bugs:

* [Fix admin panel route for subfolder](https://github.com/wekan/wekan/pull/1084);
* [Fix i18n route for subfolder](https://github.com/wekan/wekan/pull/1085).

Thanks to GitHub user nztqa for contributions.

# v0.25 2017-06-24 Wekan release

This release adds the following new features:

* [Import due date from Trello](https://github.com/wekan/wekan/pull/1082).

and fixes the following bugs:

* [Fix importing Trello board: Attribute correct members to their
   comments](https://github.com/wekan/wekan/pull/1080);
* [Fix Case-sensitive email handling](https://github.com/wekan/wekan/issues/675);
* [Use fibers 1.0.15 because 2.0.0 is broken](https://github.com/wekan/wekan/commit/86e2744c24149c0eacf725b68a186d0bcfae5100);
* [Remove git submodules, so that git clone of Wekan repo works now on Windows](https://github.com/wekan/wekan/issues/977).

Thanks to GitHub users GhassenRjab, nztqa and xet7 for their contributions.

# v0.24 2017-06-21 Wekan release

This release adds the following new features:

* [Change the way to delete a list (card-like)](https://github.com/wekan/wekan/pull/1050), fixes
  [missing undo button](https://github.com/wekan/wekan/issues/1023);
* [When deleting list, delete list's cards too](https://github.com/wekan/wekan/pull/1054);
* [Re-enable Export Wekan Board](https://github.com/wekan/wekan/pull/1059);
* [Sort languages by their translated names](https://github.com/wekan/wekan/pull/1070);
* [Add Breton language name](https://github.com/wekan/wekan/pull/1071).

and fixes the following bugs:

* [Fix Admin Panel link available to all users, only link is hidden](https://github.com/wekan/wekan/pull/1076);
* [Fix IE 11 drag board to scroll](https://github.com/wekan/wekan/pull/1052);
* [Fix Export Wekan board](https://github.com/wekan/wekan/pull/1067);
* [Fix "W" shortcut binding](https://github.com/wekan/wekan/pull/1066);
* [Fix login url in invitation email](https://github.com/wekan/wekan/issues/993);
* [Edit card description with invalid markdown](https://github.com/wekan/wekan/pull/1073);
* [Fix filter reset on moving between starred boards](https://github.com/wekan/wekan/pull/1074).

Thanks to GitHub users BaobabCoder, GhassenRjab, nebulade, nztqa and xet7
for their contributions.

# v0.23 2017-05-21 Wekan release

This release adds the following new features:

* [Add checklist and card comment to REST API](https://github.com/wekan/wekan/pull/1033);
* [Add token authentication to REST API](https://github.com/wekan/wekan/pull/1033), this fixes
  [Security flaws introduced by REST API](https://github.com/wekan/wekan/issues/1032);
* [Authorization improvements etc to REST API](https://github.com/wekan/wekan/pull/1041);
* [IE 11 support in unicode filename downloads](https://github.com/wekan/wekan/issues/1031).

and fixes the following bugs:

* [When Wekan starts, there's "here1 false" messages in
  console](https://github.com/wekan/wekan/issues/1028);
* [IE11 problem when closing cards, sidebar etc](https://github.com/wekan/wekan/pull/1042).

Thanks to GitHub users huneau, mayjs and nztqa for their contributions.

# v0.22 2017-05-07 Wekan release

This release fixes the following bugs:

* [Download file(unicode filename) cause crash with exception](https://github.com/wekan/wekan/issues/784)

Thanks to GitHub user yatusiter for contributions.

# v0.21 2017-05-07 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/784

This release fixes the following bugs:

* Update release version number to package.json.

Thanks to GitHub user xet7 for contributions.

# v0.20 2017-05-07 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/784

This release fixes the following bugs:

* Docker images missing latest Debian updates.

Thanks to GitHub user xet7 for contributions.

# v0.19 2017-05-06 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/784

This release adds the following new features:

* Set first user as admin, it there is no existing
  users and Wekan is not running at Sandstorm;
* New Docker Compose [Wekan-MongoDB](https://github.com/wekan/wekan-mongodb)
  and [Wekan-PostgreSQL](https://github.com/wekan/wekan-postgresql)
  that use Meteor v1.4 and Node v4 based Wekan's meteor-1.4 branch;
* [Console, file, and zulip logger on database changes](https://github.com/wekan/wekan/pull/1010);
* [REST API first step](https://github.com/wekan/wekan/pull/1003);
* [Install from source](https://github.com/wekan/wekan/wiki/Install-and-Update#install-manually-from-source)
  has been updated to new meteor 1.4 version;
* meteor-1.4 branch has been merged to devel and master branches,
  where development continues from now on. Previous code has been moved to
  meteor-1.3-2017-04-27 branch;
* [VirtualBox image updated](https://wekan.xet7.org).

and fixes the following bugs:

* isCommentOnly false fix for Trello import;
* Node version to 4.8.1 to solve 100% CPU issue;
* Fix bson error on Docker and install from source;
* Try other key servers on Dockerfile if ha.pool.sks-keyservers.net is unreachable.

Thanks to GitHub users brylie, huneau, johnniesong, rhelsing, stephenmoloney,
xet7 and Zokormazo for contributions.

# v0.18 2017-04-02 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/784

This release adds the following new features:

* Add TLS toggle option to smtp configuration;
* [Comment permissions](https://github.com/wekan/wekan/issues/870);
* Add bigger screenshots for Sandstorm.

and fixes the following bugs:

* Fix email settings loading:
  MAIL_URL was overriden with database info all the time.
  Now if MAIL_URL exists is not overwritten and if neither MAIL_URL nor
  exists valid admin panel data MAIL_URL is not set.
  MAIL_FROM was ignored. Same behaviour, env variable has bigger priority
  than database configuration.
  On both cases, althought environment variable is set, updating admin-panel
  mail settings will load new info and ignore the environment variable;
* Dockerfile fix for local packages;
* Don't send emails if missing smtp host;
* Remove invitation code if email sending failed;
* Show customized error msg while invitation code is wrong during registration;
* Fix "internal error" while registration is done;
* Fix "cannot access disableRegistration of undefined" error;
* Add high available server for getting the gpg keys - suppose it should lead
  to fewer failures on getting the gpg keys leading to some rare build failures;
* Add a docker build to the .travis.yml - this will help determine if pull
  requests need further review before merging into devel;
* Use navigator language by default instead of English.

Thanks to GitHub users JamborJan, lkisme, rhelsing, Serubin, stephenmoloney,
umbertooo and Zokormazo for their contributions.

# v0.17 2017-03-25 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/784

This release fixes the following bugs:

* Double slash problem on card pop-ups;
* No need for Array.prototype if using rest operator;
* Fix default font so Chinese is shown correctly.
  Still looking for better solution for #914 although
  commit had wrong number #707.

Thanks to GitHub users mo-han, Serubin and vuxor for
their contributions.

# v0.16 2017-03-15 Wekan release

Added missing changelog updates.

# v0.15 2017-03-15 Wekan release

Updated translations.

# v0.14 2017-03-15 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/785
* https://github.com/wekan/wekan/issues/784

This release fixes the following bug:

* Set IE compatibility mode to Edge to so that
  Wekan board loads correctly.

Thanks to GitHub users immertroll and REJack for
their contributions.

# v0.13 2017-03-12 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/785
* https://github.com/wekan/wekan/issues/784

This release fixes the following bug:

* Admin Panel: Set mail-from to environment immediately after changed,
  allow user set a blank username and password pair in SMTP setting.

Thanks to GitHub user lkisme for contributions.

# v0.12 2017-03-05 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/785
* https://github.com/wekan/wekan/issues/784

This release adds the following new features:

* Import Checklists from Trello;
* Simplified release numbers of Wekan.

Thanks to GitHub users whodafly and xet7 for
their contributions.

# v0.11.1-rc2 2017-03-05 Wekan prerelease

Known bugs:

* https://github.com/wekan/wekan/issues/785
* https://github.com/wekan/wekan/issues/784

This release adds the following supported platforms:

* [Docker environment for Wekan development](https://github.com/wekan/wekan-dev);
* [Wekan <=> MongoDB <=> ToroDB => PostgreSQL read-only
  mirroring](https://github.com/wekan/wekan-postgresql)
  for SQL access with any programming language
  or Office package that has PostgreSQL support, like
  newest LibreOffice 3.5;
* [Install from source on
  Windows](https://github.com/wekan/wekan/wiki/Install-Wekan-from-source-on-Windows).

and adds the following new features:

* Admin Panel:
```
  1) Disable Self-Registration and invite users
  2) SMTP settings.

  Adding Admin user in mongo cli:
  1) Use database that has wekan data, for example:
     use admin;
  2) Add Admin rights to some Wekan username:
     db.users.update({username:'admin-username-here'},{$set:{isAdmin:true}})
  Hiding Admin panel by removing Admin rights:
     use admin;
     db.settings.remove({});
```
* Make Due Date layout nicer on minicard;
* Added tooltip for board menu and sidebar buttons;
* [Wekan database cleanup script](https://github.com/wekan/wekan-cleanup);
* [Daily export script of Wekan changes as JSON to Logstash and
  ElasticSearch / Kibana (ELK)](https://github.com/wekan/wekan-logstash);
* [Wekan stats script](https://github.com/wekan/wekan-stats).

and fixes the following bugs:

* Dockerfile was missing EXPOSE $PORT;
* Bug when removing user from board that generate activity for
  all cards of the board. Add check before user is one owner
  of the card before adding activity;
* All new boards are automatically starred. Fixed to
  only star header-bar new-boards;
* Orphan documents were created when cards were deleted;
* Improve Wekan performance by adding indexes to MongoDB;
* Invite user with lower case email;
* Typos.

Thanks to GitHub users eemeli, entrptaher, fmonthel, jLouzado, lkisme,
maulal, pra85, vuxor, whittssg2 and xet7 for their contributions.

# v0.11.1-rc1 2017-02-10 Wekan prerelease

2017-01-29 mquandalle gave Wekan access to xet7,
so at 2017-01-31 xet7 started merging Wefork back to Wekan.
At 2017-02-03 all Wefork code and pull requests are now
merged back to Wekan.

Known bugs:
* https://github.com/wekan/wekan/issues/785
* https://github.com/wekan/wekan/issues/784

This release adds the following supported platforms:

* Docker;
* Docker on SLES12SP1;
* Install from source.

and adds the following new features:

* Checklists;
* Remove a list;
* Admin of board can leave board if he/she
  is not last admin in the board;
* Shortcuts popup, link to it on
  bottom right corner;
* Links are now underlined and change
  link color on hover;
* Added YuGothic and Meiryo fonts to show
  non-English text correctly.

and fixes the following bugs:

* Update xss to v0.3.3;
* Typos in boards.js and boardHeader.js;
* Build warning in jade template;
* New MongoDB version breaks uploading files
  and avatars, so using older version;
* Tweaked .gitignore to exclude .build/*;
* Fix executeUpTo label when dragging cards,
  popup was not in the predefined hierarchy.

and adds the following new documentation:

* Developer Documentation;
* Docker;
* and others.

Thanks to GitHub users AlexanderR, BaobabCoder, jLouzado, kamijin-fanta,
lkisme, mario-orlicky, martingabelmann, mquandalle, stephenmoloney,
umbertooo, xet7 and qge for their contributions.

# v0.11.0 2016-12-16 Wekan fork first release

This release adds the following new features:

* Start- and Duedate for cards;
* Allow IE 11 to work;
* Option to hide system messages in the card;
* Option to setup minimum limit to show cards count
  for each list in board;
* Option 'filter by empty' to filter by cards by 'no member'
  and 'no label' properties;
* Speedup: Added MongoDB index on CardId into Comments collection.
* Translation updates

and fixes the following bugs:

* Sandstorm: username handling, restore identity, eslint regressions,
  board not found;
* Failure to load when navigator.language is Chinese or Finnish;
* Hover background for labels in filter sidebar. Now correctly
  centered;
* Display message when user wants to choose existing username;
* Client sometimes fails to receive current user's profile;
* Old users could see broken presence indicators on new users.

Thanks to GitHub users dwrencha, fmonthel, mario-orlicky, pierreozoux,
shoetten, and xet7 for their contributions.

# v0.11.0-rc2 2016-07-21

This release adds the following new features:

* Notification system with email notifications of the changes in a board,
  a list or on a card;
* Show the exact time when hovering the activity time;
* Allow to edit more easily longer card titles by resizing the input box;
* Add shortcuts to move cards to the top or the bottom of a list;
* Add a warning indicator when the application is offline;
* A new log-in button on the public board view to sign in, even if the board
  is published;
* New link to the keyboard shortcuts in the board sidebar;

and fixes the following bugs:

* Fix the syntax of the `docker-compose.yml`;
* Use the correct pluralization of emoji;
* Only publish required user data and keep the hashed passwords confidential;
* Fix the generation and alignment of the initials avatars;
* Fix the “welcome board” feature;
* Only display the buttons in the board header, if the data is available
  and the user is able to use it;
* Fix the scaling of cover images;
* Fix bugs on Internet Explorer v11 that blocked card creation and activity feed
  visualization.

Thanks to GitHub users alayek, AlexanderS, choclin, floatinghotpot, ForNeVeR,
PeterDaveHello, seschwar, and TheElf for their contributions.

# v0.10.1 2015-12-30

This patch release fixes two bugs on Sandstorm:

* Drag and drop was broken;
* Avatars weren’t working.

# v0.10 2015-12-22

This release features:

* Trello boards importation, including card history, assigned members, labels,
  comments, and attachments;
* Invite new users to a board using an email address;
* Autocompletion in the minicard editor. Start with <kbd>@</kbd> to start a
  board member autocompletion, or <kbd>#</kbd> for a label;
* Improve the user interface on small screens so that Wekan could be used on the
  mobile web;
* Accelerate the initial page rendering by sending the data on the initial HTTP
  response instead of waiting for the DDP connection to open;
* Support images attachments copy pasting;
* On Sandstorm, expose the Wekan grain title and URL to the Sandstorm shell;
* Support Wekan deployment under a sub-path of a domain name.

New languages supported: Arabic, Catalan, Italian, and Russian.

Thanks to GitHub users AlexanderS, fisle, floatinghotpot, FuzzyWuzzie, mnutt,
ndarilek, SirCmpwn, and xavierpriour for their contributions.

# v0.9 2015-09-10

This release is a large re-write of the previous code base. This release marks
the beginning of our new user interface and continues to improve the overall
performance and security. It also features the following improvements:

* A new user account system, including the possibility to reset a forgotten
  password, to change the password, or to enable email confirmation (all of
  which were previously impossible);
* Avatar customization, including the possibility to upload images and to choose
  one from Gravatar or the user initials (on Sandstorm we use the avatar exposed
  by Sandstorm);
* Cards multi-selection to facilitate batch actions such as moving all the cards
  of selection, or attaching a label or a member to them;
* Automatic drafts saving synced with the server;
* Keyboard navigation, press `?` to read the list of available shortcuts;
* The possibility to restore archived boards, lists, and cards.

Starting from this release we will also distribute official docker images on
both the [GitHub release page](https://github.com/wekan/wekan/releases) and on
the [DockerHub](https://hub.docker.com/r/mquandalle/wekan). We also configured
Heroku one-click install and improved Sandstorm integration with the integration
of its build-in sharing model.

New languages supported: Chinese, Finnish, Spanish, Korean, and Russian.

Special thanks to GitHub users ePirat, nata-goddanti, ocdtrekkie, and others who
have supportive during this *traversée du desert*, and to neynah for the Wekan
icons.

# v0.8

This release continues the implementation of basic features of a “kanban”
software, especially:

* Basic card attachments. If the attached file is an image we generate and
  display a thumbnail that can be used as a card “cover” (visible in the board
  general view);
* User names mentions and auto-completion in card description and comments
  (though we don’t have any notification system for now, making this feature a
  less useful that it should);
* Filter views, current filtering options are based on labels and assigned
  members;
* Labels creation and suppression at the board level (previously we had a fixed
  list of labels);
* Customization of the board background color.

This release is also the first one to introduce localization of the user
interface.

New languages supported: French, German, Japanese, Portuguese, and Turkish.

# v0.7.1

This release fixes the following bugs:

* Unexpected lost of the card sorting on the server side;
* Fix a bug during board creation;
* Focus the new list form if the board is empty.

# v0.7

This release starts the transition from a toy project to something useful. Along
with some security and performance improvements (for instance, opening a card
used to take a long time because it was re-generated the entire DOM whereas only
the popover was new). New features includes:

* Add and remove labels to cards;
* Assign and unassign members to cards;
* Archive cards (though restoration is not yet possible);
* Board stars;
* Markdown and emoji support in comments and card description;
* Emoji auto-completion in the text editor;
* Some keyboard shortcuts (eg `Ctrl`+`Enter` to submit a multi-line input).

We also introduced basic support for the [Sandstorm](https://sandstorm.io)
platform, and distribute a `spk` (Sandstorm PacKage) for this release and
subsequent.
