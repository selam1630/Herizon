const jwt = require('jsonwebtoken')

function getSecret(name) {
  const secret = process.env[name] || process.env.JWT_SECRET

  if (!secret) {
    throw new Error(`Missing ${name} in environment variables`)
  }

  return secret
}

function assertJwtConfig() {
  getSecret('ACCESS_TOKEN_SECRET')
  getSecret('REFRESH_TOKEN_SECRET')
}

function signAccessToken(payload) {
  return jwt.sign(payload, getSecret('ACCESS_TOKEN_SECRET'), { expiresIn: '15m' })
}

function verifyAccessToken(token) {
  return jwt.verify(token, getSecret('ACCESS_TOKEN_SECRET'))
}

function signRefreshToken(payload) {
  return jwt.sign(payload, getSecret('REFRESH_TOKEN_SECRET'), { expiresIn: '30d' })
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getSecret('REFRESH_TOKEN_SECRET'))
}

module.exports = {
  assertJwtConfig,
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
}
