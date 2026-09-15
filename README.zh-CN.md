# DSH Codex OAuth Bridge

[English](README.md) | 简体中文

一个非官方的 DeepSeek Harness Bundle，让 DSH 内置的 `openai-codex`
Provider 安装后即可使用。它会自动启用 Provider、为新会话选择 Codex 模型，
并将完整的 ChatGPT OAuth 流程和凭据存储交给 DSH 自身处理。

插件功能：

- 仅监听 `127.0.0.1:3081`；
- 自动启用 `openai-codex` Provider；
- 首次登录时将新会话默认模型设置为 `gpt-5.6-sol`；
- 尚未保存 Codex 凭据时自动打开系统浏览器；
- 授权完成后，后续启动不会重复打开登录页面；
- 不读取、不显示、不复制，也不上传 OAuth 令牌；
- 使用 DSH 自带的凭据库和 Provider 自带的本机回调；
- 无需修改 DSH 源码，卸载后即可移除。

本项目是社区项目，与 DeepSeek 或 OpenAI 无隶属或背书关系。Codex、ChatGPT
和 OpenAI 是 OpenAI 的商标。

## 环境要求

- DeepSeek Harness `0.1.1-rc.2` 或兼容的更高版本
- Node.js 22 或更高版本
- 有权使用 Codex 模型的 ChatGPT 账号

## 从 npm 安装

DSH Desktop 使用 `tauri` profile；独立浏览器版使用 `web` profile。
桌面版安装方式：

```powershell
dsh plugin --profile tauri add dsh-codex-oauth-bridge
```

重启 DSH Desktop 后，进入「设置 → 插件 → 插件列表」并搜索
`codex-oauth-bridge`，应显示「已启用 / 运行中」。此插件列表只展示状态，
不能在页面内直接启停；安装或移除当前 profile 的 Bundle 后重启才会生效。
「设置 → 插件 → Codex 桥接」标签可打开本机登录桥，查看状态并手动发起认证。
DSH Desktop 的「配置 → 插件」是另一套界面：插件旁显示「禁用」按钮表示当前
已启用；这里不会显示「运行中」。如果显示「启用」，点击后重启 DSH Desktop。
桥接会随 DSH 自动加载，无法在此卡片中单独启动进程。打开
<http://127.0.0.1:3081/> 可确认登录桥
是否运行、凭据是否已保存及新会话默认模型。三者不等于实际模型请求已成功。

独立 Web 版安装方式：

```powershell
dsh plugin --profile web add dsh-codex-oauth-bridge
dsh --profile web
```

第一次启动时，插件会选择 `gpt-5.6-sol`，并在系统浏览器中打开 OpenAI
登录页面。完成一次授权后，后续启动会复用 DSH 中保存的凭据，不再重复弹窗。

如需手动登录或重新授权，可访问 <http://127.0.0.1:3081/>。

## 从 GitHub 安装

```powershell
dsh plugin --profile tauri add github:zzx547651745/dsh-codex-oauth-bridge
```

随后重启 DSH Desktop。独立 Web 版将 `tauri` 改为 `web`。

## 从本地源码安装

```powershell
git clone https://github.com/zzx547651745/dsh-codex-oauth-bridge.git
dsh plugin --profile tauri add .\dsh-codex-oauth-bridge
```

随后重启 DSH Desktop。独立 Web 版将 `tauri` 改为 `web`。

## 卸载

```powershell
dsh plugin --profile tauri remove dsh-codex-oauth-bridge
```

卸载后需要重启 DSH Desktop。独立 Web 版将 `tauri` 改为 `web`。

## 安全说明

登录页面使用每进程随机生成的 CSRF 令牌，并且只监听 IPv4 回环地址。
OAuth 凭据由 DSH 写入其正常的凭据库。请勿分享你的 DSH 凭据文件。

默认模型只会在首次登录配置阶段写入。凭据已经存在后，用户在 DSH 中手动修改的
默认模型会在后续重启时得到保留。

如果端口 `3081` 已被占用，可以在启动 profile 之前，通过 DSH patch layer 修改
`codex-oauth-bridge` 配置项中的 `port`。
占用时插件会记录警告，不会因为登录页无法监听而使 DSH 崩溃；现有模型配置
仍然可用，但请释放端口或改端口后再使用手动登录页。

## 许可证

MIT
