# Test Report

## Environment

- Date: 2026-08-10
- Branch: local workspace
- Runtime: Remote MCP streamable HTTP at https://trello.1nutrouter.com/mcp

## Cases

| Case | Result | Notes |
|------|--------|-------|
| MCP initialize | Pass | Endpoint returned protocolVersion 2025-03-26 and serverInfo wekan-mcp v0.2.0. |
| Tool discovery | Pass | tools/list returned health, board, list, swimlane, and card tools. |
| Health/auth | Pass | wekan_health_status authenticated as user admin. |
| Scrum board creation | Pass | Created board KAnSasnYH66wNfKho with admin membership. |
| Lists/cards verification | Pass | list_lists returned 6 Scrum lists; list_cards verified Product Backlog cards. |
| Board listing | Warning | list_boards returned count 0, although get_board works by ID. |

## Conclusion

- Pass/Fail: Pass with warning.
- Remaining issues: Investigate list_boards visibility/API behavior later if sidebar discovery is required.

## PB-10 Apple Glass Pastel Theme

| Case | Result | Notes |
|------|--------|-------|
| `node tests/appleGlassPastelTheme.test.cjs` | Pass | Dedicated guard covers PB-10 palette tokens, glass surfaces, CTA/focus/status colors, selector coverage, registry, exporter accent, docs, and the static preview fixture. |
| `node tests/run-node-suites.cjs appleGlassPastelTheme` | Pass | Confirms the new guard is discovered by the plain-node suite runner. |
| `node tests/themeCategories.test.cjs` | Pass | `appleglasspastel` is categorized under `special` and the partition still matches `ALLOWED_BOARD_COLORS`. |
| `node tests/themeAccents.test.cjs` | Pass | The named accent map matches `boardColors.css`; first header bar and shared picker wiring are covered. |
| `node tests/headerBars.test.cjs` | Pass | Header bars stay the same color across themes, including the new theme. |
| `node tests/publicBoardsPage.test.cjs` | Pass | Public board row selector coverage still matches board-list color selector coverage. |
| `node tests/themeColorPicker.test.cjs` | Pass | Shared picker wiring remains valid for Board, Member, and Admin scopes. |
| `node tests/globalThemeColor.test.cjs` | Pass | Global theme class and override wiring remain valid. |
| `node tests/buttonThemeColors.test.cjs` | Pass | Primary/settings controls continue reading theme variables. |
| `git diff --check` | Pass | No whitespace errors in the current patch. |
| `HOME="$PWD/.tools" .tools/.meteor/meteor node tests/cpuExec.test.cjs` | Pass | 9 tests passed after making the guard derive the architecture token from `uname -m`, the same source used by `snap-src/bin/cpu-exec`. |
| `HOME="$PWD/.tools" .tools/.meteor/meteor node tests/dateUtils.normalizeDigits.test.cjs` | Pass | 16 assertions passed after making the timezone-less datetime assertion check local parsed fields instead of a runner-specific UTC string. |
| `HOME="$PWD/.tools" .tools/.meteor/meteor npm run test:unit:node` | Pass | Full plain-node suite passed: 344 suites run, 0 failed. |
| `/usr/local/bin/meteor --version` | Not usable | Host Meteor is present but unsupported on this Mac arm64 host; use repo-local `.tools/.meteor/meteor` for follow-up runtime work. |
| Browser render of `tests/fixtures/appleGlassPastelThemePreview.html` | Blocked | The in-app browser blocks `file://` navigation by policy. No workaround was used. The fixture is still source-guarded for later runtime/browser QA. |
| Localhost browser render of `tests/fixtures/appleGlassPastelThemePreview.html` | Pass | Served with `python3 -m http.server 8123 --bind 127.0.0.1`; desktop screenshot and computed styles confirmed nonblank render, pastel mesh background, glass blur/saturation on list/minicard/card/sidebar, blue CTA/header, readable dark text, and no document horizontal overflow. |
| Localhost mobile viewport render, 390x844 | Pass with expected kanban scroll | Screenshot and computed layout confirmed nonblank render, no text overlaps, no document horizontal overflow, and vertical scrolling only. The next board column is partially visible because the preview models a horizontally scrollable kanban board. |
| Real WeKan runtime startup | Pass | Started with repo-local Meteor: `HOME="$PWD/.tools" PATH="$PWD/.tools/.meteor:$PATH" ... .tools/.meteor/meteor run --port 3000`; Meteor started proxy, local MongoDB, Rspack HMR, and app at `http://localhost:3000`. |
| Runtime Board Settings picker | Pass | Created local QA user and board, opened Board Settings -> Change color, and verified `appleglasspastel` appears under `Special` in the live picker. |
| Runtime desktop board render | Pass | Selecting `appleglasspastel` changed live header/wrapper classes to `board-color-appleglasspastel`; computed styles confirmed header/primary `rgb(37, 99, 235)`, pastel mesh wrapper, glass list/minicard blur+saturation, readable dark text, and no document overflow at 1280px. |
| Runtime mobile board render, 390x844 | Pass with existing mobile layout note | The live board kept `mobile-mode`, themed header/wrapper classes, and pastel mesh. Mobile shows WeKan's existing mini-list overview; `documentElement` width stayed 390 while `bodyScrollWidth` measured 414 from existing header/sidebar controls, not tied to the new theme surface. |

