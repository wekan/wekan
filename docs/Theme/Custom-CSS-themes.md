Here is how to build wekan code and add your new theme with code changes and send as pull request:
https://github.com/wekan/wekan/wiki/Emoji#how-you-could-add-another-plugin

Here is how some have sent previous themes to Wekan, what code changes they made:
https://github.com/wekan/wekan/pulls?q=is%3Apr+is%3Aclosed+theme

After you have sent new theme as pull request, you see it as open pull request:
https://github.com/wekan/wekan/pulls?q=is%3Apr+theme+is%3Aopen

And when I have merged it to Wekan, that theme will be in next Wekan release, listed at ChangeLog:
https://github.com/wekan/wekan/blob/main/CHANGELOG.md

At Wekan Snap page you see with webpage reload, when new version has been released:
https://snapcraft.io/wekan

Wekan Snap version gets updates automatically soon after new Wekan version has been released, or you can update manually immediately:
https://github.com/wekan/wekan-snap/wiki/Automatic-update-schedule

***

Also see: [Dark Mode](Dark-Mode)

All Wekan themes are directly integrated to Wekan. You can add pull request to master branch to add custom theme, you can see from [from this commit](https://github.com/wekan/wekan/commit/34b2168d0dda253dedabbee47031873efa4ae446) required new color/theme name and changes to these files 3 files listed below. In that commit is also changes to other files, you don't need to change those files.
  - `wekan/client/components/boards/boardColors.styl`
  - `wekan/models/boards.js`
  - `wekan/server/migrations.js`

Alternatives for sending new theme as pull request:
- If you would like to have some new theme, please add screenshot mockup to [new Wekan issue](https://github.com/wekan/wekan/issues).
- If possible, you can also try to create those CSS changes with [Stylish browser extension](https://userstyles.org/) and add those to new issue too.

There are currently board color modes/themes, and these full themes:
- Dark: modified from below by @lonix1 and more changes by xet7
- Relax: Light green background that helps Wekan users to relax in company of Wekan contributor that sent theme CSS.

Upcoming full themes that will be added by xet7:
- Corteza, that will be mostly-white theme, although different than example of white theme below
- Octopus, that will have different colors and some Wekan features hidden

![dark wekan](https://wekan.github.io/wekan-dark-mode.png)

## Dark theme

[by @lonix1](https://github.com/wekan/wekan/issues/1149), could look a little like this screenshot mockup:

<!--
![dark wekan](https://user-images.githubusercontent.com/11541071/28684178-574c0852-72fb-11e7-9c39-d11281863c3a.png)
-->

lonix1 created some css overrides with Stylish. It's not complete but I'm happy with it. I work in swimlanes mode, so that is what I changed (not list mode or calendar mode).

Colors:
- adds dark mode, I used vscode as a reference

Other:
- hides various useless icons and things
- hides  "add card", "add swimlane", "add list" links, until hovered (I find these very "noisy")

```css
/* HIDE PERMANENTLY -------------------------------------------------- */

/* various */
.wekan-logo,
.close-card-details { display:none; }

/* header text */
#header-quick-access >ul >li:nth-child(1) >a { font-size:0; }
#header-quick-access >ul >li:nth-child(1) >a >.fa-home{ font-size:12px; margin:0; }

/* popup menu titles (boards, swimlanes, lists, cards, labels) */
.pop-over >.header { display:none; }

/* OPTIONAL 
   card fields: received, start, due, end, members, requested, assigned
   I rarely use these... uncomment if you want to hide them */
/*
.card-details-item.card-details-item-received,
.card-details-item.card-details-item-start,
.card-details-item.card-details-item-due,
.card-details-item.card-details-item-end,
.card-details-item.card-details-item-members,
.card-details-item.card-details-item-name { display:none; }
.card-details-items:empty { display:none; }
*/

/* HIDE UNTIL HOVER -------------------------------------------------- */

/* header "+" button */
#header-quick-access .fa-plus { display:none; }
#header-quick-access:hover .fa-plus { display:inherit; }

/* "add card" links (use visibility rather than display so items don't jump) */
                    .open-minicard-composer { visibility:hidden; }
.list.js-list:hover .open-minicard-composer { visibility:visible; }
                    .list-header-menu { visibility:hidden; }
.list.js-list:hover .list-header-menu { visibility:visible; }

/* "add list/swimlane" links (use visibility rather than display so items don't jump) */
.list.js-list-composer       >.list-header { visibility:hidden; }
.list.js-list-composer:hover >.list-header { visibility:visible; }

/* DARK MODE -------------------------------------------------- */

/* headers */
#header-quick-access, #header { background-color:rgba(0,0,0,.75) !important; }
#header .board-header-btn:hover { background-color:rgba(255,255,255,0.3) !important; }

/* backgrounds: swimlanes, lists */
.swimlane { background-color:rgba(0,0,0,1); }
.swimlane >.swimlane-header-wrap,
.swimlane >.list.js-list,
.swimlane >.list-composer.js-list-composer { background-color:rgba(0,0,0,.9); }

/* foregrounds: swimlanes, lists */
.list >.list-header, .swimlane-header { color:rgba(255,255,255,.7); }

/* minicards */
.minicard { background-color:rgba(255,255,255,.4); }
.minicard-wrapper.is-selected .minicard,
.minicard:hover,
.minicard-composer.js-composer,
.open-minicard-composer:hover { background-color:rgba(255,255,255,.8) !important; color:#000; }
.minicard, .minicard .badge { color:#fff; }
.minicard:hover .badge, .minicard-wrapper.is-selected .badge { color:#000; }

/* cards */
.card-details,
.card-details .card-details-header { background-color:#ccc; }

/* sidebar */
.sidebar-tongue, .sidebar { background-color:#666 !important; }
.sidebar-content h3, .sidebar-content .activity-desc { color:rgba(255,255,255,.7) !important; }
```

If anyone improves on this, please share here.

## White theme

[pravdomil](https://github.com/wekan/wekan/issues/1690) has created small script for tampermonkey to redesign wekan board.

![image](https://user-images.githubusercontent.com/2387356/41285077-7c5b1c64-6e3b-11e8-91b9-503ffb39eb4a.png)

script for tampermonkey
```js
// ==UserScript==
// @name         Kanban
// @namespace    https://pravdomil.com/
// @version      0.1
// @match        https://wekan.indie.host/*
// @grant        none
// ==/UserScript==

;(function() {
  const el = document.createElement("style")
  // language=CSS
  el.textContent = `
/* white background */
body { background-color: white; }

/* header bar next to top bar */
#header #header-main-bar {
    position: absolute;
    right: 70px;
    left: 300px;
    top: -3px;
    padding: 0;
    height: calc(28px + 3px);
}

/* swimlane white background, no borders, fix ellipsis */
.swimlane { background-color: white; }
.swimlane-header-wrap { border: 0 !important; }
.swimlane-header { text-overflow: initial !important; }

/* column header only for first row */
.swimlane .list-header { margin: 4px 12px 4px; }
.swimlane .list-header-name { display: none; }
div:nth-child(1 of .swimlane) .list-header { margin: 20px 12px 4px; }
div:nth-child(1 of .swimlane) .list-header-name { display: inline; }

/* cells no borders, fix height, less padding, no add new card */
.list { border: 0; background-color: white; flex: 300px 0 0; }
.list .list-body { height: 160px; padding: 0 2px; }
.list .open-minicard-composer { display: none; }
.list .open-list-composer { opacity: 0; transition: opacity .2s; }
.list .open-list-composer:hover { opacity: 1; }

/* card style */
.minicard-wrapper { margin-bottom: 2px !important; }
.minicard { box-shadow: 0 0 16px rgba(0,0,0,0.15) inset; }

/* card style for first and last column */
.swimlane .list:nth-child(2) .minicard { opacity: .5 !important; }
.swimlane .list:nth-last-child(2) .minicard { opacity: .1 !important; }

/* card details always center, menu items tweaks */
.card-details {
    position: absolute;
    z-index: 10000 !important;
    top: 0;
    bottom: 0;
    left: calc(50% - 510px / 2);
}
.pop-over-list .js-labels { display: none }
.pop-over-list .js-move-card-to-top { display: none }
.pop-over-list .js-move-card-to-bottom { display: none }
.pop-over-list .js-archive { color: darkred }

/* not needed */
.wekan-logo, .js-member, .attachments-galery { display: none; }

`

  document.body.appendChild(el)
})()

```