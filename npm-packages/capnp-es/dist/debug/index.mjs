import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

function messageToString(message, struct, {
  capnpPath,
  format,
  schemaPath
} = {}) {
  return new Promise((resolve, reject) => {
    if (schemaPath === void 0 || !existsSync(schemaPath)) {
      throw new Error(`Schema not found at "${schemaPath}"`);
    }
    const anyStruct = struct;
    const type = anyStruct?._capnp?.displayName ?? struct;
    if (typeof type !== "string") {
      throw new Error("Can not determine the struct type");
    }
    const outputFormat = format === "json" ? "json" : "text";
    const args = ["convert", `binary:${outputFormat}`, schemaPath, type];
    const process = spawn(capnpPath ?? "capnp", args);
    let stdout = "";
    let stderr = "";
    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    process.on("error", (error) => {
      reject(new Error(`Failed to start process: ${error.message}`));
    });
    process.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.endsWith("\n") ? stdout.slice(0, -1) : stdout);
      } else {
        reject(
          new Error(`Process exited with code ${code}. Stderr: ${stderr}`)
        );
      }
    });
    try {
      process.stdin.write(Buffer.from(message.toArrayBuffer()));
      process.stdin.end();
    } catch (error) {
      reject(new Error(`Error writing to stdin: ${error.message}`));
    }
  });
}

export { messageToString };
