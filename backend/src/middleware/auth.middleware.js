const { verifyAccessToken } = require('../utils/jwt')
const { pool } = require('../db')

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' })
  }

  const token = authHeader.slice(7)

  try {
    const payload = verifyAccessToken(token)
    req.auth = payload
    return next()
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

module.exports = {
  requireAuth,
  requireAdmin: async (req, res, next) => {
    if (!req.auth?.sub) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    try {
      const result = await pool.query('SELECT is_admin FROM users WHERE id = $1 LIMIT 1', [req.auth.sub])
      if (result.rowCount === 0 || !result.rows[0].is_admin) {
        return res.status(403).json({ message: 'Admin access required' })
      }

      return next()
    } catch (error) {
      return res.status(500).json({ message: 'Failed to verify admin access', error: error.message })
    }
  },
}
