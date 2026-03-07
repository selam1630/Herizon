const express = require('express')

const { pool } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(requireAuth, requireAdmin)

router.get('/users', async (req, res) => {
  try {
    const onlyUnverifiedExperts = req.query.onlyUnverifiedExperts === 'true'
    const result = await pool.query(
      `
        SELECT id, name, email, avatar_url, bio, is_expert, is_admin, created_at
        FROM users
        ${onlyUnverifiedExperts ? 'WHERE is_expert = FALSE' : ''}
        ORDER BY created_at DESC
      `
    )

    return res.status(200).json({
      users: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar_url,
        bio: row.bio,
        isExpert: row.is_expert,
        isAdmin: row.is_admin,
        createdAt: row.created_at,
      })),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message })
  }
})

router.patch('/users/:userId/roles', async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim()
    const isExpert = typeof req.body.isExpert === 'boolean' ? req.body.isExpert : undefined
    const isAdmin = typeof req.body.isAdmin === 'boolean' ? req.body.isAdmin : undefined

    if (isExpert === undefined && isAdmin === undefined) {
      return res.status(400).json({ message: 'Provide at least one role field to update' })
    }

    const existing = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [userId])
    if (existing.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const updated = await pool.query(
      `
        UPDATE users
        SET
          is_expert = COALESCE($1, is_expert),
          is_admin = COALESCE($2, is_admin)
        WHERE id = $3
        RETURNING id, name, email, avatar_url, bio, is_expert, is_admin, created_at
      `,
      [isExpert, isAdmin, userId]
    )

    const row = updated.rows[0]
    return res.status(200).json({
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar_url,
        bio: row.bio,
        isExpert: row.is_expert,
        isAdmin: row.is_admin,
        createdAt: row.created_at,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user roles', error: error.message })
  }
})

router.get('/community/posts', async (_req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT p.id, p.content, p.category, p.created_at, p.is_anonymous, u.name AS author_name
        FROM community_posts p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
      `
    )

    return res.status(200).json({
      posts: result.rows.map((row) => ({
        id: row.id,
        content: row.content,
        category: row.category,
        timestamp: row.created_at,
        isAnonymous: row.is_anonymous,
        author: row.is_anonymous ? 'Anonymous' : row.author_name,
      })),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch community posts', error: error.message })
  }
})

router.delete('/community/posts/:postId', async (req, res) => {
  try {
    const postId = String(req.params.postId || '').trim()
    const deleted = await pool.query('DELETE FROM community_posts WHERE id = $1 RETURNING id', [postId])

    if (deleted.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found' })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete post', error: error.message })
  }
})

router.get('/experts/questions', async (_req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT q.id, q.question, q.topic, q.created_at, q.is_anonymous, u.name AS author_name
        FROM expert_questions q
        JOIN users u ON u.id = q.user_id
        ORDER BY q.created_at DESC
      `
    )

    return res.status(200).json({
      questions: result.rows.map((row) => ({
        id: row.id,
        question: row.question,
        topic: row.topic,
        timestamp: row.created_at,
        isAnonymous: row.is_anonymous,
        author: row.is_anonymous ? 'Anonymous' : row.author_name,
      })),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch expert questions', error: error.message })
  }
})

router.delete('/experts/questions/:questionId', async (req, res) => {
  try {
    const questionId = String(req.params.questionId || '').trim()
    const deleted = await pool.query('DELETE FROM expert_questions WHERE id = $1 RETURNING id', [questionId])

    if (deleted.rowCount === 0) {
      return res.status(404).json({ message: 'Question not found' })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete expert question', error: error.message })
  }
})

router.get('/experts/applications', async (_req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          a.id,
          a.user_id,
          a.specialty,
          a.credentials,
          a.motivation,
          a.evidence_photos,
          a.chat_price_usd,
          a.voice_price_usd,
          a.video_price_usd,
          a.status,
          a.reviewed_note,
          a.reviewed_at,
          a.created_at,
          a.updated_at,
          u.name AS user_name,
          u.email AS user_email
        FROM expert_applications a
        JOIN users u ON u.id = a.user_id
        ORDER BY
          CASE a.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
          a.created_at DESC
      `
    )

    return res.status(200).json({
      applications: result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        specialty: row.specialty,
        credentials: row.credentials,
        motivation: row.motivation,
        evidencePhotos: Array.isArray(row.evidence_photos) ? row.evidence_photos : [],
        pricing: {
          chat: row.chat_price_usd == null ? null : Number(row.chat_price_usd),
          voice: row.voice_price_usd == null ? null : Number(row.voice_price_usd),
          video: row.video_price_usd == null ? null : Number(row.video_price_usd),
        },
        status: row.status,
        reviewedNote: row.reviewed_note,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch expert applications', error: error.message })
  }
})

router.patch('/experts/applications/:applicationId', async (req, res) => {
  try {
    const applicationId = String(req.params.applicationId || '').trim()
    const decision = String(req.body.decision || '').trim().toLowerCase()
    const reviewedNote = String(req.body.reviewedNote || '').trim()

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be either approved or rejected' })
    }

    const appResult = await pool.query(
      `
        SELECT id, user_id, status
        FROM expert_applications
        WHERE id = $1
        LIMIT 1
      `,
      [applicationId]
    )

    if (appResult.rowCount === 0) {
      return res.status(404).json({ message: 'Application not found' })
    }

    const application = appResult.rows[0]
    if (application.status !== 'pending') {
      return res.status(409).json({ message: 'This application has already been reviewed' })
    }

    await pool.query(
      `
        UPDATE expert_applications
        SET
          status = $1,
          reviewed_by = $2,
          reviewed_note = $3,
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = $4
      `,
      [decision, req.auth.sub, reviewedNote, applicationId]
    )

    await pool.query('UPDATE users SET is_expert = $1 WHERE id = $2', [decision === 'approved', application.user_id])

    const updatedResult = await pool.query(
      `
        SELECT
          a.id,
          a.user_id,
          a.specialty,
          a.credentials,
          a.motivation,
          a.evidence_photos,
          a.chat_price_usd,
          a.voice_price_usd,
          a.video_price_usd,
          a.status,
          a.reviewed_note,
          a.reviewed_at,
          a.created_at,
          a.updated_at,
          u.name AS user_name,
          u.email AS user_email
        FROM expert_applications a
        JOIN users u ON u.id = a.user_id
        WHERE a.id = $1
        LIMIT 1
      `,
      [applicationId]
    )

    const row = updatedResult.rows[0]
    return res.status(200).json({
      application: {
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        specialty: row.specialty,
        credentials: row.credentials,
        motivation: row.motivation,
        evidencePhotos: Array.isArray(row.evidence_photos) ? row.evidence_photos : [],
        pricing: {
          chat: row.chat_price_usd == null ? null : Number(row.chat_price_usd),
          voice: row.voice_price_usd == null ? null : Number(row.voice_price_usd),
          video: row.video_price_usd == null ? null : Number(row.video_price_usd),
        },
        status: row.status,
        reviewedNote: row.reviewed_note,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to review application', error: error.message })
  }
})

module.exports = router
