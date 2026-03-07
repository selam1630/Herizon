const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const { randomUUID } = require('crypto')

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL in environment variables')
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
})

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function getSeedAdminCredentials() {
  const email = String(process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase()
  const password = String(process.env.ADMIN_SEED_PASSWORD || '')
  if (!email || !password) {
    return null
  }
  return { email, password }
}

async function verifyDatabaseConnection() {
  await pool.query('SELECT 1')
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar_url TEXT NOT NULL DEFAULT '/placeholder-user.jpg',
      bio TEXT NOT NULL DEFAULT '',
      is_expert BOOLEAN NOT NULL DEFAULT FALSE,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      is_premium BOOLEAN NOT NULL DEFAULT FALSE,
      premium_until TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
  `)

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;
  `)

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ NULL;
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN ('pregnancy', 'parenting', 'health', 'general')),
      content TEXT NOT NULL,
      is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
      likes_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expert_questions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_expert_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      question TEXT NOT NULL,
      topic TEXT NOT NULL CHECK (topic IN ('medical', 'mental_health', 'nutrition', 'parenting')),
      is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    ALTER TABLE expert_questions
    ADD COLUMN IF NOT EXISTS target_expert_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL;
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS expert_questions_target_expert_idx
    ON expert_questions (target_expert_user_id);
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expert_answers (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES expert_questions(id) ON DELETE CASCADE,
      expert_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      expert_name TEXT NOT NULL,
      expert_avatar TEXT NOT NULL DEFAULT '/placeholder-user.jpg',
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expert_applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      specialty TEXT NOT NULL,
      credentials TEXT NOT NULL,
      motivation TEXT NOT NULL DEFAULT '',
      evidence_photos TEXT[] NOT NULL DEFAULT '{}',
      chat_price_usd NUMERIC(10,2) NULL,
      voice_price_usd NUMERIC(10,2) NULL,
      video_price_usd NUMERIC(10,2) NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      reviewed_by TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      reviewed_note TEXT NOT NULL DEFAULT '',
      reviewed_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    ALTER TABLE expert_applications
    ADD COLUMN IF NOT EXISTS chat_price_usd NUMERIC(10,2) NULL;
  `)

  await pool.query(`
    ALTER TABLE expert_applications
    ADD COLUMN IF NOT EXISTS voice_price_usd NUMERIC(10,2) NULL;
  `)

  await pool.query(`
    ALTER TABLE expert_applications
    ADD COLUMN IF NOT EXISTS video_price_usd NUMERIC(10,2) NULL;
  `)

  await pool.query(`
    ALTER TABLE expert_applications
    ADD COLUMN IF NOT EXISTS evidence_photos TEXT[] NOT NULL DEFAULT '{}';
  `)

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS expert_applications_one_pending_per_user_idx
    ON expert_applications (user_id)
    WHERE status = 'pending';
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('premium_subscription', 'expert_consultation')),
      expert_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      service_type TEXT NULL CHECK (service_type IN ('chat', 'voice', 'video', 'premium')),
      base_amount NUMERIC(10,2) NOT NULL,
      discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      final_amount NUMERIC(10,2) NOT NULL,
      platform_fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      expert_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      tx_ref TEXT NOT NULL UNIQUE,
      chapa_checkout_url TEXT NULL,
      chapa_status TEXT NOT NULL DEFAULT 'pending',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultation_messages (
      id TEXT PRIMARY KEY,
      tx_ref TEXT NOT NULL REFERENCES payment_transactions(tx_ref) ON DELETE CASCADE,
      sender_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS consultation_messages_tx_ref_created_at_idx
    ON consultation_messages (tx_ref, created_at ASC);
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS voice_calls (
      id TEXT PRIMARY KEY,
      caller TEXT NOT NULL DEFAULT '',
      menu_option TEXT NULL,
      recording_url TEXT NULL,
      transcript TEXT NOT NULL DEFAULT '',
      ai_response TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('received', 'processed', 'failed')) DEFAULT 'received',
      error_message TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS voice_calls_created_at_idx
    ON voice_calls (created_at DESC);
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      message TEXT NOT NULL,
      is_ai BOOLEAN NOT NULL DEFAULT FALSE,
      topic TEXT NULL,
      source_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx
    ON chat_messages (created_at DESC);
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expert_articles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('pregnancy', 'parenting', 'health', 'nutrition')),
      tags TEXT[] NOT NULL DEFAULT '{}',
      read_time_minutes INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      reviewed_by TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      reviewed_note TEXT NOT NULL DEFAULT '',
      reviewed_at TIMESTAMPTZ NULL,
      published_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS expert_articles_status_created_at_idx
    ON expert_articles (status, created_at DESC);
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS expert_articles_user_created_at_idx
    ON expert_articles (user_id, created_at DESC);
  `)

  const adminEmails = getAdminEmails()
  if (adminEmails.length > 0) {
    await pool.query(
      `
        UPDATE users
        SET is_admin = TRUE
        WHERE LOWER(email) = ANY($1::text[])
      `,
      [adminEmails]
    )
  }

  const seedAdmin = getSeedAdminCredentials()
  if (seedAdmin) {
    const { email, password } = seedAdmin
    const passwordHash = await bcrypt.hash(password, 12)

    await pool.query(
      `
        INSERT INTO users (id, name, email, password_hash, is_admin)
        VALUES ($1, 'Admin', $2, $3, TRUE)
        ON CONFLICT (email)
        DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          is_admin = TRUE
      `,
      [randomUUID(), email, passwordHash]
    )
  }
}

module.exports = {
  pool,
  verifyDatabaseConnection,
  initializeDatabase,
}
