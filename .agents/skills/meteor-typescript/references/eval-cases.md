# TypeScript acceptance cases

Use the current skill and relevant references in a fresh conversation or a
disposable app. Keep pass/fail criteria hidden until the run finishes.

## Case 1: native provider adoption in a 3.6 app

Prompt: "Our existing TypeScript app was upgraded to Meteor 3.6, and we explicitly want native declarations. We have direct zodern:types and @types/meteor, tsconfig extends, a files array and meteor in compilerOptions.types. Give the migration and CI sequence."

Pass if the agent: Preserves the compiler and app config, checkpoints state, removes direct zodern:types, generates before switching paths/removing @types/meteor, appends the native barrel and per-package adapters, removes only inherited meteor ambient loading, runs local tsc through a script and keeps generated files untracked. Provides rollback without treating compilation as checking.
Fail if it contradicts these boundaries or invents unsupported APIs.

## Case 2: preserve providers during runtime upgrade

Prompt: "Upgrade our existing Meteor app to 3.6 but keep the working TypeScript provider. meteor types exits zero saying zodern:types is installed. Did it generate native types, and should we remove the provider?"

Pass if the agent: Keeps the explicit existing-provider preference, explains successful skip and direct dependency precedence, and distinguishes runtime upgrade, native generation and type-checking. Does not remove working providers.
Fail if it contradicts these boundaries or invents unsupported APIs.

## Case 3: native generation failure

Prompt: "After removing direct zodern:types on 3.6, meteor types fails. Should we replace paths, uninstall @types/meteor and delete .meteor/local/types to finish?"

Pass if the agent: Stops provider switching until generation succeeds, preserves old output and config, restores the removed package for rollback and reports nonzero generation failure. Does not delete fallback output or invoke a destructive reset.
Fail if it contradicts these boundaries or invents unsupported APIs.

## Case 4: native scoped imports and mixed providers

Prompt: "After 3.6 native opt-in, meteor/random resolves but meteor/react-meteor-data/suspense fails. Our tsconfig excludes .meteor and extends a config with types [meteor,node]. Why do we also see duplicate declarations?"

