import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'

export const name = 'codex-oauth-bridge'
export const inject = ['authorization', 'agentDefaultModel']

const KEY = 'llm-pi-ai/openai-codex'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function page(title, body) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { max-width: 640px; margin: 12vh auto; padding: 0 24px; line-height: 1.6; }
    .card { border: 1px solid #8885; border-radius: 16px; padding: 24px; }
    button { font: inherit; padding: 10px 18px; border: 0; border-radius: 10px; cursor: pointer; background: #10a37f; color: white; }
    code { overflow-wrap: anywhere; }
  </style>
</head>
<body><main class="card"><h1>${escapeHtml(title)}</h1>${body}</main></body>
</html>`
}

function sendHtml(response, status, title, body) {
  response.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  response.end(page(title, body))
}

function openExternal(target, logger) {
  const command = process.platform === 'win32'
    ? ['rundll32.exe', ['url.dll,FileProtocolHandler', target]]
    : process.platform === 'darwin'
      ? ['open', [target]]
      : ['xdg-open', [target]]
  const child = spawn(command[0], command[1], { detached: true, stdio: 'ignore' })
  child.once('error', (error) => {
    logger.warn('[codex-oauth-bridge] could not open the system browser; use the local login page instead')
    logger.warn(error)
  })
  child.unref()
}

export function apply(ctx, config = {}) {
  const host = config.host ?? '127.0.0.1'
  const port = config.port ?? 3081
  const autoLogin = config.autoLogin ?? true
  const defaultModel = config.defaultModel ?? 'gpt-5.6-sol'
  const reasoningEffort = config.reasoningEffort ?? 'medium'
  const csrf = randomBytes(24).toString('base64url')
  let inFlight = false
  let currentAuthUrl = null
  let lastResult = '尚未登录'

  async function configured() {
    return (await ctx.get('credentials')?.describeRecord(KEY))?.configured === true
  }

  function prompt(prompt) {
    if (prompt.kind === 'select') {
      const browser = prompt.options?.find(option => option.id === 'browser') ?? prompt.options?.[0]
      if (browser !== undefined) return Promise.resolve(browser.id)
      return Promise.reject(new Error('authorization offered an empty selection'))
    }
    return new Promise((resolve, reject) => {
      const abort = () => reject(new Error('browser callback completed'))
      if (prompt.signal?.aborted) abort()
      else prompt.signal?.addEventListener('abort', abort, { once: true })
    })
  }

  function startAuthorization({ response, openBrowser = false } = {}) {
    if (inFlight) return false
    if (ctx.authorization.describe(KEY) === undefined) return false

    inFlight = true
    lastResult = '正在等待浏览器授权'
    let delivered = false
    const deliver = (target) => {
      currentAuthUrl = target
      if (openBrowser) {
        openBrowser = false
        openExternal(target, ctx.logger)
      }
      if (delivered || response?.headersSent === true) return
      delivered = true
      response?.writeHead(303, { location: target, 'cache-control': 'no-store' })
      response?.end()
    }

    void ctx.authorization.begin({
      key: KEY,
      method: 'oauth',
      interaction: {
        notify(notice) {
          if (notice.url) deliver(notice.url)
        },
        prompt,
      },
    }).then((outcome) => {
      lastResult = outcome.status === 'authorized' ? '登录成功' : '登录已取消'
    }).catch((error) => {
      lastResult = `登录失败：${error instanceof Error ? error.message : String(error)}`
      ctx.logger.warn('[codex-oauth-bridge] authorization failed')
      ctx.logger.warn(error)
    }).finally(() => {
      inFlight = false
      currentAuthUrl = null
      if (response !== undefined && !delivered && !response.headersSent) {
        sendHtml(response, 500, '未能启动登录', `<p>${escapeHtml(lastResult)}</p>`)
      }
    })
    return true
  }

  async function autoConfigure() {
    if (!autoLogin || await configured()) return
    await ctx.agentDefaultModel.saveSelection({
      provider: 'openai-codex',
      model: defaultModel,
      reasoningEffort,
    })
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (startAuthorization({ openBrowser: true })) return
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    ctx.logger.warn('[codex-oauth-bridge] openai-codex authorization flow did not become ready')
  }

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${host}:${port}`)
      if (request.method === 'GET' && url.pathname === '/') {
        const ready = ctx.authorization.describe(KEY) !== undefined
        const signedIn = await configured()
        const status = signedIn ? '已保存 ChatGPT OAuth 凭据' : lastResult
        const continueLogin = inFlight && currentAuthUrl !== null
          ? `<p><a href="/continue?csrf=${encodeURIComponent(csrf)}" target="_blank" rel="noopener">继续完成 ChatGPT 登录</a></p>`
          : ''
        sendHtml(response, 200, 'DSH Codex 登录桥', `
          <p>状态：<strong>${escapeHtml(status)}</strong></p>
          <p>授权流程：${ready ? '已就绪' : '尚未注册，请稍后刷新'}</p>
          ${continueLogin}
          <form method="post" action="/login" target="_blank">
            <input type="hidden" name="csrf" value="${csrf}">
            <button type="submit" ${ready && !inFlight ? '' : 'disabled'}>${signedIn ? '重新登录 ChatGPT' : '使用 ChatGPT 登录'}</button>
          </form>
          <p><small>仅监听本机回环地址，不会显示或复制访问令牌。</small></p>`)
        return
      }

      if (request.method === 'GET' && url.pathname === '/continue') {
        if (url.searchParams.get('csrf') !== csrf || currentAuthUrl === null) {
          sendHtml(response, 404, '没有待继续的登录', '<p>请返回首页重新发起登录。</p>')
          return
        }
        response.writeHead(303, { location: currentAuthUrl, 'cache-control': 'no-store' })
        response.end()
        return
      }

      if (request.method === 'POST' && url.pathname === '/login') {
        let body = ''
        for await (const chunk of request) {
          body += chunk
          if (body.length > 4096) throw new Error('request body is too large')
        }
        const form = new URLSearchParams(body)
        if (form.get('csrf') !== csrf) {
          sendHtml(response, 403, '请求已拒绝', '<p>登录页已过期，请返回首页重试。</p>')
          return
        }
        if (inFlight) {
          if (currentAuthUrl !== null) {
            response.writeHead(303, { location: currentAuthUrl, 'cache-control': 'no-store' })
            response.end()
          } else {
            sendHtml(response, 409, '登录进行中', '<p>已有登录流程正在运行。</p>')
          }
          return
        }
        if (ctx.authorization.describe(KEY) === undefined) {
          sendHtml(response, 503, '授权尚未就绪', '<p>DSH 尚未注册 Codex 授权流程，请稍后重试。</p>')
          return
        }

        startAuthorization({ response })
        return
      }

      sendHtml(response, 404, '未找到', '<p>页面不存在。</p>')
    } catch (error) {
      if (!response.headersSent) {
        sendHtml(response, 500, '插件错误', `<p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p>`)
      }
    }
  })

  server.listen(port, host, () => {
    ctx.logger.info(`[codex-oauth-bridge] login page: http://${host}:${port}/`)
    void autoConfigure().catch((error) => {
      ctx.logger.warn('[codex-oauth-bridge] automatic setup failed')
      ctx.logger.warn(error)
    })
  })

  ctx.effect(() => () => {
    if (inFlight) ctx.authorization.cancel(KEY)
    server.close()
  })
}
