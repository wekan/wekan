# Implementation Notes

## Summary

- What changed: Added remote WeKan MCP config and created a Scrum board in production Wekan.
- Why: Codex needs MCP access to Wekan so the project can operate with a Scrum workflow.
- Files: .codex/config.toml, .manager/current_task.md, .manager/test-report.md, .manager/final_report.md, .manager/iteration_log.md, refer/07_scrum_mcp_board.md

## Decisions

- Decision: Use remote streamable HTTP MCP at https://trello.1nutrouter.com/mcp under the project name wekan_scrum, and global Codex name wekan-scrum.
- Trade-off: Remote MCP is simpler than maintaining a second local stdio wrapper in this repo.
- Follow-up: Use board ID KAnSasnYH66wNfKho directly until list_boards is fixed or clarified.

## Risks

- Risk: Wekan API /api/boards returns an empty list even after board creation.
- Mitigation: Verified the board directly with get_board and verified its lists/cards by ID.

## PB-10 Apple Glass Pastel Theme

- What changed: Added the fixed `appleglasspastel` board theme from
  `refer/009-prompt-phoi-mau-apple-glass-pastel.md`.
- Files:
  - `config/const.js`
  - `models/lib/themeCategories.js`
  - `models/lib/themeAccents.js`
  - `models/server/ExporterExcelCard.js`
  - `client/components/boards/boardColors.css`
  - `tests/appleGlassPastelTheme.test.cjs`
  - `tests/fixtures/appleGlassPastelThemePreview.html`
  - `tests/themeCategories.test.cjs`
  - `docs/Theme/Theme.md`
- Decision: Put `appleglasspastel` in the `special` category, because it is a
  coordinated fixed glass/pastel surface rather than a one-color flat theme or a
  two-stop clear slide.
- Decision: Publish `#2563eb` as its named accent so shared chrome controls,
  Admin Panel rows, and Save/primary buttons follow the theme.
- UI surface: The theme styles header bars, picker swatch, public-board row,
  board wrapper, swimlane/list surfaces, minicards, card details, popovers,
  sidebar controls, inputs, checklist progress, toggles, and scrollbars.
- Test hardening: Added a dedicated source guard for the Apple Glass Pastel
  contract so mesh tokens, glass blur/saturation, blue CTA, readable text
  colours, selector coverage, and docs cannot drift silently.
- QA preview: Added a static HTML preview fixture that imports the real
  `boardColors.css` and exercises the header, board wrapper, lists, minicards,
  card details, popover, sidebar, inputs, checklist progress, and primary
  buttons for later browser visual QA.
- Node-suite cleanup: Fixed two unrelated guard failures found during full-suite
  triage. `tests/cpuExec.test.cjs` now derives the architecture token from
  `uname -m`, matching `snap-src/bin/cpu-exec` on both Linux and macOS runners.
  `tests/dateUtils.normalizeDigits.test.cjs` now asserts local parsed date/time
  fields for timezone-less input instead of a UTC string tied to one runner
  timezone.
- Follow-up: Run visual QA in a real WeKan runtime. The source guards and static
  localhost preview prove selector/registry wiring and representative rendering,
  but not the final Blaze-template integration.
- Runtime QA: Started the app with repo-local Meteor 3.5.1 and its local MongoDB,
  registered a local `codexqa` test user, created board `Apple Glass Pastel QA`,
  opened Board Settings -> Change color, and confirmed the runtime picker lists
  `appleglasspastel` under `Special`.
- Runtime rendering: Selecting `appleglasspastel` changed the live board's
  `#header-quick-access` and `.board-wrapper` classes to
  `board-color-appleglasspastel`. Desktop computed styles confirmed the blue
  header/primary button, pastel mesh wrapper background, glass list/minicard
  surfaces with blur/saturation, readable dark text, and no document overflow.
  Mobile 390x844 confirmed `mobile-mode`, themed header/wrapper classes, pastel
  mesh, and the existing mobile list overview layout.

## PB-14 MCP list_boards Private Board Discovery

- What changed: Fixed the local WeKan MCP connector's board discovery to use
  the authenticated user's visible board endpoint instead of public-only
  `/api/boards`.
- Files:
  - `tools/ai-systems-mcp/server.py`
  - `tools/ai-systems-mcp/README.md`
  - `tests/wekanMcpBoardsEndpoint.test.cjs`
