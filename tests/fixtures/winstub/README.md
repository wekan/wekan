# Stub Windows headers

Just enough of `windows.h` and `bcrypt.h` to type-check
`releases/windows-single-exe-launcher.c` on a machine that is not Windows and
has no Windows SDK. `tests/windowsSingleExe.test.cjs` compiles the launcher
against these with `-fsyntax-only`, so a typo, a wrong argument count or a
misspelled API is caught by the ordinary test run instead of by a release
build on a GitHub runner.

They are deliberately NOT a Windows SDK: the types are the smallest ones that
make the launcher's own calls check out. Adding a call to the launcher may mean
adding its prototype here.
