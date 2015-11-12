# Wekan

[![Join the chat][gitter_badge]][gitter_chat]

Wekan is an open-source and collaborative kanban board application.

Whether you’re maintaining a personal todo list, planning your holidays with
some friends, or working in a team on your next revolutionary idea, Kanban
boards are an unbeatable tool to keep your things organized. They give you a
visual overview of the current state of your project, and make you productive by
allowing you to focus on the few items that matter the most.

[![Our roadmap is self-hosted on Wekan][screenshot]][roadmap]

Wekan supports most features you would expect of it including a real-time user
interface, cards comments, member assignations, customizable labels, filtered
views, and more.

Since it is a free software, you don’t have to trust us with your data and can
install Wekan on your own computer or server. In fact we encourage you to do
that by providing one-click installation on Heroku or [Sandstorm]
[sandstorm_market] platforms and verified [Docker][docker_image] images.

[![Deploy][heroku_button]][heroku_deploy]

Wekan is released under the very permissive [MIT license](LICENSE), and made
with [Meteor](https://www.meteor.com).

[Our roadmap is self-hosted on Wekan][roadmap]

[screenshot]: http://i.imgur.com/cI4jW2h.png
[gitter_badge]: https://badges.gitter.im/Join%20Chat.svg
[gitter_chat]: https://gitter.im/wekan/wekan
[roadmap]: http://try.wekan.io/b/MeSsFJaSqeuo9M6bs/wekan-roadmap
[sandstorm_market]: https://oasis.sandstorm.io/appdemo/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h
[docker_image]: https://hub.docker.com/r/mquandalle/wekan/
[heroku_button]: https://www.herokucdn.com/deploy/button.png
[heroku_deploy]: https://heroku.com/deploy?template=https://github.com/wekan/wekan/tree/master

# Cn-WeKan

除了原作者（Maxime Quandalle）提供的功能外，我（Raymond Xie）新增了如下功能（感谢原作者的优秀架构，在原作基础上新增功能还是比较容易的）：

## 操作优化
* 附件上传支持复制粘贴图片、拖放文件
* 点击卡片附件的小图，能够快速预览大图
* 中文翻译全部语句

## 批量处理
* 新建看板时，可从把现有看板作为模版，导入清单、成员、标签（例如：可以为迭代、Bug单快速建立看板）
* 从另一看板的某清单导入全部卡片（例如，可以把项目计划中的内容快速导入迭代看板）
* 创建卡片时从excel直接批量copy/paste，批量建立任务卡片

## 时间管理
* 为卡片增加工作量、截止日期、开始、完成日期，并显示在小卡片上
* 卡片拖入清单的时候，自动记录开始、完成日期

## 消息推送
* 集成 [QQ机器人/smart-bot](https://github.com/floatinghotpot/qqbot)
* 可在自己的档案中输入自己的QQ号，用来接收消息
* 当任务分配、状态发生改变、或者有人留言的时候，QQ消息推送给相关人

## 数据迁移
* 支持从 Redmine 导出的 CSV 文件导入 WeKan，并保留所有信息（附件除外）

## 其他
* 原作者提供的新功能，我会定期合并进来。我也会把自己实现的功能，提交给原作者，但是原作者是个很严谨的人，何时能够接受，难以预知
* 报表功能、燃尽图等功能暂不具备。如果需要其他功能，可以通过 issue 提交需求，我会根据需求的可行性和价值，建议给原作者，或者自己加以实现
