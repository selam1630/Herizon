const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || '').trim()
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || 'gpt-4o-mini').trim()
const OPENAI_STT_MODEL = String(process.env.OPENAI_STT_MODEL || 'whisper-1').trim()
const QUERY_STOPWORDS = new Set([
  'what',
  'when',
  'where',
  'which',
  'who',
  'whom',
  'whose',
  'why',
  'how',
  'can',
  'could',
  'should',
  'would',
  'please',
  'tell',
  'about',
  'explain',
  'define',
  'this',
  'that',
  'these',
  'those',
  'with',
  'without',
  'from',
  'into',
  'over',
  'under',
  'your',
  'my',
  'our',
  'their',
  'there',
  'here',
  'have',
  'has',
  'had',
  'does',
  'did',
  'for',
  'and',
  'the',
])

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
}

function scoreByTokenOverlap(text, tokens) {
  if (!tokens.length) return { score: 0, matchedCount: 0 }

  const textTokens = new Set(tokenize(text))
  let matchedCount = 0

  for (const token of tokens) {
    if (textTokens.has(token)) matchedCount += 1
  }

  // Prefer both absolute overlap and query coverage.
  const coverage = matchedCount / tokens.length
  const score = matchedCount + coverage
  return { score, matchedCount }
}

function fallbackResponse(question, contextItems) {
  const q = String(question || '').trim()
  if (contextItems.length > 0) {
    return `From trusted community and expert guidance: ${contextItems[0].text} This is general support information, not medical diagnosis.`
  }

  return `I do not have enough verified knowledge from expert and community data for: "${q}". Please ask a verified expert for a safe and reliable answer.`
}

async function fetchGroundingContext(pool, question, topic, limit = 6) {
  const topicFilter = String(topic || '').trim().toLowerCase()
  const tokens = tokenize(question)
  const queryTokens = tokens
    .filter((token) => !QUERY_STOPWORDS.has(token))
    .slice(0, 10)

  if (queryTokens.length === 0) {
    return []
  }

  const [expertAnswersResult, communityResult] = await Promise.all([
    pool.query(
      `
        SELECT
          a.content,
          a.expert_name,
          q.topic,
          a.created_at
        FROM expert_answers a
        JOIN expert_questions q ON q.id = a.question_id
        WHERE ($1 = '' OR q.topic = $1)
        ORDER BY a.created_at DESC
        LIMIT 200
      `,
      [topicFilter]
    ),
    pool.query(
      `
        SELECT 'post'::text AS kind, p.content, p.created_at
        FROM community_posts p
        ORDER BY p.created_at DESC
        LIMIT 120
      `
    ),
  ])

  const candidates = []

  for (const row of expertAnswersResult.rows) {
    const text = String(row.content || '').trim()
    if (!text) continue
    const overlap = scoreByTokenOverlap(text, queryTokens)
    const score = overlap.score + 0.35
    candidates.push({
      source: 'expert',
      text,
      score,
      matchedCount: overlap.matchedCount,
      meta: `Expert: ${row.expert_name || 'Verified expert'}`,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    })
  }

  for (const row of communityResult.rows) {
    const text = String(row.content || '').trim()
    if (!text) continue
    const overlap = scoreByTokenOverlap(text, queryTokens)
    candidates.push({
      source: row.kind || 'community',
      text,
      score: overlap.score,
      matchedCount: overlap.matchedCount,
      meta: 'Community',
      createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    })
  }

  return candidates
    .filter((item) => {
      if (item.matchedCount >= 2) return true
      if (item.matchedCount === 1) {
        return queryTokens.some((token) => token.length >= 7 && item.text.toLowerCase().includes(token))
      }
      return false
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.createdAt - a.createdAt
    })
    .slice(0, limit)
}

async function generateGroundedAnswer({ pool, question, topic }) {
  const contextItems = await fetchGroundingContext(pool, question, topic, 6)
  const contextText = contextItems
    .map((item, index) => `#${index + 1} [${item.meta}] ${item.text}`)
    .join('\n')

  // Hard guard: never guess when we have no grounded context.
  if (contextItems.length === 0) {
    return {
      answer: fallbackResponse(question, contextItems),
      grounded: false,
      sources: [],
      model: 'no_context',
    }
  }

  if (!OPENAI_API_KEY) {
    return {
      answer: fallbackResponse(question, contextItems),
      grounded: contextItems.length > 0,
      sources: contextItems,
      model: 'fallback',
    }
  }

  const systemPrompt = [
    'You are a maternal health support assistant.',
    'Use only the provided context when possible.',
    'If context is insufficient, say you are not sure and recommend consulting a licensed clinician.',
    'Keep responses short, practical, and safe.',
    'Do not provide diagnosis.',
    'Include a brief safety disclaimer at the end.',
  ].join(' ')

  const userPrompt = [
    `Topic: ${topic || 'general'}`,
    `Question: ${question}`,
    contextText ? `Context:\n${contextText}` : 'Context: none',
  ].join('\n\n')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  const data = await response.json().catch(() => ({}))
  const answer = String(data?.choices?.[0]?.message?.content || '').trim()
  if (!response.ok || !answer) {
    const message = String(data?.error?.message || data?.message || 'Failed to generate AI answer')
    throw new Error(message)
  }

  return {
    answer,
    grounded: contextItems.length > 0,
    sources: contextItems,
    model: OPENAI_MODEL,
  }
}

async function transcribeAudioFromUrl(recordingUrl) {
  if (!OPENAI_API_KEY) {
    return ''
  }

  const audioResponse = await fetch(recordingUrl)
  if (!audioResponse.ok) {
    throw new Error(`Failed to download recording (${audioResponse.status})`)
  }

  const audioBuffer = await audioResponse.arrayBuffer()
  const audioBlob = new Blob([audioBuffer], { type: audioResponse.headers.get('content-type') || 'audio/mpeg' })
  const formData = new FormData()
  formData.append('model', OPENAI_STT_MODEL)
  formData.append('file', audioBlob, 'recording.mp3')

  const sttResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  })

  const sttData = await sttResponse.json().catch(() => ({}))
  const transcript = String(sttData?.text || '').trim()
  if (!sttResponse.ok) {
    const message = String(sttData?.error?.message || sttData?.message || 'Failed to transcribe audio')
    throw new Error(message)
  }

  return transcript
}

module.exports = {
  generateGroundedAnswer,
  transcribeAudioFromUrl,
}
