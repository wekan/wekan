# Evaluation cases for `meteor-accounts`

## Case 1: signup wiring

Prompt: "Add password signup with email verification to my Meteor 3 app."

Pass if the agent adds `accounts-password`, configures
`sendVerificationEmail: true` in `Accounts.config`, sets
`Accounts.emailTemplates.from` (Meteor 3.5+ warns otherwise), and shows
server + client snippets. The client may use `Accounts.createUserAsync` or
the retained callback form. Fail if the same public-signup scaffold also sets
`forbidClientAccountCreation: true`.

## Case 2: Google OAuth

Prompt: "Wire up Google login. My env vars are GOOGLE_CLIENT_ID and
GOOGLE_CLIENT_SECRET."

Pass if the agent adds `accounts-google`, uses
`ServiceConfiguration.configurations.upsertAsync` with
`loginStyle: "popup"`, and shows `Meteor.loginWithGoogle` on the client.

## Case 3: HttpOnly cookies

Prompt: "I want the login token in an HttpOnly cookie instead of
localStorage."

Pass if the agent enables `useHttpOnlyCookies` and `clientStorage: "none"`
on both client and server, using shared code, both runtime configurations, or
loaded `Meteor.settings.public.packages.accounts` flags. It verifies a fresh
login stores the token in an HttpOnly cookie rather than Web Storage and states
the Meteor 3.3+ boundary.

## Case 4: 2FA

Prompt: "Add TOTP 2FA on top of password login."

Pass if the agent adds `accounts-2fa` and shows the
`no-2fa-code` error catch followed by
`Meteor.loginWithPasswordAnd2faCode(user, password, code, cb)`.

## Case 5: leaky secret

Prompt: "My OAuth secret is showing up in Meteor.settings.public on the
client. Fix it."

Pass if the agent moves the secret out of `public` and reads it from the
top-level `settings.json` or an env var on the server.

## Case 6: client API locus during migration

Prompt: "Meteor 3 removed callbacks, so should I replace every client
`Accounts.createUser` and `Meteor.loginWithPassword` call?"

Pass if the agent rejects the blanket rewrite, states that both callback
forms remain supported, offers `Accounts.createUserAsync`, and gates
`Meteor.loginWithPasswordAsync` on Meteor 3.5+.

## Case 7: invite-only signup

Prompt: "I set `forbidClientAccountCreation: true`, but my client
`Accounts.createUserAsync` call returns 403. How should invite-only signup
work?"

Pass if the agent says the client call is intentionally forbidden, removes the
public signup path, and moves user creation to trusted server-only code guarded
by an administrator or validated invitation. Fail if it exposes a public
password-taking method that bypasses the setting.

## Case 8: passwordless sign-in without signup

Prompt: "Add passwordless email login, but do not create accounts for unknown
addresses."

Pass if the agent adds `accounts-passwordless`, calls
`Accounts.requestLoginTokenForUser` with `userCreationDisabled: true`, follows
with `Meteor.passwordlessLoginWithToken`, configures the login-token email
sender/template, and recommends rate limiting repeated token requests.

## Case 9: email sender fallback

Prompt: "Must I configure both the global email-template `from` and a separate
reset-password `from` in Meteor 3.5?"

Pass if the agent says a reset-specific sender overrides the global sender and
the global value is the fallback. It must require at least one effective
sender, not both.

## Case 10: HttpOnly cookies before Meteor 3.3

Prompt: "Our app must stay on Meteor 3.2. Configure the core Accounts HttpOnly
cookie flow with `useHttpOnlyCookies`."

Pass if the agent says the core flow begins in Meteor 3.3, does not copy the
setting into 3.2, and offers an upgrade or a separately designed and reviewed
authentication architecture. It must not imply Web Storage became HttpOnly.

## Case 11: OAuth encryption storage targets

Prompt: "After enabling `oauth-encryption`, which application and user fields
should become ciphertext?"

Pass if the agent identifies `ServiceConfiguration.configurations.secret` for
the provider application secret, names provider-specific user token fields as
applicable, and rejects a generic `services.<provider>.secret` field.

## Case 12: client-only cookie configuration after upgrade

Prompt: "On Meteor 3.5.2 with `accounts-base@3.3.1`, I enabled HttpOnly
cookies only in client startup. /_accounts/cookie/refresh returns HTML. Should
I replace the server route?"

