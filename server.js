const WebSocket = require('ws');
const { Server } = require('ws');
const { Client } = require('ssh2');

// Create a new WebSocket server on port 8080
const wss = new Server({ port: 8080 });

// Logging helper functions with timestamp
const sessionInfo = {
  clientIP: null,
  username: null
};
function logInfo(message) {
  console.log(`[${new Date().toISOString()}] ${JSON.stringify(sessionInfo)} ${message}`);
}

function logError(message) {
  console.error(`[${new Date().toISOString()}] ${JSON.stringify(sessionInfo)} ${message}`);
}

wss.on('connection', (ws, req) => {
  const clientIP = ws._socket.remoteAddress; // Get the client IP address
  logInfo(`Client connected: ${clientIP}`);

  const conn = new Client();
  let termSize = { cols: 150, rows: 50 }; // Set default terminal size

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'connect') {
      // SSH server connection details
      conn.connect({
        host: '203.250.33.83', // SSH server address
        port: 32022,
        username: data.username,
        password: data.password
      });
      sessionInfo.username = data.username;
      sessionInfo.clientIP = clientIP;
    } else if (data.type === 'resize') {
      // Apply terminal resize requested by the client
      termSize = { cols: data.cols, rows: data.rows };
      if (conn.shellStream) {
        conn.shellStream.setWindow(data.rows, data.cols, 600, 800);
      }
    } else if (data.type === 'command') {
      // Execute command in the SSH shell
      if (conn.shell) {
        conn.shell.write(data.command);
      }
    }
  });

  conn.on('ready', () => {
    logInfo(`SSH connection established for ${clientIP}`);
    ws.send(JSON.stringify({ type: 'connected' }));

    // Open SSH shell with the given terminal size
    conn.shell(termSize, (err, stream) => {
      if (err) {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
        return;
      }

      // Assign the SSH shell stream to conn.shell
      conn.shell = stream;
      stream.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'output', output: data.toString() }), (err) => {
            if (err) {
              logError(`Error sending data: ${err.message}`);
            }
          });
        }
      });

      stream.on('close', () => {
        conn.end();
        ws.close();
      });
    });
  });

  // When the client disconnects, log the event and close the SSH connection safely
  ws.on('close', () => {
    logInfo(`Client disconnected`);
    try {
      if (conn.shell && typeof conn.shell.write === 'function') {
        conn.shell.write('exit\n'); // SSH 세션 안전 종료
        conn.shell.end();
      }
    } catch (err) {
      logError(`Error writing exit command`);
    }
    conn.end();
  });

  // Log WebSocket errors
  ws.on('error', (err) => {
    logError(`WebSocket error from : ${err.message}`);
  });

  // Handle SSH connection errors
  conn.on('error', (err) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    } else {
      logError('WebSocket is closed. Cannot send SSH error message.');
    }
  });
});

logInfo('WebSocket SSH server running on ws://localhost:8080');

