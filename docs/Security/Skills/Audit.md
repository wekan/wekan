# Meteor skills audit

Updated: **2026-09-14**. Source baseline: **fe52b7dac**.
Status: initial source review completed; the improvements below remain open.
Follow-up **2026-09-14**, `c1246d720`: saved mirror alerts reviewed and
command/host validation hardened; see [WeKanSec20.md](../WeKanSec20.md).
All 25 focused mirror test entries pass. This does not resolve the four
application findings below.
This is a bounded review, not a complete security or runtime certification.

Read all 15 installed `meteor/agent-skills` skills, pinned by
`skills-lock.json` to `v1.1.0-beta.0`, and applied relevant guidance to source.
References: [Meteor skills documentation](https://docs.meteor.com/ai/agent-skills)
and [Meteor 3.6 beta announcement](https://forums.meteor.com/t/meteor-3-6-beta-0-rspack-2-x-pnpm-monorepos-installable-pwas-and-a-friendlier-cli-posting-checklist/64773).

## Review coverage

| Skills | Progress |
| --- | --- |
| Security, accounts, methods, pub/sub | Inspected selected user publications, search methods, account configuration, rate limits and browser policy. Full endpoint inventory remains open. |
| Meteor 3 migration, Mongo/Minimongo, Blaze | Traced selected async operations, permissions, popup events and lifecycle cleanup. Remaining call sites need review. |
| Rspack migration, modern build stack | Checked release/package pairing, entries, CSS loaders and development cache policy. Clean build verification remains open for this audit. |
| Debugging, testing | Ran focused existing regressions; distinguished source checks from live browser/DDP tests. |
| Deployment, CLI installation, native, community packages | Reviewed configuration and applicability. No installation, deployment, package adoption or native SDK validation performed. Only server/browser platforms are declared. |

## Confirmed findings

| Priority | Finding and evidence | Recommended repair and verification |
| --- | --- | --- |
| High | Search rate limits share buckets across callers: [`user-search`](../../../server/publications/users.js) and [`searchUsers`](../../../server/models/users.js) match only type/name. | Introduce caller-specific buckets, retaining a separate global budget if intentional. Verify one exhausted caller cannot block another. |
| High | `user-search` accepts an empty string and has no result limit. Its escaped regex then matches all usernames/full names; [`ReactiveCache`](../../../imports/reactiveCache.js) adds no implicit limit. Public identity fields are projected; this is a resource-bound issue, not evidence of password exposure. | Bound input length and result count. Test empty/oversized input, authorization and result caps through DDP. The separate `searchUsers` method already has a minimum query length and five-result cap. |
| High | [`server/policy.js`](../../../server/policy.js) has its import and all BrowserPolicy calls commented out. `BROWSER_POLICY_ENABLED`/`TRUSTED_URL` therefore do not activate that module's intended app policy. | Restore explicit, tested CSP/framing configuration. Account for Rspack inline styles and embedding requirements; inspect actual response headers. File-response protections already exist, and proxy policy was not inspected. |
| Medium | [`disambiguateMultiMemberPopup`](../../../client/components/sidebar/sidebarFilters.js) dispatches Unassign to `assignMember` and Assign to `unassignMember`. `mutateSelectedCards` invokes those methods directly. | Swap the two dispatches. Test both actions on mixed selected cards, with a browser regression for the translated buttons. |

## Candidates requiring contract review

| Area | Evidence and next check |
| --- | --- |
| Publication audience and bounds | `user-authenticationMethod` requires login but accepts an arbitrary user identifier and publishes authentication method, teams and organizations. Confirm who needs this metadata before restricting it. `user-miniprofile` checks `Array`, not `[String]`, and lacks an array cap. [`lockoutSettings`](../../../server/publications/lockoutSettings.js) is public without projection; determine which configuration is required before login. No secret disclosure is established by this review. |
| Collection mutation architecture | Legacy [`allow/deny permissions`](../../../server/permissions) remain. Consider incremental guarded method migration with ownership/role regressions. Existing permission rules must remain effective during migration. |

## Safeguards already present

- `audit-argument-checks` is installed; inspected search publications deny
  unauthenticated access, escape regex input and project identity fields.
- Server accounts configure HttpOnly cookies with `clientStorage: 'none'`.
  Existing first-user CSS and challenge-only 2FA regressions pass.
- Meteor 3.6 beta uses the corresponding beta Rspack integration and Rspack 2.
  Client CSS injection overrides native CSS typing; persistent dev caching is
  disabled. Selected async export mappings are awaited with `Promise.all`.
- Sidebar document handlers and delayed initialization have teardown cleanup.

## Verification and remaining work

**Passed:** seven Node test entries across `methodArgumentChecks`,
`publicationArgumentGuard`, `searchPaginationAuthorization`,
`firstUserAuthLayout`, `twoFactorLoginState` and `devOverlayRuntimeErrors`.
Log: `.tools/tmp/skills-audit/targeted-tests.txt`. These are focused offline
source/VM/compiler checks; they do not verify the newly identified gaps.

**Not run for this audit:** full EVERYTHING tests, clean Meteor builds, live
DDP/database authorization probes, browser UI tests or native builds.
No application code or dependencies changed in this report-only pass.

Next: repair confirmed findings with positive/negative/UI coverage, review
publication audiences, then expand endpoint and async-call-site coverage.
All proposed runtime changes must retain offline on-premise operation.

## Build follow-up — 2026-09-14

Meteor debugging and Rspack migration guidance identified an undeclared
Moment import in the assignee client graph. Commit `43adfe1a7` uses the
existing native date formatter, retaining selected-calendar rendering.
The Meteor bundle build passed on Linux arm64; focused date/view and
release-preflight regressions passed. Build log:
`.tools/log/build-dev-bundle/2026-09-14/03-54-13/dev.txt`.
Live browser tests and builds on other operating systems were not run.
The security findings above remain open.
