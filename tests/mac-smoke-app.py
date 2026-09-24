#!/usr/bin/env python3
import importlib.util
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import threading
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('smoke', Path(__file__).resolve().parents[1] / 'releases/mac/smoke-app.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class MacSmoke(unittest.TestCase):
    def test_success_and_failure_stop_term_resistant_descendants(self):
        for ready in (True, False):
            with self.subTest(ready=ready), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                pidfile = root / 'child.pid'
                child = "import os,signal,time; from pathlib import Path; signal.signal(signal.SIGTERM,signal.SIG_IGN); Path(%r).write_text(str(os.getpid())); time.sleep(60)" % str(pidfile)
                # Like the actual shell launcher: wait for a foreground child.
                command = ['bash', '-c', 'trap "exit 0" TERM; "$@"; wait', 'launcher', sys.executable, '-c', child]
                def probe(*args, **kwargs):
                    deadline = time.monotonic() + 2
                    while not pidfile.exists() and time.monotonic() < deadline:
                        time.sleep(.01)
                    self.assertTrue(pidfile.exists())
                    self.assertIn('--max-time', args[0])
                    return subprocess.CompletedProcess(args[0], 0 if ready else 7)
                started = time.monotonic()
                with patch.object(smoke.subprocess, 'run', side_effect=probe):
                    self.assertEqual(smoke.smoke(command, 'http://unused', root / 'app.log', timeout=.5, grace=.1), ready)
                self.assertLess(time.monotonic() - started, 3)
                pid = int(pidfile.read_text())
                # A killed descendant can briefly be a zombie until init reaps it.
                status = subprocess.run(['ps', '-o', 'stat=', '-p', str(pid)], capture_output=True, text=True).stdout.strip()
                self.assertTrue(not status or status.startswith('Z'), status)

    def test_early_exit_preserves_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(smoke.subprocess, 'run', return_value=subprocess.CompletedProcess([], 7)):
                self.assertFalse(smoke.smoke(['sh', '-c', 'echo startup-failed; exit 9'],
                                            'http://unused', Path(tmp) / 'app.log', timeout=.5, grace=.1))

    def test_real_http_success_and_failure(self):
        for status in (200, 503, None):
            with self.subTest(status=status), tempfile.TemporaryDirectory() as tmp:
                class Handler(BaseHTTPRequestHandler):
                    def do_GET(self):
                        if status is None:
                            time.sleep(2)  # Accept a connection but never answer.
                            return
                        self.send_response(status)
                        self.end_headers()
                    def log_message(self, *args):
                        pass
                server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
                thread = threading.Thread(target=server.serve_forever, daemon=True)
                thread.start()
                try:
                    self.assertEqual(smoke.smoke(['sleep', '60'],
                        'http://127.0.0.1:%s/sign-in' % server.server_port,
                        Path(tmp) / 'app.log', timeout=.3, grace=.1), status == 200)
                finally:
                    server.shutdown()
                    server.server_close()
                    thread.join(timeout=2)

    def test_probe_exception_still_cleans_up(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(smoke.subprocess, 'run', side_effect=RuntimeError('probe failed')):
                with self.assertRaisesRegex(RuntimeError, 'probe failed'):
                    smoke.smoke(['sleep', '60'], 'http://unused', Path(tmp) / 'app.log', grace=.1)


if __name__ == '__main__':
    unittest.main()
