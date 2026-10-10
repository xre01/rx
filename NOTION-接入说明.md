# 网站上传到 Daily Practice 日历

这份版本已添加上传表单及 Cloudflare Worker 后端。尚未部署，也尚未使用真实 Notion 密钥完成上传测试。

## 保存方式

- 接收数据库：PTE 页面下的 Daily Practice。
- 每次提交按选择的日期查找 `Date`；已有页面则追加，没有则创建 `YYYY-MM-DD · 每日任务`。
- 同一天已有多个页面时，追加到创建时间最早的页面。不会删除或覆盖已有任务。
- 分类使用页面内容标题，任务为待办，附件保存在页面正文。
- 每次最多 5 个附件，总大小 20 MiB。Notion 对文件类型及工作区上传额度的限制仍然适用。
- 上传成功才清空输入。当前页面内重试同一次提交会复用提交编号，并检查已有内容以避免重复追加。
- 首页提升总览仍是当前浏览器的文字缓存；跨设备查看以 Notion 和档案馆为准。首页删除缓存不会删除 Notion 内容。
- 不会自动上传旧的本地记录；需要逐项提交。网页中的演示试炼也不会自动上传。

## 第一步：准备 Notion 连接

1. 打开 https://www.notion.so/profile/integrations ，创建一个内部连接，选择存放 PTE 的工作区。
2. 开启读取内容、插入内容、更新内容权限。
3. 在 Notion 打开 PTE 页面，右上角 `···` → `连接 / Connections`，添加这个连接；也可以在连接设置的访问权限里授予 PTE 或 Daily Practice 的访问权限。
4. 保留连接密钥；只在 Cloudflare 的 Secret 中设置，不要放进网页、GitHub、这份说明或聊天。

当前聊天中的 Notion 连接与网站运行时使用的这个连接是独立的。

## 第二步：部署后端

需要一个 Cloudflare 账户。后端使用一个 Durable Object 来串行处理上传，避免多个浏览器同时提交时创建重复的当天页面。

在这份项目的 `worker` 目录运行以下命令；需要已安装 Node.js/npm 的电脑：

```powershell
npx wrangler login
npx wrangler secret put NOTION_TOKEN
npx wrangler secret put ACCESS_PASSWORD
npx wrangler deploy
```

第一条打开 Cloudflare 登录。第二条按提示输入 Notion 内部连接密钥。第三条设置你自己使用的较长通行令。第四条部署并返回 `https://rex-notion-calendar....workers.dev` 地址。

`wrangler.toml` 已配置目标数据库和 Durable Object。`ALLOWED_ORIGIN` 预设为 `https://xre01.github.io`；如果网页使用自定义域名，请改成实际网站来源，例如 `https://example.com`，不要包含路径或末尾斜杠。

## 第三步：更新 GitHub 网站

将 `index.html`、`notion-upload.js` 上传到 `xre01/rx` 的网站发布分支根目录。图片资源沿用原仓库文件。`worker` 目录是后端部署源文件。

等待 GitHub Pages 更新后，打开网站 → 魔法档案馆：

1. 填入 Worker 的 HTTPS 地址。
2. 填入刚才设置的通行令。
3. 点击「同步魔法档案」，确认可以读取日历。
4. 回首页，在「记录一次提升」选择日期，填写任务或选附件，点击「保存到 Notion」。
5. 点击成功提示中的「打开当天任务」，检查日历的对应日期。当天再次提交应出现在同一页面。

通行令仅在当前浏览器会话保存；Notion 密钥仅保存在后端。首次连接需要手工输入 Worker 地址。

## 已完成的本地验证

4 个模拟接口测试通过：访问来源和通行令校验、同日复用与并发/重试、无效日期拒绝、附件成功后才追加任务且失败不返回保存成功。网站和后端脚本语法检查通过。

```powershell
node --test --test-isolation=none worker/worker.test.mjs
```

仍需验证：Cloudflare 实际部署、Notion 连接权限、真实文件上传，以及已发布网站上的完整操作。

参考：
- https://developers.notion.com/guides/data-apis/uploading-small-files
- https://developers.notion.com/reference/query-a-data-source
- https://developers.cloudflare.com/durable-objects/
