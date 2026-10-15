#!/usr/bin/env python3
"""Run the actual chart planner against a paginated, offline GitHub fixture."""
import contextlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
script = (ROOT / 'releases/backfill-charts.sh').read_text()
planner = script.split("<<'PYEOF'\n", 1)[1].split('\nPYEOF', 1)[0]


class Response(io.BytesIO):
    def __init__(self, content, link=''):
        super().__init__(content.encode())
        self.headers = {'Link': link}
        self.status = 200


class Pagination(unittest.TestCase):
    def plan(self, pages=2, failure=False, evil=False):
        calls = []
        def get(request, **kwargs):
            url = request.full_url
            if url.startswith('https://api.github.com/'):
                self.assertEqual(request.get_header('Authorization'), 'Bearer fixture-token')
                calls.append(url)
                if failure or len(calls) > pages:
                    raise urllib.error.HTTPError(url, 422, 'Unprocessable Entity', {}, None)
                batch = [{'tag_name': 'v12.37'}, {'tag_name': 'v12.36'},
                         {'tag_name': 'v12.35'}, {'tag_name': 'v12.34'}, {'tag_name': 'v9.00'}]
                next_url = f'https://api.github.com/repos/wekan/wekan/releases?per_page=100&page={len(calls)+1}'
                if evil:
                    next_url = 'https://untrusted.invalid/releases'
                link = f'<{next_url}>; rel="next", <https://api.github.com/last>; rel="last"' if len(calls) < pages else ''
                return Response(json.dumps(batch), link)
            self.assertNotEqual(request.get_header('Authorization'), 'Bearer fixture-token')
            if url.endswith('/index.yaml'):
                return Response('    version: 12.37.0\n      version: 12.36.0\n')
            if '/token?' in url:
                return Response('{"token":"registry-token"}')
            self.assertEqual(request.method, 'HEAD')
            if url.endswith('v12.35'):
                raise urllib.error.HTTPError(url, 404, 'Not Found', {}, None)
            if url.endswith('v12.34'):
                raise TimeoutError('registry unavailable')
            self.assertTrue(url.endswith('v12.36'), url)
            return Response('')
        with tempfile.TemporaryDirectory() as tmp, \
             patch.dict(os.environ, {'CHART_BASE_URL': 'https://charts.invalid', 'LIMIT': '0',
                                     'GH_TOKEN': '', 'GITHUB_TOKEN': 'fixture-token'}), \
             patch('urllib.request.urlopen', side_effect=get), \
             patch.object(sys, 'argv', ['planner', str(Path(tmp) / 'plan.json')]), \
             contextlib.redirect_stderr(io.StringIO()):
            # The planner under test is this repository's own backfill-charts.sh,
            # run in an empty namespace with the network patched out.
            exec(compile(planner, 'backfill-charts.sh:planner', 'exec'), {})  # nosec B102
            result = json.loads((Path(tmp) / 'plan.json').read_text())
        self.assertEqual(len(calls), pages)
        self.assertEqual(result['keep'], ['12.37'])
        self.assertEqual(result['build'], ['12.36'])
        self.assertEqual(result['omit'], ['12.35'])
        self.assertEqual(result['unknown'], ['12.34'])
        self.assertEqual(result['predates'], ['9.00'])

    def test_stops_at_last_link_and_preserves_plan(self):
        self.plan()

    def test_does_not_truncate_at_nineteen_pages(self):
        self.plan(pages=21)

    def test_api_errors_are_not_hidden(self):
        with self.assertRaises(urllib.error.HTTPError):
            self.plan(failure=True)

    def test_pagination_cannot_leak_token_to_another_host(self):
        with self.assertRaisesRegex(ValueError, 'pagination host'):
            self.plan(evil=True)


if __name__ == '__main__':
    unittest.main()
