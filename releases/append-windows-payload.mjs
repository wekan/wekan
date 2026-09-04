#!/usr/bin/env node
'use strict';

/*
 * Build (and check) WeKan's single Windows EXE.
 *
 * The EXE is the compiled launcher from releases/windows-single-exe-launcher.c
 * with the published wekan-<version>-win64.zip appended to it and an 80-byte
 * trailer at the very end saying where that payload starts, how long it is,
 * its SHA-256 and which WeKan version it is. The launcher reads the same
 * trailer, so the layout below and the TRAILER_* constants in that .c file are
 * one format described twice; tests/windowsSingleExe.test.cjs compares them
 * and round-trips a packed file through both halves.
 *
 *   offset  size  field
 *        0     8  magic "WEKANSFX"
 *        8     4  format version (little-endian, currently 1)
 *       12     4  reserved, zero
 *       16     8  payload offset (little-endian)
 *       24     8  payload size (little-endian)
 *       32    32  SHA-256 of the payload
 *       64    16  WeKan version, ASCII, NUL-padded
 *
 * Usage:
 *   node releases/append-windows-payload.mjs --manifest wekan-11.49-win64.zip \
 *     --header wekan-real-files.h
 *   node releases/append-windows-payload.mjs \
 *     --launcher wekan-launcher.exe --payload wekan-11.49-win64.zip \
 *     --output dist/WeKan-11.49-win64.exe --version 11.49
 *   node releases/append-windows-payload.mjs --verify dist/WeKan-11.49-win64.exe
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const TRAILER_SIZE = 80;
export const TRAILER_MAGIC = 'WEKANSFX';
export const TRAILER_FORMAT = 1;
export const TRAILER_OFFSET_POS = 16;
export const TRAILER_SIZE_POS = 24;
export const TRAILER_SHA256_POS = 32;
export const TRAILER_VERSION_POS = 64;
export const TRAILER_VERSION_SIZE = 16;

export function buildTrailer({ payloadOffset, payloadSize, sha256, version }) {
  if (!Buffer.isBuffer(sha256) || sha256.length !== 32) {
    throw new Error('sha256 must be a 32-byte Buffer');
  }
  const ascii = Buffer.from(String(version), 'ascii');
  if (ascii.length > TRAILER_VERSION_SIZE) {
    throw new Error(
      `version "${version}" does not fit in ${TRAILER_VERSION_SIZE} bytes`);
  }
  const trailer = Buffer.alloc(TRAILER_SIZE, 0);
  trailer.write(TRAILER_MAGIC, 0, 'ascii');
  trailer.writeUInt32LE(TRAILER_FORMAT, TRAILER_MAGIC.length);
  trailer.writeBigUInt64LE(BigInt(payloadOffset), TRAILER_OFFSET_POS);
  trailer.writeBigUInt64LE(BigInt(payloadSize), TRAILER_SIZE_POS);
  sha256.copy(trailer, TRAILER_SHA256_POS);
  ascii.copy(trailer, TRAILER_VERSION_POS);
  return trailer;
}

export function readTrailer(buffer) {
  if (buffer.length < TRAILER_SIZE) {
    throw new Error('file is smaller than the trailer');
  }
  const trailer = buffer.subarray(buffer.length - TRAILER_SIZE);
  if (trailer.subarray(0, TRAILER_MAGIC.length).toString('ascii') !== TRAILER_MAGIC) {
    throw new Error('no WEKANSFX trailer: this file carries no WeKan bundle');
  }
  const format = trailer.readUInt32LE(TRAILER_MAGIC.length);
  if (format !== TRAILER_FORMAT) {
    throw new Error(`unsupported trailer format ${format}`);
  }
  const version = trailer
    .subarray(TRAILER_VERSION_POS, TRAILER_VERSION_POS + TRAILER_VERSION_SIZE)
    .toString('ascii')
    .replace(/\0+$/, '');
  return {
    format,
    payloadOffset: Number(trailer.readBigUInt64LE(TRAILER_OFFSET_POS)),
    payloadSize: Number(trailer.readBigUInt64LE(TRAILER_SIZE_POS)),
    sha256: Buffer.from(
      trailer.subarray(TRAILER_SHA256_POS, TRAILER_SHA256_POS + 32)),
    version,
  };
}

/* Throws when the packed payload is not the payload the trailer describes. */
export function verifyBuffer(buffer) {
  const trailer = readTrailer(buffer);
  const end = trailer.payloadOffset + trailer.payloadSize;
  if (end !== buffer.length - TRAILER_SIZE) {
    throw new Error(
      `payload ends at ${end} but the trailer starts at ${buffer.length - TRAILER_SIZE}`);
  }
  const payload = buffer.subarray(trailer.payloadOffset, end);
  const actual = createHash('sha256').update(payload).digest();
  if (!actual.equals(trailer.sha256)) {
    throw new Error(
      `payload SHA-256 is ${actual.toString('hex')}, trailer says ${trailer.sha256.toString('hex')}`);
  }
  return trailer;
}

