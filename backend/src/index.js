require('dotenv').config()

const app = require('./app')
const { verifyDatabaseConnection } = require('./db')

const port = Number(process.env.PORT || 5000)

async function startServer() {
  try {
    await verifyDatabaseConnection()
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
    console.error('Failed to connect to database:', error.message)
    process.exit(1)
  }
}

startServer()
