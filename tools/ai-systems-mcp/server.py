#!/usr/bin/env python3
"""MCP server for working with WeKan boards, sprints, tasks, and cards."""

from __future__ import annotations

import argparse
import contextvars
import hashlib
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

import httpx
from mcp.server import MCPServer
from mcp.server.mcpserver import Context


_request_api_key: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "wekan_mcp_api_key",
    default=None,
)
_request_user_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "wekan_mcp_user_id",
    default=None,
)
_request_key_error: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "wekan_mcp_key_error",
    default=None,
)
_rate_windows: dict[str, tuple[int, int]] = {}
MCP_RATE_LIMIT_PER_MINUTE = 60


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
        return _request_user_id.get() or self._user_id

    async def _login(self) -> None:
        if _request_key_error.get():
            raise WekanConfigError(_request_key_error.get() or "Invalid MCP API key")
        api_key = _request_api_key.get()
        if api_key:
            if not _request_user_id.get():
                identity = await self._request_without_auth(
                    "GET",
                    "/api/mcp/whoami",
                    headers={"x-api-key": api_key},
                )
                if not isinstance(identity, dict) or not identity.get("userId"):
                    raise WekanAPIError("MCP API key did not resolve to a WeKan user")
                _request_user_id.set(str(identity["userId"]))
            return
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
        headers: dict[str, str] | None = None,
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
                headers={"Accept": "application/json", **(headers or {})},
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
        api_key = _request_api_key.get()
        if not api_key and not self._api_token:
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
                headers=(
                    {"Accept": "application/json", "x-api-key": api_key}
                    if api_key
                    else {
                        "Accept": "application/json",
                        "Authorization": f"Bearer {self._api_token}",
                    }
                ),
            )
        return self._decode_response(response, method, path)

    async def record_usage(self, tool: str, action: str, phase: str) -> None:
        """Record one API-key MCP event in WeKan's daily usage dashboard."""
        api_key = _request_api_key.get()
        if not api_key:
            return
        await self._request_without_auth(
            "POST",
            "/api/mcp/usage/event",
            json_body={"tool": tool, "action": action, "phase": phase},
            headers={"x-api-key": api_key},
        )

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


async def _safe_call(
    client: WekanClient,
    tool: str,
    action: str,
    operation: str,
    func,
) -> dict[str, Any]:
    usage_started = False
    try:
        await client.record_usage(tool, action, "requested")
        usage_started = True
        result = await func()
        try:
            await client.record_usage(tool, action, "success")
        except Exception:  # noqa: BLE001 - tracking must not hide a successful tool result.
            pass
        if isinstance(result, dict):
            return {"ok": True, **result}
        return {"ok": True, operation: result}
    except Exception as error:  # noqa: BLE001 - MCP tools should return useful errors.
        if usage_started:
            try:
                await client.record_usage(tool, action, "failed")
            except Exception:  # noqa: BLE001 - preserve the original tool error.
                pass
        return _tool_error(error)


def _clean_body(values: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in values.items() if value is not None}


def _resource_id(value: str, name: str) -> str:
    """Validate an opaque WeKan id before placing it in a REST path."""
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9]+", value):
        raise WekanConfigError(f"{name} must be a non-empty alphanumeric WeKan id")
    return quote(value, safe="")