Remaining verification: PR handoff and CHANGELOG entry after a real commit URL
exists for the required linked summary.

## PB-14 MCP list_boards Private Board Discovery

| Case | Result | Notes |
|------|--------|-------|
| Source route validation | Pass | `server/models/boards.js` confirms `/api/users/:userId/boards` returns the authenticated user's visible boards, while `/api/boards` lists public boards only. |
| `HOME="$PWD/.tools" .tools/.meteor/meteor node tests/wekanMcpBoardsEndpoint.test.cjs` | Pass | 6 tests passed; guards endpoint selection, health probe metadata, README docs, and version bump. |
| `python3 -m py_compile tools/ai-systems-mcp/server.py` | Pass | Python syntax compiles. |
| `git diff --check` | Pass | No whitespace errors. |
| Live remote MCP `list_boards` before deploy | Still old behavior | The running remote MCP still returns `count: 0`, while `get_board` by `KAnSasnYH66wNfKho` succeeds for the private Scrum board. This confirms the deployment still needs rebuild/restart. |

Remaining verification: deploy/restart the remote MCP server, then confirm the
live `list_boards` call returns private board `KAnSasnYH66wNfKho`.

## PB-15 Deploy MCP Board Discovery Fix

| Case | Result | Notes |
|------|--------|-------|
| Live remote MCP `list_boards` after PB-15 grooming | Blocked | The live MCP still returns `count: 0`, so the remote service has not picked up PB-14 yet. |
| Direct board/list access by ID | Pass | `list_lists` for board `KAnSasnYH66wNfKho` returned the 6 Scrum lists. |
| Local Docker deploy path | Blocked | `docker ps` and `docker compose -f tools/ai-systems-mcp/docker-compose.yml ps` cannot connect to `/Users/apple/.colima/default/docker.sock`. |
| Deployment handoff | Pass | Review checkpoint gCR3Qs48jwMSyy4vS records the deploy command and live verification steps. |

Remaining verification: run the deploy/restart on the actual remote MCP host.

## PB-16 Scrum Course Exercise 2 Preview Polish