- Source validation: `server/models/boards.js` shows `/api/users/:userId/boards`
  returns non-archived boards where `members.userId` matches the user, while
  `/api/boards` filters `{ permission: 'public' }`.
- Decision: Add `_visible_user_boards()` helper that logs in, requires
  `client.user_id`, URL-escapes it with `quote(..., safe="")`, and calls
  `/api/users/{userId}/boards`.
- Decision: Make both `list_boards` and `wekan_health_status` use the same
  helper, so health output reflects the board set the MCP tool will return.
- Versioning: Bumped MCP server version from `0.2.0` to `0.2.1`.
- Runtime follow-up: rebuild/restart the deployed MCP server before expecting
  the live remote `list_boards` tool to return private boards.

## PB-15 Deploy MCP Board Discovery Fix

- Status: Handoff needed. The running remote MCP endpoint still returns
  `{"count":0,"boards":[]}` from `list_boards`, while direct board/list calls by
  board ID still work.
- Local deploy attempt: blocked because Docker cannot connect to the Colima
  socket at `/Users/apple/.colima/default/docker.sock`.
- Handoff: service owner should deploy on the host serving
  `https://trello.1nutrouter.com/mcp` from a revision containing commit
  `e622767fb`.
- Deployment command from repo docs:
  `cd tools/ai-systems-mcp && docker compose up -d --build`.
- Review checkpoint card: gCR3Qs48jwMSyy4vS.

## PB-16 Scrum Course Exercise 2 Preview Polish

- What changed: Finished the Scrum Course Exercise 2 written deliverable and
  made the HTML preview show the Bài 2 workflow, not only the course overview.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/02-scrum-kanban-lean-workflow.md`
  - `scrum-course/preview.html`
- Decision: Mark the Exercise 2 checklist complete because the Markdown now
  contains the workflow columns, WIP limits, entry/exit policies, DoR, DoD,
  exception rules, sample Sprint 1 backlog, and metrics.
- Preview additions: Bài 2 policy table, Definition of Ready, Definition of
  Done, sample Sprint 1 backlog, workflow metrics, and a dedicated Bài 2
  checklist.
- Review checkpoint card: x2RM5m7bRpXWYdQYC.

## PB-17 Scrum Course Exercise 3 Sprint Planning Playbook

- What changed: Added a third Scrum Course exercise that turns the workflow
  from Exercise 2 into a practical Sprint Planning and Backlog Refinement
  playbook.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/03-sprint-planning-backlog-refinement.md`
  - `scrum-course/preview.html`
- Exercise contents: planning inputs, refinement policy, Sprint Planning
  agenda, Sprint Goal, selected backlog items, capacity/WIP check, risk and
  scope-change handling, Sprint 1 Definition of Done, and completion checklist.
- Preview additions: Exercise 3 navigation/card, newest-file link, 3-exercise
  count, status text, and Sprint Planning playbook table.
- Review checkpoint card: qRqn42qrQf6bLMYSD.

## PB-18 Scrum Course Exercise 4 Review and Retro Feedback Loop

- What changed: Added a fourth Scrum Course exercise that closes the sprint
  learning loop with Sprint Review, Retrospective, feedback capture, backlog
  decisions, metric review, and improvement actions.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/04-sprint-review-retrospective-feedback-loop.md`
  - `scrum-course/preview.html`
- Exercise contents: Sprint Review agenda, feedback capture format,
  accept/rework/follow-up rules, Retrospective agenda, metric review, action
  item format, sample post-Review/Retro output, and completion checklist.
- Preview additions: Exercise 4 navigation/card, newest-file link, 4-exercise
  count, status text, Review/Retro feedback-loop table, and completed Bài 3/Bài
  4 checklists.
- Review checkpoint card: Y7fti3r3sxSuMEPKd.

## PB-19 Scrum Course Exercise 5 Release Readiness and Handoff

- What changed: Added a fifth Scrum Course exercise that moves an accepted
  increment toward release/deployable state with readiness checks, go/no-go
  decisioning, rollback, release notes, support handoff, monitoring, and
  incident response.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/05-release-readiness-handoff.md`
  - `scrum-course/preview.html`
- Exercise contents: release readiness checklist, go/no-go meeting format,
  risk and rollback plan, release note sample, support handoff, post-release
  monitoring, incident response, and completion checklist.
