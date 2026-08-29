#define UNICODE
#define _UNICODE

#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <wchar.h>
#include <windows.h>

/*
 * The Enigma Virtual Box image needs a real PE entry point. This deliberately
 * does only what double-clicking start-wekan.bat in the ordinary Windows ZIP
 * does. The packed program is portable: by default its persistent files and
 * SQLite database go in a real "wekan-files" directory beside the EXE.
 */
int wmain(void) {
  wchar_t module[MAX_PATH];
  wchar_t command[MAX_PATH * 3];
  wchar_t data[MAX_PATH];
  wchar_t *slash;

  if (!GetModuleFileNameW(NULL, module, MAX_PATH)) {
    fwprintf(stderr, L"WeKan: cannot locate its executable (error %lu).\n",
             GetLastError());
    return 1;
  }
  slash = wcsrchr(module, L'\\');
  if (!slash) {
    fwprintf(stderr, L"WeKan: executable path has no directory.\n");
    return 1;
  }
  *slash = L'\0';
  if (!SetCurrentDirectoryW(module)) {
    fwprintf(stderr, L"WeKan: cannot enter %ls (error %lu).\n", module,
             GetLastError());
    return 1;
  }

  /*
   * Enigma's virtual filesystem compatibility layer can make Node's legacy
   * Windows version probe report a pre-Windows-10 version even though the host
   * is supported. The ordinary ZIP does not need this. The packed launcher
   * does, and the variable is Node's documented escape hatch for exactly a
   * false platform-version result. Preserve an administrator's explicit value.
   */
  if (!GetEnvironmentVariableW(L"NODE_SKIP_PLATFORM_CHECK", data, MAX_PATH) &&
      !SetEnvironmentVariableW(L"NODE_SKIP_PLATFORM_CHECK", L"1")) {
    fwprintf(stderr, L"WeKan: cannot set NODE_SKIP_PLATFORM_CHECK (error %lu).\n",
             GetLastError());
    return 1;
  }

  if (!GetEnvironmentVariableW(L"WRITABLE_PATH", data, MAX_PATH)) {
    if (wcslen(module) + wcslen(L"\\wekan-files") >= MAX_PATH) {
      fwprintf(stderr, L"WeKan: executable path is too long for its data directory.\n");
      return 1;
    }
    wcscpy_s(data, MAX_PATH, module);
    wcscat_s(data, MAX_PATH, L"\\wekan-files");
    if (!SetEnvironmentVariableW(L"WRITABLE_PATH", data)) {
      fwprintf(stderr, L"WeKan: cannot set WRITABLE_PATH (error %lu).\n",
               GetLastError());
      return 1;
    }
  }

  if (_snwprintf_s(command, _countof(command), _TRUNCATE,
                   L"cmd.exe /D /S /C \"\"%ls\\start-wekan.bat\"\"", module) < 0) {
    fwprintf(stderr, L"WeKan: launcher command is too long.\n");
    return 1;
  }

  wprintf(L"WeKan data: %ls\n", data);
  wprintf(L"Starting the bundled Node.js, FerretDB and WeKan ...\n\n");
  errno = 0;
  int status = _wsystem(command);
  if (status == -1) {
    fwprintf(stderr, L"WeKan: start-wekan.bat could not run (errno %d).\n",
             errno);
    return 1;
  }
  return status;
}