| Case | Result | Notes |
|------|--------|-------|
| Python HTML parser | Pass | `html.parser` accepted `scrum-course/preview.html`. |
| Static link/checklist guard | Pass | Verified preview links resolve and Exercise 2 has nine completed checklist items. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8124/preview.html` found the new Bài 2 sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was served/opened on localhost for manual inspection instead. |

## PB-17 Scrum Course Exercise 3 Sprint Planning Playbook

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 3 guard | Pass | Confirmed preview text, Exercise 3 link, required Markdown sections, and 8 completed checklist items. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8125/preview.html` found the Bài 3 preview sections. |
| Localhost Exercise 3 fetch | Pass | `curl http://127.0.0.1:8125/exercises/03-sprint-planning-backlog-refinement.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-18 Scrum Course Exercise 4 Review and Retro Feedback Loop

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 4 guard | Pass | Confirmed Exercise 4 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-4. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8126/preview.html` found the Bài 4 preview sections. |
| Localhost Exercise 4 fetch | Pass | `curl http://127.0.0.1:8126/exercises/04-sprint-review-retrospective-feedback-loop.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-19 Scrum Course Exercise 5 Release Readiness and Handoff

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 5 guard | Pass | Confirmed Exercise 5 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-5. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8127/preview.html` found the Bài 5 preview sections. |
| Localhost Exercise 5 fetch | Pass | `curl http://127.0.0.1:8127/exercises/05-release-readiness-handoff.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-20 Scrum Course Exercise 6 Metrics and Improvement Loop

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 6 guard | Pass | Confirmed Exercise 6 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-6. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8128/preview.html` found the Bài 6 preview sections. |
| Localhost Exercise 6 fetch | Pass | `curl http://127.0.0.1:8128/exercises/06-metrics-improvement-loop.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-21 Scrum Course Exercise 7 Roadmap and Prioritization

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 7 guard | Pass | Confirmed Exercise 7 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-7. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8129/preview.html` found the Bài 7 preview sections. |
| Localhost Exercise 7 fetch | Pass | `curl http://127.0.0.1:8129/exercises/07-roadmap-prioritization.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-22 Scrum Course Exercise 8 Execution Planning and Capacity

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 8 guard | Pass | Confirmed Exercise 8 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-8. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8130/preview.html` found the Bài 8 preview sections. |
| Localhost Exercise 8 fetch | Pass | `curl http://127.0.0.1:8130/exercises/08-execution-planning-capacity.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-23 Scrum Course Exercise 9 Daily Scrum and Blocker Coordination

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 9 guard | Pass | Confirmed Exercise 9 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-9. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8131/preview.html` found the Bài 9 preview sections. |
| Localhost Exercise 9 fetch | Pass | `curl http://127.0.0.1:8131/exercises/09-daily-scrum-blocker-coordination.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-24 Scrum Course Exercise 10 Sprint Health and Forecasting

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 10 guard | Pass | Confirmed Exercise 10 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-10. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8132/preview.html` found the Bài 10 preview sections. |
| Localhost Exercise 10 fetch | Pass | `curl http://127.0.0.1:8132/exercises/10-sprint-health-burndown-forecasting.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-25 Scrum Course Exercise 11 Sprint Recovery and Scope Reset

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 11 guard | Pass | Confirmed Exercise 11 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-11. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8133/preview.html` found the Bài 11 preview sections. |
| Localhost Exercise 11 fetch | Pass | `curl http://127.0.0.1:8133/exercises/11-sprint-recovery-scope-reset.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-26 Scrum Course Exercise 12 Retro Action Tracking and Improvement Backlog

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 12 guard | Pass | Confirmed Exercise 12 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-12. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8134/preview.html` found the Bài 12 preview sections. |
| Localhost Exercise 12 fetch | Pass | `curl http://127.0.0.1:8134/exercises/12-retro-action-tracking-improvement-backlog.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-27 Scrum Course Exercise 13 Backlog Aging and Cleanup

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 13 guard | Pass | Confirmed Exercise 13 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-13. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8135/preview.html` found the Bài 13 preview sections. |
| Localhost Exercise 13 fetch | Pass | `curl http://127.0.0.1:8135/exercises/13-backlog-aging-cleanup.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-28 Scrum Course Exercise 14 Planning Poker and Estimate Calibration

| Case | Result | Notes |
|------|--------|-------|
| Static Exercise 14 guard | Pass | Confirmed Exercise 14 preview text, links/anchors, required Markdown sections, README link, and checklist counts for Exercises 2-14. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8136/preview.html` found the Bài 14 preview sections. |
| Localhost Exercise 14 fetch | Pass | `curl http://127.0.0.1:8136/exercises/14-planning-poker-estimate-calibration.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was opened on localhost in Codex for manual inspection instead. |

## PB-29 Scrum Course Exercise 15 Working Agreement and Team Operating Rules

| Case | Result | Notes |
|------|--------|-------|
| MCP board read | Pass | `get_board`, `list_lists`, and `list_cards` succeeded for board `KAnSasnYH66wNfKho`. |
| Product Backlog card creation | Pass | Created PB-29 card `2u5upkf3AskFeFXT6` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `8b6Cdio9K8QK7LzyJ`. |
| Static Exercise 15 guard | Pass | Confirmed Exercise 15 preview text, links/anchors, required Markdown sections, README link, 15 exercise cards, and 15 checklist sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8137/preview.html` found the Bài 15 preview sections. |
| Localhost Exercise 15 fetch | Pass | `curl http://127.0.0.1:8137/exercises/15-working-agreement-team-operating-rules.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through localhost fetch checks instead. |

## PB-30 Scrum Course Exercise 16 Dependency Mapping and Risk Board

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-30 card `F42FZKpmA2iQWiwMh` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `iJwCZQPcWxstkmBRp`. |
| Static Exercise 16 guard | Pass | Confirmed Exercise 16 preview text, links/anchors, required Markdown sections, README link, 16 exercise cards, and 16 checklist sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8138/preview.html` found the Bài 16 preview sections. |
| Localhost Exercise 16 fetch | Pass | `curl http://127.0.0.1:8138/exercises/16-dependency-mapping-risk-board.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through localhost fetch checks instead. |

## PB-31 Scrum Course Exercise 17 Stakeholder Alignment and Review Prep

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-31 card `RRLMtyJhwAoPA3Eem` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `RQN7FDkynFtvXoTqS`. |
| Static Exercise 17 guard | Pass | Confirmed Exercise 17 preview text, links/anchors, required Markdown sections, README link, 17 exercise cards, and 17 checklist sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8139/preview.html` found the Bài 17 preview sections. |
| Localhost Exercise 17 fetch | Pass | `curl http://127.0.0.1:8139/exercises/17-stakeholder-alignment-review-prep.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through localhost fetch checks instead. |

## PB-32 Scrum Course Exercise 18 Facilitation and Decision Deadlock Resolution

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-32 card `4fWTTXbmpDXWLAncS` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `p7vbeemHfFGNvcx7h`. |
| Static Exercise 18 guard | Pass | Confirmed Exercise 18 preview text, links/anchors, required Markdown sections, README link, 18 exercise cards, and 18 checklist sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8140/preview.html` found the Bài 18 preview sections. |
| Localhost Exercise 18 fetch | Pass | `curl http://127.0.0.1:8140/exercises/18-facilitation-decision-deadlock-resolution.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through localhost fetch checks instead. |

## PB-33 Scrum Course Exercise 19 Cross-functional Swarming and Flow Rescue

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-33 card `sCodyGdDAr8JoZJbA` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `5rYReRpSqZJcKSfTR`. |
| Static Exercise 19 guard | Pass | Confirmed Exercise 19 preview text, links/anchors, required Markdown sections, README link, 19 exercise cards, and 19 checklist sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8141/preview.html` found the Bài 19 preview sections. |
| Localhost Exercise 19 fetch | Pass | `curl http://127.0.0.1:8141/exercises/19-cross-functional-swarming-flow-rescue.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through localhost fetch checks instead. |

## PB-34 Scrum Course Exercise 20 Knowledge Sharing and Bus Factor Reduction

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-34 card `T9kQHt5HCkQCTcny8` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `7Ta9pbJfWYG5Zde6x`. |
| Static Exercise 20 guard | Pass | Confirmed Exercise 20 preview text, links/anchors, required Markdown sections, README link, 20 exercise cards, and 20 checklist sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8142/preview.html` found the Bài 20 preview sections. |
| Localhost Exercise 20 fetch | Pass | `curl http://127.0.0.1:8142/exercises/20-knowledge-sharing-bus-factor-reduction.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-35 Scrum Course Exercise 21 Technical Debt Mapping and Quality Investment

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-35 card `BrR2tFYpH7doTGoxn` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `yDWbRt3zFkCx2bsFZ`. |
| Static Exercise 21 guard | Pass | Confirmed Exercise 21 preview text, links/anchors, required Markdown sections, README link, 21 exercise cards, and 21 checklist sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8143/preview.html` found the Bài 21 preview sections. |
| Localhost Exercise 21 fetch | Pass | `curl http://127.0.0.1:8143/exercises/21-technical-debt-quality-investment.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-36 Scrum Course Exercise 22 Quality Gates and Continuous Integration

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-36 card `yHzxNWryAgQhvrrLo` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `kRk3PNJAwc7aMJWXM`. |
| Static Exercise 22 guard | Pass | Confirmed Exercise 22 preview text, links/anchors, required Markdown sections, README link, 22 exercise cards, and 22 checklist sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8144/preview.html` found the Bài 22 preview sections. |
| Localhost Exercise 22 fetch | Pass | `curl http://127.0.0.1:8144/exercises/22-quality-gates-continuous-integration.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-37 Scrum Course Exercise 23 Incident Response and Production Learning

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-37 card `784x9fyGXWFtpLPX2` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `a8MxNnpdSow8e48wG`. |
| Static Exercise 23 guard | Pass | Confirmed Exercise 23 preview text, links/anchors, required Markdown sections, README link, 23 exercise cards, and 23 checklist sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8145/preview.html` found the Bài 23 preview sections. |
| Localhost Exercise 23 fetch | Pass | `curl http://127.0.0.1:8145/exercises/23-incident-response-production-learning.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-38 Scrum Course Exercise 24 SLOs and Operational Readiness

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-38 card `3F25keYbBfRXNEyYo` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `NDFAAgFTGrdYfaFn7`. |
| Static Exercise 24 guard | Pass | Confirmed Exercise 24 preview text, links/anchors, required Markdown sections, README link, 24 exercise cards, and 24 checklist sections. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8146/preview.html` found the Bài 24 preview sections. |
| Localhost Exercise 24 fetch | Pass | `curl http://127.0.0.1:8146/exercises/24-slos-operational-readiness.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-39 Scrum Course Exercise 25 Release Strategy and Progressive Rollout

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-39 card `3fjejPZZN7vetahXa` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `JsbiLRoF3i3Yd4yt4`. |
| Static Exercise 25 guard | Pass | Confirmed Exercise 25 preview text, links/anchors, required Markdown sections, README link, 25 exercise cards, 25 checklist sections, and 25 README exercise links. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8147/preview.html` found the Bài 25 preview sections. |
| Localhost Exercise 25 fetch | Pass | `curl http://127.0.0.1:8147/exercises/25-release-strategy-progressive-rollout.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-40 Scrum Course Exercise 26 Product Adoption and Post-launch Feedback

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-40 card `snH3CJ8vn9evZAP2W` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `xFmrpvEfJjxAobhmp`. |
| Static Exercise 26 guard | Pass | Confirmed Exercise 26 preview text, links/anchors, required Markdown sections, README link, 26 exercise cards, 26 checklist sections, and 26 README exercise links. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8148/preview.html` found the Bài 26 preview sections. |
| Localhost Exercise 26 fetch | Pass | `curl http://127.0.0.1:8148/exercises/26-product-adoption-post-launch-feedback.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-41 Scrum Course Exercise 27 Experiment Design and A/B Testing

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-41 card `MtDkXHd87sywwCDxr` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `eKzBDMtmR3bQZhPSD`. |
| Static Exercise 27 guard | Pass | Confirmed Exercise 27 preview text, links/anchors, required Markdown sections, README link, 27 exercise cards, 27 checklist sections, and 27 README exercise links. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8149/preview.html` found the Bài 27 preview sections. |
| Localhost Exercise 27 fetch | Pass | `curl http://127.0.0.1:8149/exercises/27-experiment-design-ab-testing.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-42 Scrum Course Exercise 28 Product Discovery and Opportunity Mapping

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-42 card `mBkjDY3Ded7vvG75F` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `f8vjmd2LRCpN52i3G`. |
| Static Exercise 28 guard | Pass | Confirmed Exercise 28 preview text, links/anchors, required Markdown sections, README link, 28 exercise cards, 28 checklist sections, and 28 README exercise links. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8150/preview.html` found the Bài 28 preview sections. |
| Localhost Exercise 28 fetch | Pass | `curl http://127.0.0.1:8150/exercises/28-product-discovery-opportunity-mapping.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-43 Scrum Course Exercise 29 User Story Mapping and Release Slicing

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-43 card `X3u9GnXsXWdZi7HMJ` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `twaacJRbxTT7Ha8N8`. |
| Static Exercise 29 guard | Pass | Confirmed Exercise 29 preview text, links/anchors, required Markdown sections, README link, 29 exercise cards, 29 checklist sections, and 29 README exercise links. |
| Python HTML parser | Pass | `HTMLParser().feed()` accepted `scrum-course/preview.html`. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8151/preview.html` found the Bài 29 preview sections. |
| Localhost Exercise 29 fetch | Pass | `curl http://127.0.0.1:8151/exercises/29-user-story-mapping-release-slicing.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-44 Scrum Course Exercise 30 Example Mapping and Acceptance Criteria

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-44 card `9cpM7R2ftbhhdvjmC` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `xevmQNakL4m7f4Lgf`. |
| Static Exercise 30 guard | Pass | Confirmed Exercise 30 preview text, links/anchors, required Markdown sections, README link, 30 exercise cards, 30 checklist sections, and 30 README exercise links. |
| Python HTML parser | Pass | `HTMLParser().feed()` accepted `scrum-course/preview.html`. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8152/preview.html` found the Bài 30 preview sections. |
| Localhost Exercise 30 fetch | Pass | `curl http://127.0.0.1:8152/exercises/30-example-mapping-acceptance-criteria.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## PB-45 Scrum Course Exercise 31 Test Strategy and Automation Planning

| Case | Result | Notes |
|------|--------|-------|
| Product Backlog card creation | Pass | Created PB-45 card `HpQNpsYSveaide2TJ` in Product Backlog list `85btszJ2WYPjPH4ov`. |
| Sprint Backlog card creation | Pass | Created Sprint Backlog card `BrDb4zuCPF3GuAgTS`. |
| Static Exercise 31 guard | Pass | Confirmed Exercise 31 preview text, links/anchors, required Markdown sections, README link, 31 exercise cards, 31 checklist sections, and 31 README exercise links. |
| Python HTML parser | Pass | `HTMLParser().feed()` accepted `scrum-course/preview.html`. |
| `git diff --check -- scrum-course/...` | Pass | No whitespace errors in the course artifacts. |
| Localhost preview fetch | Pass | `curl http://127.0.0.1:8153/preview.html` found the Bài 31 preview sections. |
| Localhost Exercise 31 fetch | Pass | `curl http://127.0.0.1:8153/exercises/31-test-strategy-automation-planning.md` found the key Markdown sections. |
| Automated browser screenshot QA | Not run | Playwright is not available in this repo environment; preview was validated through static guards and localhost fetch checks instead. |

