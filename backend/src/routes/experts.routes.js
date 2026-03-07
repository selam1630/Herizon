const express = require('express')
const { randomUUID } = require('crypto')

const { pool } = require('../db')
const { requireAuth } = require('../middleware/auth.middleware')

const router = express.Router()
const MAX_EVIDENCE_PHOTOS = 3
const MAX_EVIDENCE_PHOTO_CHARS = 3_000_000
const ARTICLE_CATEGORIES = new Set(['pregnancy', 'parenting', 'health', 'nutrition'])

function normalizeEvidencePhotos(value) {
  if (value == null) {
    return []
  }

  if (!Array.isArray(value)) {
    return null
  }

  const normalized = []
  for (const item of value) {
    if (typeof item !== 'string') {
      return null
    }
    const trimmed = item.trim()
    if (!trimmed) {
      continue
    }
    const isUrl = /^https?:\/\//i.test(trimmed)
    const isImageDataUrl = /^data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)
    if (!isUrl && !isImageDataUrl) {
      return null
    }
    if (trimmed.length > MAX_EVIDENCE_PHOTO_CHARS) {
      return null
    }
    normalized.push(trimmed)
  }

  if (normalized.length > MAX_EVIDENCE_PHOTOS) {
    return null
  }

  return normalized
}

function toQuestion(row) {
  return {
    id: row.id,
    authorId: row.user_id,
    author: row.is_anonymous ? 'Anonymous' : row.author_name,
    avatar: row.author_avatar,
    question: row.question,
    topic: row.topic,
    timestamp: row.created_at,
    answerCount: Number(row.answer_count || 0),
    isAnonymous: row.is_anonymous,
    targetExpertId: row.target_expert_user_id || null,
    targetExpertName: row.target_expert_name || null,
  }
}

function toAnswer(row) {
  return {
    id: row.id,
    questionId: row.question_id,
    expertId: row.expert_user_id || `expert_${row.id}`,
    expert: row.expert_name,
    expertAvatar: row.expert_avatar,
    content: row.content,
    timestamp: row.created_at,
  }
}

function toApplication(row) {
  return {
    id: row.id,
    userId: row.user_id,
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
  }
}

function normalizeArticleTags(value) {
  if (value == null) return []
  if (!Array.isArray(value)) return null
  const tags = []
  for (const item of value) {
    if (typeof item !== 'string') return null
    const normalized = item.trim().toLowerCase()
    if (!normalized) continue
    if (normalized.length > 40) return null
    tags.push(normalized)
  }
  return Array.from(new Set(tags)).slice(0, 8)
}

function estimateReadTimeMinutes(content) {
  const words = String(content || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function toMyArticle(row) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt || '',
    content: row.content,
    category: row.category,
    tags: Array.isArray(row.tags) ? row.tags : [],
    readTime: Number(row.read_time_minutes || 1),
    status: row.status,
    reviewedNote: row.reviewed_note || '',
    reviewedAt: row.reviewed_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  }
}

router.get('/verified', async (_req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          u.id,
          u.name,
          u.avatar_url,
          COALESCE(a.specialty, '') AS specialty,
          a.chat_price_usd,
          a.voice_price_usd,
          a.video_price_usd
        FROM users u
        JOIN LATERAL (
          SELECT specialty, chat_price_usd, voice_price_usd, video_price_usd
          FROM expert_applications
          WHERE user_id = u.id AND status = 'approved'
          ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
          LIMIT 1
        ) a ON TRUE
        WHERE u.is_expert = TRUE
        ORDER BY u.created_at DESC
      `
    )

    return res.status(200).json({
      experts: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        avatar: row.avatar_url,
        specialty: row.specialty,
        pricing: {
          chat: row.chat_price_usd == null ? null : Number(row.chat_price_usd),
          voice: row.voice_price_usd == null ? null : Number(row.voice_price_usd),
          video: row.video_price_usd == null ? null : Number(row.video_price_usd),
        },
      })),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch verified experts', error: error.message })
  }
})

router.get('/applications/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const result = await pool.query(
      `
        SELECT id, user_id, specialty, credentials, motivation, status, reviewed_note, reviewed_at, created_at, updated_at
        , chat_price_usd, voice_price_usd, video_price_usd, evidence_photos
        FROM expert_applications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId]
    )

    if (result.rowCount === 0) {
      return res.status(200).json({ application: null })
    }

    return res.status(200).json({ application: toApplication(result.rows[0]) })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch application status', error: error.message })
  }
})

