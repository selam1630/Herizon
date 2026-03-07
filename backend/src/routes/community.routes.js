const express = require('express')
const { randomUUID } = require('crypto')

const { pool } = require('../db')
const { requireAuth } = require('../middleware/auth.middleware')

const router = express.Router()

function toPost(row) {
  return {
    id: row.id,
    authorId: row.user_id,
    author: row.is_anonymous ? 'Anonymous' : row.author_name,
    avatar: row.author_avatar,
    category: row.category,
    content: row.content,
    timestamp: row.created_at,
    likes: row.likes_count,
    commentCount: Number(row.comment_count || 0),
    isAnonymous: row.is_anonymous,
    isLiked: false,
  }
}

function toComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.user_id,
    author: row.author_name,
    avatar: row.author_avatar,
    content: row.content,
    timestamp: row.created_at,
  }
}

router.get('/posts', async (_req, res) => {
  try {
    const postsResult = await pool.query(
      `
        SELECT
          p.id,
          p.user_id,
          p.category,
          p.content,
          p.is_anonymous,
          p.likes_count,
          p.created_at,
          u.name AS author_name,
          u.avatar_url AS author_avatar,
          COUNT(c.id)::int AS comment_count
        FROM community_posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN community_comments c ON c.post_id = p.id
        GROUP BY p.id, p.user_id, p.category, p.content, p.is_anonymous, p.likes_count, p.created_at, u.name, u.avatar_url
        ORDER BY p.created_at DESC
      `
    )

    const commentsResult = await pool.query(
      `
        SELECT
          c.id,
          c.post_id,
          c.user_id,
          c.content,
          c.created_at,
          u.name AS author_name,
          u.avatar_url AS author_avatar
        FROM community_comments c
        JOIN users u ON u.id = c.user_id
        ORDER BY c.created_at ASC
      `
    )

    return res.status(200).json({
      posts: postsResult.rows.map(toPost),
      comments: commentsResult.rows.map(toComment),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch community posts', error: error.message })
  }
})

router.post('/posts', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const content = String(req.body.content || '').trim()
    const category = String(req.body.category || '').trim()
    const isAnonymous = Boolean(req.body.isAnonymous)

    if (!content) {
      return res.status(400).json({ message: 'Post content is required' })
    }

    if (!['pregnancy', 'parenting', 'health', 'general'].includes(category)) {
      return res.status(400).json({ message: 'Invalid post category' })
    }

    const postId = randomUUID()
    const inserted = await pool.query(
      `
        INSERT INTO community_posts (id, user_id, category, content, is_anonymous)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, category, content, is_anonymous, likes_count, created_at
      `,
      [postId, userId, category, content, isAnonymous]
    )

    const userResult = await pool.query('SELECT name, avatar_url FROM users WHERE id = $1 LIMIT 1', [userId])
    const user = userResult.rows[0]

    return res.status(201).json({
      post: toPost({
        ...inserted.rows[0],
        author_name: user.name,
        author_avatar: user.avatar_url,
        comment_count: 0,
      }),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create post', error: error.message })
  }
})

router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const postId = String(req.params.postId || '').trim()
    const content = String(req.body.content || '').trim()

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' })
    }

    const postExists = await pool.query('SELECT id FROM community_posts WHERE id = $1 LIMIT 1', [postId])
    if (postExists.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const commentId = randomUUID()
    const inserted = await pool.query(
      `
        INSERT INTO community_comments (id, post_id, user_id, content)
        VALUES ($1, $2, $3, $4)
        RETURNING id, post_id, user_id, content, created_at
      `,
      [commentId, postId, userId, content]
    )

    const userResult = await pool.query('SELECT name, avatar_url FROM users WHERE id = $1 LIMIT 1', [userId])
    const user = userResult.rows[0]

    const commentCountResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM community_comments WHERE post_id = $1',
      [postId]
    )

    return res.status(201).json({
      comment: toComment({
        ...inserted.rows[0],
        author_name: user.name,
        author_avatar: user.avatar_url,
      }),
      commentCount: Number(commentCountResult.rows[0].count || 0),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create comment', error: error.message })
  }
})

module.exports = router