## Trello Parity Phase 4 Heartbeat - Runtime Recovery

| Case | Result | Notes |
|------|--------|-------|
| Repo-local Meteor runtime | Pass | Restored tracked `.meteor` files, installed Meteor 3.5.1 under `.tools`, and installed npm dependencies with audit result 0 vulnerabilities. |
| Phase 4 source guard | Pass | `node tests/phase4ViewsSearch.test.cjs` reported 6/6 passed. |
| Whitespace check | Pass | `git diff --check` passed before this report update. |
| WeKan startup | Pass | App is running at `http://localhost:3000` with `WRITABLE_PATH=/Users/apple/Desktop/ex_project/mtips5s_wekan/.meteor/local/writable`. |
| Real frontend evidence | Pass | System Google Chrome captured desktop and mobile screenshots of the real frontend redirecting to `/sign-in` with a rendered login form. |
| Persistent DB snapshot | Blocked | Live MongoDB at `127.0.0.1:3001/meteor` has `users=0`, `boards=0`, `cards=0`, and `cardLocationCount=0`; no mock/seed/fixture data was created. |
| Phase 4 Map acceptance | Blocked | Map still needs a real card location entered or imported through an authorized product path before the phase can be marked Done. |

Evidence directory:
`/Users/apple/Desktop/ex_project/mtips5s_wekan/artifacts/heartbeat-evidence/phase-04/2026-08-18T06-14-00Z/`.