router.post('/applications', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const specialty = String(req.body.specialty || '').trim()
    const credentials = String(req.body.credentials || '').trim()
    const motivation = String(req.body.motivation || '').trim()
    const evidencePhotos = normalizeEvidencePhotos(req.body.evidencePhotos)

    if (!specialty || !credentials) {
      return res.status(400).json({ message: 'Specialty and credentials are required' })
    }
    if (evidencePhotos == null) {
      return res.status(400).json({
        message:
          'evidencePhotos must be up to 3 image URLs or base64 image data URLs',
      })
    }

    const existingPending = await pool.query(
      `
        SELECT id
        FROM expert_applications
        WHERE user_id = $1 AND status = 'pending'
        LIMIT 1
      `,
      [userId]
    )

    if (existingPending.rowCount > 0) {
      return res.status(409).json({ message: 'You already have a pending expert application' })
    }

    const id = randomUUID()
    const inserted = await pool.query(
      `
        INSERT INTO expert_applications (id, user_id, specialty, credentials, motivation, evidence_photos)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, user_id, specialty, credentials, motivation, evidence_photos, chat_price_usd, voice_price_usd, video_price_usd, status, reviewed_note, reviewed_at, created_at, updated_at
      `,
      [id, userId, specialty, credentials, motivation, evidencePhotos]
    )

    return res.status(201).json({ application: toApplication(inserted.rows[0]) })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit expert application', error: error.message })
  }
})

