<template>
  <div>
    <!-- Tabs Container -->
    <div class="tabs-container">
      <div
        v-for="(terminal, index) in terminals"
        :key="terminal.id"
        :class="['tab', { active: activeTerminal === terminal.id }]"
        @click="activeTerminal = terminal.id"
      >
        <span>{{ `DCU Shell ${index + 1}` }}</span>
        <button class="close-btn" @click.stop="removeTerminal(terminal.id)">×</button>
      </div>
      <button class="add-tab-btn" @click="addTerminal">+</button>
    </div>
    <div class="content">
      <div
        v-for="(terminal, index) in terminals"
        :key="terminal.id"
        v-show="activeTerminal === terminal.id"
        ref="terminal"
      ></div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import api from '@oj/api'
/* global WebSocket */
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { SerializeAddon } from 'xterm-addon-serialize'

export default {
  name: 'Container',
  data () {
    return {
      userData: {
        id: '',
        password: ''
      },
      // multiContainer: [],
      passwordEntered: false,
      containerCount: 0,
      sessionId: '',
      editContainer: null,
      input: [],
      // ws: null,
      // term: null,
      terminals: [],
      activeTerminal: null,
      terminalMap: new Map(),
      wsMap: new Map()
    }
  },
  created () {
  },
  async mounted () {
    window.addEventListener('beforeunload', this.closeAllWebSockets)
    await this.init()
    // ✅ 페이지 로드 시 자동으로 첫 번째 터미널 생성
    this.addTerminal()
  },
  beforeRouteLeave (to, from, next) {
    console.log('Navigating away... Closing all WebSockets.')
    this.closeAllWebSockets()
    next()
  },
  beforeDestroy () {
    console.log('Component destroyed... Closing all WebSockets.')
    window.removeEventListener('beforeunload', this.closeAllWebSockets)
    this.closeAllWebSockets()
  },
  // mounted () {
  //   this.initTerminal()
  //   this.connectWebSocket()
  // },
  methods: {
    async init () {
      if (!this.isAuthenticated) {
        this.$error(this.$i18n.t('m.Please_login_first'))
        this.$router.push({ name: 'Home' })
      }
      await api.getUserInfo().then(res => {
        this.userData.id = res.data.data.user.username
      })
    },
    debug () {
    },
    // Xterm
    addTerminal () {
      const id = Date.now().toString()
      this.terminals.push({ id })
      this.activeTerminal = id
      // token refresh
      let data = {
        refresh_token: localStorage.getItem('refresh_token')
      }
      api.tokenRefresh(data).then(res => {
        localStorage.setItem('access_token', res.data.data.access_token)
      })

      this.$nextTick(() => {
        const termElement = this.$refs.terminal[this.terminals.length - 1]
        if (!termElement) {
          console.error('Terminal element not found!')
          return
        }
        const term = new Terminal({
          cursorBlink: true, // 커서 깜박임 활성화
          cols: 150,
          rows: Math.floor(window.innerHeight / 19),
          fontSize: 14,
          wordWrap: false,
          theme: {
            background: '#000000',
            foreground: '#FFFFFF'
          }
        })
        // const fitAddon = new FitAddon()
        // term.loadAddon(fitAddon)
        term.open(termElement)
        term.write('\x1b[1mConnecting to SSH server...\x1b[0m\r\n')
        // fitAddon.fit()
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const ws = new WebSocket(`${wsProtocol}://${window.location.host}/ssh`)
        ws.onopen = () => {
          term.write('\x1b[1mConnected to WebSocket server.\x1b[0m\r\n')
          console.log(`WebSocket connected for terminal ${id}`)
          term.write('              ,---------------------------,\r\n' +
          '              |  /---------------------\\  |\r\n' +
          '              | |                       | |\r\n' +
          '              | |       Software &      | |\r\n' +
          '              | |         System        | |\r\n' +
          '              | |       Laboratory      | |\r\n' +
          '              | |                       | |\r\n' +
          '              |  \\_____________________/  |\r\n' +
          '              |___________________________|\r\n' +
          '            ,---\\_____     []     _______/------,\r\n' +
          '          /         /______________\\           /|\r\n' +
          '        /___________________________________ /  | ___\r\n' +
          '        |                                   |   |    )\r\n' +
          '        |  _ _ _                 [-------]  |   |   (\r\n' +
          '        |  o o o                 [-------]  |  /    _)_\r\n' +
          '        |__________________________________ |/     /  /\r\n' +
          '    /-------------------------------------/|      ( )/\r\n' +
          '  /-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/ /\r\n' +
          '/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/ /\r\n' +
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n\n')
          // SSH 서버에 연결 요청
          ws.send(JSON.stringify({
            type: 'connect',
            host: '203.250.33.83',
            username: 'dcucode-' + this.userData.id,
            password: localStorage.getItem('access_token')
          }))
          window.addEventListener('resize', () => {
            const newRows = Math.floor(window.innerHeight / 19)
            term.resize(150, newRows)
          })
        }
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          if (data.type === 'output') {
            term.write(data.output)
          } else if (data.type === 'error') {
            term.write(`Error: ${data.message}\r\n`)
          }
        }

        term.onData((input) => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            if (input === '\r') {
              ws.send(JSON.stringify({ type: 'command', command: '\n' }))
            } else if (input.charCodeAt(0) === 127) {
              ws.send(JSON.stringify({ type: 'command', command: '\b' }))
            } else {
              ws.send(JSON.stringify({ type: 'command', command: input }))
            }
          }
        })
        ws.onclose = () => {
          console.warn('WebSocket disconnected. Closing terminal...')
          term.write('\r\nDisconnected from SSH server.\r\n')
        }
        this.terminalMap.set(id, term)
        this.wsMap.set(id, ws)
      })
    },
    removeTerminal (id) {
      this.terminals = this.terminals.filter(t => t.id !== id)
      const ws = this.wsMap.get(id)
      if (ws) ws.close()
      this.wsMap.delete(id)
      this.terminalMap.delete(id)

      if (this.activeTerminal === id && this.terminals.length > 0) {
        this.activeTerminal = this.terminals[0].id
      }
    },
    closeAllWebSockets () {
      console.log('Closing all WebSockets...')
      this.wsMap.forEach(ws => {
        if (ws) ws.close()
      })
      this.wsMap.clear()
      this.terminalMap.clear()
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'user'])
  }
}
</script>

<style scoped>
.tabs-container {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  background-color: #1e1e1e;
  border-bottom: 1px solid #333;
  height: 35px;
}

.tab {
  display: flex;
  align-items: center;
  background-color: #2d2d2d;
  color: #cccccc;
  padding: 6px 12px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  cursor: pointer;
  position: relative;
  height: 100%;
  transition: background-color 0.2s, color 0.2s;
}

.tab.active {
  background-color: #1e1e1e;
  color: #ffffff;
  border-bottom: 2px solid #007acc;
}

.tab:hover {
  background-color: #3a3a3a;
}

.tab span {
  margin-right: 6px;
  font-size: 13px;
}

.close-btn {
  background: none;
  border: none;
  color: #888888;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ffffff;
}

.add-tab-btn {
  background: none;
  color: #007acc;
  border: none;
  padding: 0;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  transition: color 0.2s;
}

.add-tab-btn:hover {
  color: #3399ff;
}

.terminal-wrapper {
  margin-top: 0;
  background-color: #1e1e1e;
  height: 500px;
}
.terminal-container {
  width: 100%;
  height: 100%;
}
.content {
  margin-top: 0;
  background-color: #1e1e1e;
}

</style>
