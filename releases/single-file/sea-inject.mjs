// Can a single executable application be injected into this Node.js at all?
//
// Node.js puts the SEA blob into its own executable with LIEF, which on ELF
// adds a PT_NOTE segment and therefore needs room for one more program
// header. How it makes that room depends on the binary, and two of the
// binaries WeKan ships are ones it cannot do correctly (v12.51):
//
//   - a non-PIE executable (ET_EXEC) gets the room from its one bss-like
//     segment - the PT_LOAD whose memory size is larger than its file size.
//     A binary linked by lld (FreeBSD's) puts RELRO in a PT_LOAD of its own,
//     so it has two, and LIEF stops with "Zero or more than 1 bss-like
//     segment" / "Failed to relocate ELF program headers";
//   - a PIE (ET_DYN) is shifted by a page instead, and every relocation is
//     adjusted - except, on i386, R_386_32, which LIEF does not support. A
//     32-bit Node.js stopped with std::bad_alloc doing it; postject, the same
//     LIEF, "succeeds" with 1,524 "Relocation R32 not supported!" warnings
//     and a binary whose absolute pointers all point a page too low.
//
// seaInjectProblem() answers from the file alone, so the builder can skip a
// target with the reason instead of failing the release - or, worse,
// publishing a single file that crashes. Anything that is not ELF is not
// judged here (PE and Mach-O are injected differently and work).

import fs from 'node:fs';

const ET_EXEC = 2;
const ET_DYN = 3;
const EM_386 = 3;
const PT_LOAD = 1;
const PT_DYNAMIC = 2;
const DT_NULL = 0;
const DT_REL = 17;
const DT_RELSZ = 18;
const DT_RELENT = 19;
const R_386_32 = 1;

function reader(buf, little, is64) {
  const u16 = o => (little ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = o => (little ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const u64 = o => Number(little ? buf.readBigUInt64LE(o) : buf.readBigUInt64BE(o));
  const word = o => (is64 ? u64(o) : u32(o));
  return { u16, u32, word };
}

export function elfFacts(buf) {
  if (buf.length < 52 || buf.readUInt32BE(0) !== 0x7f454c46) return null;
  const is64 = buf[4] === 2;
  const little = buf[5] === 1;
  const { u16, u32, word } = reader(buf, little, is64);
  const type = u16(16);
  const machine = u16(18);
  const phoff = word(is64 ? 32 : 28);
  const phentsize = u16(is64 ? 54 : 42);
  const phnum = u16(is64 ? 56 : 44);
  const segments = [];
  for (let i = 0; i < phnum; i += 1) {
    const o = phoff + i * phentsize;
    if (o + phentsize > buf.length) break;
    segments.push(is64
      ? { type: u32(o), offset: word(o + 8), vaddr: word(o + 16), filesz: word(o + 32), memsz: word(o + 40) }
      : { type: u32(o), offset: word(o + 4), vaddr: word(o + 8), filesz: word(o + 16), memsz: word(o + 20) });
  }
  const loads = segments.filter(s => s.type === PT_LOAD);
  const fileOffset = vaddr => {
    const s = loads.find(l => vaddr >= l.vaddr && vaddr < l.vaddr + l.filesz);
    return s ? s.offset + (vaddr - s.vaddr) : -1;
  };
  // R_386_32 relocations, from the dynamic section's DT_REL table: the ones
  // LIEF cannot move. Only i386 is read; it is the one machine with the gap.
  let r386abs = 0;
  const dyn = segments.find(s => s.type === PT_DYNAMIC);
  if (machine === EM_386 && !is64 && dyn) {
    const tags = {};
    for (let o = dyn.offset; o + 8 <= dyn.offset + dyn.filesz && o + 8 <= buf.length; o += 8) {
      const tag = u32(o);
      if (tag === DT_NULL) break;
      tags[tag] = u32(o + 4);
    }
    const at = tags[DT_REL] !== undefined ? fileOffset(tags[DT_REL]) : -1;
    const size = tags[DT_RELSZ] || 0;
    const ent = tags[DT_RELENT] || 8;
    if (at >= 0) {
      for (let o = at; o + ent <= at + size && o + ent <= buf.length; o += ent) {
        if ((u32(o + 4) & 0xff) === R_386_32) r386abs += 1;
      }
    }
  }
  return {
    type, machine, is64,
    bssLike: loads.filter(l => l.memsz > l.filesz).length,
    r386abs,
  };
}

export function seaInjectProblem(buf) {
  const elf = elfFacts(buf);
  if (!elf) return null;
  if (elf.type === ET_EXEC && elf.bssLike !== 1) {
    return `it is a non-PIE ELF executable with ${elf.bssLike} bss-like segments, and LIEF needs exactly one `
      + 'to add the SEA note segment (rebuild that Node.js as PIE, or link it with a single RW segment)';
  }
  if (elf.type === ET_DYN && elf.machine === EM_386 && elf.r386abs > 0) {
    return `it is an i386 PIE with ${elf.r386abs} R_386_32 relocations, which LIEF does not adjust when it moves `
      + 'the program headers (rebuild that Node.js with -no-pie, as nodejs.org builds Linux)';
  }
  return null;
}

export function seaInjectProblemOf(file) {
  return seaInjectProblem(fs.readFileSync(file));
}
