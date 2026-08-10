# WeKan MCP

MCP server nay expose board/list/card tools cho WeKan, ung dung Trello-like cua
du an. Endpoint nay KHONG ket noi den Trello official va khong can Trello API
key.

Production endpoint:

```text
https://trello.1nutrouter.com/mcp
```

Transport:

```text
streamable-http
```

Server-side MCP da tu xu ly WeKan auth. Agent ket noi MCP chi can goi tools; dung
gui Trello token/key.

## For Agents

Neu client ho tro remote MCP URL, cau hinh:

```json
{
  "mcpServers": {
    "wekan": {
      "url": "https://trello.1nutrouter.com/mcp",
      "transport": "streamable-http"
    }
  }
}
```

Neu client yeu cau headers cho streamable HTTP, dung:

```json
{
  "Accept": "application/json, text/event-stream",
  "Content-Type": "application/json"
}
```

Endpoint production chay stateless HTTP de tranh loi `400 Missing session ID` voi
nhung client khong giu MCP session header tot.

## Tool List

- `wekan_health_status` - kiem tra MCP co ket noi duoc den WeKan REST API khong.
- `list_boards` - liet ke board ma user server-side nhin thay, bao gom private
  board cua user. MCP dung `/api/users/:userId/boards` cho viec nay; WeKan
  `/api/boards` chi list public boards.
- `get_board` - doc chi tiet mot board theo `board_id`.
- `create_board` - tao board moi.
- `list_swimlanes` - liet ke swimlane trong board.
- `list_lists` - liet ke list trong board.
- `create_list` - tao list trong board.
- `list_cards` - liet ke card trong list.
- `create_card` - tao card trong list. Neu agent khong truyen
  `swimlane_id`, MCP tu lay default swimlane cua board.

## Common Workflow

1. Kiem tra ket noi:

```json
{
  "name": "wekan_health_status",
  "arguments": {}
}
```

2. Tao board:

```json
{
  "name": "create_board",
  "arguments": {
    "title": "My Project Board",
    "permission": "private"
  }
}
```

Response quan trong:

```json
{
  "ok": true,
  "board_id": "...",
  "default_swimlane_id": "..."
}
```

3. Tao list:

```json
{
  "name": "create_list",
  "arguments": {
    "board_id": "...",
    "title": "Todo"
  }
}
```

Response quan trong:

```json
{
  "ok": true,
  "list_id": "..."
}
```

4. Tao card:

```json
{
  "name": "create_card",
  "arguments": {
    "board_id": "...",
    "list_id": "...",
    "title": "Write first draft",
    "description": "Short, actionable card description."
  }
}
```

Response quan trong:

```json
{
  "ok": true,
  "card_id": "...",
  "author_id": "admin",
  "swimlane_id": "..."
}
```

5. Xac minh card:

```json
{
  "name": "list_cards",
  "arguments": {
    "board_id": "...",
    "list_id": "..."
  }
}
```

## Tool Arguments

`create_board`:

```json
{
  "title": "Required board title",
  "permission": "private",
  "owner": null,
  "color": "belize"
}
```

`create_list`:

```json
{
  "board_id": "required",
  "title": "required",
  "swimlane_id": null
}
```

`create_card`:

```json
{
  "board_id": "required",
  "list_id": "required",
  "title": "required",
  "description": "",
  "author_id": null,
  "swimlane_id": null,
  "members": null,
  "assignees": null,
  "received_at": null,
  "start_at": null,
  "due_at": null,
  "end_at": null
}
```

Date fields should be ISO-like date strings accepted by WeKan, for example
`2026-08-10T09:00:00.000Z`.

## Raw HTTP Smoke Tests

Initialize:

```sh
curl -sS https://trello.1nutrouter.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": { "name": "curl-smoke", "version": "1" }
    }
  }'
```

List tools:

```sh
curl -sS https://trello.1nutrouter.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

Call health:

```sh
curl -sS https://trello.1nutrouter.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "wekan_health_status",
      "arguments": {}
    }
  }'
```

Healthy response should include:

```json
{
  "ok": true,
  "base_url": "http://wekan-ui:8080",
  "auth_probe": {
    "authenticated": true,
    "user_id": "admin"
  }
}
```

## Error Handling

Tools return structured JSON. Successful calls return `ok: true`. Failed calls
return:

```json
{
  "ok": false,
  "error": "ErrorClass",
  "message": "Human readable reason"
}
```

Common cases:

- `ConnectError` - MCP container cannot reach WeKan. Check Docker network and
  `WEKAN_BASE_URL`.
- `Missing WeKan credentials` - server env is missing token or login credentials.
- `Swimlane ID is required` - old server version, or direct WeKan REST call did
  not include `swimlaneId`. Use the MCP `create_card` tool; it fills default
  swimlane automatically.
- `400 Missing session ID` - client is speaking stateful streamable HTTP. The
  production server is configured stateless; reconnect to the production endpoint
  or verify the request path is exactly `/mcp`.

## Local Configuration

Set base URL:

```sh
export WEKAN_BASE_URL=http://127.0.0.1:3000
```

Then configure auth by token:

```sh
export WEKAN_API_TOKEN=...
export WEKAN_USER_ID=...
```

Or let the MCP server log in automatically:

```sh
export WEKAN_USERNAME=admin
export WEKAN_PASSWORD=...
# or WEKAN_EMAIL=admin@example.com
```

Optional settings:

```sh
export WEKAN_TIMEOUT_SECONDS=20
export WEKAN_VERIFY_TLS=true
export MCP_STATELESS_HTTP=true
```

## Install Locally

```sh
cd tools/ai-systems-mcp
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
```

## Run Locally

For local MCP clients:

```sh
python server.py --transport stdio
```

For streamable HTTP:

```sh
python server.py --transport streamable-http --host 127.0.0.1 --port 8000
```

The streamable HTTP path defaults to `/mcp`.

## Local Smoke Test

List MCP tools/resources and call the health tool:

```sh
python test_client.py
```

Also call `list_boards` when credentials are configured:

```sh
python test_client.py --call-boards
```

`list_boards` should include private boards owned by or shared with the
authenticated user. If it returns `0` while `get_board` by a known private board
id works, rebuild/restart the MCP server so it is using
`/api/users/:userId/boards` instead of the public-only `/api/boards` endpoint.

## Docker Runtime

Production compose maps the container to `127.0.0.1:18080` by default:

```sh
cd tools/ai-systems-mcp
docker compose up -d --build
```

By default compose joins the external Docker network
`WEKAN_DOCKER_NETWORK=wekan-ui_wekan-ui` and reaches WeKan at
`WEKAN_BASE_URL=http://wekan-ui:8080`. Override those values when the WeKan
container/network uses different names.
