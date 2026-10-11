#!/usr/bin/env python3
"""Retry failed jobs of the original release, preserving successful jobs."""
import json
import os
import re
import subprocess
import sys


def gh(*args):
    return subprocess.check_output(['gh', *args], text=True).strip()


def gh_pages(text):
    """The pages `gh api --paginate` prints, as a list with one entry per page.

    Without --slurp, gh prints the pages back to back ([...][...]), which one
    json.loads cannot read. --slurp would wrap them in one array, but it exists
    only from GitHub CLI 2.48 on, and an older gh stopped the release with
    "unknown flag: --slurp". So the pages are read one after another here.
    """
    decoder = json.JSONDecoder()
    text = text.strip()
    pages, i = [], 0
    while i < len(text):
        page, i = decoder.raw_decode(text, i)
        pages.append(page)
        while i < len(text) and text[i].isspace():
            i += 1
    return pages


def recover(version, repo):
    version = version.removeprefix('v')
    if not re.fullmatch(r'\d+\.\d{2}', version):
        raise ValueError('Expected a WeKan release version, e.g. 11.92')
    pages = gh_pages(gh('api', '--paginate',
                          f'repos/{repo}/actions/workflows/release-all.yml/runs?event=workflow_dispatch&per_page=100'))
    candidates = [run for page in pages for run in page['workflow_runs']
                  if (run['display_title'] == f'Release v{version}' or
                      (run.get('head_commit') or {}).get('message', '').split('\n')[0]
                      in {f'Prepare v{version} release', f'Bump versions for v{version}'})]
    if not candidates:
        print(f'No named full-release run found for v{version}; checking published assets next.')
        return
    run = candidates[0]
    if run['status'] != 'completed':
        raise ValueError('The full release is still running. Wait for it before retrying missing builds.')
    if run['conclusion'] == 'success':
        print('Original release jobs succeeded; checking for missing published assets.')
        return
    # Do not rerun successful bump/tag/build/publish jobs. GitHub retries failed
    # jobs and dependent jobs only; follow that attempt before planning assets.
    subprocess.run(['gh', 'run', 'rerun', str(run['id']), '--failed', '--repo', repo], check=True)
    subprocess.run(['gh', 'run', 'watch', str(run['id']), '--exit-status', '--repo', repo], check=True)


if __name__ == '__main__':
    try:
        recover(sys.argv[1], os.environ.get('GITHUB_REPOSITORY', 'wekan/wekan'))
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print('::error::Release recovery failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
