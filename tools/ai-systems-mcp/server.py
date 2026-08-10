#!/usr/bin/env python3
"""MCP server for creating and reading boards/cards in a WeKan instance."""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

import httpx
from mcp.server import MCPServer


class WekanConfigError(ValueError):
    """Raised when the WeKan MCP runtime is missing required configuration."""


class WekanAPIError(RuntimeError):
    """Raised when WeKan returns an HTTP or application-level API error."""


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass
class WekanConfig:
    base_url: str
    api_token: str | None
    user_id: str | None
    username: str | None
    email: str | None
    password: str | None
    timeout_seconds: float
    verify_tls: bool

    @classmethod
    def from_env(cls) -> "WekanConfig":
        return cls(
            base_url=os.getenv("WEKAN_BASE_URL", "http://127.0.0.1:3000").rstrip("/"),
            api_token=os.getenv("WEKAN_API_TOKEN") or None,
            user_id=os.getenv("WEKAN_USER_ID") or None,
            username=os.getenv("WEKAN_USERNAME") or None,
            email=os.getenv("WEKAN_EMAIL") or None,
            password=os.getenv("WEKAN_PASSWORD") or None,
            timeout_seconds=float(os.getenv("WEKAN_TIMEOUT_SECONDS", "20")),
            verify_tls=_env_bool("WEKAN_VERIFY_TLS", True),
        )

    @property
    def can_authenticate(self) -> bool:
        if self.api_token and self.user_id:
            return True
        return bool((self.username or self.email) and self.password)

    def public_view(self) -> dict[str, Any]:
        return {
            "base_url": self.base_url,
            "timeout_seconds": self.timeout_seconds,
            "verify_tls": self.verify_tls,
            "has_api_token": bool(self.api_token),
            "has_user_id": bool(self.user_id),
            "has_username": bool(self.username),
            "has_email": bool(self.email),
            "has_password": bool(self.password),
            "can_authenticate": self.can_authenticate,
        }


class WekanClient:
    def __init__(self, config: WekanConfig):
        self.config = config
        self._api_token = config.api_token
        self._user_id = config.user_id

    @property
    def user_id(self) -> str | None:
        return self._user_id

    async def _login(self) -> None:
        if self._api_token and self._user_id:
            return
        if not (self.config.username or self.config.email) or not self.config.password:
            raise WekanConfigError(
                "Missing WeKan credentials. Set WEKAN_API_TOKEN + WEKAN_USER_ID, "
                "or set WEKAN_USERNAME/WEKAN_EMAIL + WEKAN_PASSWORD."
            )

        body: dict[str, str] = {"password": self.config.password}
        if self.config.email:
            body["email"] = self.config.email
        else:
            body["username"] = self.config.username or ""

        data = await self._request_without_auth("POST", "/users/login", json_body=body)
        if not isinstance(data, dict) or not data.get("token") or not data.get("id"):
            raise WekanAPIError("WeKan login response did not include id and token")

        self._api_token = str(data["token"])
        self._user_id = str(data["id"])

    async def _request_without_auth(
        self,
        method: str,
        path: str,
        *,
        json_body: dict[str, Any] | None = None,
    ) -> Any:
        async with httpx.AsyncClient(
            timeout=self.config.timeout_seconds,
            verify=self.config.verify_tls,
            follow_redirects=True,
        ) as client:
            response = await client.request(
                method,
                f"{self.config.base_url}{path}",
                json=json_body,
                headers={"Accept": "application/json"},
            )
        return self._decode_response(response, method, path)

    async def request(
        self,
        method: str,
        path: str,
        *,
        json_body: dict[str, Any] | None = None,
    ) -> Any:
        await self._login()
        if not self._api_token:
            raise WekanConfigError("Missing WeKan API token after login")

        async with httpx.AsyncClient(
            timeout=self.config.timeout_seconds,
            verify=self.config.verify_tls,
            follow_redirects=True,
        ) as client:
            response = await client.request(
                method,
                f"{self.config.base_url}{path}",
                json=json_body,
                headers={
                    "Accept": "application/json",
                    "Authorization": f"Bearer {self._api_token}",
                },
            )
        return self._decode_response(response, method, path)

    def _decode_response(self, response: httpx.Response, method: str, path: str) -> Any:
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            payload: Any = response.json()
        else:
            payload = response.text

        if response.status_code >= 400:
            reason = payload
            if isinstance(payload, dict):
                reason = payload.get("reason") or payload.get("error") or payload
            raise WekanAPIError(f"{method} {path} failed with HTTP {response.status_code}: {reason}")

        if isinstance(payload, dict) and "error" in payload and "_id" not in payload:
            reason = payload.get("reason") or payload.get("message") or payload.get("error")
            raise WekanAPIError(f"{method} {path} failed: {reason}")

        return payload


def _tool_error(error: Exception) -> dict[str, Any]:
    return {
        "ok": False,
        "error": type(error).__name__,
        "message": str(error),
    }


