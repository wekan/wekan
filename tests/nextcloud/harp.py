#!/usr/bin/env python3
"""Start the real pinned HaRP servers on isolated loopback ports."""
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / '.tools/nextcloud-harp'))
import haproxy_agent as harp


async def main():
    # Same servers as upstream main(); only its fixed control port is configurable.
    await asyncio.gather(
        harp.SPOA_AGENT._run(host=harp.SPOA_HOST, port=harp.SPOA_PORT),
        harp.run_http_server(host='127.0.0.1', port=int(os.environ['HP_CONTROL_PORT'])),
        harp._loop_lag_monitor(),
    )


asyncio.run(main())
