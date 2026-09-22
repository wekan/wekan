#include <limits.h>
#include <mach-o/dyld.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(void) {
  char executable[PATH_MAX];
  uint32_t size = sizeof(executable);
  if (_NSGetExecutablePath(executable, &size) != 0) {
    fputs("WeKan: cannot locate the app launcher.\n", stderr);
    return 1;
  }
  char *macos = strstr(executable, "/Contents/MacOS/WeKan");
  if (macos == NULL || macos[21] != '\0') {
    fputs("WeKan: invalid app layout.\n", stderr);
    return 1;
  }
  if ((size_t)(macos - executable) + sizeof("/Contents/Resources/launch-wekan.command") > sizeof(executable)) {
    fputs("WeKan: app path is too long.\n", stderr);
    return 1;
  }
  strcpy(macos, "/Contents/Resources/launch-wekan.command");
  execl("/usr/bin/open", "open", "-a", "Terminal", executable, (char *)NULL);
  perror("WeKan: cannot open Terminal");
  return 1;
}
