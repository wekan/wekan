var fs = require('fs');

let error = false

if (!process.env.WRITABLE_PATH) {
  console.error("WRITABLE_PATH environment variable missing and/or unset, please configure !");
  error = true;
} else {
  try {
    fs.accessSync(process.env.WRITABLE_PATH, fs.constants.W_OK);
  } catch (err) {
    error = true;
    console.error("can't write to " + process.env.WRITABLE_PATH, err);
    console.error("the path of WRITABLE_PATH (" + process.env.WRITABLE_PATH + ") must be writable !!!");
  }
}

if (error) {
  console.error("Stopping Wekan");
  console.error("Wekan isn't runable. Please resolve the error's above and restart Wekan !");
  process.exit(1);
}
