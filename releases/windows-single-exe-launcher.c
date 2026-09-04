#define UNICODE
#define _UNICODE
#define WIN32_LEAN_AND_MEAN

#include <windows.h>
#include <bcrypt.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <wchar.h>

#include "wekan-real-files.h"

#pragma comment(lib, "bcrypt.lib")

/*
 * WeKan's single Windows EXE: this launcher with the published win64 ZIP
 * appended to it, and an 80-byte trailer at the very end of the file saying
 * where that payload starts, how long it is and what its SHA-256 is.
 * releases/append-windows-payload.mjs writes the payload and the trailer;
 * TRAILER_* below and that script are the two halves of one format and are
 * checked against each other by tests/windowsSingleExe.test.cjs.
 *
 * The bundle is NOT unpacked. On its first run the launcher verifies the
 * payload's SHA-256 and unpacks only the members listed in the generated
 * wekan-real-files.h - the executables, the native addons, main.js,
 * start-wekan.bat and wekan-vfs.cjs, about thirty files - into a real
 * "wekan-app" directory beside itself. The other ~39,000 files stay inside
 * the EXE and are read from it in-process by releases/single-exe/wekan-vfs.cjs,
 * which node.exe preloads. WEKAN_VFS_* below is how this launcher tells it
 * where the archive is.
 *
 * WeKan used to be packed with Enigma Virtual Box, which served all 44,401
 * bundle files from a virtual filesystem inside the EXE. That is what broke
 * 11.48: after Node.js loaded the native bcrypt addon out of it, the next read
 * - promises.js, whose bytes sit immediately after that addon - came back as
 * the addon's own PE bytes, so the server died with "SyntaxError: Invalid or
 * unexpected token" in a restart loop. The idea was right and the closed-source
 * implementation was wrong, so the mounting is ours now, in JavaScript, where
 * it is tested against a real bundle.
 *
 * Persistent data is unaffected: it stays in a real "wekan-files" directory
 * beside the EXE, so the EXE and its data can be moved together, and unpacking
 * a newer version never touches them.
 */

#define TRAILER_SIZE 80
#define TRAILER_MAGIC "WEKANSFX"
#define TRAILER_MAGIC_SIZE 8
#define TRAILER_FORMAT 1
#define TRAILER_OFFSET_POS 16
#define TRAILER_SIZE_POS 24
#define TRAILER_SHA256_POS 32
#define TRAILER_VERSION_POS 64
#define TRAILER_VERSION_SIZE 16
#define SHA256_SIZE 32

#define COPY_CHUNK (1024 * 1024)

/* Paths in the bundle reach 191 characters, so keep every buffer generous. */
#define PATHBUF 4096

static int complain(const wchar_t *what, DWORD code) {
  fwprintf(stderr, L"WeKan: %ls (error %lu).\n", what, code);
  return 1;
}

static void hex(const unsigned char *bytes, size_t count, wchar_t *out) {
  static const wchar_t digits[] = L"0123456789abcdef";
  size_t i;
  for (i = 0; i < count; i++) {
    out[i * 2] = digits[bytes[i] >> 4];
    out[i * 2 + 1] = digits[bytes[i] & 0x0f];
  }
  out[count * 2] = L'\0';
}

static unsigned long long read_u64(const unsigned char *p) {
  unsigned long long value = 0;
  int i;
  for (i = 7; i >= 0; i--) {
    value = (value << 8) | p[i];
  }
  return value;
}

static unsigned long read_u32(const unsigned char *p) {
  return (unsigned long)p[0] | ((unsigned long)p[1] << 8) |
         ((unsigned long)p[2] << 16) | ((unsigned long)p[3] << 24);
}

/*
 * Copy payload_size bytes from payload_offset in the EXE into zip_path, and
 * hash them while they go past. Returns 0 on success.
 */
