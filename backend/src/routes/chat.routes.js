const express = require('express')
const { randomUUID } = require('crypto')

const { pool } = require('../db')
const { generateGroundedAnswer } = require('../services/grounded-ai.service')

const router = express.Router()

function inferTopicFromText(text) {
  const value = String(text || '').toLowerCase()
  if (!value) return 'general'
  if (value.includes('pregnan') || value.includes('trimester') || value.includes('labor')) return 'medical'
  if (value.includes('anxiety') || value.includes('depress') || value.includes('stress')) return 'mental_health'
  if (value.includes('breastfeed') || value.includes('milk') || value.includes('feeding') || value.includes('nutrition')) return 'nutrition'
  if (value.includes('toddler') || value.includes('baby') || value.includes('parent')) return 'parenting'
  return 'general'
}

router.post('/', async (req, res) => {
  try {
    const message = String(req.body.message || '').trim()
    const topic = String(req.body.topic || '').trim().toLowerCase() || inferTopicFromText(message)

    if (!message) {
      return res.status(400).json({ message: 'message is required' })
    }

    const ai = await generateGroundedAnswer({
      pool,
      question: message,
      topic,
    })

    const userId = null
    await pool.query(
      `
        INSERT INTO chat_messages (id, user_id, message, is_ai, topic, source_count)
        VALUES ($1, $2, $3, FALSE, $4, 0),
               ($5, $2, $6, TRUE, $4, $7)
      `,
      [randomUUID(), userId, message, topic, randomUUID(), ai.answer, ai.sources.length]
    )

    return res.status(200).json({
      reply: ai.answer,
      topic,
      grounded: ai.grounded,
      sourceCount: ai.sources.length,
      model: ai.model,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process chat message', error: error.message })
  }
})

router.get('/history', async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit)
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 100) : 30

    const result = await pool.query(
      `
        SELECT id, message, is_ai, topic, source_count, created_at
        FROM chat_messages
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit]
    )

    return res.status(200).json({
      messages: result.rows
        .reverse()
        .map((row) => ({
          id: row.id,
          message: row.message,
          isAi: row.is_ai,
          topic: row.topic,
          sourceCount: Number(row.source_count || 0),
          createdAt: row.created_at,
        })),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch chat history', error: error.message })
  }
})

module.exports = router