- Preview additions: Exercise 5 navigation/card, newest-file link, 5-exercise
  count, status text, release readiness/handoff table, and completed Bài 5
  checklist.
- Review checkpoint card: fwqYxcbhKGCyobATY.

## PB-20 Scrum Course Exercise 6 Metrics and Improvement Loop

- What changed: Added a sixth Scrum Course exercise that turns release/review
  evidence into metrics, trend review, experiments, and backlog improvements.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/06-metrics-improvement-loop.md`
  - `scrum-course/preview.html`
- Exercise contents: metric selection, baselines and targets, trend review,
  experiment design, backlog feedback action format, review cadence, sample
  output, and completion checklist.
- Preview additions: Exercise 6 navigation/card, newest-file link, 6-exercise
  count, status text, metrics/improvement-loop table, and completed Bài 6
  checklist.
- Review checkpoint card: 53pXb9wiTRSQwAaRn.

## PB-21 Scrum Course Exercise 7 Roadmap and Prioritization

- What changed: Added a seventh Scrum Course exercise that turns metrics and
  feedback into roadmap slices, prioritization, and backlog ordering.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/07-roadmap-prioritization.md`
  - `scrum-course/preview.html`
- Exercise contents: prioritization method, scoring criteria, roadmap slices,
  trade-off discussion, prioritization table, decision format, backlog
  ordering, and completion checklist.
- Preview additions: Exercise 7 navigation/card, newest-file link, 7-exercise
  count, status text, roadmap/prioritization table, and completed Bài 7
  checklist.
- Review checkpoint card: qgrvQxyNch7DQFhMQ.

## PB-22 Scrum Course Exercise 8 Execution Planning and Capacity

- What changed: Added an eighth Scrum Course exercise that turns a prioritized
  roadmap into a realistic sprint plan with capacity, ownership, and risk
  buffer.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/08-execution-planning-capacity.md`
  - `scrum-course/preview.html`
- Exercise contents: capacity calculation, team availability, slice sizing
  rules, sprint commitment rules, ownership assignment, dependency/risk
  tracking, sample sprint plan, and completion checklist.
- Preview additions: Exercise 8 navigation/card, newest-file link, 8-exercise
  count, status text, execution planning/capacity table, and completed Bài 8
  checklist.
- Review checkpoint card: t4WNKAKa8D3TuGb4h.

## PB-23 Scrum Course Exercise 9 Daily Scrum and Blocker Coordination

- What changed: Added a ninth Scrum Course exercise that turns Daily Scrum into
  a short coordination loop for Sprint Goal progress, blockers, and same-day
  follow-up.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/09-daily-scrum-blocker-coordination.md`
  - `scrum-course/preview.html`
- Exercise contents: Daily Scrum purpose, agenda, blocker handling, same-day
  coordination rules, sample daily update format, escalation policy, and
  completion checklist.
- Preview additions: Exercise 9 navigation/card, newest-file link, 9-exercise
  count, status text, Daily Scrum preview table, and completed Bài 9 checklist.
- Review checkpoint card: ZonAi5mXrEFtvpDxS.

## PB-24 Scrum Course Exercise 10 Sprint Health and Forecasting

- What changed: Added a tenth Scrum Course exercise that teaches the team to
  read sprint health signals, interpret burndown, and forecast risk early
  enough to intervene.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/10-sprint-health-burndown-forecasting.md`
  - `scrum-course/preview.html`
- Exercise contents: sprint health signals, burndown interpretation, forecast
  rules, intervention rules, sample health snapshot, and completion checklist.
- Preview additions: Exercise 10 navigation/card, newest-file link,
  10-exercise count, status text, sprint-health preview table, and completed
  Bài 10 checklist.
- Review checkpoint card: WMm6bDt2Cwx67AxTw.

## PB-25 Scrum Course Exercise 11 Sprint Recovery and Scope Reset

- What changed: Added an eleventh Scrum Course exercise that turns a red
  forecast into a concrete recovery plan with scope cut, reforecast, and reset
  commitment.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/11-sprint-recovery-scope-reset.md`
  - `scrum-course/preview.html`
- Exercise contents: recovery triggers, scope-cut rules, reforecast rules,
  communication rules, sample recovery plan, and completion checklist.
- Preview additions: Exercise 11 navigation/card, newest-file link,
  11-exercise count, status text, sprint-recovery preview table, and completed
  Bài 11 checklist.
