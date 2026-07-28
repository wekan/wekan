'use strict';

// Plain-Node guard for two release-all.yml jobs that failed v10.48 for reasons
// that were not what the log said. Run: node tests/releaseWin64AndVariants.test.cjs
//
// build-win64: the zip was verified by listing it with `7z l -ba` INTO A VARIABLE
// and grepping that. When the grep found nothing the log had the verdict — "has
// no bundle/main.js" — and not one line of the listing it judged, so a broken zip
// and a broken grep looked exactly alike. Two releases were failed on it. What
// can be verified robustly is verified robustly (the files are there before
// zipping; the archive passes `7z t`), and the listing is now printed as evidence
// rather than used as a hidden verdict.
//
// snap-variants: the pre-flight asked GitHub for `.permissions.push` on the
// variant repository, which describes the authenticated USER's role rather than
// what the TOKEN may do — it answered `true`, and the push one step later was
// refused with "Permission to wekan/wekan-gantt-gpl.git denied to xet7". The
// pre-flight now asks the receive-pack endpoint, which is the thing that refuses.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8',
);

// A comment inside a `run:` block is text the shell never sees. These files keep
// the OLD broken line in a comment on purpose, so assertions about behaviour must
// read the code only.
const code = text => text.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');

function job(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('releaseWin64AndVariants:');

const win = code(job('build-win64'));

test('the bundle is checked BEFORE it is zipped', () => {
  const embed = win.slice(0, win.indexOf('Create win64 zip'));
  for (const want of ['main.js', 'node.exe', 'start-wekan.bat']) {
    assert.ok(embed.includes(want), `${want} is named in the embed step`);
  }
  assert.ok(/\[ ! -s "bundle\/\$want" \]/.test(embed),
    'each one must be present and non-empty in the directory - that is where '
    + '"can this zip start WeKan" is actually decided, with no archive format in the way');
  assert.ok(/exit 1/.test(embed), 'and a missing one fails the job there');
});

test('no listing anywhere in the workflow is piped into grep', () => {
  // Same trap, four more times: `unzip -l "$zip" | grep -q " $want$"` reports a
  // present file as missing whenever grep matches before unzip has finished
  // writing - which depends only on how big the listing is and how early the
  // match falls, i.e. on luck.
  const piped = workflow.split('\n')
    .filter(l => !/^\s*#/.test(l))
    .filter(l => /(unzip -l|7z l|release view).*\|\s*(grep|head)/.test(l));
  assert.deepStrictEqual(piped, [],
    'list to a file, then grep the file');
});

test('the archive is verified by an integrity test, not by grepping a listing', () => {
  const verify = win.slice(win.indexOf('Verify the win64 zip'));
  assert.ok(/7z t "\$zip"/.test(verify),
    '`7z t` reads every entry and is what catches a truncated or corrupt zip');
  assert.ok(/did not pass 7z t/.test(verify), 'and says so when it fails');
});

test('nothing in the verify step reads a listing through a PIPE', () => {
  // This is the whole win64 story, twice over. `cmd | head` and `cmd | grep -q`
  // end the reader as soon as it has what it needs, the writer gets SIGPIPE, and
  // `set -o pipefail` - which GitHub's bash sets - makes the pipeline's status
  // 141. Under `set -e` that fails the step. v10.48 read "$zip has no
  // bundle/main.js" because grep -q MATCHED and killed printf; v10.49 died with
  // exit code 141 at `printf | head -5` after printing the listing that shows
  // bundle\main.js five lines in. The listing goes to a file now, and every
  // reader reads the file.
  const from = win.indexOf('Verify the win64 zip');
  const verify = win.slice(from, win.indexOf('- uses: actions/upload-artifact', from));
  assert.ok(/7z l -ba "\$zip" > zip-listing\.txt/.test(verify),
    'the listing is written to a file');
  assert.ok(!/\|\s*(head|grep|tail|wc)\b/.test(verify),
    'and nothing pipes into head/grep/tail/wc, which is what SIGPIPE turns into a '
    + 'failed step:\n' + verify.split('\n').filter(l => /\|\s*(head|grep|tail|wc)\b/.test(l)).join('\n'));
  assert.ok(/head -5 zip-listing\.txt/.test(verify),
    'the listing must still appear in the log; judging it invisibly was the first bug');
  assert.ok(/entries matching bundle\/\$want/.test(verify),
    'with the match count for each wanted file');
  const missing = verify.slice(verify.indexOf('if [ "${n:-0}" -eq 0 ]'));
  assert.ok(/::warning::/.test(missing.slice(0, 400)),
    'a zero count is a WARNING: the file was verified in the directory and the '
    + 'archive passed 7z t, so a zero count says something about 7-Zip output, '
    + 'not about the bundle');
  assert.ok(!/::error::[\s\S]{0,200}has no bundle/.test(verify),
    'and it must not fail the release on the listing format again');
});

const variants = code(job('snap-variants'));

test('the push pre-flight asks the endpoint that refuses a push', () => {
  assert.ok(/service=git-receive-pack/.test(variants),
    'the receive-pack advertisement is the first thing a real push requests, and '
    + 'is what GitHub answers 403 to for a token without write access');
  assert.ok(!/permissions\.push/.test(variants),
    'the repos API permissions block describes the USER, not the token - it said '
    + 'push=true for a token that was then refused');
});

test('the pre-flight cannot leak the token, and needs no checkout', () => {
  const guard = variants.slice(0, variants.indexOf('- name: Checkout wekan'));
  assert.ok(/-u "x-access-token:\$REPO_TOKEN"/.test(guard),
    'the token goes in -u, never in a URL that could be echoed');
  assert.ok(!/https:\/\/x-access-token:\$\{?REPO_TOKEN/.test(guard),
    'no token-in-URL in the pre-flight');
  assert.ok(!/git (clone|push|ls-remote)/.test(guard),
    'and no git command: this step runs BEFORE actions/checkout, so there is no '
    + 'local repository for git to work in');
});

test('the sync renames the snap in BOTH snapcraft files', () => {
  // snapcraft.yaml is what the variant job builds; snapcraft-core26.yaml is the
  // same snap on the next base. Renaming only the first leaves the core26 file
  // saying `name: wekan`, so a core26 build from wekan-ondra / wekan-gantt-gpl
  // would publish itself as the DEFAULT WeKan snap.
  const sync = variants.slice(variants.indexOf('tree from wekan'));
  assert.ok(/for f in snapcraft\.yaml snapcraft-core26\.yaml/.test(sync),
    'both files are renamed');
  assert.ok(/s\/\^name: wekan\$\/name: \$\{\{ matrix\.snapname \}\}\//.test(sync),
    'the snap name comes from the matrix');
  assert.ok(/s\/\^title: \.\*\/title: \$\{\{ matrix\.title \}\}\//.test(sync),
    'and so does the title');
});

test('a refusal and a broken pre-flight are told apart', () => {
  assert.ok(/"\$rp" = "403"/.test(variants) && /"\$rp" = "401"/.test(variants),
    '403/401 is "the token may not push"');
  assert.ok(/neither a yes nor a permission refusal/.test(variants),
    'anything else says it is something else, instead of blaming the token');
  assert.ok(/Contents: Read and write/.test(variants),
    'and the refusal message says exactly what to change');
});

test('the variant SNAP is published even when its repository cannot be pushed', () => {
  // This is the whole point of the two variants: people are still on the older
  // snap names wekan-ondra and wekan-gantt-gpl, so one release must publish all
  // three snaps. Keeping the GitHub repositories in step is a separate,
  // optional thing - it used to gate the entire job, so a token without push
  // rights meant no variant snaps at all (v10.48 and v10.49 published none).
  const all = job('snap-variants');
  const stepOf = name => {
    const at = all.indexOf(`- name: ${name}`);
    assert.notStrictEqual(at, -1, `snap-variants has no step "${name}"`);
    const rest = all.slice(at + 1);
    const next = rest.indexOf('\n      - name:');
    return next === -1 ? rest : rest.slice(0, next);
  };

  const build = stepOf('Build the ${{ matrix.snapname }} snap (${{ matrix.arch }})');
  const publish = stepOf('Publish ${{ matrix.snapname }} to the Snap Store (all channels)');
  for (const [what, step] of [['the build', build], ['the publish', publish]]) {
    assert.ok(/steps\.guard\.outputs\.snap == 'true'/.test(step),
      `${what} runs whenever SNAP_AUTH is set`);
    assert.ok(!/outputs\.sync/.test(step),
      `${what} must NOT depend on whether the repository can be pushed`);
  }
  assert.ok(/release: stable,candidate,beta,edge/.test(publish),
    'and it goes to all four channels, like the default wekan snap');

  const push = stepOf('Push the synced tree to wekan/${{ matrix.repo }}');
  assert.ok(/outputs\.sync == 'true'/.test(push),
    'the repository push is the part that needs WEKAN_REPO_TOKEN');
  assert.ok(/matrix\.arch == 'amd64'/.test(push),
    'and it happens once per variant, not once per architecture');

  // A missing WEKAN_REPO_TOKEN is a warning about the repository, never a
  // reason to skip the snap.
  assert.ok(/The snap is still built and published/.test(all),
    'the warnings say so in those words');
});

test('both variants are built for the two native architectures', () => {
  const legs = [...job('snap-variants').matchAll(/snapname: (\S+)[\s\S]{0,200}?arch: (\S+)/g)]
    .map(m => `${m[1]} ${m[2]}`);
  for (const want of ['wekan-ondra amd64', 'wekan-ondra arm64',
                      'wekan-gantt-gpl amd64', 'wekan-gantt-gpl arm64']) {
    assert.ok(legs.includes(want), `${want} is missing from the matrix (${legs.join(', ')})`);
  }
});

test('a variant build that produced the wrong snap is not published', () => {
  const variantsJob = job('snap-variants');
  assert.ok(/is not a \$\{\{ matrix\.snapname \}\} snap/.test(variantsJob),
    'the built file name must start with the variant snap name - publishing a '
    + 'file called wekan_*.snap from here would overwrite the DEFAULT snap');
});

console.log(`\n${passed} tests passed`);
