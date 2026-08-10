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
