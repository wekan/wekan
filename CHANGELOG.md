The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v13.27 2026-11-22 WeKan ® release

**CodeQL** alert #611 is fixed: the **autolink rules** find the
links already in a card's text in linear time, so a description built of
thousands of brackets no longer takes seconds to render.

[All changes in v13.27](CHANGELOG-big.md#v1327-2026-11-22-wekan--release)

# v13.26 2026-11-22 WeKan ® release

New **Workload and capacity**, **Budget and billing** and **Cloud
Panel** pages: hours against working time, each board's cost and margin with
**expenses**, **fees**, **quotes** and **invoices** in **PDF**, **Excel** and
**e-invoice**, and many customer domains merged into one WeKan. WordPress,
Ghost, Blogger and static sites import and export under **Website**, and a
public board can show itself as a **website**. The **Venda** and **Klingon**
translations hold only their own language, the move and copy pickers show names
without numbers (#6135), and unused code is removed.

[All changes in v13.26](CHANGELOG-big.md#v1326-2026-11-22-wekan--release)

# v13.25 2026-11-21 WeKan ® release

**CodeQL** alerts #605-#610 in the **OneNote** and **Sandstorm
grain** formats are fixed: comments in imported HTML are removed to a fixed
point, SandChat user ids come from a cryptographic generator, and the guards
that missed these shapes now find them anywhere in the tree.

[All changes in v13.25](CHANGELOG-big.md#v1325-2026-11-21-wekan--release)

# v13.24 2026-11-21 WeKan ® release

Six more of **Microsoft**'s tools are imported and exported under
the Microsoft heading: **Azure DevOps Boards**, **Microsoft Lists**,
**Microsoft Project** (XML), **Outlook** (.msg in, .eml out), **Teams** and
**OneNote**, the last two also fetched from Microsoft Graph. **Sandstorm** grain
backups of twelve apps are imported and nine exported, and **Vietnamese** no
longer shows Malay text.

[All changes in v13.24](CHANGELOG-big.md#v1324-2026-11-21-wekan--release)

# v13.23 2026-11-20 WeKan ® release

The **Import** page and the **Export** menu list a company's
products under the company's name: **37signals**, **Atlassian**, **Google** and
**Microsoft**.

[All changes in v13.23](CHANGELOG-big.md#v1323-2026-11-20-wekan--release)