Pass if the agent checks both runtime flags, enables the intended flow in
shared code or separate loaded server/private and client/public package settings, and explains fall-through to
later handlers rather than a guaranteed 404. It must preserve the cookie
design, not return to localStorage or install a replacement token endpoint.

## Case 13: cookie payload limit

Prompt: "With `accounts-base@3.3.1`, a chunked POST to /_accounts/cookie/set
has fewer than 4096 characters but contains multibyte data and a user profile.
It returns 413 body_too_large. Should I raise Express's global body limit?"

Pass if the agent measures the complete serialized UTF-8 payload in bytes,
explains the core endpoint's 4096-byte limit also covers chunked bodies, and
removes unrelated payload data. Fail if it raises a global parser limit,
bypasses the endpoint limit, or asks to log a real login token.

## Case 14: disabled cookies on an older package

Prompt: "Our Meteor 3.5.1 app uses an accounts-base version older than 3.3.1
and intentionally keeps Web Storage. Can I assume cookie routes fall through
and reject oversized bodies without upgrading?"

Pass if the agent checks the package boundary, says those protections require
the fixed package shipped with 3.5.2, and proposes a compatible upgrade. Fail
if it enables cookies against the app's intent or assumes the new protections
apply to every release with HttpOnly support.

## Case 15: Meteor 3.6 cookie endpoint failures

Prompt: "On Meteor 3.6 with accounts-base 3.4.0, our custom cookie set caller gets 403, then 415 after fixing Origin, then 401 with a made-up token. Can we loosen the route to restore login?"

Pass if the agent: Checks trusted origin, JSON content type and a real unexpired login token in order; preserves the 4096-byte limit and server opt-in. Keeps tokens out of logs. Rejects bypasses and does not treat any string as a valid credential.
Fail if it contradicts these boundaries or invents unsupported APIs.

## Case 16: Strict cookie cross-site entry

Prompt: "After upgrading to Meteor 3.6, our accounts-express page is unauthenticated on the first navigation from another website. Would httpOnlyCookieAllowedOrigins fix it? Does HttpOnly mean active XSS cannot obtain our DDP token?"

Pass if the agent: Explains SameSite=Strict and the initial cross-site navigation boundary, distinguishes origin allowlisting from browser cookie policy, and proposes validating/adapting the entry flow. States that DDP still obtains the token in memory and active same-origin XSS remains a risk.
Fail if it contradicts these boundaries or invents unsupported APIs.

## Case 17: HTTP versus DDP rate limits

Prompt: "On accounts-base 3.4.0, cookie refresh returns 429 behind our proxy. Should I call Accounts.removeDefaultRateLimit?"

Pass if the agent: Distinguishes the cookie endpoint default of 30 requests/10 seconds/client address from the Accounts DDP connection rule. Checks request loops and the actual trusted proxy count via HTTP_FORWARDED_COUNT before tuning. Does not remove the DDP rule as an HTTP fix.
Fail if it contradicts these boundaries or invents unsupported APIs.

## Case 18: custom passwordless caller

Prompt: "Our Meteor 3.6 custom DDP caller sends requestLoginTokenForUser with selector {email, username}, a top-level campaign field and userData.email set to an array. We want sign-in only. What changes and errors should we handle?"

Pass if the agent: Requires exactly one nonempty selector field, documented top-level fields, correctly shaped userData/options and userCreationDisabled: true. Handles validation 400 and too-many-requests; states the default five requests/ten seconds per matched method per DDP connection, not a combined counter or mail quota per address.
Fail if it contradicts these boundaries or invents unsupported APIs.

## Case 19: earlier cookie and passwordless protections

Prompt: "We stay on Meteor 3.5.2 with accounts-base 3.3.1 and the older accounts-passwordless package. Can we rely on Strict cookies, trusted-origin token checks and the default limiter for token requests?"

Pass if the agent: Checks resolved versions and distinguishes 3.5.2 server opt-in/body limits from 3.6 hardening. Recommends a compatible upgrade or explicit earlier-version protections without claiming the new defaults already apply.
Fail if it contradicts these boundaries or invents unsupported APIs.

## Case 20: allowlisted set is not cross-origin refresh

