const express = require('express')
const { articles } = require('../data/articles')
const authRoutes = require('./auth.routes')
const communityRoutes = require('./community.routes')
const expertsRoutes = require('./experts.routes')
const adminRoutes = require('./admin.routes')

const router = express.Router()

router.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to Herizone API',
    endpoints: [
      'GET /health',
      'GET /api',
      'GET /api/v1/resources',
      'GET /api/v1/articles',
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
      'GET /api/v1/admin/users',
      'PATCH /api/v1/admin/users/:userId/roles',
      'GET /api/v1/admin/community/posts',
      'DELETE /api/v1/admin/community/posts/:postId',
      'GET /api/v1/admin/experts/questions',
      'DELETE /api/v1/admin/experts/questions/:questionId',
      'GET /api/v1/admin/experts/applications',
      'PATCH /api/v1/admin/experts/applications/:applicationId',
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

router.get('/v1/articles', (_req, res) => {
  res.json(articles)
})

router.use('/v1/auth', authRoutes)
router.use('/v1/community', communityRoutes)
router.use('/v1/experts', expertsRoutes)
router.use('/v1/admin', adminRoutes)

module.exports = router
