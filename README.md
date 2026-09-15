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

## Install from npm

DSH Desktop builds use separate profiles. The older Tauri build uses `tauri`:

```powershell
dsh plugin --profile tauri add dsh-codex-oauth-bridge
```

DSH Desktop Beta (Electron) uses its selected profile, `desktop` by default.
Open **DSH Terminal inside Desktop Beta** and run:

```powershell
dsh plugin add dsh-codex-oauth-bridge
```

The in-app terminal targets the active profile. The standalone `dsh` CLI
rejects `--profile desktop` because Electron manages that profile. Confirm
the selected profile in Desktop Beta before installing, then restart the app.

Restart DSH Desktop, then inspect its plugin inventory for
`dsh-codex-oauth-bridge` in the active profile. In the older Tauri build,
**Settings → Plugins → Plugin list** should show **Enabled / Running**. This
list is read-only: activation requires a restart after installation or removal.
The **Codex bridge** tab in Plugins opens the local login page to inspect
status and start ChatGPT authentication manually.
DSH Desktop's **Configuration → Plugins** is a separate interface: a
**Disable** button means the plugin is already enabled. It does not show
**Running**. Click **Enable** if it is disabled, then restart DSH Desktop.
The bridge loads automatically with DSH; this card cannot start it as a
separate process. Visit <http://127.0.0.1:3081/> to check whether the login bridge
is running, credentials are stored, and which model new sessions default to.
These checks do not prove that every model request will succeed.

For a standalone Web profile:

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
dsh plugin --profile tauri add github:zzx547651745/dsh-codex-oauth-bridge
```

In Desktop Beta's in-app DSH Terminal, use
`dsh plugin add github:zzx547651745/dsh-codex-oauth-bridge` instead.
Restart the active Desktop profile. For the standalone Web app, replace
`tauri` with `web`.

## Install from a local checkout

```powershell
git clone https://github.com/zzx547651745/dsh-codex-oauth-bridge.git
dsh plugin --profile tauri add .\dsh-codex-oauth-bridge
```

In Desktop Beta's in-app DSH Terminal, use
`dsh plugin add .\dsh-codex-oauth-bridge` from the directory containing the
checkout. Restart Desktop after installation. For the standalone Web app,
replace `tauri` with `web`.

## Remove

```powershell
dsh plugin --profile tauri remove dsh-codex-oauth-bridge
```

In Desktop Beta's in-app DSH Terminal, use
`dsh plugin remove dsh-codex-oauth-bridge`. Restart Desktop after removing
the bundle. For the standalone Web app, replace `tauri` with `web`.

## Security

The page uses a per-process CSRF token and listens on the IPv4 loopback address
only. OAuth credentials are written by DSH to its normal credential store. Do
not share your DSH credential file.

The default model is written only as part of the first-login setup. After a
credential exists, changing the default model in DSH is respected on later
restarts.

If port `3081` is already in use, change the `codex-oauth-bridge` row's `port`
in a DSH patch layer before starting the profile.
The plugin logs a warning instead of crashing DSH when the login page cannot
bind. Existing model configuration remains available, but release or change
the port before using the manual login page.

## License

MIT