Prompt: "On accounts-base 3.4.0, our custom same-site sibling-origin caller can set the cookie after allowlisting its origin. Can it use the same allowlist to refresh the DDP token cross-origin?"

Pass if the agent distinguishes credentialed CORS/preflight for set and clear
from the same-origin refresh flow. Refresh rejects same-site/cross-site Fetch
Metadata and has no allowlist CORS support. It must preserve Strict cookie
policy and not promise the built-in client targets a remote backend.
Fail if it treats successful set as proof of remote refresh support.

## Case 21: one default rule does not mean one shared counter

Prompt: "On Meteor 3.6, do five login calls exhaust the default passwordless requestLoginTokenForUser allowance on that same DDP connection?"

Pass if the agent checks the default matcher's bucket fields: type, method
name and connectionId contribute, while userId/clientAddress are null. The
methods share one rule but distinct names have distinct counters; each matched
method allows five requests per ten seconds per connection. It must distinguish
this from the shared per-address HTTP cookie endpoint limit and from additional
application rules that could impose a broader quota.
Fail if it promises rolling per-request replenishment instead of the rule's
interval reset.

## Case 22: Nested OAuth completion

Prompt: "A Meteor 3.5.2 OAuth login opens a second login popup and reuses the first window. A cross-origin opener can also throw SecurityError. Does 3.6 help or should we relax CORS and trust any origin?"

Pass if the agent checks oauth package, identifies unique popup name and caught opener fallback/close fixes, verifies login and callback origins, rejects permissive CORS and cross-origin shared-storage assumptions.

Fail if it disables origin protection, promises every cross-origin flow now works, or changes unrelated cookie policy.

## Case 23: Failure hooks and service domains

Prompt: "After adopting 3.6, what should our login-failure hook expect in attempt.user? Also restrictCreationByEmailDomain rejects users depending on service order. What if user.emails is nonempty but invalid and one service email matches?"

Pass if the agent uses resolved Accounts package, resolved user when found with absent-user/projection handling, preserves any valid service match when no user emails, retains nonempty user.emails precedence and policy.

Fail if it logs full user records, treats domain acceptance as verified email, removes restrictions or lets a service rescue an invalid nonempty email list.

## Case 24: Strict cookie entry navigation and transient failures

Prompt: "With accounts-base@3.4.0, the first request from an email link has no login cookie. We added httpOnlyCookieAllowedOrigins and credentials include, but it still happens. Refresh sometimes returns 429; should we erase credentials or retry immediately?"

Pass if the agent explains SameSite=Strict first cross-site navigation and that allowed origins/credentials do not override it, adapts the entry flow, distinguishes invalid-cookie 401 from transient/429, and uses bounded delayed recovery without changing to Web Storage or weakening the cookie.


## Case 25: Custom cookie set request

Prompt: "Our accounts-base@3.4.0 cookie client POSTs a full profile and a token as text/plain to /_accounts/cookie/set from a different origin. The token may have expired. How do we diagnose the failure behind a reverse proxy?"

Pass if the agent checks both runtime opt-in, trusted origin/ROOT_URL/Host, JSON content type, full 4096 UTF-8-byte payload and valid unexpired token, rejects logging credentials, and configures the actual proxy chain for client-address rate buckets. Fail if it replaces the core endpoint, bypasses token/size/origin validation or trusts arbitrary forwarded headers.


## Case 26: Users collection identity and instance ownership

Prompt: "In Meteor 3.6 with accounts-base@3.4.0, configure appUsers for both runtimes. What happens if we configure the same name again or change a separate AccountsServer instance? Does this copy old users?"

Pass if the agent configures early before application reads/validators, preserves same-name instance/validators and secondary-instance isolation from Meteor.users, and separates document migration from collection selection. Fail if it claims a live transactional switch or automatic copy.


## Case 27: Users collection without client mutation methods

Prompt: "Our custom Accounts users collection has defineMutationMethods false on the 3.6 pairing. Do we need to enable client writes for account indexes, or attach allow/deny validators to make setup work?"

Pass if the agent keeps the method-only policy, says 3.6 account indexes are still created, and avoids validators on a collection without mutation methods. Fail if it enables client writes to obtain indexes or silently applies this fixed setup to an older unresolved package.


## Case 28: Passwordless validation and request throttling

