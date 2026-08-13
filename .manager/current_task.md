# Current Task

- Task ID: PB-45
- Title: Scrum Course Exercise 31 Test Strategy and Automation Planning
- Owner: Codex
- Status: Implemented and validated locally; not staged or committed.
- Goal: Add a thirty-first Scrum Course exercise that helps learners turn
  acceptance criteria and testable scenarios into a risk-based test strategy,
  automation plan, regression coverage, and CI signal policy.
- Scope: `scrum-course/README.md`,
  `scrum-course/exercises/31-test-strategy-automation-planning.md`, and
  `scrum-course/preview.html`.
- Product Backlog card: HpQNpsYSveaide2TJ on board KAnSasnYH66wNfKho.
- Sprint Backlog card: BrDb4zuCPF3GuAgTS.
- Review checkpoint card: r9b7WdPXSZfmZd6Rd.
- Verification:
  - Static guard confirmed Exercise 31 preview text, links/anchors, required
    Markdown sections, README link, 31 exercise cards, 31 checklist sections,
    and 31 README exercise links.
  - Python HTML parser accepted `scrum-course/preview.html`.
  - `curl http://127.0.0.1:8153/preview.html` served the new Bài 31 sections.
  - `curl http://127.0.0.1:8153/exercises/31-test-strategy-automation-planning.md`
    served the key Exercise 31 Markdown sections.
  - `git diff --check -- scrum-course/README.md scrum-course/exercises/31-test-strategy-automation-planning.md scrum-course/preview.html`
    passed.
- Runtime note: preview was served at
  `http://127.0.0.1:8153/preview.html`; the localhost server was stopped after
  validation.
- Previous course sprints:
  - PB-16 Scrum Course Exercise 2 Preview Polish:
    x2RM5m7bRpXWYdQYC.
  - PB-17 Scrum Course Exercise 3 Sprint Planning Playbook:
    qRqn42qrQf6bLMYSD.
  - PB-18 Scrum Course Exercise 4 Review and Retro Feedback Loop:
    Y7fti3r3sxSuMEPKd.
  - PB-19 Scrum Course Exercise 5 Release Readiness and Handoff:
    fwqYxcbhKGCyobATY.
  - PB-20 Scrum Course Exercise 6 Metrics and Improvement Loop:
    53pXb9wiTRSQwAaRn.
  - PB-21 Scrum Course Exercise 7 Roadmap and Prioritization:
    qgrvQxyNch7DQFhMQ.
  - PB-22 Scrum Course Exercise 8 Execution Planning and Capacity:
    t4WNKAKa8D3TuGb4h.
  - PB-23 Scrum Course Exercise 9 Daily Scrum and Blocker Coordination:
    ZonAi5mXrEFtvpDxS.
  - PB-24 Scrum Course Exercise 10 Sprint Health and Forecasting:
    WMm6bDt2Cwx67AxTw.
  - PB-25 Scrum Course Exercise 11 Sprint Recovery and Scope Reset:
    zss4tZe9SCD3YkZ75.
  - PB-26 Scrum Course Exercise 12 Retro Action Tracking and Improvement
    Backlog: JEzHeKBkD9QsQd5dD.
  - PB-27 Scrum Course Exercise 13 Backlog Aging and Cleanup:
    8pjRtDjdwRqXc26Wt.
  - PB-28 Scrum Course Exercise 14 Planning Poker and Estimate Calibration:
    f4BetY7vsYfLP4GzE.
  - PB-29 Scrum Course Exercise 15 Working Agreement and Team Operating Rules:
    5JwQkoPaAFg9QgDxu.
  - PB-30 Scrum Course Exercise 16 Dependency Mapping and Risk Board:
    7B9cWGLnq2FtvtMKG.
  - PB-31 Scrum Course Exercise 17 Stakeholder Alignment and Review Prep:
    bpFeGT2Dk6XY72WMC.
  - PB-32 Scrum Course Exercise 18 Facilitation and Decision Deadlock
    Resolution: HjvGKhYhmDQcYYcJi.
  - PB-33 Scrum Course Exercise 19 Cross-functional Swarming and Flow Rescue:
    vSuXhrBToD5LEgfyn.
  - PB-34 Scrum Course Exercise 20 Knowledge Sharing and Bus Factor Reduction:
    wNJpnWooxTRK8iPBu.
  - PB-35 Scrum Course Exercise 21 Technical Debt Mapping and Quality
    Investment: M7KMhZfHGkE4RXBYx.
  - PB-36 Scrum Course Exercise 22 Quality Gates and Continuous Integration:
    yhahkfZfeFQPkC3ch.
  - PB-37 Scrum Course Exercise 23 Incident Response and Production Learning:
    Hky6vHo2jB9q7eyZY.
  - PB-38 Scrum Course Exercise 24 SLOs and Operational Readiness:
    bBgTnK6R6cwmb24Wb.
  - PB-39 Scrum Course Exercise 25 Release Strategy and Progressive Rollout:
    RtbDBbC7oLFGDvMdN.
  - PB-40 Scrum Course Exercise 26 Product Adoption and Post-launch Feedback:
    AxDqDJ3XxoWBntmNz.
  - PB-41 Scrum Course Exercise 27 Experiment Design and A/B Testing:
    uMpJt4shK7nRcYrBN.
  - PB-42 Scrum Course Exercise 28 Product Discovery and Opportunity Mapping:
    j2wX997x62Czx8DRy.
  - PB-43 Scrum Course Exercise 29 User Story Mapping and Release Slicing:
    B6C6gQ8MC3uiFKqAe.
  - PB-44 Scrum Course Exercise 30 Example Mapping and Acceptance Criteria:
    S3MhSdpW3BctMHLDz.
- PB-15 note: Deploy MCP Board Discovery Fix remains blocked by remote service
  access/Docker runtime; handoff checkpoint card gCR3Qs48jwMSyy4vS records the
  required deploy command and verification.
- Previous sprint: PB-44 Scrum Course Exercise 30 Example Mapping and
  Acceptance Criteria.
- Next step: Decide whether to stage/commit the Scrum Course files or continue
  the next course backlog item.
- Last update: 2026-08-11
