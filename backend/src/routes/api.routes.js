const express = require('express')
const { articles } = require('../data/articles')
const authRoutes = require('./auth.routes')

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

module.exports = router
