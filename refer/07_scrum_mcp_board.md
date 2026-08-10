# 07. Scrum MCP Board

## MCP endpoint

- URL: `https://trello.1nutrouter.com/mcp`
- Codex global MCP name: `wekan-scrum`
- Project MCP name: `wekan_scrum`
- Transport: streamable HTTP

## Production board

- Title: `Scrum - MTips5s - 2026-08-10`
- Board ID: `KAnSasnYH66wNfKho`
- Default swimlane ID: `fpKdbHyuHg5aQgC34`
- Owner/member: `admin`
- Permission: `private`

## Lists

| List | ID |
|------|----|
| Product Backlog | `85btszJ2WYPjPH4ov` |
| Sprint Backlog | `vZmjmjL4CXgfjeHzk` |
| In Progress | `aDdGaXEBZciXyzcNG` |
| Review / QA | `hGqp8HcAKj2LQfpoR` |
| Done | `kMJdKitRc4ZJRbBmL` |
| Blocked | `s4dHmoiFhrcmdeJFP` |

## Starter cards

| List | Card | ID |
|------|------|----|
| Product Backlog | Product Vision & Goal | `jnSaux642MYjjrTY6` |
| Product Backlog | Epics & User Stories | `RKwvfZu9YjPjstTGW` |
| Sprint Backlog | Sprint Planning | `z8zi8t4T75daQ2jws` |
| In Progress | Daily Scrum Cadence | `tBCdQZ76B7sPkBG3r` |
| Review / QA | Sprint Review Checklist | `GSXL6crmtQjQoXLnp` |
| Review / QA | Retrospective Notes | `HfcQrGLffbjZeyoqt` |
| Done | Definition of Done | `eYAZi7GnaGzAQEwkz` |
| Blocked | Blocker Triage | `S62DZ8sTiqmdL44EZ` |

## Verification notes

- `initialize` passed.
- `tools/list` exposed WeKan board/list/card tools.
- `wekan_health_status` authenticated as `admin`.
- `get_board` confirmed board membership and private permission.
- `list_lists` confirmed the 6 Scrum columns.
- `list_cards` confirmed Product Backlog starter cards.

`list_boards` currently returns `count: 0`; use direct board ID operations until
that API behavior is fixed or clarified.
