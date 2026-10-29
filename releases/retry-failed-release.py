#!/usr/bin/env python3
"""Retry failed jobs of the original release, preserving successful jobs."""
import json
import os
import re
import subprocess
import sys
import time


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


def failed_jobs(run_id, attempt, repo):
    """The names of the jobs that did not succeed in that attempt, or [] when
    GitHub cannot say. "ended failure" alone sent the reader to the web page to
    find out which of ~130 jobs it was (v12.68: four Launchpad snaps that got
    503s, and OpenBSD, whose start-wekan.sh fault is in the tagged code)."""
    try:
        pages = gh_pages(gh('api', '--paginate',
                            f'repos/{repo}/actions/runs/{run_id}/attempts/{attempt}/jobs?per_page=100'))
    except (subprocess.CalledProcessError, ValueError, OSError):
        return []
    return [job.get('name', '?') for page in pages if isinstance(page, dict)
            for job in page.get('jobs', [])
            if job.get('conclusion') not in (None, 'success', 'skipped')]


def wait_for_rerun(run_id, attempt, repo, poll=30, max_errors=10, sleep=time.sleep):
    """Wait until the rerun (an attempt after `attempt`) of run `run_id` ends.

    This used to be `gh run watch --exit-status`, which ends with status 1 on
    the first failed API call: one HTTP 502 from GitHub while it listed the
    jobs stopped the recovery, and with it every missing build. So the run is
    polled here, an API error is retried up to `max_errors` times in a row,
    and only the run's own conclusion decides. Until GitHub has started the
    new attempt, the run still shows the old attempt's failure, so that is
    not taken as the answer either.
    """
    errors = 0
    while True:
        try:
            state = json.loads(gh('run', 'view', str(run_id), '--repo', repo,
                                  '--json', 'attempt,status,conclusion'))
        except (subprocess.CalledProcessError, ValueError) as error:
            errors += 1
            if errors >= max_errors:
                raise ValueError(f'GitHub did not answer about run {run_id} '
                                 f'{errors} times in a row: {error}') from error
            print(f'::warning::Could not read run {run_id} ({error}); trying again.')
            sleep(poll)
            continue
        errors = 0
        if state.get('attempt', 0) > attempt and state.get('status') == 'completed':
            if state.get('conclusion') != 'success':
                failed = failed_jobs(run_id, state['attempt'], repo)
                named = f' Failed again: {", ".join(failed)}.' if failed else ''
                raise ValueError(f'The rerun of the full release ended {state.get("conclusion")}.{named} '
                                 'A rerun builds the TAGGED commit, so a fault in that code fails every '
                                 'rerun and is fixed by the next release; the missing assets are planned '
                                 'and built after this anyway.')
            print('The failed jobs of the full release succeeded on rerun.')
            return
        sleep(poll)


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
    wait_for_rerun(run['id'], run.get('run_attempt', 1), repo)


if __name__ == '__main__':
    try:
        recover(sys.argv[1], os.environ.get('GITHUB_REPOSITORY', 'wekan/wekan'))
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print('::error::Release recovery failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
