#!/usr/bin/env python3
"""Probe the packaged app, then stop its entire process group within a deadline."""
import argparse
from collections import deque
import os
from pathlib import Path
import signal
import subprocess
import time


def signal_group(pid, sig):
    try:
        os.killpg(pid, sig)
        return True
    except ProcessLookupError:
        return False


def stop_app(process, grace=5):
    signal_group(process.pid, signal.SIGTERM)
    deadline = time.monotonic() + grace
    while time.monotonic() < deadline:
        process.poll()  # Reap the launcher, but also wait for its descendants.
        if not signal_group(process.pid, 0):
            break
        time.sleep(0.05)
    signal_group(process.pid, signal.SIGKILL)
    process.wait(timeout=5)


def smoke(command, url, log, timeout=180, grace=5):
    log = Path(log)
    log.parent.mkdir(parents=True, exist_ok=True)
    with log.open('wb') as output:
        process = subprocess.Popen(command, stdout=output, stderr=subprocess.STDOUT,
                                   start_new_session=True)
        try:
            deadline = time.monotonic() + timeout
            while process.poll() is None and time.monotonic() < deadline:
                remaining = deadline - time.monotonic()
                limit = max(0.01, min(3, remaining))
                result = subprocess.run(
                    ['curl', '-fsS', '--connect-timeout', '1', '--max-time', str(limit),
                     '-o', os.devnull, url], stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL, timeout=limit + 1)
                if result.returncode == 0:
                    print('WeKan answered through bundled Node.js and FerretDB.', flush=True)
                    return True
                time.sleep(min(0.2, max(0, deadline - time.monotonic())))
            print('::error::The bundled Mac app did not start WeKan with FerretDB.', flush=True)
            return False
        finally:
            stop_app(process, grace)
            with log.open(errors='replace') as lines:
                print(''.join(deque(lines, maxlen=100)), end='', flush=True)


def interrupted(signum, frame):
    # Let smoke's finally stop Node and FerretDB on workflow cancellation too.
    raise SystemExit(128 + signum)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command')
    parser.add_argument('url')
    parser.add_argument('log')
    args = parser.parse_args()
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    raise SystemExit(0 if smoke([args.command], args.url, args.log) else 1)
