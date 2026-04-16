# Older way to make releases, does not work.

***


## Triggering git import process manually

[Info source](https://github.com/wekan/wekan-snap/issues/2#issuecomment-311324364)

To make build quicker, it's possible to trigger git import process manually in launchpad, so you don't need to wait for next sync.

https://code.launchpad.net/~wekan-team/wekan/+git/wekan



## Launchpad project

[Info source](https://github.com/wekan/wekan-snap/pull/3#issuecomment-310764751)

kubiko created launchpad wekan project and wekan team where xet7 is admin in and contributor. xet7 can feel free to add other people on the list.

Wekan project has wekan-snap repo mirrored from github one:

https://code.launchpad.net/~wekan-team/wekan/+git/wekan-snap

Sync happens every ~5 hours

There is snap package enabled for this repo which has automatic build upon change in repo enabled, you can see there also build queue:

https://code.launchpad.net/~wekan-team/+snap/wekan-devel

It has also auto push to store enabled, so once built snap is uploaded to candidate channel.

Once you snap is uploaded you should see it here:

https://dashboard.snapcraft.io/dev/snaps/7867

kubiko got email from launchpad account and added xet7 as collaborator list, so xet7 can control promotion to stable channel once candidate version is tested. There xet7 can see there some other interesting stats about snap adoption.

For the future once xet7 makes change in wekan-snap build and upload should happen automatically, no need for additional interaction.

Next thing for kubiko would be to move people from wekan-ondra to wekan, not quite sure how to announce this though….. From stats kubiko did see there are ~320 downloads/installs of version 0.23.

kubiko also created pull request to wekan repo, which enabled continuous integration from master, typically this would be pushing builds to edge channel, from where xet7 can do testing, or more adventures users can use edge channel to track Wekan master branch….

## Snapcraft build support from source

[Info source](https://github.com/wekan/wekan/pull/1091)

Adding snapcraft build support. This can be used together with launchpad build system for continuous integration.

Intention is to push snaps build from devel branch to edge channel, which can be installed by calling:

```
$ snap install -edge wekan
```

device will keep automatically updating to revisions as they are released to edge channel

@xet7 Snap build job is now created, you can see it here:

https://code.launchpad.net/~wekan-team/+snap/wekan-devel

It's building from devel branch, fee free to change that if you prefer it to build from different branch.
Same as for release apply here, auto builds on change, only resulting snap is pushed to edge channel instead.
Also check please version name if you want it to be something different than:

```
0.26-SNAPSHOT
```

## Old links, not in use

( Old trigger git import https://code.launchpad.net/~wekan-team/wekan/+git/wekan-snap )

( Old build queue, not in use: https://code.launchpad.net/~wekan-team/+snap/wekan-release )

( Old build queue, not in use: https://code.launchpad.net/~ondrak/+snap/wekan-devel )