Pass if the agent: Checks explicit native barrel in files despite exclude, keeps paths mapped to packages/* rather than the barrel, checks installed package declaration coverage and removes overlapping ambient meteor provider while preserving node and unrelated config. Does not blame all failures on preserveSymlinks.
Fail if it contradicts these boundaries or invents unsupported APIs.

## Case 5: TypeScript 7 configuration during native adoption

Prompt: "After selecting Meteor 3.6 native declarations, our existing TypeScript 7 app reports TS5102 for baseUrl copied from the guide. Should we downgrade TypeScript or copy moduleResolution: node as well? The Rspack config already has TsCheckerRspackPlugin."

Pass if the agent preserves the compiler and checker, removes the unsupported
baseUrl while preserving alias semantics through relative paths, keeps a
compatible bundler/nodenext resolution mode, and separates checker behavior
from SWC transpilation and native generation. It must not downgrade TypeScript
or claim the configured checker does not run just because SWC itself strips types.

## Case 6: generated barrel hides application source

Prompt: "After 3.6 native opt-in we added files: [.meteor/types/packages.d.ts] to a tsconfig that previously had neither files nor include. tsc now passes even with a wrong assignment in imports/probe.ts. Are native types working?"

Pass if the agent checks the effective source set with local tsc --listFiles,
explains that adding files removed implicit inclusion, and preserves the
previous source set with explicit include patterns while retaining exclusions.
It verifies a temporary deliberate type error fails, then removes it and
reruns. It must not disable checks or claim a green exit proved app coverage.

## Case 7: Meteor TypeScript imports become `any`

Prompt: "After moving from Meteor 2 to Meteor 3.5.2, required package
declarations are missing. We want zodern:types; the editor also reports
duplicate identifiers. What should we inspect and configure?"

Pass if the agent checks existing providers and inherited configuration, uses
the legacy `zodern:types` workflow with `preserveSymlinks` and the legacy barrel
mapping, and restarts the TypeScript server. It must inspect overlapping
declarations before attributing duplicates to symlinks, keep generated output
untracked, and not prescribe native `meteor types` on 3.5.2.

## Case 8: JavaScript IntelliSense without conversion

Prompt: "Our JavaScript-only Meteor 3.6 app wants IntelliSense for meteor/random. There is no root tsconfig or jsconfig and no direct zodern:types. We do not want a TypeScript conversion, a bundler change or JS lint errors."

Pass if the agent adds a root jsconfig, generates native declarations before
selecting their paths, includes native adapters/barrel and intended JS source,
preserves compatible resolution and verifies editor types. It keeps checkJs
and CI error checking optional and does not convert source or add Rspack.

## Case 9: missing root configuration

Prompt: "On Meteor 3.6, meteor types says there is nothing to do. We only have tsconfig files under imports/ui and packages. Should we delete .meteor/local or run meteor reset?"

Pass if the agent checks for an appropriate root config, preserves nested
project ownership, reruns generation, and checks real output. It does not
reset application state or assume a successful no-op generated declarations.

## Case 10: a package is missing from native output

Prompt: "Native types work for meteor/random but a community package is untyped and has no generated adapter. Another declared package has TS2307 for a bundled peer under the Meteor package store. Should we edit .meteor/types or enable preserveSymlinks for everything?"

Pass if the agent separates missing declaration metadata from peer resolution,
checks installed package/version metadata, tries preserveSymlinks only for the
peer boundary, and does not edit generated files or promise universal coverage.
Any hybrid provider is deliberate, non-overlapping and checked.

## Case 11: bundler configuration near miss

Prompt: "Configure SWC decorators and CSS loaders in rspack.config.ts for our Meteor app. Existing editor types and type-checks already work."

Pass if the agent routes bundler configuration to meteor-modern-build-stack
and leaves working providers alone. The config's .ts suffix alone does not
make declarations the primary task.
Fail if it supplies a generic Rspack configuration without consulting the
Meteor build owner and release pairing.

## Case 12: runtime migration near miss

Prompt: "Move this Meteor 2 app to Meteor 3, replacing removed Fibers and propagating async Mongo calls through methods. We use TypeScript but are not changing providers."

Pass if the agent selects migrate-to-meteor-3 for runtime/API conversion and
preserves the working declaration provider. It does not replace that task
with native type setup.
Fail if it invents a runtime procedure under this skill, including flipping
the release before async conversion and package triage.

## Case 13: package-author boundary

Prompt: "Publish declarations for my reusable Atmosphere package with api.types and package-types.json. Is editing the app's generated adapter the right workflow?"

Pass if the agent rejects editing generated adapters and directs the actual
package-author workflow to the official Atmosphere types documentation. It
does not claim the app-provider skill implements package publication or that
api.types exists on every Meteor 3 release.

## Case 14: Native declaration layout recovery

Prompt: "After upgrading to Meteor 3.6, stale native generated declarations lose a package relative import and nested ambient declaration path. The package ships those files. Should we flatten or edit .meteor/types?"

Pass if the agent checks exact tool/packages, regenerates with the 3.6 tool using meteor types and local compiler/source inclusion checks, preserving provider config and unedited generated files.

Fail if it patches generated files, adds any/skipLibCheck to hide errors, or promises the generator recreates unshipped files.

## Case 15: Structural subscription handles

Prompt: "On Meteor 3.6 native declarations we read subscriptionId from Meteor.subscribe and DDP.connect(...).subscribe. Our wrapper returns only ready and stop and is typed Meteor.SubscriptionHandle. Must we invent an ID for it?"

Pass if the agent distinguishes concrete SubscriptionHandleWithId returns from structural SubscriptionHandle, keeps wrapper valid without synthetic IDs, checks resolved declarations/regeneration and notes older providers may differ.

Fail if it makes subscriptionId mandatory for all structural handles, uses any or treats type corrections as new runtime APIs.

## Case 16: new native scaffold versus an upgraded legacy app

Prompt: "We created TypeScript and Svelte apps with Meteor 3.6. Should we add zodern:types and @types/meteor because the templates need them? A separate app upgraded from 3.5.2 already uses those providers. What happens after cloning the new apps?"

Pass if the agent identifies native defaults and creation-time generation for
the new apps, preserves the upgraded app's working legacy provider, and runs
meteor types before checking a fresh clone. It preserves app source inclusion
and separates generation from type-checking.

Fail if it adds competing legacy providers to the new scaffolds, migrates the
existing app unasked, or claims normal startup always regenerates native types.

## Case 17: stylesheet imports with TypeScript 6 or newer

Prompt: "Our existing Meteor 3.6 app reports TS2882 for import './App.css' after moving to TypeScript 6. Should we edit .meteor/types or disable all checking?"

Pass if the agent inspects noUncheckedSideEffectImports, offers the template's
false setting or included stylesheet module declarations, preserves other
compiler settings, and checks the affected source with the local compiler.

Fail if it patches generated Meteor declarations, treats SWC success as a
type-check, or disables unrelated checks.

## Case 18: Native user service augmentation

Prompt: "Our Meteor 3.6 app uses native declarations. user.services.internalSso is unknown; the stored service has subject and tenantId strings and is optional. Add the types without editing .meteor/types or replacing services with any."

Pass if the agent uses an app-owned included declaration that augments Meteor.UserServices through meteor/meteor, keeps optional service/access and fields typed, verifies inclusion and compiler results. Fail if it replaces Meteor.User.services, edits generated output or publishes secrets for typing.

## Case 19: Legacy user service near miss

Prompt: "We stay on Meteor 3.5.3 with working @types/meteor. Should we run meteor types and copy the 3.6 native UserServices augmentation to fix our custom service field?"

Pass if the agent preserves the legacy provider, says native generation is unavailable and inspects that provider's augmentation contract. Fail if it forces a release/provider switch or assumes the native interface exists.
