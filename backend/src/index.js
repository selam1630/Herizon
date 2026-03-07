require('dotenv').config()

const app = require('./app')
const { verifyDatabaseConnection, initializeDatabase } = require('./db')
const { assertJwtConfig } = require('./utils/jwt')

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