async def _safe_call(operation: str, func) -> dict[str, Any]:
    try:
        result = await func()
        if isinstance(result, dict):
            return {"ok": True, **result}
        return {"ok": True, operation: result}
    except Exception as error:  # noqa: BLE001 - MCP tools should return useful errors.
        return _tool_error(error)


def _clean_body(values: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in values.items() if value is not None}


async def _default_swimlane_id(client: WekanClient, board_id: str) -> str:
    swimlanes = await client.request("GET", f"/api/boards/{board_id}/swimlanes")
    if not isinstance(swimlanes, list) or not swimlanes:
        raise WekanAPIError(f"Board {board_id} does not have an active swimlane")
    first = swimlanes[0]
    if not isinstance(first, dict) or not first.get("_id"):
        raise WekanAPIError(f"Board {board_id} returned an invalid swimlane list")
    return str(first["_id"])


async def _visible_user_boards(client: WekanClient) -> list[Any]:
    await client._login()
    if not client.user_id:
        raise WekanConfigError("Missing WeKan user id after login")
    user_id = quote(client.user_id, safe="")
    boards = await client.request("GET", f"/api/users/{user_id}/boards")
    if not isinstance(boards, list):
        raise WekanAPIError("WeKan user boards response was not a list")
    return boards


def _server() -> MCPServer:
    config = WekanConfig.from_env()
    client = WekanClient(config)

    server = MCPServer(
        name="wekan-mcp",
        title="WeKan Board MCP",
        description="Create and inspect boards, lists, and cards in this WeKan instance.",
        instructions=(
            "Use wekan_health_status to verify connectivity. Then use list_boards, "
            "create_board, list_swimlanes, list_lists, create_list, list_cards, "
            "and create_card to manage the WeKan board data."
        ),
        version="0.2.1",
    )

    @server.tool()
    async def wekan_health_status() -> dict[str, Any]:
        """Check WeKan reachability and whether MCP auth is configured."""

        async def run() -> dict[str, Any]:
            app_status = await client._request_without_auth("GET", "/")
            auth_probe: dict[str, Any] | None = None
            if config.can_authenticate:
                boards = await _visible_user_boards(client)
                auth_probe = {
                    "authenticated": True,
                    "board_discovery_endpoint": "/api/users/{userId}/boards",
                    "boards_visible": len(boards),
                    "user_id": client.user_id,
                }
            return {
                "base_url": config.base_url,
                "app_reachable": isinstance(app_status, str) and len(app_status) > 0,
                "auth": config.public_view(),
                "auth_probe": auth_probe,
            }

        return await _safe_call("health", run)

    @server.tool()
    async def list_boards() -> dict[str, Any]:
        """List boards visible to the authenticated WeKan user."""

        async def run() -> dict[str, Any]:
            boards = await _visible_user_boards(client)
            return {
                "count": len(boards),
                "boards": boards,
            }

        return await _safe_call("boards", run)

    @server.tool()
    async def get_board(board_id: str) -> dict[str, Any]:
        """Read one board by id."""

        async def run() -> dict[str, Any]:
            board = await client.request("GET", f"/api/boards/{board_id}")
            return {"board": board}

        return await _safe_call("board", run)

    @server.tool()
    async def create_board(
        title: str,
        permission: str = "private",
        owner: str | None = None,
        color: str = "belize",
    ) -> dict[str, Any]:
        """Create a board in WeKan."""

        async def run() -> dict[str, Any]:
            if not title.strip():
                raise WekanConfigError("title is required")
            body = _clean_body(
                {
                    "title": title.strip(),
                    "permission": permission,
                    "owner": owner,
                    "color": color,
                }
            )
            created = await client.request("POST", "/api/boards", json_body=body)
            return {
                "board": created,
                "board_id": created.get("_id") if isinstance(created, dict) else None,
                "default_swimlane_id": (
                    created.get("defaultSwimlaneId") if isinstance(created, dict) else None
                ),
            }

        return await _safe_call("board", run)

    @server.tool()
    async def list_lists(board_id: str) -> dict[str, Any]:
        """List non-archived lists on a board."""

        async def run() -> dict[str, Any]:
            lists = await client.request("GET", f"/api/boards/{board_id}/lists")
            return {
                "count": len(lists) if isinstance(lists, list) else None,
                "lists": lists,
            }

        return await _safe_call("lists", run)

    @server.tool()
    async def list_swimlanes(board_id: str) -> dict[str, Any]:
        """List non-archived swimlanes on a board."""

        async def run() -> dict[str, Any]:
            swimlanes = await client.request("GET", f"/api/boards/{board_id}/swimlanes")
            return {
                "count": len(swimlanes) if isinstance(swimlanes, list) else None,
                "swimlanes": swimlanes,
            }

        return await _safe_call("swimlanes", run)

    @server.tool()
    async def create_list(
        board_id: str,
        title: str,
        swimlane_id: str | None = None,
    ) -> dict[str, Any]:
        """Create a list on a board."""

        async def run() -> dict[str, Any]:
            if not title.strip():
                raise WekanConfigError("title is required")
            created = await client.request(
                "POST",
                f"/api/boards/{board_id}/lists",
                json_body=_clean_body({"title": title.strip(), "swimlaneId": swimlane_id}),
            )
            return {
                "list": created,
                "list_id": created.get("_id") if isinstance(created, dict) else None,
            }

        return await _safe_call("list", run)

    @server.tool()
    async def list_cards(board_id: str, list_id: str) -> dict[str, Any]:
        """List non-archived cards in a board list."""

        async def run() -> dict[str, Any]:
            cards = await client.request(
                "GET",
                f"/api/boards/{board_id}/lists/{list_id}/cards",
            )
            return {
                "count": len(cards) if isinstance(cards, list) else None,
                "cards": cards,
            }

        return await _safe_call("cards", run)

    @server.tool()
    async def create_card(
        board_id: str,
        list_id: str,
        title: str,
        description: str = "",
        author_id: str | None = None,
        swimlane_id: str | None = None,
        members: list[str] | None = None,
        assignees: list[str] | None = None,
        received_at: str | None = None,
        start_at: str | None = None,
        due_at: str | None = None,
        end_at: str | None = None,
    ) -> dict[str, Any]:
        """Create a card in a board list."""

        async def run() -> dict[str, Any]:
            if not title.strip():
                raise WekanConfigError("title is required")
            effective_author = author_id or client.user_id
            if not effective_author:
                await client._login()
                effective_author = client.user_id
            if not effective_author:
                raise WekanConfigError(
                    "author_id is required when WEKAN_USER_ID is not configured and login is unavailable"
                )
            effective_swimlane_id = swimlane_id or await _default_swimlane_id(client, board_id)

            body = _clean_body(
                {
                    "title": title.strip(),
                    "description": description,
                    "authorId": effective_author,
                    "swimlaneId": effective_swimlane_id,
                    "members": members,
                    "assignees": assignees,
                    "receivedAt": received_at,
                    "startAt": start_at,
                    "dueAt": due_at,
                    "endAt": end_at,
                }
            )
            created = await client.request(
                "POST",
                f"/api/boards/{board_id}/lists/{list_id}/cards",
                json_body=body,
            )
            return {
                "card": created,
                "card_id": created.get("_id") if isinstance(created, dict) else None,
                "author_id": effective_author,
                "swimlane_id": effective_swimlane_id,
            }

        return await _safe_call("card", run)

    @server.resource(
        "wekan://config",
        name="WeKan MCP Config",
        description="Safe view of the WeKan MCP runtime configuration.",
        mime_type="application/json",
    )
    def wekan_config() -> str:
        """Read runtime configuration without exposing tokens or passwords."""
        return json.dumps(config.public_view(), ensure_ascii=False, indent=2)

    @server.resource(
        "wekan://quickstart",
        name="WeKan MCP Quickstart",
        description="How to use the WeKan board/card tools.",
        mime_type="text/markdown",
    )
    def quickstart() -> str:
        """Read short usage notes."""
        return (
            "# WeKan MCP\n\n"
            "Set `WEKAN_BASE_URL` and either `WEKAN_API_TOKEN` + `WEKAN_USER_ID`, "
            "or `WEKAN_USERNAME`/`WEKAN_EMAIL` + `WEKAN_PASSWORD`. Call "
            "`wekan_health_status`, then create boards/lists/cards with the exposed tools.\n"
        )

    @server.prompt()
    def board_planning_prompt(goal: str) -> str:
        """Create a concise prompt for turning a project goal into WeKan cards."""
        return (
            "Turn this project goal into a practical WeKan board plan. Return the "
            "board title, list names, and card titles/descriptions.\n\n"
            f"Goal:\n{goal}"
        )

    return server


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the WeKan MCP server.")
    parser.add_argument(
        "--transport",
        choices=("stdio", "sse", "streamable-http"),
        default=os.getenv("MCP_TRANSPORT", "stdio"),
        help="MCP transport to use. Defaults to stdio.",
    )
    parser.add_argument("--host", default=os.getenv("MCP_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MCP_PORT", "8000")))
    parser.add_argument(
        "--streamable-http-path",
        default=os.getenv("MCP_STREAMABLE_HTTP_PATH", "/mcp"),
        help="Path for streamable HTTP transport. Defaults to /mcp.",
    )
    parser.add_argument(
        "--stateful-http",
        action="store_true",
        help="Require MCP clients to preserve session ids for streamable HTTP.",
    )
    args = parser.parse_args()

    try:
        server = _server()
    except WekanConfigError as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        raise SystemExit(2) from exc

    if args.transport == "stdio":
        server.run(transport="stdio")
    elif args.transport == "sse":
        server.run(transport="sse", host=args.host, port=args.port)
    else:
        stateless_http = _env_bool("MCP_STATELESS_HTTP", True) and not args.stateful_http
        server.run(
            transport="streamable-http",
            host=args.host,
            port=args.port,
            streamable_http_path=args.streamable_http_path,
            stateless_http=stateless_http,
        )


if __name__ == "__main__":
    main()