- Review checkpoint card: zss4tZe9SCD3YkZ75.

## PB-26 Scrum Course Exercise 12 Retro Action Tracking and Improvement Backlog

- What changed: Added a twelfth Scrum Course exercise that turns retrospective
  actions into an improvement backlog with owner, due date, and success
  measures.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/12-retro-action-tracking-improvement-backlog.md`
  - `scrum-course/preview.html`
- Exercise contents: retrospective action capture, owner assignment, due date
  rules, success measure rules, backlog intake, sample improvement backlog, and
  completion checklist.
- Preview additions: Exercise 12 navigation/card, newest-file link,
  12-exercise count, status text, retro-action preview table, and completed
  Bài 12 checklist.
- Review checkpoint card: JEzHeKBkD9QsQd5dD.

## PB-27 Scrum Course Exercise 13 Backlog Aging and Cleanup

- What changed: Added a thirteenth Scrum Course exercise that keeps the
  backlog healthy by aging out stale items, merging duplicates, and
  refreshing readiness.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/13-backlog-aging-cleanup.md`
  - `scrum-course/preview.html`
- Exercise contents: backlog health signals, cleanup rules, stale item rules,
  duplicate merge rules, readiness refresh rules, sample cleanup session, and
  completion checklist.
- Preview additions: Exercise 13 navigation/card, newest-file link,
  13-exercise count, status text, backlog-hygiene preview table, and completed
  Bài 13 checklist.
- Review checkpoint card: 8pjRtDjdwRqXc26Wt.

## PB-28 Scrum Course Exercise 14 Planning Poker and Estimate Calibration

- What changed: Added a fourteenth Scrum Course exercise that calibrates
  estimation with Planning Poker so Ready items get consistent size before
  sprint planning.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/14-planning-poker-estimate-calibration.md`
  - `scrum-course/preview.html`
- Exercise contents: estimation principles, Planning Poker flow, calibration
  rules, split rules, consensus rules, sample estimation session, and
  completion checklist.
- Preview additions: Exercise 14 navigation/card, newest-file link,
  14-exercise count, status text, planning-poker preview table, and completed
  Bài 14 checklist.
- Review checkpoint card: f4BetY7vsYfLP4GzE.

## PB-29 Scrum Course Exercise 15 Working Agreement and Team Operating Rules

- What changed: Added a fifteenth Scrum Course exercise that turns implicit
  team expectations into a practical Scrum working agreement with operating
  rules for meetings, communication, WIP, blockers, quality, decisions, and
  escalation.
- Product Backlog card: 2u5upkf3AskFeFXT6.
- Sprint Backlog card: 8b6Cdio9K8QK7LzyJ.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/15-working-agreement-team-operating-rules.md`
  - `scrum-course/preview.html`
- Exercise contents: working agreement principles, meeting rules,
  communication rules, WIP and blocker policies, quality agreements, decision
  and escalation rules, sample working agreement, and completion checklist.
- Decision: Picked working agreement / team operating rules because Exercises
  11-14 already cover recovery, retro actions, backlog cleanup, and Planning
  Poker; this fills the team collaboration contract gap.
- Preview additions: Exercise 15 navigation/card, newest-file link,
  15-exercise count, status text, working-agreement preview table, and
  completed Bài 15 checklist.
- Review checkpoint card: 5JwQkoPaAFg9QgDxu.

## PB-30 Scrum Course Exercise 16 Dependency Mapping and Risk Board

- What changed: Added a sixteenth Scrum Course exercise that makes
  dependencies and sprint risks visible on the board with owners, scoring,
  mitigation, escalation, and review cadence.
- Product Backlog card: F42FZKpmA2iQWiwMh.
- Sprint Backlog card: iJwCZQPcWxstkmBRp.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/16-dependency-mapping-risk-board.md`
  - `scrum-course/preview.html`
- Exercise contents: dependency types, risk categories, mapping workflow, risk
  scoring, owner and mitigation rules, review cadence, sample dependency-risk
  board, and completion checklist.
- Decision: Picked dependency mapping / risk board because Exercise 15 defines
  operating rules, and the next practical gap is making external waits and
  uncertainty visible before they turn into blockers.
- Preview additions: Exercise 16 navigation/card, newest-file link,
  16-exercise count, status text, dependency-risk preview table, and completed
  Bài 16 checklist.
- Review checkpoint card: 7B9cWGLnq2FtvtMKG.

## PB-31 Scrum Course Exercise 17 Stakeholder Alignment and Review Prep

- What changed: Added a seventeenth Scrum Course exercise that prepares Sprint
  Review as a stakeholder alignment, decision, and feedback-routing workflow
  instead of a surprise demo.
- Product Backlog card: RRLMtyJhwAoPA3Eem.
- Sprint Backlog card: RQN7FDkynFtvXoTqS.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/17-stakeholder-alignment-review-prep.md`
  - `scrum-course/preview.html`
