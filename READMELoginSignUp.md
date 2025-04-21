# 🔐 WeKan — Login System Overview

This document provides a detailed overview of WeKan’s **login and authentication system**, covering client-side UI, server-side logic, external authentication methods, and potential upgrade paths.

---

## 🖥️ Login Web UI

WeKan's login interface is implemented using a combination of:

- `layouts.jade` – Login HTML structure
- `layouts.js` – Login logic and interactivity
- `layouts.css` – Styling and layout

📁 Source: [`client/components/main`](https://github.com/wekan/wekan/tree/main/client/components/main)

---

## ⚙️ Server-Side Authentication

Server-side login functionality is handled in:

- [`server/authentication.js`](https://github.com/wekan/wekan/blob/main/server/authentication.js)

Other related configurations:

- 🔧 Account config: [`config/accounts.js`](https://github.com/wekan/wekan/blob/main/config/accounts.js)
- 📨 Sign-up invitations: [`models/settings.js#L275`](https://github.com/wekan/wekan/blob/main/models/settings.js#L275)
- 👤 User creation logic: [`models/users.js#L1339`](https://github.com/wekan/wekan/blob/main/models/users.js#L1339)

---

## 👥 Meteor User Accounts

WeKan utilizes Meteor’s `accounts` system. Relevant resources:

- 📚 Meteor 2.x Accounts Docs: [v2-docs.meteor.com/api/accounts](https://v2-docs.meteor.com/api/accounts)
- 🔍 Meteor Packages:
  - [`packages`](https://github.com/wekan/wekan/blob/main/.meteor/packages)
  - [`versions`](https://github.com/wekan/wekan/blob/main/.meteor/versions)
- 📦 Meteor 2.14 core packages: [Meteor 2.14 packages](https://github.com/meteor/meteor/tree/release/METEOR%402.14/packages)

---

## 🔐 External Authentication (OIDC, LDAP, etc.)

WeKan supports external authentication methods via internal packages.

📁 See [`packages/`](https://github.com/wekan/wekan/tree/main/packages) for:
- OpenID Connect (OIDC)
- LDAP
- OAuth and other integrations

---

## 📦 NPM & AtmosphereJS Dependencies

- 🔗 `package.json`: [Dependencies list](https://github.com/wekan/wekan/blob/main/package.json)
- 🧩 WekanTeam scoped NPM packages: [@wekanteam on npm](https://www.npmjs.com/search?q=%40wekanteam)
- ☁️ AtmosphereJS Meteor packages: [atmospherejs.com](https://atmospherejs.com)

---

## 🚧 Meteor Version & Upgrade Notes

- 📌 Current Version: **Meteor 2.14**
  - [`.meteor/release`](https://github.com/wekan/wekan/blob/main/.meteor/release)
- 🔧 Maintained with only **critical fixes** until ~Summer 2025
- 🚀 Migration to **Meteor 3** or a new framework is under consideration

📘 Meteor 3 API: [docs.meteor.com/api/accounts](https://docs.meteor.com/api/accounts)

---

## 🧪 Prototypes & Examples

### 🐘 PHP Prototype Sign-Up

Used in experimental versions:

- Step 1: [`sign-up1.php`](https://github.com/wekan/php/blob/main/page/sign-up1.php)
- Step 2: [`sign-up2.php`](https://github.com/wekan/php/blob/main/page/sign-up2.php)
- Main entry: [`index.php#L72-L83`](https://github.com/wekan/php/blob/main/public/index.php#L72-L83)

---

### 🎨 WeKan Studio Prototype

Sign-up logic in the **WeKan Studio** version:

- [`signUp.fmt`](https://github.com/wekan/wekanstudio/blob/main/srv/templates/login/signUp.fmt)

---

## 📎 Future Considerations

- Upgrading to **Meteor 3.x**
- Refactoring frontend logic to fix translation rendering order
- Exploring **simplified authentication systems** in future prototypes

---

## 🔗 Project Links

- 🔧 Main Repo: [github.com/wekan/wekan](https://github.com/wekan/wekan)
- 🌐 Website: [wekan.github.io](https://wekan.github.io)
- 📚 Documentation: [Wekan Wiki](https://github.com/wekan/wekan/wiki)

---



---
