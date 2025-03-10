const WebSocket = require('ws')
const { Server } = require('ws')
const { Client } = require('ssh2')

const wss = new Server({ port: 8080 })

wss.on('connection', (ws, req) => {
  const clientIP = ws._socket.remoteAddress // ✅ 클라이언트 IP 가져오기
  console.log(`Client connected: ${clientIP}`)

  const conn = new Client()
  let termSize = { cols: 150, rows: 50 } // ✅ 기본 터미널 크기 설정

  ws.on('message', (message) => {
    const data = JSON.parse(message)

    if (data.type === 'connect') {
      // SSH 서버 정보
      conn.connect({
        host: '203.250.33.83',  // SSH 서버 주소
        port: 32022,
        username: data.username,
        password: data.password
      })
    } else if (data.type === 'resize') {
      // ✅ 클라이언트에서 터미널 크기 변경 요청 시 적용
      termSize = { cols: data.cols, rows: data.rows }
      if (conn.shellStream) {
        conn.shellStream.setWindow(data.rows, data.cols, 600, 800)
      }
    } else if (data.type === 'command') {
      // 명령어 실행
      if (conn.shell) {
        conn.shell.write(data.command)
      }
    }
  })

  conn.on('ready', () => {
    console.log(`SSH connection established for ${clientIP}`)
    ws.send(JSON.stringify({ type: 'connected' }))

    conn.shell(termSize, (err, stream) => {
      if (err) {
        ws.send(JSON.stringify({ type: 'error', message: err.message }))
        return
      }

      conn.shell = stream

      stream.on('data', (data) => {
        ws.send(JSON.stringify({ type: 'output', output: data.toString() }))
      })

      stream.on('close', () => {
        conn.end()
        ws.close()
      })
    })
  })

  // ✅ 클라이언트가 연결을 끊었을 때 로그 출력
  ws.on('close', () => {
    console.log(`Client disconnected: ${clientIP}`)
    console.log(`Current connections after disconnect: ${wss.clients.size}`)
    if (conn.shell) {
      conn.shell.write('exit\n') // SSH 세션 안전 종료
      conn.shell.end()
    }
    conn.end()
  })

  // ✅ 웹소켓 에러 발생 시 로그 출력
  ws.on('error', (err) => {
    console.error(`WebSocket error from ${clientIP}:`, err.message)
  })

  conn.on('error', (err) => {
    ws.send(JSON.stringify({ type: 'error', message: err.message }))
  })
})

// ✅ 5초마다 현재 연결된 클라이언트 수 및 IP 출력
setInterval(() => {
  console.log(`Current connections: ${wss.clients.size}`)
  wss.clients.forEach((client, index) => {
    console.log(`Client ${index + 1}: ${client._socket.remoteAddress}`)
  })
}, 5000)

console.log('WebSocket SSH server running on ws://localhost:8080')