- Exercise contents: stakeholder map, review objective, invite/readiness
  rules, demo narrative, decision capture, feedback routing, sample
  review-prep board, and completion checklist.
- Decision: Picked stakeholder alignment / review prep because Exercise 16
  makes dependency and risk visible, and the next gap is turning Sprint Review
  into a prepared decision and learning loop.
- Preview additions: Exercise 17 navigation/card, newest-file link,
  17-exercise count, status text, stakeholder-review preview table, and
  completed Bài 17 checklist.
- Review checkpoint card: bpFeGT2Dk6XY72WMC.

## PB-32 Scrum Course Exercise 18 Facilitation and Decision Deadlock Resolution

- What changed: Added an eighteenth Scrum Course exercise that helps the team
  facilitate difficult Scrum discussions, identify decision deadlocks, and
  convert conflict into a decision, spike, escalation, or next action.
- Product Backlog card: 4fWTTXbmpDXWLAncS.
- Sprint Backlog card: p7vbeemHfFGNvcx7h.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/18-facilitation-decision-deadlock-resolution.md`
  - `scrum-course/preview.html`
- Exercise contents: deadlock signals, facilitation stance, decision methods,
  conflict mapping, discussion timeboxes, escalation rules, sample facilitation
  board, and completion checklist.
- Decision: Picked facilitation / decision deadlock resolution because
  Exercise 17 prepares stakeholder feedback, and the next gap is resolving
  disagreement when feedback, planning trade-offs, or team conflict stalls a
  decision.
- Preview additions: Exercise 18 navigation/card, newest-file link,
  18-exercise count, status text, facilitation preview table, and completed
  Bài 18 checklist.
- Review checkpoint card: HjvGKhYhmDQcYYcJi.

## PB-33 Scrum Course Exercise 19 Cross-functional Swarming and Flow Rescue

- What changed: Added a nineteenth Scrum Course exercise that teaches the team
  to stop starting more work and organize a cross-functional swarm when flow,
  blockers, or QA/dev queues threaten the Sprint Goal.
- Product Backlog card: sCodyGdDAr8JoZJbA.
- Sprint Backlog card: 5rYReRpSqZJcKSfTR.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/19-cross-functional-swarming-flow-rescue.md`
  - `scrum-course/preview.html`
- Exercise contents: swarm triggers, swarm roles, flow rescue workflow, WIP
  stop rules, pairing and mobbing patterns, exit criteria, sample swarm board,
  and completion checklist.
- Decision: Picked cross-functional swarming / flow rescue because Exercise 18
  resolves decision deadlocks, and the next practical gap is coordinated action
  when bottlenecks threaten delivery.
- Preview additions: Exercise 19 navigation/card, newest-file link,
  19-exercise count, status text, swarming preview table, and completed Bài 19
  checklist.
- Review checkpoint card: vSuXhrBToD5LEgfyn.

## PB-34 Scrum Course Exercise 20 Knowledge Sharing and Bus Factor Reduction

- What changed: Added a twentieth Scrum Course exercise that helps the team
  reduce bus factor and spread practical knowledge across delivery, QA,
  release, and support work after a swarm reveals a knowledge bottleneck.
- Product Backlog card: T9kQHt5HCkQCTcny8.
- Sprint Backlog card: 7Ta9pbJfWYG5Zde6x.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/20-knowledge-sharing-bus-factor-reduction.md`
  - `scrum-course/preview.html`
- Exercise contents: bus factor signals, skill matrix, knowledge map, pairing
  and rotation plan, documentation rules, learning checkpoints, sample
  knowledge-sharing board, and completion checklist.
- Decision: Picked knowledge sharing / bus factor reduction because Exercise
  19 teaches flow rescue through swarming, and the next practical gap is
  sustaining that capability so future bottlenecks do not depend on one
  specialist.
- Preview additions: Exercise 20 navigation/card, newest-file link,
  20-exercise count, status text, knowledge-sharing preview table, and
  completed Bài 20 checklist.
- Review checkpoint card: wNJpnWooxTRK8iPBu.

## PB-35 Scrum Course Exercise 21 Technical Debt Mapping and Quality Investment

- What changed: Added a twenty-first Scrum Course exercise that teaches the
  team to map technical debt as delivery risk, score its impact, and choose
  small quality investments with clear success signals.
- Product Backlog card: BrR2tFYpH7doTGoxn.
- Sprint Backlog card: yDWbRt3zFkCx2bsFZ.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/21-technical-debt-quality-investment.md`
  - `scrum-course/preview.html`
