import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { apply } from './index.js'

function context(warnings) {
  let cleanup
  return {
    authorization: { describe: () => ({}), cancel: () => {} },
    agentDefaultModel: {
      currentSelection: () => ({ provider: 'openai-codex', model: 'gpt-5.6-sol' }),
    },
    get: () => ({ describeRecord: async () => ({ configured: true }) }),
    logger: { info: () => {}, warn: value => warnings.push(String(value)) },
    effect: register => { cleanup = register() },
    stop: () => cleanup?.(),
  }
}

const reserve = createServer()
await new Promise(resolve => reserve.listen(0, '127.0.0.1', resolve))
const port = reserve.address().port
await new Promise(resolve => reserve.close(resolve))

const warnings = []
const ctx = context(warnings)
apply(ctx, { port })
const html = await (await fetch(`http://127.0.0.1:${port}/`)).text()
assert.match(html, /插件：<strong>运行中<\/strong>/)
assert.match(html, /openai-codex\/gpt-5\.6-sol/)
ctx.stop()

await new Promise(resolve => reserve.listen(port, '127.0.0.1', resolve))
apply(context(warnings), { port })
await new Promise(resolve => setTimeout(resolve, 20))
assert.ok(warnings.some(value => value.includes('login page unavailable')))
await new Promise(resolve => reserve.close(resolve))
