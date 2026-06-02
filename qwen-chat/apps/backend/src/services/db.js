const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected pg pool error', err);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  logger.info(`query executed in ${Date.now() - start}ms: ${text.slice(0, 80)}`);
  return res;
}

async function ping() {
  await pool.query('SELECT 1');
}

module.exports = { query, ping, pool };
