const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const healthRoutes = require('./routes/health.routes')
const apiRoutes = require('./routes/api.routes')

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
)
app.use(helmet())
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

app.get('/', (_req, res) => {
  res.json({
    service: 'Herizone Backend API',
    status: 'ok',
    docs: '/api',
  })
})

app.use('/health', healthRoutes)
app.use('/api', apiRoutes)

module.exports = app
