const express = require('express')
const { pool } = require('../db')
const { requireAuth } = require('../middleware/auth.middleware')
const authRoutes = require('./auth.routes')
const communityRoutes = require('./community.routes')
const expertsRoutes = require('./experts.routes')
const adminRoutes = require('./admin.routes')
const paymentsRoutes = require('./payments.routes')
const voiceRoutes = require('./voice.routes')
const chatRoutes = require('./chat.routes')

const router = express.Router()

function toPublicArticle(row) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt || '',
    content: row.content,
    category: row.category,
    tags: Array.isArray(row.tags) ? row.tags : [],
    author: row.author_name || 'Verified Expert',
    readTime: Number(row.read_time_minutes || 5),
    timestamp: row.published_at || row.created_at,
  }
}

router.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to Herizone API',
    endpoints: [
      'GET /health',
      'GET /api',
      'GET /api/v1/resources',
      'GET /api/v1/articles',
      'POST /api/v1/experts/articles',
      'GET /api/v1/experts/articles/me',
      'POST /api/v1/auth/signup',
      'POST /api/v1/auth/signin',
      'POST /api/v1/auth/refresh',
      'POST /api/v1/auth/signout',
      'GET /api/v1/auth/me',
      'GET /api/v1/community/posts',
      'POST /api/v1/community/posts',
      'POST /api/v1/community/posts/:postId/comments',
      'GET /api/v1/experts/questions',
      'POST /api/v1/experts/questions',
      'POST /api/v1/experts/questions/:questionId/answers',
      'GET /api/v1/experts/verified',
      'GET /api/v1/experts/applications/me',
      'POST /api/v1/experts/applications',
      'GET /api/v1/experts/me/pricing',
      'PATCH /api/v1/experts/me/pricing',
      'POST /api/v1/payments/premium/initialize',
      'POST /api/v1/payments/expert-communication/initialize',
      'POST /api/v1/payments/:txRef/verify',
      'POST /api/v1/payments/mpesa/callback',
      'GET /api/v1/payments/me',
      'POST /api/v1/voice/incoming',
      'POST /api/v1/voice/recording-complete',
      'POST /api/v1/chat',
      'GET /api/v1/chat/history',
      'GET /api/v1/admin/users',
      'PATCH /api/v1/admin/users/:userId/roles',
      'GET /api/v1/admin/community/posts',
      'DELETE /api/v1/admin/community/posts/:postId',
      'GET /api/v1/admin/experts/questions',
      'DELETE /api/v1/admin/experts/questions/:questionId',
      'GET /api/v1/admin/experts/applications',
      'PATCH /api/v1/admin/experts/applications/:applicationId',
      'GET /api/v1/admin/articles/pending',
      'PATCH /api/v1/admin/articles/:articleId/review',
    ],
  })
})

router.get('/v1/resources', (_req, res) => {
  res.json([
    {
      id: 1,
      title: 'Understanding Early Autism Signs',
      category: 'special-needs',
    },
    {
      id: 2,
      title: 'Postpartum Stress First-Aid Toolkit',
      category: 'mental-health',
    },
  ])
})

router.get('/v1/articles', requireAuth, async (req, res) => {
  try {
    const userResult = await pool.query(
      `
        SELECT is_premium, premium_until
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [req.auth.sub]
    )

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = userResult.rows[0]
    const premiumUntil = user.premium_until ? new Date(user.premium_until) : null
    const premiumActive = Boolean(user.is_premium) && (!premiumUntil || premiumUntil.getTime() > Date.now())

    if (!premiumActive) {
      return res.status(403).json({ message: 'Premium membership is required to view expert articles.' })
    }

    const result = await pool.query(
      `
        SELECT
          a.id,
          a.title,
          a.excerpt,
          a.content,
          a.category,
          a.tags,
          a.read_time_minutes,
          a.published_at,
          a.created_at,
          u.name AS author_name
        FROM expert_articles a
        JOIN users u ON u.id = a.user_id
        WHERE a.status = 'approved'
        ORDER BY COALESCE(a.published_at, a.created_at) DESC
      `
    )

    return res.status(200).json({ articles: result.rows.map(toPublicArticle) })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load articles', error: error.message })
  }
})

router.use('/v1/auth', authRoutes)
router.use('/v1/community', communityRoutes)
router.use('/v1/experts', expertsRoutes)
router.use('/v1/payments', paymentsRoutes)
router.use('/v1/voice', voiceRoutes)
router.use('/v1/chat', chatRoutes)
router.use('/v1/admin', adminRoutes)

module.exports = router