router.get('/me/pricing', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const result = await pool.query(
      `
        SELECT id, chat_price_usd, voice_price_usd, video_price_usd
        FROM expert_applications
        WHERE user_id = $1 AND status = 'approved'
        ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
        LIMIT 1
      `,
      [userId]
    )

    if (result.rowCount === 0) {
      return res.status(403).json({ message: 'Only approved experts can manage pricing' })
    }

    const row = result.rows[0]
    return res.status(200).json({
      pricing: {
        applicationId: row.id,
        chat: row.chat_price_usd == null ? null : Number(row.chat_price_usd),
        voice: row.voice_price_usd == null ? null : Number(row.voice_price_usd),
        video: row.video_price_usd == null ? null : Number(row.video_price_usd),
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load expert pricing', error: error.message })
  }
})

router.patch('/me/pricing', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const chat = Number(req.body.chat)
    const voice = Number(req.body.voice)
    const video = Number(req.body.video)

    if (
      Number.isNaN(chat) ||
      Number.isNaN(voice) ||
      Number.isNaN(video) ||
      chat < 0 ||
      voice < 0 ||
      video < 0
    ) {
      return res.status(400).json({ message: 'chat, voice, and video must be non-negative numbers' })
    }

    const approved = await pool.query(
      `
        SELECT id
        FROM expert_applications
        WHERE user_id = $1 AND status = 'approved'
        ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
        LIMIT 1
      `,
      [userId]
    )

    if (approved.rowCount === 0) {
      return res.status(403).json({ message: 'Only approved experts can manage pricing' })
    }

    const applicationId = approved.rows[0].id
    const updated = await pool.query(
      `
        UPDATE expert_applications
        SET
          chat_price_usd = $1,
          voice_price_usd = $2,
          video_price_usd = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING id, chat_price_usd, voice_price_usd, video_price_usd
      `,
      [chat, voice, video, applicationId]
    )

    const row = updated.rows[0]
    return res.status(200).json({
      pricing: {
        applicationId: row.id,
        chat: Number(row.chat_price_usd),
        voice: Number(row.voice_price_usd),
        video: Number(row.video_price_usd),
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update expert pricing', error: error.message })
  }
})

router.post('/articles', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const title = String(req.body.title || '').trim()
    const excerpt = String(req.body.excerpt || '').trim()
    const content = String(req.body.content || '').trim()
    const category = String(req.body.category || '').trim().toLowerCase()
    const tags = normalizeArticleTags(req.body.tags)

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'title, content, and category are required' })
    }
    if (!ARTICLE_CATEGORIES.has(category)) {
      return res.status(400).json({ message: 'Invalid category' })
    }
    if (title.length > 220) {
      return res.status(400).json({ message: 'Title must be 220 characters or less' })
    }
    if (tags == null) {
      return res.status(400).json({ message: 'tags must be an array of short strings' })
    }

    const expertCheck = await pool.query(
      `
        SELECT is_expert
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId]
    )
    if (expertCheck.rowCount === 0 || !expertCheck.rows[0].is_expert) {
      return res.status(403).json({ message: 'Only verified experts can submit articles' })
    }

    const id = randomUUID()
    const readTimeMinutes = estimateReadTimeMinutes(content)
    const articleExcerpt = excerpt || content.slice(0, 220)
    const inserted = await pool.query(
      `
        INSERT INTO expert_articles (
          id, user_id, title, excerpt, content, category, tags, read_time_minutes, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING
          id, title, excerpt, content, category, tags, read_time_minutes, status,
          reviewed_note, reviewed_at, published_at, created_at
      `,
      [id, userId, title, articleExcerpt, content, category, tags, readTimeMinutes]
    )

    return res.status(201).json({ article: toMyArticle(inserted.rows[0]) })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit article', error: error.message })
  }
})

router.get('/articles/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id, title, excerpt, content, category, tags, read_time_minutes, status,
          reviewed_note, reviewed_at, published_at, created_at
        FROM expert_articles
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [req.auth.sub]
    )

    return res.status(200).json({ articles: result.rows.map(toMyArticle) })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load your submitted articles', error: error.message })
  }
})

router.get('/questions', async (_req, res) => {
  try {
    const questionsResult = await pool.query(
      `
        SELECT
          q.id,
          q.user_id,
          q.question,
          q.topic,
          q.is_anonymous,
          q.target_expert_user_id,
          q.created_at,
          u.name AS author_name,
          u.avatar_url AS author_avatar,
          te.name AS target_expert_name,
          COUNT(a.id)::int AS answer_count
        FROM expert_questions q
        JOIN users u ON u.id = q.user_id
        LEFT JOIN users te ON te.id = q.target_expert_user_id
        LEFT JOIN expert_answers a ON a.question_id = q.id
        GROUP BY
          q.id, q.user_id, q.question, q.topic, q.is_anonymous,
          q.target_expert_user_id, q.created_at, u.name, u.avatar_url, te.name
        ORDER BY q.created_at DESC
      `
    )

    const answersResult = await pool.query(
      `
        SELECT
          id,
          question_id,
          expert_user_id,
          expert_name,
          expert_avatar,
          content,
          created_at
        FROM expert_answers
        ORDER BY created_at ASC
      `
    )

    return res.status(200).json({
      questions: questionsResult.rows.map(toQuestion),
      answers: answersResult.rows.map(toAnswer),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch expert data', error: error.message })
  }
})

router.post('/questions', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const question = String(req.body.question || '').trim()
    const topic = String(req.body.topic || '').trim()
    const isAnonymous = Boolean(req.body.isAnonymous)
    const targetExpertIdRaw = String(req.body.targetExpertId || '').trim()
    const targetExpertId = targetExpertIdRaw || null

    if (!question) {
      return res.status(400).json({ message: 'Question is required' })
    }

    if (!['medical', 'mental_health', 'nutrition', 'parenting'].includes(topic)) {
      return res.status(400).json({ message: 'Invalid question topic' })
    }

    let targetExpertName = null
    if (targetExpertId) {
      const targetExpertResult = await pool.query(
        `
          SELECT id, name, is_expert
          FROM users
          WHERE id = $1
          LIMIT 1
        `,
        [targetExpertId]
      )

      if (targetExpertResult.rowCount === 0 || !targetExpertResult.rows[0].is_expert) {
        return res.status(400).json({ message: 'Selected target expert is invalid or not verified' })
      }

      targetExpertName = targetExpertResult.rows[0].name
    }

    const questionId = randomUUID()
    const inserted = await pool.query(
      `
        INSERT INTO expert_questions (id, user_id, question, topic, is_anonymous, target_expert_user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, user_id, question, topic, is_anonymous, target_expert_user_id, created_at
      `,
      [questionId, userId, question, topic, isAnonymous, targetExpertId]
    )

    const userResult = await pool.query('SELECT name, avatar_url FROM users WHERE id = $1 LIMIT 1', [userId])
    const user = userResult.rows[0]

    return res.status(201).json({
      question: toQuestion({
        ...inserted.rows[0],
        author_name: user.name,
        author_avatar: user.avatar_url,
        answer_count: 0,
        target_expert_name: targetExpertName,
      }),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create question', error: error.message })
  }
})

router.post('/questions/:questionId/answers', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const questionId = String(req.params.questionId || '').trim()
    const content = String(req.body.content || '').trim()

    if (!content) {
      return res.status(400).json({ message: 'Answer content is required' })
    }

    const userResult = await pool.query(
      `
        SELECT id, name, avatar_url, is_expert
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId]
    )

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = userResult.rows[0]
    if (!user.is_expert) {
      return res.status(403).json({ message: 'Only approved experts can answer questions' })
    }

    const questionExists = await pool.query(
      `
        SELECT id, target_expert_user_id
        FROM expert_questions
        WHERE id = $1
        LIMIT 1
      `,
      [questionId]
    )
    if (questionExists.rowCount === 0) {
      return res.status(404).json({ message: 'Question not found' })
    }

    const questionRow = questionExists.rows[0]
    if (questionRow.target_expert_user_id && questionRow.target_expert_user_id !== userId) {
      return res.status(403).json({ message: 'This question is reserved for another expert' })
    }

    const answerId = randomUUID()
    const inserted = await pool.query(
      `
        INSERT INTO expert_answers (id, question_id, expert_user_id, expert_name, expert_avatar, content)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, question_id, expert_user_id, expert_name, expert_avatar, content, created_at
      `,
      [answerId, questionId, userId, user.name, user.avatar_url || '/placeholder-user.jpg', content]
    )

    const answerCountResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM expert_answers WHERE question_id = $1',
      [questionId]
    )

    return res.status(201).json({
      answer: toAnswer(inserted.rows[0]),
      answerCount: Number(answerCountResult.rows[0].count || 0),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create answer', error: error.message })
  }
})

module.exports = router