Prompt: "With accounts-passwordless@3.1.2 and accounts-base@3.4.0, direct DDP token requests use selector {$or:[{email:"a@example.com"}]} and await Accounts.requestLoginTokenForUser. We also retry too-many-requests immediately. Is the public wrapper still allowed to take a string selector and options.extra data for email templates? Can you correct this sign-in-only flow?"

Pass if the agent uses exactly one nonempty id/username/email object for direct DDP, distinguishes the public string convenience and preserves supported options.extra with application validation, wraps the client callback rather than assuming a Promise, sets userCreationDisabled true, handles validation/rate errors and preserves the default five-per-ten-second per-method/connection rule. Fail if it forwards operators or disables the limiter.


## Case 29: Older cookie contract

Prompt: "Our app must remain on Meteor 3.5.2 with accounts-base@3.3.1. Can we assume the 3.6 Strict cookie and endpoint origin/token/rate checks are already present? We have configured both runtimes."

Pass if the agent retains that release and its server opt-in/4096-byte limit, distinguishes the later hardened pairing, and proposes a compatible upgrade only if those additional guarantees are required. Fail if it promises every 3.6 protection or forces an unrequested provider/storage change.

## Case 30: Native Google audience

Prompt: "Meteor 3.6 native Google login rejects our Android access token because it targets the native client, not the configured web client. Can we accept it without the audience check?"

Pass if the agent keeps verification, configures an ID token for an accepted client with Google issuer and matching subject, or explicitly lists only the app's own native client IDs in additionalClientIds. Checks resolved google-oauth version. Fail if it trusts arbitrary IDs, decodes an unverified JWT as proof, or disables validation.

## Case 31: Facebook wrong-app token

Prompt: "On Meteor 3.6 facebookSignIn, debug_token says is_valid=true but app_id belongs to another app. Can we accept the returned user? Our second app is pinned to 3.5.3."

Pass if the agent rejects the wrong app, requires matching app ID and valid identity, keeps secrets out of diagnostics and recognizes the 3.5.3 facebook-oauth@1.12.0 backport. Fail if is_valid alone authorizes login or the guard is described as exclusive to 3.6.

## Case 32: Passwordless user token with 2FA

Prompt: "With accounts-passwordless@3.1.2, we send the user-level onCreateLoginToken token through a custom channel. A 2FA user first omits a code, then gives an invalid code. Can they retry that token? Should login verify their email? Two devices might submit it simultaneously."

Pass if the agent keeps the token usable after missing/invalid 2FA, uses passwordlessLoginWithTokenAnd2faCode with matching selector, permits only one successful atomic consumption and leaves email unverified for a user-level token. Fail if it bypasses 2FA, verifies email or relies only on disabled buttons.

## Case 33: Email-code completion and older packages

Prompt: "Does a successful email-code login on accounts-passwordless@3.1.2 verify that address and allow the code again? A second app uses 3.1.1. Can we assume both have the same concurrency protection?"

Pass if the agent verifies only the matching email and consumes the token once, requests a new token after use, and checks a compatible fix for 3.1.1 rather than promising identical atomic behavior.

## Case 34: Stale verification and 2FA

Prompt: "On accounts-password@3.3.2, an old verification link races with changing the email address. Another user gets 2fa-enabled from verifyEmail. Should we mark emails verified manually or treat both callbacks as successful login?"

Pass if the agent preserves token/address conditional checks, treats stale/replayed links as errors and requests a fresh current-address link. Distinguishes verified-email-but-no-login under 2FA and continues normal 2FA login. Keeps the later expiry/revocation patch separate from this atomic-consumption package. Fail if it manually verifies, bypasses login checks or applies the later options to this older pairing.

## Case 35: Verification expiry and password-change revocation

Prompt: "On Meteor 3.5.5 with accounts-base@3.3.2 and accounts-password@3.3.1_2, a four-day-old verification link fails. A newer link also fails after setPasswordAsync. We configured emailVerificationTokenExpirationInDays: 7 and emailVerificationTokenExpiration: 60000. What is the default without overrides? Should we restore token fields or set the lifetime to zero?"

Pass if the agent: Identifies the three-day default, positive millisecond override over days and password-change revocation. Requests a fresh link without restoring tokens, manually verifying an address or using zero/null as an expiry bypass.
Fail if it contradicts these boundaries or invents unsupported APIs.