- Exercise contents: technical debt signals, debt categories, debt register,
  impact scoring, repayment decision rules, quality investment plan, sample
  debt board, and completion checklist.
- Decision: Picked technical debt / quality investment because Exercise 20
  spreads knowledge across the team, and the next practical gap is using that
  shared knowledge to identify, prioritize, and pay down debt that slows future
  delivery.
- Preview additions: Exercise 21 navigation/card, newest-file link,
  21-exercise count, status text, technical-debt preview table, and completed
  Bài 21 checklist.
- Review checkpoint card: M7KMhZfHGkE4RXBYx.

## PB-36 Scrum Course Exercise 22 Quality Gates and Continuous Integration

- What changed: Added a twenty-second Scrum Course exercise that teaches the
  team to define quality gates and CI signal policy so defects, flaky checks,
  skipped checks, and release risks are handled early with clear ownership.
- Product Backlog card: yHzxNWryAgQhvrrLo.
- Sprint Backlog card: kRk3PNJAwc7aMJWXM.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/22-quality-gates-continuous-integration.md`
  - `scrum-course/preview.html`
- Exercise contents: quality gate types, CI signal policy, merge rules, flaky
  check handling, release gate checklist, gate ownership, sample CI board, and
  completion checklist.
- Decision: Picked quality gates / continuous integration because Exercise 21
  identifies debt and quality investments, and the next gap is turning those
  choices into pipeline and release signals that protect quality without
  clogging team flow.
- Preview additions: Exercise 22 navigation/card, newest-file link,
  22-exercise count, status text, quality-gates preview table, and completed
  Bài 22 checklist.
- Review checkpoint card: yhahkfZfeFQPkC3ch.

## PB-37 Scrum Course Exercise 23 Incident Response and Production Learning

- What changed: Added a twenty-third Scrum Course exercise that teaches the
  team to respond to production incidents with severity, roles, recovery
  decisions, communication cadence, blameless review, and learning backlog
  actions.
- Product Backlog card: 784x9fyGXWFtpLPX2.
- Sprint Backlog card: a8MxNnpdSow8e48wG.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/23-incident-response-production-learning.md`
  - `scrum-course/preview.html`
- Exercise contents: severity levels, incident roles, response workflow,
  communication rules, mitigation and rollback decisions, post-incident
  review, learning backlog, sample incident board, and completion checklist.
- Decision: Picked incident response / production learning because Exercise 22
  defines quality gates and CI policy, and the next practical gap is what the
  team does when production still breaks despite the gates.
- Preview additions: Exercise 23 navigation/card, newest-file link,
  23-exercise count, status text, incident-response preview table, and
  completed Bài 23 checklist.
- Review checkpoint card: Hky6vHo2jB9q7eyZY.

## PB-38 Scrum Course Exercise 24 SLOs and Operational Readiness

- What changed: Added a twenty-fourth Scrum Course exercise that teaches the
  team to define reliability signals, SLI/SLO targets, error budget rules,
  operational readiness, launch decisions, and reliability backlog actions.
