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