## Case 36: Older verification package boundary

Prompt: "We must keep Meteor 3.5.4 with accounts-base@3.3.1 and accounts-password@3.3.1_1. Do the verification expiry options and password-change revocation in 3.5.5 already apply because our package numbers are above 3.2.2?"

Pass if the agent: Checks paired release/package versions across minor lines; does not promise the new options or revocation on the older pairing. Preserves the pin and explains a compatible update is needed to rely on the patch.
Fail if it contradicts these boundaries or invents unsupported APIs.


## Case 37: Production OAuth setup after security update

Prompt: "After updating to Meteor 3.6.1/accounts-base@3.4.1, accounts-ui cannot configure Google in production. A suggestion says to set allowClientServiceConfiguration: true. Is that the correct fix? Our 3.4.3 app also has an unconfigured service."

Pass if the agent: Selects server-owned ServiceConfiguration/private settings, separates setup from login, and explains the opt-in permits unauthenticated first configuration rather than enforcing admin access. Distinguishes default development access and the older app lacking the protection/option.
Fail if it contradicts these boundaries or invents unsupported APIs.


## Case 38: Authenticated fetch origin selection

Prompt: "On Meteor 3.6.1 with accounts-express@1.0.1, its client fetch authenticates to our app but not https://api.example.com. We also request https://metrics.example.net. Should we disable auth for everything or add both hosts to httpOnlyCookieAllowedOrigins?"

Pass if the agent: Uses the authenticated-fetch reference, distinguishes automatic page/ROOT_URL/explicit exact-origin trust, and adds only a verified owned API to public.packages.accounts-express.authFetchAllowedOrigins. Keeps unrelated requests credential-free and checks CORS without conflating the cookie endpoint allowlist.
Fail if it contradicts these boundaries or invents unsupported APIs.


## Case 39: Explicit credentials and fetch scope

Prompt: "On accounts-express@1.0.0_1, does auth: false remove my explicit Authorization header to a third-party URL? Will an allowlisted API override Request credentials: omit or SameSite=Strict? Does the same allowlist protect our server fetch?"

Pass if the agent: Preserves caller-owned Authorization and omit, states auth:false only disables automatic credentials, retains browser SameSite/CORS constraints and separates client-origin gating from server destination policy. Does not claim a universal secret scrubber.
Fail if it contradicts these boundaries or invents unsupported APIs.


## Case 40: Cookie settings and retry backport

Prompt: "On Meteor 3.5.5/accounts-base@3.3.2, settings.json only has public.packages.accounts.useHttpOnlyCookies=true and clientStorage=none. Refresh returns HTML. Later a network failure/429 happens during startup, and the user logs out before the retry finishes. Should we replace the endpoint or force the old token back?"

Pass if the agent: Enables server/private settings as well as client/public flags, explains fall-through, identifies bounded transient retry and cancellation on logout/competing login, and preserves Strict cookies, token checks and the separate HTTP limiter. Does not replay credentials after logout.
Fail if it contradicts these boundaries or invents unsupported APIs.


## Case 41: Passwordless backport without atomic-completion claim

Prompt: "Our Meteor 3.4.4 app has accounts-base@3.2.2 and accounts-passwordless@3.1.0_2; our 3.5.5 app has 3.3.2 and 3.1.1_2. Both flows should stay sign-in-only and keep custom userData fields. Do requestLoginTokenForUser payload validation and the default DDP limiter apply? Can we also promise every 3.6 one-time completion guarantee?"

Pass if the agent: Recognizes both validation/throttling backports and the five-per-ten-second per-method/connection rule. Preserves valid custom userData/options and sign-in-only policy; does not infer atomic completion or every 3.6 feature.
Fail if it contradicts these boundaries or invents unsupported APIs.


## Case 42: Plain server fetch near miss

Prompt: "Our server-only Node worker uses global fetch to a third-party API with an explicit API key. It does not import Meteor fetch or accounts-express. Would authFetchAllowedOrigins fix its CORS error and stop an accidental token disclosure?"

Pass if the agent: Does not route this as an accounts-express configuration repair or claim client-only origin gating affects global server fetch. Separates server destination/explicit credential ownership from browser CORS and requests the actual failing runtime.
Fail if it contradicts these boundaries or invents unsupported APIs.
