import '../models/users';
const fs = require('fs');
const os = require('os');

let errors = [];
if (!process.env.WRITABLE_PATH) {
  errors.push("WRITABLE_PATH environment variable missing and/or unset, please configure !");
} else {
  try {
    fs.accessSync(process.env.WRITABLE_PATH, fs.constants.W_OK);
  } catch (err) {
    const userInfo = os.userInfo();
    errors.push("can't write to " + process.env.WRITABLE_PATH, err);
    errors.push("the path of WRITABLE_PATH (" + process.env.WRITABLE_PATH + ") must be writable !!!");
    errors.push("username: " + userInfo["username"] + " - uid: " + userInfo["uid"] + " - gid: " + userInfo["gid"]);
  }
}

if (errors.length > 0) {
  console.error("\n\n");
  console.error(errors.join("\n"));
  console.error("\n");
  console.error("Stopping Wekan");
  console.error("Wekan isn't runnable. Please resolve the error's above and restart Wekan !");
  console.error("\n\n");
  process.exit(1);
}


// #6538: every link WeKan puts in an email - the board invitation, the password
// reset, the address verification - is built from ROOT_URL. When ROOT_URL is left
// at localhost, those mails go out with `http://127.0.0.1/b/...` in them, which
// is the SENDER's own machine and unusable for everybody who receives it. The
// mail is sent, nothing errors, and the only symptom is a link nobody can follow.
//
// Say it once, at startup, naming the setting and what to set it to. It is a
// warning, not a refusal: a single-machine install where localhost IS the address
// is perfectly valid.
{
  const rootUrl = process.env.ROOT_URL || '';
  const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\/?$/i.test(rootUrl);

  if (!rootUrl) {
    console.warn(
      'ROOT_URL is not set. Links in invitation and password-reset emails are built ' +
      'from it, so they will point at the wrong place. Set it to the address users ' +
      'open WeKan at, e.g. ROOT_URL=https://boards.example.com (snap: snap set wekan ' +
      'root-url=https://boards.example.com).',
    );
  } else if (local) {
    console.warn(
      `ROOT_URL is ${rootUrl}. Every link WeKan sends by email is built from it, so ` +
      'invitation and password-reset mails will contain a localhost address that only ' +
      'works on this machine. If WeKan is reached from anywhere else, set ROOT_URL to ' +
      'that address (snap: snap set wekan root-url=https://boards.example.com).',
    );
  }
}

// Import migrations - COMMENTED OUT
// import './migrations/fixAvatarUrls';
// import './migrations/fixAllFileUrls';
// (fixMissingListsMigration / comprehensiveBoardMigration removed in #6521)

// Import file serving routes
import './routes/universalFileServer';
import './routes/customHeadAssets';

// Import server-side custom head rendering
import './lib/customHeadRender';

// Import users for methods
import './import-users-for-methods';

// Note: Automatic migrations are disabled - migrations only run when opening boards
