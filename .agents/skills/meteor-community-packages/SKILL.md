---
name: meteor-community-packages
description: >
  Use when choosing, evaluating, adopting, configuring, or debugging a package
  from Meteor's documented community catalog, or moving from a community
  package to a promoted core package such as roles. Triggers on community
  package recommendations, Atmosphere vs npm selection, Packosphere maintenance
  checks, jam:* helpers, Meteor.publish.once, Meteor.publish.stream, meteor-rpc,
  Wormhole, cluster, mail-preview, meteor add --search, or adopting a Git-hosted
  Atmosphere package. Use this skill when the user asks which
  maintained package fits or how its documented integration works. Route
  Meteor 2-to-3 package failures to migrate-to-meteor-3 and underlying core API
  design to its owning skill.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: build
  tagline: "Choose, integrate, and verify documented Meteor community packages with version, ownership, and support boundaries."
  docs_synced_at: "2026-09-11"
license: MIT
---

# Meteor community packages

Use Meteor's community package pages as a curated discovery catalog. A listing
does not make a package part of Meteor core, transfer its maintenance to the
Meteor organization, or guarantee compatibility with every Meteor 3 release.
Select a package only after checking its ownership, current release, supported
Meteor range, and changes to application behavior.

This skill owns package discovery, comparison, first adoption, and the
package-specific integration documented in Meteor core. It does not replace
the core skill for methods, publications, Mongo, accounts, security, testing,
builds, or deployment.

## Decision flow

1. Define the missing capability and the behavior that must remain unchanged.
   Distinguish a new adoption from a package that stopped resolving during a
   Meteor upgrade. Route the latter to `migrate-to-meteor-3`.
2. Inspect `.meteor/release`, `.meteor/packages`, `.meteor/versions`,
   `package.json`, and the npm lockfile. Package APIs follow the resolved
   package version, not only the Meteor release.
3. Read [`references/package-catalog.md`](references/package-catalog.md) when
   the request matches the documented catalog or a promoted package. Open only
   the selected package's local guide and read its baseline, selection rules,
   and required checks before responding. Then consult its linked upstream
   repository for APIs or versions beyond Meteor's maintained guidance.
4. Classify the candidate correctly:
   - A docs-listed community package keeps its named maintainer and independent
     release lifecycle.
   - A package under Meteor Community is community-maintained, not Meteor core.
   - A promoted core package, such as `roles` in Meteor 3.1+, uses the core
     package name and Meteor documentation.
5. Compare behavior, not feature labels. Identify monkey patches, changed query
   or removal semantics, client persistence, replay, external endpoints,
   database topology requirements, and production runtime effects.
6. Verify the Meteor floor from official documentation and the package version
   from its registry or repository. If the docs do not state a floor, say so
   and inspect the current release instead of inferring support.
7. Install through the package's documented ecosystem. Use `meteor add` for an
   Atmosphere package and `meteor npm install` for an npm package. Do not invent
   a version constraint. After installation, confirm the resolved version in
   `.meteor/versions` or the npm lockfile.
   For Meteor 3.6-beta.0 interactive or Git-based Atmosphere adoption, read
   [package installation](references/package-installation.md). Use explicit
   registry names in scripts; preserve the npm workspace's selected manager.
8. Apply every relevant required check from the selected package guide. Do not
   stop after asking for a project path. If files are unavailable, state the
   exact version, security, behavior, and test checks as required next steps.
   For an option not covered there, verify the resolved version against the
   upstream repository instead of extrapolating from another release.
9. Add the smallest representative integration and test its package-specific
   behavior plus the underlying Meteor invariants. Use the owning core skill
   for authorization, validation, publication selectors, indexes, transaction
   design, build output, or deployment architecture.

## Ecosystem choice

Use an Atmosphere package when the capability depends on Meteor packages,
client/server packaging, Meteor build plugins, package globals, or the Meteor
constraint solver. Use npm for general JavaScript libraries and packages
designed for the npm ecosystem. A Meteor app can use both.

Atmosphere and Packosphere expose package metadata. Packosphere's maintenance
signals help with triage, but they do not replace checking the source repository,
release history, open compatibility issues, license, and resolved version.

Useful inspection commands:

```bash
meteor --version
meteor show <atmosphere-package>
meteor list
meteor npm view <npm-package> version
```

## Adoption checks

For every selected package, the response **MUST** report:

- Why it fits better than the documented alternatives.
- Who maintains it and whether it is community-maintained or core.
- How to verify the current upstream release and resolved package version,
  plus the documented Meteor boundary.
- Which application semantics it changes.
- Which data, endpoints, or server capabilities it exposes.
- How to remove or roll back the integration.
- The concrete focused tests from the selected guide that prove the intended
  behavior and its security boundary.

Treat wrappers as extensions, not replacements for Meteor's security model.
Method and publication helpers still require server authorization and argument
validation. Client persistence still requires least-privilege data selection.
External method bridges require an explicit exposure and authentication review.
For Wormhole or another external method bridge, the response **MUST** include a
pre-exposure checklist covering method inventory, existing authentication and
authorization, input validation, rate limits, side effects, returned fields,
credential tests, and proof that unexposed methods remain unreachable.

## Routing

| Request | Owning skill |
|---|---|
| Package does not resolve, build, or support Meteor 3 during an upgrade | `migrate-to-meteor-3` |
| Method implementation, validation, optimistic UI, or rate limiting | `meteor-methods` |
| Publication design, authorization, or reactive data semantics | `meteor-pubsub` |
| Collection selectors, indexes, Change Streams, or Mongo behavior | `meteor-mongo-minimongo` |
| Accounts and authorization design, including how roles protect server actions | `meteor-accounts` and `meteor-security` |
| Cluster topology or production rollout | `meteor-deployment` |
| Publishing or maintaining an Atmosphere package | Package authoring workflow, not this skill |

## Anti-patterns

- Recommend a package only because it appears in Meteor documentation.
- Treat Meteor Community ownership as Meteor core support.
- Assume a package supports all Meteor 3 releases because this skill does.
- Copy the latest API without checking the installed package version.
- Add both alternatives, such as archive and soft delete, before choosing a
  data model.
- Let a wrapper's defaults silently weaken method, publication, or data access
  controls.
- Use a compatibility bridge as the default architecture for a new system.

## See also

- [`references/package-catalog.md`](references/package-catalog.md)
- [`references/eval-cases.md`](references/eval-cases.md)