def _activate_request_key(ctx: Context) -> None:
    """Bind and rate-limit one HTTP request's user-owned MCP API key."""
    headers = ctx.headers
    api_key: str | None = None
    _request_key_error.set(None)
    if headers is not None:
        api_key = headers.get("x-api-key") or headers.get("X-Api-Key")
        authorization = headers.get("authorization") or headers.get("Authorization")
        if not api_key and authorization:
            match = re.fullmatch(r"Bearer\s+(wk_mcp_.+)", authorization, re.IGNORECASE)
            if match:
                api_key = match.group(1)
        if not api_key:
            _request_key_error.set(
                "Missing MCP API key in x-api-key or Authorization header"
            )

    _request_api_key.set(api_key)
    _request_user_id.set(None)
    if not api_key:
        return

    key_id = hashlib.sha256(api_key.encode("utf-8")).hexdigest()
    minute = int(time.time() // 60)
    window, count = _rate_windows.get(key_id, (minute, 0))
    if window != minute:
        window, count = minute, 0
    count += 1
    _rate_windows[key_id] = (window, count)
    if count > MCP_RATE_LIMIT_PER_MINUTE:
        _request_key_error.set("MCP API key rate limit exceeded (60 calls per minute)")


async def _default_swimlane_id(client: WekanClient, board_id: str) -> str:
    board_path = _resource_id(board_id, "board_id")
    swimlanes = await client.request("GET", f"/api/boards/{board_path}/swimlanes")
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
    user_id = _resource_id(client.user_id, "user_id")
    boards = await client.request("GET", f"/api/users/{user_id}/boards")
    if not isinstance(boards, list):
        raise WekanAPIError("WeKan user boards response was not a list")
    return boards


def _server() -> MCPServer:
    config = WekanConfig.from_env()
    client = WekanClient(config)

    server = MCPServer(
        name="wekan-mcp",
        title="WeKan Work Management MCP",
        description=(
            "Create and manage boards, lists, sprint swimlanes, checklist tasks, "
            "and cards in this WeKan instance."
        ),
        instructions=(
            "Use wekan_health_status to verify connectivity. Then use list_boards, "
            "list_lists, list_sprints, list_cards, and list_tasks to discover data. "
            "A sprint maps to a WeKan swimlane and a task maps to a checklist item."
        ),
        version="0.3.0",
    )

    @server.tool()
    async def wekan_health_status(ctx: Context) -> dict[str, Any]:
        """Check WeKan reachability and whether MCP auth is configured."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            if ctx.headers is not None:
                await client._login()
            app_status = await client._request_without_auth("GET", "/")
            auth_probe: dict[str, Any] | None = None
            if config.can_authenticate or _request_api_key.get():
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

        return await _safe_call(client, "wekan_health_status", "health", "health", run)

    @server.tool()
    async def list_boards(ctx: Context) -> dict[str, Any]:
        """List boards visible to the authenticated WeKan user."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            boards = await _visible_user_boards(client)
            return {
                "count": len(boards),
                "boards": boards,
            }

        return await _safe_call(client, "list_boards", "read", "boards", run)

    @server.tool()
    async def get_board(board_id: str, ctx: Context) -> dict[str, Any]:
        """Read one board by id."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            board_path = _resource_id(board_id, "board_id")
            board = await client.request("GET", f"/api/boards/{board_path}")
            return {"board": board}

        return await _safe_call(client, "get_board", "read", "board", run)

    @server.tool()
    async def create_board(
        title: str,
        ctx: Context,
        permission: str = "private",
        owner: str | None = None,
        color: str = "belize",
    ) -> dict[str, Any]:
        """Create a board in WeKan."""
        _activate_request_key(ctx)

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

        return await _safe_call(client, "create_board", "create", "board", run)

    @server.tool()
    async def list_lists(board_id: str, ctx: Context) -> dict[str, Any]:
        """List non-archived lists on a board."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            board_path = _resource_id(board_id, "board_id")
            lists = await client.request("GET", f"/api/boards/{board_path}/lists")
            return {
                "count": len(lists) if isinstance(lists, list) else None,
                "lists": lists,
            }

        return await _safe_call(client, "list_lists", "read", "lists", run)

    @server.tool()
    async def list_swimlanes(board_id: str, ctx: Context) -> dict[str, Any]:
        """List non-archived swimlanes (sprints) on a board."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            board_path = _resource_id(board_id, "board_id")
            swimlanes = await client.request("GET", f"/api/boards/{board_path}/swimlanes")
            return {
                "count": len(swimlanes) if isinstance(swimlanes, list) else None,
                "swimlanes": swimlanes,
            }

        return await _safe_call(client, "list_swimlanes", "read", "swimlanes", run)

    @server.tool()
    async def list_sprints(board_id: str, ctx: Context) -> dict[str, Any]:
        """List sprints. In WeKan, each sprint is represented by a swimlane."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            board_path = _resource_id(board_id, "board_id")
            sprints = await client.request("GET", f"/api/boards/{board_path}/swimlanes")
            return {
                "count": len(sprints) if isinstance(sprints, list) else None,
                "sprints": sprints,
                "wekan_mapping": "swimlane",
            }

        return await _safe_call(client, "list_sprints", "read", "sprints", run)

    @server.tool()
    async def get_sprint(
        board_id: str,
        sprint_id: str,
        ctx: Context,
    ) -> dict[str, Any]:
        """Read one sprint by id. Sprint ids are WeKan swimlane ids."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            board_path = _resource_id(board_id, "board_id")
            sprint_path = _resource_id(sprint_id, "sprint_id")
            sprint = await client.request(
                "GET",
                f"/api/boards/{board_path}/swimlanes/{sprint_path}",
            )
            return {"sprint": sprint, "wekan_mapping": "swimlane"}

        return await _safe_call(client, "get_sprint", "read", "sprint", run)

    @server.tool()
    async def create_sprint(
        board_id: str,
        title: str,
        ctx: Context,
        sort: float | None = None,
    ) -> dict[str, Any]:
        """Create a sprint as a WeKan swimlane."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            if not title.strip():
                raise WekanConfigError("title is required")
            board_path = _resource_id(board_id, "board_id")
            created = await client.request(
                "POST",
                f"/api/boards/{board_path}/swimlanes",
                json_body=_clean_body({"title": title.strip(), "sort": sort}),
            )
            return {
                "sprint": created,
                "sprint_id": created.get("_id") if isinstance(created, dict) else None,
                "wekan_mapping": "swimlane",
            }

        return await _safe_call(client, "create_sprint", "create", "sprint", run)

    @server.tool()
    async def update_sprint(
        board_id: str,
        sprint_id: str,
        title: str,
        ctx: Context,
    ) -> dict[str, Any]:
        """Rename a sprint (WeKan swimlane)."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            if not title.strip():
                raise WekanConfigError("title is required")
            board_path = _resource_id(board_id, "board_id")
            sprint_path = _resource_id(sprint_id, "sprint_id")
            updated = await client.request(
                "PUT",
                f"/api/boards/{board_path}/swimlanes/{sprint_path}",
                json_body={"title": title.strip()},
            )
            return {
                "sprint": updated,
                "sprint_id": sprint_id,
                "wekan_mapping": "swimlane",
            }

        return await _safe_call(client, "update_sprint", "update", "sprint", run)

    @server.tool()
    async def create_list(
        board_id: str,
        title: str,
        ctx: Context,
        swimlane_id: str | None = None,
    ) -> dict[str, Any]:
        """Create a list on a board."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            if not title.strip():
                raise WekanConfigError("title is required")
            board_path = _resource_id(board_id, "board_id")
            created = await client.request(
                "POST",
                f"/api/boards/{board_path}/lists",
                json_body=_clean_body({"title": title.strip(), "swimlaneId": swimlane_id}),
            )
            return {
                "list": created,
                "list_id": created.get("_id") if isinstance(created, dict) else None,
            }

        return await _safe_call(client, "create_list", "create", "list", run)

    @server.tool()
    async def list_cards(
        board_id: str,
        list_id: str,
        ctx: Context,
    ) -> dict[str, Any]:
        """List non-archived cards in a board list."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            board_path = _resource_id(board_id, "board_id")
            list_path = _resource_id(list_id, "list_id")
            cards = await client.request(
                "GET",
                f"/api/boards/{board_path}/lists/{list_path}/cards",
            )
            return {
                "count": len(cards) if isinstance(cards, list) else None,
                "cards": cards,
            }

        return await _safe_call(client, "list_cards", "read", "cards", run)

    @server.tool()
    async def get_card(card_id: str, ctx: Context) -> dict[str, Any]:
        """Read one card, including an archived card, by id."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            card_path = _resource_id(card_id, "card_id")
            card = await client.request("GET", f"/api/cards/{card_path}")
            return {"card": card}

        return await _safe_call(client, "get_card", "read", "card", run)

    @server.tool()
    async def create_card(
        board_id: str,
        list_id: str,
        title: str,
        ctx: Context,
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
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            if not title.strip():
                raise WekanConfigError("title is required")
            board_path = _resource_id(board_id, "board_id")
            list_path = _resource_id(list_id, "list_id")
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
                f"/api/boards/{board_path}/lists/{list_path}/cards",
                json_body=body,
            )
            return {
                "card": created,
                "card_id": created.get("_id") if isinstance(created, dict) else None,
                "author_id": effective_author,
                "swimlane_id": effective_swimlane_id,
            }

        return await _safe_call(client, "create_card", "create", "card", run)

    @server.tool()
    async def update_card(
        board_id: str,
        list_id: str,
        card_id: str,
        ctx: Context,
        title: str | None = None,
        description: str | None = None,
        sprint_id: str | None = None,
        destination_list_id: str | None = None,
        members: list[str] | None = None,
        assignees: list[str] | None = None,
        received_at: str | None = None,
        start_at: str | None = None,
        due_at: str | None = None,
        end_at: str | None = None,
        due_complete: bool | None = None,
    ) -> dict[str, Any]:
        """Edit or move a card within its board."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            board_path = _resource_id(board_id, "board_id")
            list_path = _resource_id(list_id, "list_id")
            card_path = _resource_id(card_id, "card_id")
            body = _clean_body(
                {
                    "title": title.strip() if isinstance(title, str) else None,
                    "description": description,
                    "swimlaneId": sprint_id,
                    "listId": destination_list_id,
                    "members": members,
                    "assignees": assignees,
                    "receivedAt": received_at,
                    "startAt": start_at,
                    "dueAt": due_at,
                    "endAt": end_at,
                    "dueComplete": due_complete,
                }
            )
            if not body:
                raise WekanConfigError("at least one card field is required")
            updated = await client.request(
                "PUT",
                f"/api/boards/{board_path}/lists/{list_path}/cards/{card_path}",
                json_body=body,
            )
            return {
                "card": updated,
                "card_id": card_id,
                "list_id": destination_list_id or list_id,
                "sprint_id": sprint_id,
            }

        return await _safe_call(client, "update_card", "update", "card", run)

    @server.tool()
    async def list_checklists(
        board_id: str,
        card_id: str,
        ctx: Context,
    ) -> dict[str, Any]:
        """List checklist containers on a card."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            board_path = _resource_id(board_id, "board_id")
            card_path = _resource_id(card_id, "card_id")
            checklists = await client.request(
                "GET",
                f"/api/boards/{board_path}/cards/{card_path}/checklists",
            )
            return {
                "count": len(checklists) if isinstance(checklists, list) else None,
                "checklists": checklists,
            }

        return await _safe_call(client, "list_checklists", "read", "checklists", run)

    @server.tool()
    async def create_checklist(
        board_id: str,
        card_id: str,
        title: str,
        ctx: Context,
        tasks: list[str] | None = None,
    ) -> dict[str, Any]:
        """Create a checklist, optionally with initial tasks, on a card."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            if not title.strip():
                raise WekanConfigError("title is required")
            board_path = _resource_id(board_id, "board_id")
            card_path = _resource_id(card_id, "card_id")
            created = await client.request(
                "POST",
                f"/api/boards/{board_path}/cards/{card_path}/checklists",
                json_body={"title": title.strip(), "items": tasks or []},
            )
            return {
                "checklist": created,
                "checklist_id": (
                    created.get("_id") if isinstance(created, dict) else None
                ),
            }

        return await _safe_call(client, "create_checklist", "create", "checklist", run)

    @server.tool()
    async def list_tasks(
        board_id: str,
        card_id: str,
        checklist_id: str,
        ctx: Context,
    ) -> dict[str, Any]:
        """List tasks. In WeKan, tasks are items in a card checklist."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            board_path = _resource_id(board_id, "board_id")
            card_path = _resource_id(card_id, "card_id")
            checklist_path = _resource_id(checklist_id, "checklist_id")
            checklist = await client.request(
                "GET",
                f"/api/boards/{board_path}/cards/{card_path}/checklists/{checklist_path}",
            )
            tasks = checklist.get("items", []) if isinstance(checklist, dict) else []
            return {
                "count": len(tasks),
                "tasks": tasks,
                "checklist": checklist,
                "wekan_mapping": "checklist-item",
            }

        return await _safe_call(client, "list_tasks", "read", "tasks", run)

    @server.tool()
    async def create_task(
        board_id: str,
        card_id: str,
        checklist_id: str,
        title: str,
        ctx: Context,
        sort: float | None = None,
    ) -> dict[str, Any]:
        """Create a task as a checklist item on a card."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            if not title.strip():
                raise WekanConfigError("title is required")
            board_path = _resource_id(board_id, "board_id")
            card_path = _resource_id(card_id, "card_id")
            checklist_path = _resource_id(checklist_id, "checklist_id")
            created = await client.request(
                "POST",
                f"/api/boards/{board_path}/cards/{card_path}/checklists/"
                f"{checklist_path}/items",
                json_body=_clean_body({"title": title.strip(), "sort": sort}),
            )
            return {
                "task": created,
                "task_id": created.get("_id") if isinstance(created, dict) else None,
                "wekan_mapping": "checklist-item",
            }

        return await _safe_call(client, "create_task", "create", "task", run)

    @server.tool()
    async def update_task(
        board_id: str,
        card_id: str,
        checklist_id: str,
        task_id: str,
        ctx: Context,
        title: str | None = None,
        is_finished: bool | None = None,
    ) -> dict[str, Any]:
        """Rename or complete a checklist task."""
        _activate_request_key(ctx)

        async def run() -> dict[str, Any]:
            board_path = _resource_id(board_id, "board_id")
            card_path = _resource_id(card_id, "card_id")
            checklist_path = _resource_id(checklist_id, "checklist_id")
            task_path = _resource_id(task_id, "task_id")
            body = _clean_body(
                {
                    "title": title.strip() if isinstance(title, str) else None,
                    "isFinished": is_finished,
                }
            )
            if not body:
                raise WekanConfigError("title or is_finished is required")
            updated = await client.request(
                "PUT",
                f"/api/boards/{board_path}/cards/{card_path}/checklists/"
                f"{checklist_path}/items/{task_path}",
                json_body=body,
            )
            return {
                "task": updated,
                "task_id": task_id,
                "wekan_mapping": "checklist-item",
            }

        return await _safe_call(client, "update_task", "update", "task", run)

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
            "`wekan_health_status`, then work with boards, sprint swimlanes, "
            "checklist tasks, and cards through the exposed tools.\n"
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
