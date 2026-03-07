const express = require('express')
const bcrypt = require('bcryptjs')
const { randomUUID, createHash } = require('crypto')

const { pool } = require('../db')
const { requireAuth } = require('../middleware/auth.middleware')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt')

const router = express.Router()
const REFRESH_COOKIE_NAME = 'herizone_refresh_token'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  })
}

function toPublicUser(row) {
  const premiumUntil = row.premium_until ? new Date(row.premium_until) : null
  const isPremiumActive = Boolean(row.is_premium && premiumUntil && premiumUntil.getTime() > Date.now())

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_url,
    bio: row.bio,
    isExpert: row.is_expert,
    isAdmin: row.is_admin,
    isPremium: isPremiumActive,
    premiumUntil: row.premium_until,
    createdAt: row.created_at,
  }
}

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function isAdminEmail(email) {
  return getAdminEmails().includes(String(email || '').trim().toLowerCase())
}

function getSeedAdminCredentials() {
  const email = String(process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase()
  const password = String(process.env.ADMIN_SEED_PASSWORD || '')
  if (!email || !password) {
    return null
  }
  return { email, password }
}

async function ensureSeedAdminUserExists(email) {
  const seedAdmin = getSeedAdminCredentials()
  const normalized = normalizeEmail(email)
  if (!seedAdmin || seedAdmin.email !== normalized) {
    return
  }
  const passwordHash = await bcrypt.hash(seedAdmin.password, 12)
  await pool.query(
    `
      INSERT INTO users (id, name, email, password_hash, is_admin)
      VALUES ($1, 'Admin', $2, $3, TRUE)
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_admin = TRUE
    `,
    [randomUUID(), seedAdmin.email, passwordHash]
  )
}

async function createSession(res, user) {
  const sessionId = randomUUID()
  const refreshToken = signRefreshToken({ sub: user.id, sid: sessionId, email: user.email })
  const refreshTokenHash = hashToken(refreshToken)

  await pool.query(
    `
      INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')
    `,
    [sessionId, user.id, refreshTokenHash]
  )

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions())
  return signAccessToken({ sub: user.id, email: user.email })
}

async function findUserById(userId) {
  const result = await pool.query(
    `
        SELECT id, name, email, avatar_url, bio, is_expert, is_admin, created_at
        , is_premium, premium_until
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  )

  if (result.rowCount === 0) {
    return null
  }

  return toPublicUser(result.rows[0])
}

router.post('/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email])
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    const id = randomUUID()
    const passwordHash = await bcrypt.hash(password, 12)

    const inserted = await pool.query(
      `
        INSERT INTO users (id, name, email, password_hash, is_admin)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, avatar_url, bio, is_expert, is_admin, created_at
        , is_premium, premium_until
      `,
      [id, name, email, passwordHash, isAdminEmail(email)]
    )

    const user = toPublicUser(inserted.rows[0])
    const accessToken = await createSession(res, user)

    return res.status(201).json({ accessToken, user })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create account', error: error.message })
  }
})

router.post('/signin', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    await ensureSeedAdminUserExists(email)

    const result = await pool.query(
      `
        SELECT id, name, email, avatar_url, bio, is_expert, is_admin, created_at, password_hash
        , is_premium, premium_until
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    )

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const row = result.rows[0]
    let validPassword = await bcrypt.compare(password, row.password_hash)

    if (!validPassword) {
      const seedAdmin = getSeedAdminCredentials()
      if (seedAdmin && seedAdmin.email === email) {
        const resetHash = await bcrypt.hash(seedAdmin.password, 12)
        await pool.query('UPDATE users SET password_hash = $1, is_admin = TRUE WHERE id = $2', [resetHash, row.id])
        row.password_hash = resetHash
        row.is_admin = true
        validPassword = await bcrypt.compare(password, row.password_hash)
      }
    }

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (isAdminEmail(row.email) && !row.is_admin) {
      await pool.query('UPDATE users SET is_admin = TRUE WHERE id = $1', [row.id])
      row.is_admin = true
    }

    const user = toPublicUser(row)
    const accessToken = await createSession(res, user)

    return res.status(200).json({ accessToken, user })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to sign in', error: error.message })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME]
    if (!refreshToken) {
      return res.status(401).json({ message: 'Missing refresh token' })
    }

    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch (_error) {
      clearRefreshCookie(res)
      return res.status(401).json({ message: 'Invalid or expired refresh token' })
    }

    const sessionId = payload.sid
    const userId = payload.sub

    const sessionResult = await pool.query(
      `
        SELECT id, user_id, refresh_token_hash, expires_at, revoked_at
        FROM user_sessions
        WHERE id = $1
        LIMIT 1
      `,
      [sessionId]
    )

    if (sessionResult.rowCount === 0) {
      clearRefreshCookie(res)
      return res.status(401).json({ message: 'Session not found' })
    }

    const session = sessionResult.rows[0]
    const matchesHash = session.refresh_token_hash === hashToken(refreshToken)
    const expired = new Date(session.expires_at).getTime() <= Date.now()
    const revoked = Boolean(session.revoked_at)

    if (!matchesHash || expired || revoked) {
      await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1', [sessionId])
      clearRefreshCookie(res)
      return res.status(401).json({ message: 'Session is no longer valid' })
    }

    const user = await findUserById(userId)
    if (!user) {
      clearRefreshCookie(res)
      return res.status(404).json({ message: 'User not found' })
    }

    const rotatedRefreshToken = signRefreshToken({ sub: user.id, sid: sessionId, email: user.email })
    const rotatedRefreshTokenHash = hashToken(rotatedRefreshToken)

    await pool.query(
      `
        UPDATE user_sessions
        SET refresh_token_hash = $1, expires_at = NOW() + INTERVAL '30 days'
        WHERE id = $2
      `,
      [rotatedRefreshTokenHash, sessionId]
    )

    res.cookie(REFRESH_COOKIE_NAME, rotatedRefreshToken, getRefreshCookieOptions())
    const accessToken = signAccessToken({ sub: user.id, email: user.email })

    return res.status(200).json({ accessToken, user })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to refresh session', error: error.message })
  }
})

router.post('/signout', async (req, res) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME]
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken)
        await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1', [payload.sid])
      } catch (_error) {
        // Ignore invalid token on signout and still clear the cookie.
      }
    }

    clearRefreshCookie(res)
    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to sign out', error: error.message })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const user = await findUserById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({ user })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user', error: error.message })
  }
})

module.exports = router