## Trello Parity Phase 5 Heartbeat - Email-to-Inbox Slice

| Case | Result | Notes |
|------|--------|-------|
| Email capture validation helper | Pass | `models/lib/emailInboxCapture.js` normalizes sender allowlists, hashes tokens, rejects unsafe attachment names/MIME/size, and formats email provenance. |
| Server-authoritative route | Pass | `POST /api/inbox/email` verifies token and sender before creating a Personal Inbox card. |
| Provenance protection | Pass | Email provenance card fields are in the schema and direct client rewrites are covered by the existing capture provenance deny guard. |
| Targeted guards | Pass | `node tests/emailInboxCapture.test.cjs` passed 5/5, `node tests/personalInbox.test.cjs` passed 6/6, and `node tests/phase4ViewsSearch.test.cjs` passed 6/6. |
| Whitespace check | Pass | `git diff --check` passed. |
| Real negative API evidence | Pass | Live `POST /api/inbox/email` without a valid token returned `401 {"error":"not-authorized"}` and live MongoDB still had `emailCaptureCards=0`. |
| Real frontend evidence | Blocked | Desktop/mobile screenshots were captured from the real frontend at `http://localhost:3000/sign-in`, but completion still needs a real authenticated user with a generated token and accepted email card visible in `/inbox`. |