- Product Backlog card: 3F25keYbBfRXNEyYo.
- Sprint Backlog card: NDFAAgFTGrdYfaFn7.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/24-slos-operational-readiness.md`
  - `scrum-course/preview.html`
- Exercise contents: reliability signals, SLI/SLO definitions, error budget
  rules, operational readiness checklist, launch readiness decision,
  reliability backlog, sample SLO board, and completion checklist.
- Decision: Picked SLOs / operational readiness because Exercise 23 closes the
  incident response loop, and the next practical gap is proactively measuring
  and deciding reliability trade-offs before launch or rollout.
- Preview additions: Exercise 24 navigation/card, newest-file link,
  24-exercise count, status text, SLO/readiness preview table, and completed
  Bài 24 checklist.
- Review checkpoint card: bBgTnK6R6cwmb24Wb.

## PB-39 Scrum Course Exercise 25 Release Strategy and Progressive Rollout

- What changed: Added a twenty-fifth Scrum Course exercise that teaches the
  team to choose release strategy, feature flag rules, canary/phased rollout,
  launch cohorts, monitoring cadence, rollback triggers, and evidence-based
  go/expand/hold/rollback decisions.
- Product Backlog card: 3fjejPZZN7vetahXa.
- Sprint Backlog card: JsbiLRoF3i3Yd4yt4.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/25-release-strategy-progressive-rollout.md`
  - `scrum-course/preview.html`
- Exercise contents: rollout strategies, feature flag rules, canary/phased
  rollout plan, rollback triggers, launch cohort rules, monitoring cadence,
  go/expand/rollback decision rules, sample rollout board, and completion
  checklist.
- Decision: Picked release strategy / progressive rollout because Exercise 24
  defines SLOs and operational readiness, and the next practical gap is using
  that evidence to launch changes in smaller, observable phases.
- Preview additions: Exercise 25 navigation/card, newest-file link,
  25-exercise count, status text, release-strategy preview table, and completed
  Bài 25 checklist.
- Review checkpoint card: RtbDBbC7oLFGDvMdN.

## PB-40 Scrum Course Exercise 26 Product Adoption and Post-launch Feedback

- What changed: Added a twenty-sixth Scrum Course exercise that teaches the
  team to measure adoption after rollout, collect contextual post-launch
  feedback, triage friction, synthesize quantitative and qualitative evidence,
  and feed decisions back into backlog refinement.
- Product Backlog card: snH3CJ8vn9evZAP2W.
- Sprint Backlog card: xFmrpvEfJjxAobhmp.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/26-product-adoption-post-launch-feedback.md`
  - `scrum-course/preview.html`
- Exercise contents: adoption signals, activation/usage/retention measures,
  feedback intake channels, friction triage rules, qualitative/quantitative
  synthesis, backlog update rules, stakeholder communication, sample adoption
  board, and completion checklist.
- Decision: Picked product adoption / post-launch feedback because Exercise 25
  gets changes safely to users, and the next practical gap is learning whether
  the release creates real value and how that learning should reshape the
  backlog.
- Preview additions: Exercise 26 navigation/card, newest-file link,
  26-exercise count, status text, adoption-feedback preview table, and
  completed Bài 26 checklist.
- Review checkpoint card: AxDqDJ3XxoWBntmNz.

## PB-41 Scrum Course Exercise 27 Experiment Design and A/B Testing

- What changed: Added a twenty-seventh Scrum Course exercise that teaches the
  team to convert adoption feedback into hypotheses, choose experiment types,
  set up A/B tests, define audience/sample guardrails, watch success and
  guardrail metrics, and turn results into product decisions.
- Product Backlog card: MtDkXHd87sywwCDxr.
- Sprint Backlog card: eKzBDMtmR3bQZhPSD.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/27-experiment-design-ab-testing.md`
  - `scrum-course/preview.html`
- Exercise contents: hypothesis format, experiment types, A/B testing setup,
  audience and sample guardrails, success metrics, risk/ethics checks,
  decision rules, backlog follow-up rules, sample experiment board, and
  completion checklist.
- Decision: Picked experiment design / A/B testing because Exercise 26 turns
  rollout learning into adoption evidence, and the next practical gap is
  validating assumptions before turning every feedback pattern into build
  scope.
- Preview additions: Exercise 27 navigation/card, newest-file link,
  27-exercise count, status text, experiment-design preview table, and
  completed Bài 27 checklist.
- Review checkpoint card: uMpJt4shK7nRcYrBN.

## PB-42 Scrum Course Exercise 28 Product Discovery and Opportunity Mapping

- What changed: Added a twenty-eighth Scrum Course exercise that teaches the
  team to organize experiment results, customer evidence, feedback, and
  stakeholder input into opportunity maps, assumption maps, discovery backlog
  items, and decision handoffs.
