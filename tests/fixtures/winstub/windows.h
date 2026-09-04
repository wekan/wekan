#ifndef WEKAN_WINSTUB_WINDOWS_H
#define WEKAN_WINSTUB_WINDOWS_H
/* See README.md: a stand-in for the Windows SDK, for type-checking only. */
#include <stddef.h>
#include <stdlib.h>
#include <wchar.h>

typedef unsigned long DWORD;
typedef int BOOL;
typedef void *HANDLE;
typedef void *LPVOID;
typedef const void *LPCVOID;
typedef unsigned char BYTE, *PUCHAR;
typedef long long LONGLONG;
typedef unsigned int UINT;
typedef const wchar_t *LPCWSTR;
typedef wchar_t *LPWSTR;
typedef const char *LPCSTR;
typedef char *LPSTR;
typedef DWORD *LPDWORD;
typedef long LONG;
typedef long NTSTATUS;
typedef void *PVOID;

typedef union { struct { DWORD LowPart; LONG HighPart; } u; LONGLONG QuadPart; } LARGE_INTEGER;
typedef struct { DWORD nLength; LPVOID lpSecurityDescriptor; BOOL bInheritHandle; }
  SECURITY_ATTRIBUTES, *LPSECURITY_ATTRIBUTES;
typedef struct { DWORD Internal; } OVERLAPPED, *LPOVERLAPPED;

#define MAX_PATH 260
#define ERROR_SUCCESS 0UL
#define ERROR_INSUFFICIENT_BUFFER 122UL
#define ERROR_ALREADY_EXISTS 183UL
#define INVALID_HANDLE_VALUE ((HANDLE)(long long)-1)
#define INVALID_FILE_ATTRIBUTES ((DWORD)-1)
#define GENERIC_READ 0x80000000UL
#define GENERIC_WRITE 0x40000000UL
#define FILE_SHARE_READ 0x00000001UL
#define OPEN_EXISTING 3UL
#define CREATE_ALWAYS 2UL
#define FILE_ATTRIBUTE_NORMAL 0x80UL
#define FILE_BEGIN 0UL
#define FILE_END 2UL
#define CP_ACP 0U

DWORD GetModuleFileNameW(HANDLE, LPWSTR, DWORD);
BOOL SetCurrentDirectoryW(LPCWSTR);
HANDLE CreateFileW(LPCWSTR, DWORD, DWORD, LPSECURITY_ATTRIBUTES, DWORD, DWORD, HANDLE);
BOOL SetFilePointerEx(HANDLE, LARGE_INTEGER, LARGE_INTEGER *, DWORD);
BOOL ReadFile(HANDLE, LPVOID, DWORD, LPDWORD, LPOVERLAPPED);
BOOL WriteFile(HANDLE, LPCVOID, DWORD, LPDWORD, LPOVERLAPPED);
BOOL CloseHandle(HANDLE);
BOOL DeleteFileW(LPCWSTR);
BOOL CreateDirectoryW(LPCWSTR, LPSECURITY_ATTRIBUTES);
DWORD GetFileAttributesW(LPCWSTR);
UINT GetSystemDirectoryW(LPWSTR, UINT);
DWORD GetEnvironmentVariableW(LPCWSTR, LPWSTR, DWORD);
BOOL SetEnvironmentVariableW(LPCWSTR, LPCWSTR);
DWORD GetLastError(void);
void SetLastError(DWORD);
int MultiByteToWideChar(UINT, DWORD, LPCSTR, int, LPWSTR, int);
int WideCharToMultiByte(UINT, DWORD, LPCWSTR, int, LPSTR, int, LPCSTR, BOOL *);

/* The MSVC C runtime extensions the launcher uses. */
#define _TRUNCATE ((size_t)-1)
#define _countof(a) (sizeof(a) / sizeof((a)[0]))
int _snwprintf_s(wchar_t *, size_t, size_t, const wchar_t *, ...);
int wcscpy_s(wchar_t *, size_t, const wchar_t *);
int wcscat_s(wchar_t *, size_t, const wchar_t *);
int _wsystem(const wchar_t *);
#endif
