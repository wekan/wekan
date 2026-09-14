# Community case studies

Real-world Meteor 2.x to 3.x migration write-ups. Skim these to calibrate
effort, anticipate edge cases, and cross-check the patterns documented in
this skill's other references. Each entry notes which failure modes it
covers and which references in this skill expand on them.

## Production Blaze app on Meteor 3.4 with Rspack

[Migrating a Production Blaze App from Meteor 2 to 3.4 with Rspack](https://blog.galaxycloud.app/meteorjs-2-to-3-blaze-migration-rspack/)
on the Galaxy blog.

Covers: incremental migration into a fresh Meteor 3 project, local packages
first, the Iron Router controller silent-failure trap, implicit-global
sweep with a grep recipe, lost reactivity inside async Blaze helpers,
publication cursor internals (`_cursorDescription`), iterators with
`await`, and per-package replacement strategy. The author also reports
roughly halved bundle size after the Rspack switch.

Maps to: `module-system.md`, `client-reactivity.md`, `publications.md`,
`js-iterators.md`, `package-triage.md`.

## Solo developer migration over 18 months

[Migrating to Meteor 3: a solo developer story](https://dev.to/meteor/migrating-to-meteor-3-a-solo-developer-story-1nek)
on the Meteor publication on dev.to.

Covers: a phased two-stage plan (pre-upgrade async sweep plus unit-test
harness, then post-upgrade dependency reinstall and integration tests),
isomorphic-code segregation patterns (server-only vs client-only helpers),
auto-generated test seeding from schema metadata, package fork inventory,
and the Tracker reactivity-after-`await` pattern using
`Tracker.withComputation`. Useful as a worked example of test-first
migration strategy.

Maps to: `async-rewrites.md`, `client-reactivity.md`, `package-triage.md`.

## Gradual upgrade strategy and dependency triage

[Gradually upgrading a Meteor.js project to 3.0](https://dev.to/meteor/gradually-upgrading-a-meteorjs-project-to-30-5aj0)
on the Meteor publication on dev.to.

Covers: an explicit generic strategy (branch hygiene, prepare project
structure, update on 2.x first, then per-package triage), the
clone-into-`lib`-and-link-into-`packages` workflow, `api.versionsFrom`
dual-version pinning, and the multi-version `api.use('mongo@1.16.0 || 2.0.0')`
syntax.

Maps to: `package-triage.md` (the most directly relevant), plus the
strategy phases in the top-level `SKILL.md`.

## Large-team migration over a year

[The Meteor 3.0 Migration: A Space Exploration Mission](https://dev.to/meteor/the-meteor-30-migration-a-space-exploration-mission-3gb5)
on the Meteor publication on dev.to.

Covers: ecosystem-wide migration coordination (which packages had to ship
3.x releases before app code could move), keeping critical cornerstone
packages on a working version even if it means temporarily disabling
features, the value of a robust test suite when introducing many small
PRs in sequence, and a deployment-time MINISAT memory error that surfaces
when a large app tries to run `meteor update --release=3` straight from
2.x. Reinforces the rule: do not flip the version flag first.

Maps to: `package-triage.md`, the strategy section of `SKILL.md`.

## How to use these

Read in this order when planning a migration:

1. Start with the gradual-upgrade article for the high-level strategy.
2. Read the solo-developer story for the test-first angle.
3. Read the production-Blaze article for the implicit-global, Iron Router,
   and Rspack details.
4. Read the space-mission article last to set expectations for
   ecosystem-level coordination on large apps.
