const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL in environment variables')
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function verifyDatabaseConnection() {
  await pool.query('SELECT 1')
}

module.exports = {
  pool,
  verifyDatabaseConnection,
}
