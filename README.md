# DSH Codex OAuth Bridge

English | [简体中文](README.zh-CN.md)

An unofficial DeepSeek Harness bundle that makes DSH's built-in `openai-codex`
provider ready to use after installation. It enables the provider, selects a
Codex model for new conversations, and delegates the complete ChatGPT OAuth
flow and credential storage to DSH.

The bridge:

- binds only to `127.0.0.1:3081`;
- enables the `openai-codex` provider automatically;
- defaults new conversations to `gpt-5.6-sol`;
- opens the system browser automatically when no Codex credential is stored;
- skips the login popup on later starts once authorization exists;
- never reads, displays, copies, or uploads OAuth tokens;
- uses DSH's own credential store and the provider's own loopback callback;
- can be removed without modifying DSH source code.

This community project is not affiliated with or endorsed by DeepSeek or
OpenAI. Codex, ChatGPT, and OpenAI are trademarks of OpenAI.

## Requirements

- DeepSeek Harness `0.1.1-rc.2` or a compatible newer release
- Node.js 22 or newer
- A ChatGPT account with access to Codex models
- The `openai-codex` provider enabled in DSH's Models settings

## Install from npm

```powershell
dsh plugin --profile web add dsh-codex-oauth-bridge
dsh --profile web
```

On the first start, the bundle selects `gpt-5.6-sol` and opens the OpenAI login
page in the system browser. Complete authorization once; later starts reuse the
stored credential without opening another login window.

The manual login and reauthorization page remains available at
<http://127.0.0.1:3081/>.

## Install from GitHub

```powershell
dsh plugin --profile web add github:zzx547651745/dsh-codex-oauth-bridge
dsh --profile web
```

## Install from a local checkout

```powershell
git clone https://github.com/zzx547651745/dsh-codex-oauth-bridge.git
dsh plugin --profile web add .\dsh-codex-oauth-bridge
dsh --profile web
```

## Remove

```powershell
dsh plugin --profile web remove dsh-codex-oauth-bridge
```

Restart the Web profile after installing or removing the bundle.

## Security

The page uses a per-process CSRF token and listens on the IPv4 loopback address
only. OAuth credentials are written by DSH to its normal credential store. Do
not share your DSH credential file.

The default model is written only as part of the first-login setup. After a
credential exists, changing the default model in DSH is respected on later
restarts.

If port `3081` is already in use, change the `codex-oauth-bridge` row's `port`
in a DSH patch layer before starting the profile.

## License

MIT