Evidence directory:
`/Users/apple/Desktop/ex_project/mtips5s_wekan/artifacts/heartbeat-evidence/phase-05/2026-08-18T06-34-48Z/`.

## UI Default - Apple Glass Pastel

| Case | Result | Notes |
|------|--------|-------|
| Shared default theme | Pass | `DEFAULT_GLOBAL_THEME_COLOR` is `appleglasspastel`, used by the global body/header fallback and non-board sidebar/search fallbacks. |
| Targeted guards | Pass | `node tests/globalThemeColor.test.cjs` passed 8/8, `node tests/appleGlassPastelV2.test.cjs` passed 11/11, `node tests/appleGlassPastelTheme.test.cjs` passed 9/9, `node tests/allBoardsPage.test.cjs` passed 27/27, and `node tests/tenantWiring.test.cjs` passed 33/33. |
| Whitespace check | Pass | `git diff --check` passed. |
| Real frontend evidence | Pass | The running frontend at `http://localhost:3000/sign-in` rendered desktop and mobile with `bodyClass` containing `board-color-appleglasspastel`. |
| Persistent DB snapshot | Pass | Live MongoDB at `127.0.0.1:3001/meteor` had `users=0`, `boards=0`, `settings=1`, and no explicit `settings.themeColor`, proving the new UI came from the app default fallback rather than seed/mock data. |

Evidence directory:
`/Users/apple/Desktop/ex_project/mtips5s_wekan/artifacts/heartbeat-evidence/ui-default/2026-08-18T06-55-00Z/`.

## Trello Parity Phase 4 Heartbeat - Real Map Location Completion

| Case | Result | Notes |
|------|--------|-------|
| Real QA user creation | Pass | The local DB had no usable Map evidence data, so user-authorized real data was created. Frontend registration created a local QA administrator through the product UI; credentials are intentionally omitted. |
| Real board/list creation | Pass | Frontend UI created board `Trello parity real map QA` (`2ceyfdWC9eTReXnj7`) and list `Real locations` (`Htib65SgycsznRBQv`). |
| Real card location | Pass | The UI card composer returned `insert failed errorClass`, so the card/location were created through WeKan's official REST API product surface; MongoDB persisted card `hgwiYDPLhCw8kGrLw` with `Hoan Kiem Lake QA location` at `21.028511, 105.804817`. |
| Frontend Map evidence | Pass | Desktop and mobile screenshots from `http://localhost:3000/b/2ceyfdWC9eTReXnj7/trello-parity-real-map-qa` show Map view, `1 locations`, the real card title, the location name, coordinates, and the marker link to the card. |
| Targeted guards | Pass | `node tests/phase4ViewsSearch.test.cjs` passed 6/6 and `git diff --check` passed. |