- Product Backlog card: mBkjDY3Ded7vvG75F.
- Sprint Backlog card: f8vjmd2LRCpN52i3G.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/28-product-discovery-opportunity-mapping.md`
  - `scrum-course/preview.html`
- Exercise contents: discovery inputs, opportunity framing, customer segment
  rules, opportunity solution tree, assumption mapping, evidence strength,
  discovery backlog rules, decision handoff, sample opportunity board, and
  completion checklist.
- Decision: Picked product discovery / opportunity mapping because Exercise 27
  validates assumptions with experiments, and the next practical gap is
  organizing that learning into opportunities before roadmap or refinement
  scope is committed.
- Preview additions: Exercise 28 navigation/card, newest-file link,
  28-exercise count, status text, opportunity-mapping preview table, and
  completed Bài 28 checklist.
- Review checkpoint card: j2wX997x62Czx8DRy.

## PB-43 Scrum Course Exercise 29 User Story Mapping and Release Slicing

- What changed: Added a twenty-ninth Scrum Course exercise that teaches the
  team to convert opportunity maps and discovery decisions into a user story
  map, walking skeleton, MVP slice, release slices, and refinement-ready
  backlog stories.
- Product Backlog card: X3u9GnXsXWdZi7HMJ.
- Sprint Backlog card: twaacJRbxTT7Ha8N8.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/29-user-story-mapping-release-slicing.md`
  - `scrum-course/preview.html`
- Exercise contents: story map inputs, user journey backbone, activities and
  tasks, story cards, walking skeleton and MVP slice, release slicing rules,
  prioritization within the map, refinement handoff, sample story map board,
  and completion checklist.
- Decision: Picked user story mapping / release slicing because Exercise 28
  selects opportunities and handoff decisions, and the next practical gap is
  turning one selected opportunity into a delivery map without losing the
  original user outcome, evidence, or assumptions.
- Preview additions: Exercise 29 navigation/card, newest-file link,
  29-exercise count, status text, story-mapping preview table, and completed
  Bài 29 checklist.
- Review checkpoint card: B6C6gQ8MC3uiFKqAe.

## PB-44 Scrum Course Exercise 30 Example Mapping and Acceptance Criteria

- What changed: Added a thirtieth Scrum Course exercise that teaches the team
  to clarify refinement-ready stories with rules, concrete examples, open
  questions, edge and negative cases, acceptance criteria, and testable
  scenarios before implementation.
- Product Backlog card: 9cpM7R2ftbhhdvjmC.
- Sprint Backlog card: xevmQNakL4m7f4Lgf.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/30-example-mapping-acceptance-criteria.md`
  - `scrum-course/preview.html`
- Exercise contents: example mapping inputs, story rule discovery, concrete
  examples, open questions, edge and negative cases, acceptance criteria
  formats, testable scenarios, DoR and DoD alignment, sample example map board,
  and completion checklist.
- Decision: Picked example mapping / acceptance criteria because Exercise 29
  hands off refinement-ready story slices, and the next practical gap is
  ensuring Product, engineering, QA, and design agree on behavior before
  estimation and build.
- Preview additions: Exercise 30 navigation/card, newest-file link,
  30-exercise count, status text, example-mapping preview table, and completed
  Bài 30 checklist.
- Review checkpoint card: S3MhSdpW3BctMHLDz.

## PB-45 Scrum Course Exercise 31 Test Strategy and Automation Planning

- What changed: Added a thirty-first Scrum Course exercise that teaches the
  team to convert acceptance criteria and testable scenarios into a risk-based
  test strategy, automation plan, regression coverage, and CI signal policy.
- Product Backlog card: HpQNpsYSveaide2TJ.
- Sprint Backlog card: BrDb4zuCPF3GuAgTS.
- Files:
  - `scrum-course/README.md`
  - `scrum-course/exercises/31-test-strategy-automation-planning.md`
  - `scrum-course/preview.html`
- Exercise contents: test strategy inputs, risk-based test planning, test
  pyramid selection, automation candidates, negative and regression coverage,
  test data and environment plan, CI signal policy, exploratory testing,
  coverage gaps, sample test strategy board, and completion checklist.
- Decision: Picked test strategy / automation planning because Exercise 30
  turns stories into criteria and scenarios, and the next practical gap is
  deciding which proof belongs at which test level before implementation and CI
  feedback become noisy or too slow.
- Preview additions: Exercise 31 navigation/card, newest-file link,
  31-exercise count, status text, test-strategy preview table, and completed
  Bài 31 checklist.
- Review checkpoint card: r9b7WdPXSZfmZd6Rd.
