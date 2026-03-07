require('dotenv').config()

const app = require('./app')
const { WebSocketServer } = require('ws')
const { verifyDatabaseConnection, initializeDatabase, pool } = require('./db')
const { assertJwtConfig, verifyAccessToken } = require('./utils/jwt')

const port = Number(process.env.PORT || 5000)
const retryBaseMs = Number(process.env.DB_RETRY_BASE_MS || 2000)
const retryMaxMs = Number(process.env.DB_RETRY_MAX_MS || 30000)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function connectWithRetry() {
  let attempt = 0

  while (true) {
    try {
      await verifyDatabaseConnection()
      await initializeDatabase()
      return
    } catch (error) {
      attempt += 1
      const waitMs = Math.min(retryBaseMs * 2 ** Math.max(0, attempt - 1), retryMaxMs)

      console.error(`Database connection failed (attempt ${attempt}).`)
      console.error('Reason:', error?.message || String(error))
      if (error?.code) console.error('Code:', error.code)
      console.error(`Retrying in ${Math.round(waitMs / 1000)}s...`)

      await sleep(waitMs)
    }
  }
}

async function startServer() {
  try {
    assertJwtConfig()
    await connectWithRetry()
    console.log('Connected to Neon Postgres')

    const server = app.listen(port, () => {
      console.log(`Backend API running on http://localhost:${port}`)
    })

    const audioRooms = new Map()
    const wss = new WebSocketServer({ server, path: '/ws/audio' })

    function roomSet(roomKey) {
      if (!audioRooms.has(roomKey)) {
        audioRooms.set(roomKey, new Set())
      }
      return audioRooms.get(roomKey)
    }

    function broadcast(roomKey, payload, exclude) {
      const peers = audioRooms.get(roomKey)
      if (!peers || peers.size === 0) return
      for (const client of peers) {
        if (client === exclude || client.readyState !== 1) continue
        client.send(payload)
      }
    }

    wss.on('connection', async (socket, request) => {
      try {
        const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
        const txRef = String(parsedUrl.searchParams.get('txRef') || '').trim()
        const token = String(parsedUrl.searchParams.get('token') || '').trim()
        if (!txRef || !token) {
          socket.close(1008, 'Missing txRef or token')
          return
        }

        let payload
        try {
          payload = verifyAccessToken(token)
        } catch (_error) {
          socket.close(1008, 'Invalid token')
          return
        }

        const userId = String(payload?.sub || '').trim()
        if (!userId) {
          socket.close(1008, 'Invalid token payload')
          return
        }

        const txResult = await pool.query(
          `
            SELECT tx_ref, user_id, expert_user_id, kind, chapa_status
            FROM payment_transactions
            WHERE tx_ref = $1
            LIMIT 1
          `,
          [txRef]
        )

        if (txResult.rowCount === 0) {
          socket.close(1008, 'Unknown consultation')
          return
        }

        const tx = txResult.rows[0]
        const isParticipant = tx.user_id === userId || tx.expert_user_id === userId
        const canJoin = tx.kind === 'expert_consultation' && tx.chapa_status === 'success' && isParticipant
        if (!canJoin) {
          socket.close(1008, 'Not allowed in this room')
          return
        }

        socket.roomKey = txRef
        socket.userId = userId
        roomSet(txRef).add(socket)

        socket.send(
          JSON.stringify({
            type: 'system',
            message: 'Audio consultation channel connected.',
            txRef,
          })
        )

        socket.on('message', (data, isBinary) => {
          if (!socket.roomKey) return
          if (isBinary) {
            broadcast(socket.roomKey, data, socket)
            return
          }
          const text = data.toString('utf8')
          broadcast(socket.roomKey, text, socket)
        })

        socket.on('close', () => {
          const key = socket.roomKey
          if (!key) return
          const peers = audioRooms.get(key)
          if (!peers) return
          peers.delete(socket)
          if (peers.size === 0) {
            audioRooms.delete(key)
          }
        })
      } catch (_error) {
        socket.close(1011, 'Internal websocket error')
      }
    })

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Stop the other process or set a different PORT.`)
        process.exit(1)
      }

      console.error('Server failed to start:', error.message)
      process.exit(1)
    })
  } catch (error) {
    console.error('Startup failed.')
    console.error('Reason:', error?.message || String(error))
    if (error?.code) console.error('Code:', error.code)
    if (error?.stack) console.error(error.stack)
    process.exit(1)
  }
}

startServer()
