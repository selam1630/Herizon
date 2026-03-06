const express = require('express')
const { pool } = require('../db')

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    await pool.query('SELECT 1')

    res.status(200).json({
      ok: true,
      db: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (_error) {
    res.status(503).json({
      ok: false,
      db: 'disconnected',
      timestamp: new Date().toISOString(),
    })
  }
})

module.exports = router
