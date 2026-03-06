const { verifyAccessToken } = require('../utils/jwt')

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
}
