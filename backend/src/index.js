require('dotenv').config()

const app = require('./app')
const { verifyDatabaseConnection, initializeDatabase } = require('./db')
const { assertJwtConfig } = require('./utils/jwt')

const port = Number(process.env.PORT || 5000)

async function startServer() {
  try {
    assertJwtConfig()
    await verifyDatabaseConnection()
    await initializeDatabase()
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
