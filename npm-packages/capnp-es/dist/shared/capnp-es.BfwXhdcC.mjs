import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { exec } from 'node:child_process';
import { c as compileAll } from './capnp-es.D7fKICra.mjs';
import { existsSync } from 'node:fs';

async function cliMain(outFormat) {
  let outFormats = [outFormat];
  let outDir;
  try {
    let dataBuf = await readStdin();
    if (dataBuf.length === 0) {
      const parsedOptions = parseOptions();
      outFormats = parsedOptions.outFormats;
      outDir = parsedOptions.outDir;
      const { sources, options } = parsedOptions;
      dataBuf = await execCapnpc(sources, options);
    }
    const { files } = await compileAll(dataBuf, {
      ts: outFormats.includes("ts"),
      js: outFormats.includes("js"),
      dts: outFormats.includes("dts")
    });
    (await writeFiles(files, outDir)).map(
      (file) => console.log(`[capnp-es] ${file}`)
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
function parseOptions() {
  const sources = [];
  const options = [];
  let outFormats = ["js"];
  let outDir;
  for (const arg of process.argv.slice(2)) {
    if (arg === "--help") {
      console.log(usage);
      process.exit(0);
    }
    if (!arg.startsWith("-")) {
      sources.push(arg);
    } else if (arg.startsWith("--output=") || arg.startsWith("-o")) {
      const s = arg.slice(arg.startsWith("-o") ? "-o".length : "--output=".length).split(":");
      if (s[0] && s[0] !== "-") {
        outFormats = s[0].split(",");
      }
      if (s[1]) {
        outDir = s[1];
      }
    } else if (capnpcOptions.some((opt) => arg.startsWith(opt))) {
      options.push(arg);
    }
  }
  return { sources, options, outFormats, outDir };
}
async function execCapnpc(sources, options) {
  const cmd = `capnpc -o- ${options.join(" ")} ${sources.join(" ")}`;
  console.log(`[capnp-es] ${cmd}`);
  return new Promise((resolve) => {
    exec(cmd, { encoding: "buffer" }, (error, stdout, stderr) => {
      if (stderr.length > 0) {
        process.stderr.write(stderr);
      }
      if (error) {
        process.exit(1);
      }
      resolve(stdout);
    });
  });
}
async function writeFiles(files, outDir) {
  const filePaths = [];
  for (const [fileName, content] of files) {
    let filePath = fileName;
    if (!existsSync(dirname(filePath))) {
      const fullPath = `/${filePath}`;
      if (existsSync(dirname(fullPath))) {
        filePath = fullPath;
      }
    }
    if (outDir) {
      filePath = join(outDir, fileName);
    }
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(
      filePath,
      // https://github.com/microsoft/TypeScript/issues/54632
      content.replace(/^\s+/gm, (match) => " ".repeat(match.length / 2))
    );
    filePaths.push(filePath);
  }
  return filePaths;
}
async function readStdin() {
  if (process.stdin.isTTY) {
    return Buffer.alloc(0);
  }
  const chunks = [];
  process.stdin.on("data", (chunk) => {
    chunks.push(chunk);
  });
  await new Promise((resolve) => {
    process.stdin.on("end", resolve);
  });
  const reqBuffer = Buffer.alloc(
    chunks.reduce((l, chunk) => l + chunk.byteLength, 0)
  );
  let i = 0;
  for (const chunk of chunks) {
    chunk.copy(reqBuffer, i);
    i += chunk.byteLength;
  }
  return reqBuffer;
}
const capnpcOptions = [
  "-I",
  "--import-path",
  "-i",
  "--generate-id",
  "--no-standard-import",
  "--src-prefix",
  "--verbose"
];
const usage = `
Usage: capnp-es [<option>...] <source>...

Compiles Cap'n Proto schema files and generates corresponding source code for javascript and typescript.

Options:
    -o<lang>[:<dir>], --output=<lang>[:<dir>]
        Specify the output language (js,ts,dts) and optional output directory.
    -I<dir>, --import-path=<dir>
        Add <dir> to the list of directories searched for non-relative imports.
    -i, --generate-id
        Generate a new 64-bit unique ID for use in a Cap'n Proto schema.
    --no-standard-import
        Do not add any default import paths; use only those specified by -I.
    --src-prefix=<prefix>
       Remove the prefix of output files.
`;

export { cliMain as c };
