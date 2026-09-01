# WeKan MCP

MCP server nay expose board/list/sprint/task/card tools cho WeKan. Sprint duoc
anh xa vao swimlane va task duoc anh xa vao checklist item, nen du lieu tao qua
MCP hien thi truc tiep trong giao dien WeKan. Endpoint nay KHONG ket noi den
Trello official va khong can Trello API key.

The server is local-only by default:

```text
http://127.0.0.1:8000/mcp
```

Transport:

```text
streamable-http
```

Voi streamable HTTP, moi user tao API key rieng tai WeKan `/mcp`. MCP doc
`x-api-key`, chuyen key den WeKan de xac dinh user va chi thao tac voi dung
quyen board cua user do. WeKan chi luu SHA-256 hash, key tu het han, co the thu
hoi rieng va bi gioi han 60 tool calls/phut. Stdio local van co the dung
server-side WeKan credentials tu environment.

## For Agents

Neu client ho tro remote MCP URL, cau hinh:

```json
{
  "mcpServers": {
    "wekan": {
      "url": "http://127.0.0.1:8000/mcp",
      "transport": "streamable-http",
      "headers": {
        "x-api-key": "wk_mcp_..."
      }
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

Endpoint local chay stateless HTTP de tranh loi `400 Missing session ID` voi
nhung client khong giu MCP session header tot.

## Tool List

- `wekan_health_status` - kiem tra MCP co ket noi duoc den WeKan REST API khong.
- `list_boards` - liet ke board ma user server-side nhin thay, bao gom private
  board cua user. MCP dung `/api/users/:userId/boards` cho viec nay; WeKan
  `/api/boards` chi list public boards.
- `get_board` - doc chi tiet mot board theo `board_id`.
- `create_board` - tao board moi.
- `list_swimlanes` - liet ke swimlane trong board.
- `list_sprints`, `get_sprint`, `create_sprint`, `update_sprint` - doc, tao va
  doi ten sprint; moi sprint la mot WeKan swimlane.
- `list_lists` - liet ke list trong board.
- `create_list` - tao list trong board.
- `list_cards` - liet ke card trong list.
- `get_card` - doc chi tiet mot card theo id.
- `create_card` - tao card trong list. Neu agent khong truyen
  `swimlane_id`, MCP tu lay default swimlane cua board.
- `update_card` - sua card hoac chuyen card sang list/sprint khac trong cung
  board.
- `list_checklists`, `create_checklist` - doc va tao checklist tren card.
- `list_tasks`, `create_task`, `update_task` - doc, tao, doi ten va hoan tat
  task; moi task la mot checklist item.

MCP khong expose tool xoa. Neu can xoa du lieu, hay dung giao dien WeKan hoac
REST API trong mot quy trinh co buoc xac nhan rieng.

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

## WeKan MCP Tab

WeKan co tab `MCP Connections` tai `/mcp`. Tab nay hien endpoint va cau hinh
JSON de client sao chep. User dat ten, chon han 30/90/365 ngay, tao key va
nhin thay secret DUNG MOT LAN. Danh sach sau do chi hien prefix, ngay tao, ngay
het han, lan dung gan nhat va nut thu hoi.

Dat URL public tren **WeKan app container**, khong phai MCP container:

```sh
export MCP_PUBLIC_URL=https://wekan.example.com/mcp
# Optional: set a positive integer only when a daily create limit is wanted.
# export MCP_DAILY_CREATE_LIMIT=100
```

URL phai la URL `http` hoac `https` tuyet doi. Neu bien nay khong co hoac sai,
tab van mo duoc nhung hien trang thai `Not configured`. URL public thuong la
route cua authenticated reverse proxy chuyen tiep den MCP container o
ngoai. Tab cung hien dashboard usage 90 ngay: tong tool calls, luot doc/tra du
lieu va create requested/success/failed. Mac dinh khong gioi han luot tao.
Dat `MCP_DAILY_CREATE_LIMIT` thanh mot so nguyen duong neu can quota theo moi
user moi ngay theo mui gio Asia/Ho_Chi_Minh. Khi co quota, moi create request
deu duoc tinh, ke ca request that bai, de retry khong the vuot gioi han.
`127.0.0.1:18080`. API key la lop xac thuc cua MCP; TLS/reverse proxy van bat
buoc de key khong di qua mang duoi dang plaintext.

## Raw HTTP Smoke Tests

Initialize:

```sh
curl -sS http://127.0.0.1:8000/mcp \
  -H 'x-api-key: wk_mcp_...' \
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
curl -sS http://127.0.0.1:8000/mcp \
  -H 'x-api-key: wk_mcp_...' \
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
curl -sS http://127.0.0.1:8000/mcp \
  -H 'x-api-key: wk_mcp_...' \
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
- `Missing MCP API key` - HTTP tool call does not include `x-api-key` or a
  `Bearer wk_mcp_...` header.
- `rate limit exceeded` - one API key exceeded 60 tool calls in the current
  minute.
- `Swimlane ID is required` - old server version, or direct WeKan REST call did
  not include `swimlaneId`. Use the MCP `create_card` tool; it fills default
  swimlane automatically.
- `400 Missing session ID` - client is speaking stateful streamable HTTP. The
  server is configured stateless; reconnect to the configured endpoint
  or verify the request path is exactly `/mcp`.

## Local Configuration

Set base URL:

```sh
export WEKAN_BASE_URL=http://127.0.0.1:3000
```

For streamable HTTP, create a key in WeKan `/mcp` and put it in the client's
`x-api-key` header. For trusted local stdio, configure auth by login token:

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

Compose maps the container to `127.0.0.1:18080` by default:

```sh
cd tools/ai-systems-mcp
docker compose up -d --build
```

By default compose joins the external Docker network
`WEKAN_DOCKER_NETWORK=wekan-ui_wekan-ui` and reaches WeKan at
`WEKAN_BASE_URL=http://wekan-ui:8080`. Override those values when the WeKan
container/network uses different names.

Keep `MCP_BIND=127.0.0.1` unless an authenticated reverse proxy is in front of
the service. TLS alone is not client authentication: a public unauthenticated
MCP endpoint would give anyone the WeKan privileges configured in the server.