Evidence directory:
`/Users/apple/Desktop/ex_project/mtips5s_wekan/artifacts/heartbeat-evidence/phase-04/2026-08-18T07-15-00Z/`.

## Trello Parity Phase 5 Heartbeat - Email-to-Inbox Accepted Email Completion

| Case | Result | Notes |
|------|--------|-------|
| Token creation path | Pass | An authenticated frontend session called `personalInbox.emailToken.rotate` for user `MeAFPZceJJjqMGMmZ`; only the hash persisted, and the raw token was redacted in evidence. |
| Security negative checks | Pass | Live `POST /api/inbox/email` rejected a wrong token with HTTP 401, rejected an unauthorized sender with HTTP 401, and rejected an unsafe attachment with HTTP 400. |
| Accepted email path | Pass | Live `POST /api/inbox/email` accepted sender `qa-sender@example.invalid`, created email card `5rG5PQrzpZhmCfoDY`, and persisted `captureSourceType: email` plus sender/message/attachment provenance. |
| Frontend Inbox evidence | Pass | Desktop and mobile screenshots from `http://localhost:3000/inbox` show the persisted email card, sender provenance, and checked attachment text. |
| Targeted guards | Pass | `node tests/emailInboxCapture.test.cjs` passed 5/5, `node tests/personalInbox.test.cjs` passed 6/6, `node tests/phase4ViewsSearch.test.cjs` passed 6/6, and `git diff --check` passed. |
| Remaining Phase 5 work | In Progress | Email-to-Inbox is complete; still remaining are connector API permission/token validation and reviewable template packages. |

Evidence directory:
`/Users/apple/Desktop/ex_project/mtips5s_wekan/artifacts/heartbeat-evidence/phase-05/2026-08-18T07-18-53Z/`.

## UI Default - Board Pages Use Apple Glass Pastel

| Case | Result | Notes |
|------|--------|-------|
| Root cause | Pass | The first Phase 4 Map screenshot rendered the legacy blue UI because the real QA board persisted `color: belize`; app-level default was already Apple Glass, but board pages honor the board's own color. |
| Source fix | Pass | Added `DEFAULT_BOARD_THEME_COLOR = DEFAULT_GLOBAL_THEME_COLOR`; schema-created boards, REST-created boards, and board color-picker fallbacks now use `appleglasspastel` instead of `BOARD_COLORS[0]`/hard-coded `belize`. |
| Existing evidence board correction | Pass | Authenticated frontend Meteor client update changed board `2ceyfdWC9eTReXnj7` to `appleglasspastel`; no direct DB write was used for the correction. |
| Frontend Map evidence | Pass | Desktop and mobile screenshots from `http://localhost:3000/b/2ceyfdWC9eTReXnj7/trello-parity-real-map-qa` show Apple Glass Pastel while still rendering the persisted real location card. |
| Targeted guards | Pass | `node tests/appleGlassPastelV2.test.cjs` passed 11/11, `node tests/globalThemeColor.test.cjs` passed 8/8, `node tests/phase4ViewsSearch.test.cjs` passed 6/6, and `git diff --check` passed. |

Evidence directory:
`/Users/apple/Desktop/ex_project/mtips5s_wekan/artifacts/heartbeat-evidence/ui-default-board-map/2026-08-18T07-28-21Z/`.

## UI Default - Root Cause Scan for Legacy Theme Regression

| Case | Result | Notes |
|------|--------|-------|
| Runtime default scan | Pass | Scanned for `belize`, `BOARD_COLORS[0]`, and first-category fallback uses. Silent defaults were found in board schema, REST board create, CSV/Jira/Kanboard imports, WeKan/Trello import fallbacks, Personal Inbox helper board creation, and test DB helpers. |
| Runtime fixes | Pass | All silent board defaults now use `DEFAULT_BOARD_THEME_COLOR`, which points to `DEFAULT_GLOBAL_THEME_COLOR` / `appleglasspastel`. |
| Personal Inbox self-heal | Pass | Opening `/inbox` through an authenticated frontend session ran `personalInbox.ensure`; live DB now has the Personal Inbox helper board on `appleglasspastel`. |
| Residual scan | Pass | Remaining `belize` hits are expected: allowed palette/theme tests/docs examples and explicit Trello blue mapping; unknown/missing Trello colors now fall back to Apple Glass. |
| Live DB check | Pass | Live MongoDB has `belizeCount=0` across the two current boards: `Trello parity real map QA` and `^Personal Inbox^` are both `appleglasspastel`. |
| Targeted guards | Pass | `node tests/appleGlassPastelV2.test.cjs` passed 11/11, `node tests/globalThemeColor.test.cjs` passed 8/8, `node tests/personalInbox.test.cjs` passed 6/6, `node tests/phase4ViewsSearch.test.cjs` passed 6/6, `node tests/emailInboxCapture.test.cjs` passed 5/5, and `git diff --check` passed. |

