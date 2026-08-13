#!/usr/bin/env python3
"""Smoke-test the WeKan MCP server over stdio."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


SERVER_DIR = Path(__file__).resolve().parent


def _jsonable(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if isinstance(value, list):
        return [_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: _jsonable(item) for key, item in value.items()}
    return value


async def _run(server_python: str, call_boards: bool) -> None:
    env = os.environ.copy()

    params = StdioServerParameters(
        command=server_python,
        args=[str(SERVER_DIR / "server.py"), "--transport", "stdio"],
        env=env,
    )

    async with stdio_client(params) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            tools = await session.list_tools()
            print("TOOLS")
            print(json.dumps(_jsonable(tools), indent=2))

            resources = await session.list_resources()
            print("RESOURCES")
            print(json.dumps(_jsonable(resources), indent=2))

            config = await session.read_resource("wekan://config")
            print("READ_CONFIG")
            print(json.dumps(_jsonable(config), indent=2))

            quickstart = await session.read_resource("wekan://quickstart")
            print("READ_QUICKSTART")
            print(json.dumps(_jsonable(quickstart), indent=2))

            prompts = await session.list_prompts()
            print("PROMPTS")
            print(json.dumps(_jsonable(prompts), indent=2))

            health = await session.call_tool("wekan_health_status", {})
            print("HEALTH")
            print(json.dumps(_jsonable(health), indent=2))

            if call_boards:
                boards = await session.call_tool("list_boards", {})
                print("LIST_BOARDS")
                print(json.dumps(_jsonable(boards), indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description="Smoke-test the WeKan MCP server.")
    parser.add_argument("--python", default=sys.executable, help="Python executable to run server.py.")
    parser.add_argument(
        "--call-boards",
        action="store_true",
        help="Also call list_boards. Requires valid WeKan credentials.",
    )
    args = parser.parse_args()
    asyncio.run(_run(args.python, args.call_boards))


if __name__ == "__main__":
    main()