static int unpack_payload(const wchar_t *exe_path, const wchar_t *zip_path,
                          unsigned long long payload_offset,
                          unsigned long long payload_size,
                          unsigned char digest[SHA256_SIZE]) {
  HANDLE source = INVALID_HANDLE_VALUE;
  HANDLE target = INVALID_HANDLE_VALUE;
  BCRYPT_ALG_HANDLE algorithm = NULL;
  BCRYPT_HASH_HANDLE hash = NULL;
  unsigned char *buffer = NULL;
  LARGE_INTEGER start;
  unsigned long long left = payload_size;
  int result = 1;

  buffer = (unsigned char *)malloc(COPY_CHUNK);
  if (!buffer) {
    complain(L"cannot allocate its unpack buffer", 0);
    goto done;
  }
  if (!BCRYPT_SUCCESS(BCryptOpenAlgorithmProvider(&algorithm, BCRYPT_SHA256_ALGORITHM,
                                                  NULL, 0)) ||
      !BCRYPT_SUCCESS(BCryptCreateHash(algorithm, &hash, NULL, 0, NULL, 0, 0))) {
    complain(L"cannot start a SHA-256 hash", GetLastError());
    goto done;
  }

  source = CreateFileW(exe_path, GENERIC_READ, FILE_SHARE_READ, NULL,
                       OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
  if (source == INVALID_HANDLE_VALUE) {
    complain(L"cannot read its own executable", GetLastError());
    goto done;
  }
  start.QuadPart = (LONGLONG)payload_offset;
  if (!SetFilePointerEx(source, start, NULL, FILE_BEGIN)) {
    complain(L"cannot seek to its packed WeKan bundle", GetLastError());
    goto done;
  }

  target = CreateFileW(zip_path, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS,
                       FILE_ATTRIBUTE_NORMAL, NULL);
  if (target == INVALID_HANDLE_VALUE) {
    complain(L"cannot write the unpacked bundle beside itself", GetLastError());
    goto done;
  }

  while (left > 0) {
    DWORD want = (DWORD)(left < COPY_CHUNK ? left : COPY_CHUNK);
    DWORD got = 0;
    DWORD written = 0;
    if (!ReadFile(source, buffer, want, &got, NULL) || got == 0) {
      complain(L"cannot read its packed WeKan bundle", GetLastError());
      goto done;
    }
    if (!BCRYPT_SUCCESS(BCryptHashData(hash, buffer, got, 0))) {
      complain(L"cannot hash its packed WeKan bundle", GetLastError());
      goto done;
    }
    if (!WriteFile(target, buffer, got, &written, NULL) || written != got) {
      complain(L"cannot write the unpacked bundle to disk", GetLastError());
      goto done;
    }
    left -= got;
  }

  if (!BCRYPT_SUCCESS(BCryptFinishHash(hash, digest, SHA256_SIZE, 0))) {
    complain(L"cannot finish hashing its packed WeKan bundle", GetLastError());
    goto done;
  }
  result = 0;

done:
  if (target != INVALID_HANDLE_VALUE) CloseHandle(target);
  if (source != INVALID_HANDLE_VALUE) CloseHandle(source);
  if (hash) BCryptDestroyHash(hash);
  if (algorithm) BCryptCloseAlgorithmProvider(algorithm, 0);
  free(buffer);
  return result;
}

/*
 * Unpack just the members WEKAN_REAL_FILES names, in batches that keep each
 * command line well inside the Windows limit.
 */
static int unpack_real_files(const wchar_t *system_dir, const wchar_t *zip_path,
                             const wchar_t *app_dir, wchar_t *command,
                             size_t command_len) {
  const size_t budget = command_len > 12000 ? 12000 : command_len - 64;
  size_t i = 0;
  while (i < WEKAN_REAL_FILE_COUNT) {
    int status;
    size_t used;
    _snwprintf_s(command, command_len, _TRUNCATE,
                 L"\"\"%ls\\tar.exe\" -x -f \"%ls\" -C \"%ls\" --strip-components=1",
                 system_dir, zip_path, app_dir);
    used = wcslen(command);
    while (i < WEKAN_REAL_FILE_COUNT &&
           used + wcslen(WEKAN_REAL_FILES[i]) + 8 < budget) {
      wcscat_s(command, command_len, L" \"");
      wcscat_s(command, command_len, WEKAN_REAL_FILES[i]);
      wcscat_s(command, command_len, L"\"");
      used = wcslen(command);
      i++;
    }
    wcscat_s(command, command_len, L"\"");
    status = _wsystem(command);
    if (status != 0) return status;
  }
  return 0;
}

/*
 * wekan-app/.wekan-version records which WeKan the directory was unpacked
 * from, so a newer EXE beside an older unpacked tree replaces it and an
 * unchanged one starts straight away.
 */
static void stamp_path(const wchar_t *app_dir, wchar_t *out, size_t out_len) {
  _snwprintf_s(out, out_len, _TRUNCATE, L"%ls\\.wekan-version", app_dir);
}

static int stamp_matches(const wchar_t *app_dir, const wchar_t *version) {
  wchar_t path[PATHBUF];
  char have[TRAILER_VERSION_SIZE + 1];
  wchar_t wide[TRAILER_VERSION_SIZE + 1];
  HANDLE file;
  DWORD got = 0;

  stamp_path(app_dir, path, PATHBUF);
  file = CreateFileW(path, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING,
                     FILE_ATTRIBUTE_NORMAL, NULL);
  if (file == INVALID_HANDLE_VALUE) return 0;
  if (!ReadFile(file, have, TRAILER_VERSION_SIZE, &got, NULL)) got = 0;
  CloseHandle(file);
  have[got] = '\0';
  MultiByteToWideChar(CP_ACP, 0, have, -1, wide, TRAILER_VERSION_SIZE + 1);
  return wcscmp(wide, version) == 0;
}

static void write_stamp(const wchar_t *app_dir, const wchar_t *version) {
  wchar_t path[PATHBUF];
  char narrow[TRAILER_VERSION_SIZE + 1];
  HANDLE file;
  DWORD written = 0;

  stamp_path(app_dir, path, PATHBUF);
  WideCharToMultiByte(CP_ACP, 0, version, -1, narrow, sizeof(narrow), NULL, NULL);
  file = CreateFileW(path, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS,
                     FILE_ATTRIBUTE_NORMAL, NULL);
  if (file == INVALID_HANDLE_VALUE) return;
  WriteFile(file, narrow, (DWORD)strlen(narrow), &written, NULL);
  CloseHandle(file);
}

int wmain(void) {
  wchar_t exe_path[PATHBUF];
  wchar_t dir[PATHBUF];
  wchar_t app_dir[PATHBUF];
  wchar_t zip_path[PATHBUF];
  wchar_t bat_path[PATHBUF];
  wchar_t system_dir[PATHBUF];
  wchar_t command[PATHBUF * 3];
  wchar_t data[PATHBUF];
  wchar_t version[TRAILER_VERSION_SIZE + 1];
  wchar_t want_hex[SHA256_SIZE * 2 + 1];
  wchar_t got_hex[SHA256_SIZE * 2 + 1];
  unsigned char trailer[TRAILER_SIZE];
  unsigned char digest[SHA256_SIZE];
  char narrow_version[TRAILER_VERSION_SIZE + 1];
  unsigned long long payload_offset;
  unsigned long long payload_size;
  LARGE_INTEGER trailer_at;
  HANDLE self;
  DWORD got = 0;
  wchar_t *slash;
  int status;

  SetLastError(ERROR_SUCCESS);
  if (!GetModuleFileNameW(NULL, exe_path, PATHBUF) ||
      GetLastError() == ERROR_INSUFFICIENT_BUFFER) {
    return complain(L"cannot locate its executable", GetLastError());
  }
  wcscpy_s(dir, PATHBUF, exe_path);
  slash = wcsrchr(dir, L'\\');
  if (!slash) {
    fwprintf(stderr, L"WeKan: executable path has no directory.\n");
    return 1;
  }
  *slash = L'\0';
  if (!SetCurrentDirectoryW(dir)) {
    return complain(L"cannot enter its own directory", GetLastError());
  }

  /* The trailer is the last TRAILER_SIZE bytes of this executable. */
  self = CreateFileW(exe_path, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING,
                     FILE_ATTRIBUTE_NORMAL, NULL);
  if (self == INVALID_HANDLE_VALUE) {
    return complain(L"cannot read its own executable", GetLastError());
  }
  trailer_at.QuadPart = -(LONGLONG)TRAILER_SIZE;
  if (!SetFilePointerEx(self, trailer_at, NULL, FILE_END) ||
      !ReadFile(self, trailer, TRAILER_SIZE, &got, NULL) || got != TRAILER_SIZE) {
    CloseHandle(self);
    return complain(L"cannot read its packed-bundle trailer", GetLastError());
  }
  CloseHandle(self);

  if (memcmp(trailer, TRAILER_MAGIC, TRAILER_MAGIC_SIZE) != 0 ||
      read_u32(trailer + TRAILER_MAGIC_SIZE) != TRAILER_FORMAT) {
    fwprintf(stderr,
             L"WeKan: this file carries no WeKan bundle. Download\n"
             L"WeKan-<version>-win64.exe again from\n"
             L"https://github.com/wekan/wekan/releases - the copy here is not\n"
             L"a complete WeKan single-file release.\n");
    return 1;
  }
  payload_offset = read_u64(trailer + TRAILER_OFFSET_POS);
  payload_size = read_u64(trailer + TRAILER_SIZE_POS);
  memcpy(narrow_version, trailer + TRAILER_VERSION_POS, TRAILER_VERSION_SIZE);
  narrow_version[TRAILER_VERSION_SIZE] = '\0';
  MultiByteToWideChar(CP_ACP, 0, narrow_version, -1, version,
                      TRAILER_VERSION_SIZE + 1);

  _snwprintf_s(app_dir, PATHBUF, _TRUNCATE, L"%ls\\wekan-app", dir);
  _snwprintf_s(bat_path, PATHBUF, _TRUNCATE, L"%ls\\start-wekan.bat", app_dir);
  _snwprintf_s(zip_path, PATHBUF, _TRUNCATE, L"%ls\\wekan-bundle.zip", dir);

  if (!(stamp_matches(app_dir, version) &&
        GetFileAttributesW(bat_path) != INVALID_FILE_ATTRIBUTES)) {
    /*
     * Unpack. Only wekan-app is replaced: wekan-files, which holds the
     * database, attachments and avatars, is a sibling and is never touched.
     */
    wprintf(L"WeKan %ls: unpacking into %ls (first run only) ...\n", version,
            app_dir);
    _snwprintf_s(command, _countof(command), _TRUNCATE,
                 L"rd /s /q \"%ls\" >nul 2>nul", app_dir);
    _wsystem(command);
    if (!CreateDirectoryW(app_dir, NULL) &&
        GetLastError() != ERROR_ALREADY_EXISTS) {
      return complain(L"cannot create its wekan-app directory", GetLastError());
    }

    if (unpack_payload(exe_path, zip_path, payload_offset, payload_size, digest)) {
      DeleteFileW(zip_path);
      return 1;
    }
    if (memcmp(digest, trailer + TRAILER_SHA256_POS, SHA256_SIZE) != 0) {
      hex(trailer + TRAILER_SHA256_POS, SHA256_SIZE, want_hex);
      hex(digest, SHA256_SIZE, got_hex);
      DeleteFileW(zip_path);
      fwprintf(stderr,
               L"WeKan: the WeKan bundle inside this EXE is damaged.\n"
               L"  expected SHA-256 %ls\n"
               L"  got              %ls\n"
               L"Download WeKan-%ls-win64.exe again from\n"
               L"https://github.com/wekan/wekan/releases and check its\n"
               L".sha256sum before running it.\n",
               want_hex, got_hex, version);
      return 1;
    }

    /*
     * tar.exe (bsdtar) has shipped with Windows since 10 1803 and reads ZIP
     * archives. Every Windows that can run this bundle's Node.js 24 is newer
     * than that, so a missing tar.exe is a broken Windows, not an old one.
     * --strip-components=1 drops the archive's leading "bundle/" so the
     * unpacked paths are no longer than the plain ZIP's. Only the members in
     * WEKAN_REAL_FILES are named: everything else is left in the archive for
     * wekan-vfs.cjs to serve. They are named literally rather than by pattern,
     * because a pattern that quietly matched nothing would leave WeKan without
     * an addon it needs and no error to say so.
     */
    if (!GetSystemDirectoryW(system_dir, PATHBUF)) {
      return complain(L"cannot locate the Windows system directory", GetLastError());
    }
    status = unpack_real_files(system_dir, zip_path, app_dir, command,
                               _countof(command));
    DeleteFileW(zip_path);
    if (status != 0) {
      fwprintf(stderr,
               L"WeKan: unpacking the bundle failed (tar exit %d). Windows'\n"
               L"own tar.exe in %ls is needed, and there must be room for\n"
               L"about 500 MB beside this EXE.\n",
               status, system_dir);
      return 1;
    }
    /*
     * main.js chdir()s here, and a working directory is a kernel concept that
     * no hook can answer, so it has to be a real directory.
     */
    _snwprintf_s(command, _countof(command), _TRUNCATE, L"%ls\\programs", app_dir);
    CreateDirectoryW(command, NULL);
    _snwprintf_s(command, _countof(command), _TRUNCATE, L"%ls\\programs\\server", app_dir);
    CreateDirectoryW(command, NULL);
    if (GetFileAttributesW(bat_path) == INVALID_FILE_ATTRIBUTES) {
      fwprintf(stderr, L"WeKan: %ls is missing after unpacking.\n", bat_path);
      return 1;
    }
    write_stamp(app_dir, version);
  }

  /*
   * By default WeKan's persistent files and its SQLite database go in a real
   * "wekan-files" directory beside the EXE, so the EXE and its data move
   * together. An administrator's explicit WRITABLE_PATH wins.
   */
  /*
   * How wekan-vfs.cjs finds the archive: this EXE, the payload's place in it,
   * and the directory the archive is mounted at. A bundle started any other
   * way sees none of these and loads the file as a no-op.
   */
  if (!SetEnvironmentVariableW(L"WEKAN_VFS_ARCHIVE", exe_path) ||
      !SetEnvironmentVariableW(L"WEKAN_VFS_ROOT", app_dir)) {
    return complain(L"cannot point WeKan at its packed bundle", GetLastError());
  }
  _snwprintf_s(command, _countof(command), _TRUNCATE, L"%llu",
               (unsigned long long)payload_offset);
  SetEnvironmentVariableW(L"WEKAN_VFS_OFFSET", command);
  _snwprintf_s(command, _countof(command), _TRUNCATE, L"%llu",
               (unsigned long long)payload_size);
  SetEnvironmentVariableW(L"WEKAN_VFS_LENGTH", command);

  if (!GetEnvironmentVariableW(L"WRITABLE_PATH", data, PATHBUF)) {
    _snwprintf_s(data, PATHBUF, _TRUNCATE, L"%ls\\wekan-files", dir);
    if (!SetEnvironmentVariableW(L"WRITABLE_PATH", data)) {
      return complain(L"cannot set WRITABLE_PATH", GetLastError());
    }
  }

  _snwprintf_s(command, _countof(command), _TRUNCATE,
               L"cmd.exe /D /S /C \"\"%ls\"\"", bat_path);
  wprintf(L"WeKan data: %ls\n", data);
  wprintf(L"Starting the bundled Node.js, FerretDB and WeKan ...\n\n");
  errno = 0;
  status = _wsystem(command);
  if (status == -1) {
    fwprintf(stderr, L"WeKan: start-wekan.bat could not run (errno %d).\n", errno);
    return 1;
  }
  return status;
}