Evidence directory:
`/Users/apple/Desktop/ex_project/mtips5s_wekan/artifacts/heartbeat-evidence/ui-default-root-cause/2026-08-18T07-36-00Z/`.

## Phase 5 Connector API permission/token validation — 2026-08-18T07:37:52Z

| Case | Result | Notes |
|------|--------|-------|
| `node tests/connectorInboxCapture.test.cjs` | Pass | 5/5 helper/source guards for token hashing, type allowlist, origin allowlist, payload URL rejection and route wiring. |
| `node tests/emailInboxCapture.test.cjs` | Pass | 5/5 regression guard for the previous Phase 5 email slice. |
| `node tests/personalInbox.test.cjs` | Pass | 6/6 regression guard for Inbox ownership, provenance and UI wiring. |
| Connector API negative checks | Pass | Wrong token 401, wrong type 401, wrong origin 401, unsafe URL 400; no accepted card created for rejected cases. |
| Connector API accepted capture | Pass | Valid browser connector token/type/origin created card EDqrozK7KpYL2Mjh3 in the real Personal Inbox board. |
| Frontend desktop/mobile evidence | Pass | In-app browser opened http://localhost:3000/inbox and rendered the persisted connector card from MongoDB with Apple Glass theme classes. |
| `git diff --check` | Pass | No whitespace errors after this slice. |

Evidence: /Users/apple/Desktop/ex_project/mtips5s_wekan/artifacts/heartbeat-evidence/phase-05/2026-08-18T07-37-52Z-connector-api/

Remaining Phase 5 work: reviewable template packages.

## Phase 5 Reviewable Template Packages — 2026-08-18T07:47:52Z

| Case | Result | Notes |
|------|--------|-------|
| `node tests/templatePackage.test.cjs` | Pass | 4/4 review schema, unreviewed-field rejection, payload bounds, user-derived server install and rollback source guards. |
| Live API auth negative | Pass | Missing Bearer token rejected with HTTP 401. |
| Live API review negative | Pass | Package with unreviewed `script` card field rejected with HTTP 400 `template-package-unreviewed-field`. |
| Live rollback check | Pass | Rejected package left 0 rejected boards and 0 rejected cards in MongoDB. |
| Live accepted install | Pass | Valid reviewed JSON package created template board `dCAbu4qoRNNyh4y2q`, linked card `8YMRhxNt9LJZGm42E`, 2 lists and 3 cards. |
| Frontend desktop/mobile evidence | Pass | WeKan frontend rendered the persisted template board/cards from MongoDB with `board-color-appleglasspastel`. |
| Final targeted QA | Pass | templatePackage 4/4, connector 5/5, email 5/5, personalInbox 6/6, phase4 6/6, Apple Glass 11/11, global theme 8/8, git diff check pass. |

Evidence: /Users/apple/Desktop/ex_project/mtips5s_wekan/artifacts/heartbeat-evidence/phase-05/2026-08-18T07-47-52Z-template-packages/

Remaining Phase 5 work: none.

## VPS sync — 2026-08-18T09:21:54Z

| Case | Result | Notes |
|------|--------|-------|
| Full bundle rsync/build | Pass | Synced `.build-vps-20260818T091216Z/bundle` to `/opt/mtips5s_wekan/bundle-overlay-trello-parity-20260818T091616Z/` on the VPS and built `mtips5s-wekan:trello-parity-20260818T091616Z`. |
| Container restart | Pass | `wekan-app` was recreated and is running `mtips5s-wekan:trello-parity-20260818T091616Z` on `127.0.0.1:3001->8080`. |
| Public frontend | Pass | `https://trello.1nutnhan.com` returned HTTP 200 and Playwright captured a successful authenticated admin session. |
| API smoke | Pass | `/api/inbox/connector` reached the new connector validation path; `/api/template-packages/install` returned expected unauthenticated 401 JSON. |
| Rollback material | Pass | Previous compose override copied to `/opt/mtips5s_wekan/backups/compose.override.before-trello-parity-20260818T091616Z.yml` before switching image. |

Evidence:
`/Users/apple/Desktop/ex_project/mtips5s_wekan/artifacts/vps-deploy-evidence/2026-08-18T09-21-54-133Z/`.

Note: the image build completed with `npm install --prefix /build/programs/server`
but npm audit reported 5 existing bundle vulnerabilities. Track separately; it
did not block this sync.