export function pack({ launcher, payload, version }) {
  const sha256 = createHash('sha256').update(payload).digest();
  const trailer = buildTrailer({
    payloadOffset: launcher.length,
    payloadSize: payload.length,
    sha256,
    version,
  });
  return Buffer.concat([launcher, payload, trailer]);
}

/*
 * The members that cannot be served from inside the archive and so have to be
 * unpacked as real files. Everything else - about 39,000 files - the server
 * reads from the EXE through releases/single-exe/wekan-vfs.cjs.
 *
 *   *.exe            node.exe, ferretdb.exe and the MongoDB Database Tools are
 *                    separate processes; Windows needs a real path to start one
 *   *.node           native addons are loaded with LoadLibrary, same reason
 *   main.js          Node resolves the entry before the VFS hooks could see it
 *   start-wekan.bat  cmd.exe reads it
 *   wekan-vfs.cjs    node --require reads it before anything is mounted
 *
 * The list is computed from the archive rather than written by hand, so a
 * bundle that gains an addon or a tool does not silently lose it.
 */
export function realFileMembers(names, strip = 'bundle/') {
  const wanted = [];
  for (const name of names) {
    if (!name.startsWith(strip) || name.endsWith('/')) continue;
    const rel = name.slice(strip.length);
    const base = path.posix.basename(rel);
    const top = !rel.includes('/');
    if (rel.endsWith('.node') ||
        (top && rel.endsWith('.exe')) ||
        (top && (base === 'main.js' || base === 'start-wekan.bat' ||
                 base === 'wekan-vfs.cjs'))) {
      wanted.push(name);
    }
  }
  return wanted.sort();
}

/* A C header the launcher includes: the same list, as wide string literals. */
export function manifestHeader(members) {
  const lines = members.map(m => `  L"${m.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",`);
  return [
    '/* Generated by releases/append-windows-payload.mjs - do not edit. */',
    '#ifndef WEKAN_REAL_FILES_H',
    '#define WEKAN_REAL_FILES_H',
    '',
    'static const wchar_t *const WEKAN_REAL_FILES[] = {',
    ...lines,
    '};',
    '',
    `#define WEKAN_REAL_FILE_COUNT ${members.length}`,
    '',
    '#endif',
    '',
  ].join('\n');
}

/* The archive's member names, read with the same tar the launcher will use. */
export function memberNames(zipPath) {
  const out = execFileSync('tar', ['-t', '-f', zipPath], {
    encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
  });
  return out.split('\n').filter(Boolean);
}

function argument(argv, name) {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? undefined : argv[at + 1];
}

function main(argv) {
  const manifest = argument(argv, 'manifest');
  if (manifest) {
    const header = argument(argv, 'header');
    if (!header) { console.error('--manifest needs --header <file.h>'); return 2; }
    const members = realFileMembers(memberNames(manifest));
    fs.writeFileSync(header, manifestHeader(members));
    console.log(`${header}: ${members.length} members must be unpacked as real files`);
    for (const m of members) console.log(`  ${m}`);
    return 0;
  }

  const verify = argument(argv, 'verify');
  if (verify) {
    const trailer = verifyBuffer(fs.readFileSync(verify));
    console.log(
      `${path.basename(verify)}: WeKan ${trailer.version}, payload ${trailer.payloadSize} bytes at ${trailer.payloadOffset}, SHA-256 ${trailer.sha256.toString('hex')}`);
    return 0;
  }

  const launcherPath = argument(argv, 'launcher');
  const payloadPath = argument(argv, 'payload');
  const outputPath = argument(argv, 'output');
  const version = argument(argv, 'version');
  if (!launcherPath || !payloadPath || !outputPath || !version) {
    console.error(
      'Usage: append-windows-payload.mjs --manifest <zip> --header <file.h>\n' +
      '       append-windows-payload.mjs --launcher <exe> --payload <zip> --output <exe> --version <v>\n' +
      '       append-windows-payload.mjs --verify <exe>');
    return 2;
  }

  const exe = pack({
    launcher: fs.readFileSync(launcherPath),
    payload: fs.readFileSync(payloadPath),
    version,
  });
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(outputPath, exe);
  const trailer = verifyBuffer(fs.readFileSync(outputPath));
  console.log(
    `Wrote ${outputPath}: WeKan ${trailer.version}, ${exe.length} bytes, payload ${trailer.payloadSize} bytes at ${trailer.payloadOffset}, SHA-256 ${trailer.sha256.toString('hex')}`);
  return 0;
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`append-windows-payload: ${error.message}`);
    process.exit(1);
  }
}
