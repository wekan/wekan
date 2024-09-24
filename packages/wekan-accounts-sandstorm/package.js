// Copyright (c) 2014 Sandstorm Development Group, Inc. and contributors
// Licensed under the MIT License:
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

Package.describe({
  summary: "Login service for Sandstorm.io applications",
  version: "0.8.0",
  name: "wekan-accounts-sandstorm",
  git: "https://github.com/sandstorm-io/meteor-accounts-sandstorm.git"
});

Package.onUse(function(api) {
  api.use('random', ['client', 'server']);
  api.use('accounts-base', ['client', 'server'], {weak: true});
  api.use('webapp', 'server');
  api.use('http', 'client');
  api.use('tracker', 'client');
  api.use('reactive-var', 'client');
  api.use('check', 'server');
  api.use('ddp-server', 'server');

  api.addFiles("client.js", "client");
  api.addFiles("server.js", "server");

  api.export("SandstormAccounts", "client");
});
