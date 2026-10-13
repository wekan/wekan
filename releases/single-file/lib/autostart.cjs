'use strict';

// "Run automatically at boot": whatever starts programs at boot on this
// operating system runs `<executable> start`.
//
//   Linux     systemd: a system service as root, otherwise a user service
//             with lingering on (so it starts at boot, not at login).
//             Without systemd: crontab @reboot.
//   Android   Termux:Boot, ~/.termux/boot/wekan.
//   macOS     launchd: a LaunchDaemon as root, otherwise a LaunchAgent
//             (which starts at login - macOS starts nobody's programs at
//             boot without root).
//   Windows   Task Scheduler: at startup as SYSTEM from an administrator
//             prompt, otherwise at logon.
//   BSDs and  crontab @reboot, which FreeBSD, OpenBSD, NetBSD and DragonFly
//   the rest  cron all have.
//
// Each method's file or entry names the executable it starts, so a single
// file that is moved has to be installed again, and removing finds exactly
// what installing made.
//
// The text each method writes is a pure function here, tested on every
// platform; only install()/remove() touch the system.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const NAME = 'wekan';
const LABEL = 'fi.wekan.single-file';
const CRON_MARK = '# wekan-single-file';

function quoteSh(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function systemdUnit({ exePath, workDir, user }) {
  return `[Unit]
Description=WeKan (single file)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${workDir}
ExecStart="${exePath}" start
Restart=on-failure
RestartSec=5
${user ? `User=${user}\n` : ''}
[Install]
WantedBy=${user === undefined ? 'default.target' : 'multi-user.target'}
`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function launchdPlist({ exePath, workDir, logFile }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${escapeXml(exePath)}</string>
    <string>start</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${escapeXml(workDir)}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>
  <key>StandardOutPath</key>
  <string>${escapeXml(logFile)}</string>
  <key>StandardErrorPath</key>
  <string>${escapeXml(logFile)}</string>
</dict>
</plist>
`;
}

function cronLine({ exePath, workDir, logFile }) {
  return `@reboot cd ${quoteSh(workDir)} && ${quoteSh(exePath)} start >> ${quoteSh(logFile)} 2>&1 ${CRON_MARK} ${exePath}`;
}

/** The crontab without this executable's line, then with `line` if given. */
function crontabWith(existing, exePath, line) {
  const kept = String(existing || '').split(/\r?\n/).filter(l => l !== '' && !l.endsWith(`${CRON_MARK} ${exePath}`));
  if (line) kept.push(line);
  return kept.length ? `${kept.join('\n')}\n` : '';
}

function termuxBootScript({ exePath, workDir, logFile }) {
  return `#!/data/data/com.termux/files/usr/bin/sh
# Started by Termux:Boot. Installed by the WeKan single file.
termux-wake-lock
cd ${quoteSh(workDir)} && exec ${quoteSh(exePath)} start >> ${quoteSh(logFile)} 2>&1
`;
}

function schtasksCreateArgs({ exePath, admin }) {
  const run = `"${exePath}" start`;
  return admin
    ? ['/Create', '/F', '/TN', 'WeKan', '/SC', 'ONSTART', '/RU', 'SYSTEM', '/RL', 'HIGHEST', '/TR', run]
    : ['/Create', '/F', '/TN', 'WeKan', '/SC', 'ONLOGON', '/RL', 'LIMITED', '/TR', run];
}

function isTermux(env = process.env) {
  return String(env.PREFIX || '').includes('com.termux');
}

/** Which method this system uses. */
function method({ platform = process.platform, env = process.env, has = commandExists, isRoot = isRootUser() } = {}) {
  if (platform === 'win32') return 'schtasks';
  if (platform === 'darwin') return isRoot ? 'launchd-daemon' : 'launchd-agent';
  if (platform === 'android' || isTermux(env)) return 'termux-boot';
  if (platform === 'linux' && has('systemctl') && fs.existsSync('/run/systemd/system')) {
    return isRoot ? 'systemd-system' : 'systemd-user';
  }
  return 'cron';
}

function commandExists(cmd) {
  const dirs = String(process.env.PATH || '').split(path.delimiter);
  const exts = process.platform === 'win32' ? ['.exe', '.cmd', ''] : [''];
  return dirs.some(d => exts.some(e => {
    try {
      return fs.statSync(path.join(d, cmd + e)).isFile();
    } catch (err) {
      return false;
    }
  }));
}

function isRootUser() {
  return typeof process.getuid === 'function' && process.getuid() === 0;
}

function isWindowsAdmin() {
  try {
    execFileSync('net', ['session'], { stdio: 'ignore', windowsHide: true });
    return true;
  } catch (e) {
    return false;
  }
}

function files(layout, how, home = os.homedir()) {
  switch (how) {
    case 'systemd-system': return { unit: `/etc/systemd/system/${NAME}.service` };
    case 'systemd-user': return { unit: path.join(home, '.config', 'systemd', 'user', `${NAME}.service`) };
    case 'launchd-daemon': return { plist: `/Library/LaunchDaemons/${LABEL}.plist` };
    case 'launchd-agent': return { plist: path.join(home, 'Library', 'LaunchAgents', `${LABEL}.plist`) };
    case 'termux-boot': return { script: path.join(home, '.termux', 'boot', NAME) };
    default: return {};
  }
}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], ...opts });
}

function readCrontab() {
  try {
    return run('crontab', ['-l']);
  } catch (e) {
    return '';
  }
}

function writeCrontab(text) {
  run('crontab', ['-'], { input: text });
}

function install(layout, { log = console.log } = {}) {
  const how = method();
  const where = files(layout, how);
  const spec = { exePath: layout.exePath, workDir: layout.files, logFile: layout.logFile };
  fs.mkdirSync(layout.logs, { recursive: true });
  switch (how) {
    case 'systemd-system':
    case 'systemd-user': {
      fs.mkdirSync(path.dirname(where.unit), { recursive: true });
      const user = how === 'systemd-system' ? (process.env.SUDO_USER || 'root') : undefined;
      fs.writeFileSync(where.unit, systemdUnit({ ...spec, user }));
      const scope = how === 'systemd-user' ? ['--user'] : [];
      run('systemctl', [...scope, 'daemon-reload']);
      run('systemctl', [...scope, 'enable', `${NAME}.service`]);
      if (how === 'systemd-user') {
        try {
          run('loginctl', ['enable-linger', os.userInfo().username]);
        } catch (e) {
          log('Could not turn on lingering, so WeKan starts when you log in rather than at boot.');
          log(`As root: loginctl enable-linger ${os.userInfo().username}`);
        }
      }
      return `systemd ${how === 'systemd-user' ? 'user ' : ''}service ${where.unit}`;
    }
    case 'launchd-daemon':
    case 'launchd-agent':
      fs.mkdirSync(path.dirname(where.plist), { recursive: true });
      fs.writeFileSync(where.plist, launchdPlist(spec));
      try {
        run('launchctl', ['load', '-w', where.plist]);
      } catch (e) {
        // loaded at the next boot or login all the same
      }
      return `launchd ${where.plist}`;
    case 'termux-boot':
      fs.mkdirSync(path.dirname(where.script), { recursive: true });
      fs.writeFileSync(where.script, termuxBootScript(spec), { mode: 0o755 });
      log('Install the Termux:Boot app and open it once, so Android runs this at boot.');
      return `Termux:Boot ${where.script}`;
    case 'schtasks': {
      const admin = isWindowsAdmin();
      run('schtasks', schtasksCreateArgs({ exePath: layout.exePath, admin }));
      if (!admin) log('Not an administrator: WeKan starts when you log in. Run as administrator to start it at boot.');
      return `Task Scheduler task "WeKan" (${admin ? 'at startup' : 'at logon'})`;
    }
    default:
      writeCrontab(crontabWith(readCrontab(), layout.exePath, cronLine(spec)));
      return 'crontab @reboot';
  }
}

function remove(layout) {
  const how = method();
  const where = files(layout, how);
  switch (how) {
    case 'systemd-system':
    case 'systemd-user': {
      const scope = how === 'systemd-user' ? ['--user'] : [];
      try {
        run('systemctl', [...scope, 'disable', `${NAME}.service`]);
      } catch (e) {
        // not enabled
      }
      const had = fs.existsSync(where.unit);
      fs.rmSync(where.unit, { force: true });
      try {
        run('systemctl', [...scope, 'daemon-reload']);
      } catch (e) {
        // nothing to reload
      }
      return had;
    }
    case 'launchd-daemon':
    case 'launchd-agent': {
      try {
        run('launchctl', ['unload', '-w', where.plist]);
      } catch (e) {
        // not loaded
      }
      const had = fs.existsSync(where.plist);
      fs.rmSync(where.plist, { force: true });
      return had;
    }
    case 'termux-boot': {
      const had = fs.existsSync(where.script);
      fs.rmSync(where.script, { force: true });
      return had;
    }
    case 'schtasks':
      try {
        run('schtasks', ['/Delete', '/F', '/TN', 'WeKan']);
        return true;
      } catch (e) {
        return false;
      }
    default: {
      const before = readCrontab();
      const after = crontabWith(before, layout.exePath, null);
      if (after === before) return false;
      writeCrontab(after);
      return true;
    }
  }
}

function status(layout) {
  const how = method();
  const where = files(layout, how);
  switch (how) {
    case 'systemd-system':
    case 'systemd-user':
      return fs.existsSync(where.unit) && fs.readFileSync(where.unit, 'utf8').includes(layout.exePath);
    case 'launchd-daemon':
    case 'launchd-agent':
      return fs.existsSync(where.plist) && fs.readFileSync(where.plist, 'utf8').includes(escapeXml(layout.exePath));
    case 'termux-boot':
      return fs.existsSync(where.script);
    case 'schtasks':
      try {
        return run('schtasks', ['/Query', '/TN', 'WeKan', '/V', '/FO', 'LIST']).includes(layout.exePath);
      } catch (e) {
        return false;
      }
    default:
      return readCrontab().split(/\r?\n/).some(l => l.endsWith(`${CRON_MARK} ${layout.exePath}`));
  }
}

module.exports = {
  LABEL, CRON_MARK, systemdUnit, launchdPlist, cronLine, crontabWith, termuxBootScript,
  schtasksCreateArgs, isTermux, method, files, install, remove, status,
};
