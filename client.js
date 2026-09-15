window.__ModuleLoader__.load({
  id: 'dsh-codex-oauth-bridge',
  factory(require) {
    const module = { exports: {} }
    const { jsx, jsxs } = require('react/jsx-runtime')

    function BridgeTab() {
      return jsxs('section', {
        style: { padding: '24px', maxWidth: '620px', lineHeight: 1.6 },
        children: [
          jsx('h3', { children: 'Codex 桥接' }),
          jsx('p', { children: '使用 DSH 的 openai-codex 模型提供方。认证凭据由 DSH 保存。' }),
          jsx('a', {
            href: 'http://127.0.0.1:3081/',
            target: '_blank',
            rel: 'noopener noreferrer',
            children: '打开本机登录桥，查看状态并发起认证',
          }),
          jsx('p', { children: '启用、禁用、安装或移除插件后需重启 DSH；桥接会随 DSH 启动，此页不会更改登录凭据。' }),
        ],
      })
    }

    module.exports.inject = ['slots']
    module.exports.apply = (ctx) => {
      ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
        name: 'settings.plugins.tab',
        id: 'codex-bridge',
        order: 20,
        label: () => 'Codex 桥接',
        inject: () => ({}),
      }, BridgeTab))
    }
    return module.exports
  },
})
