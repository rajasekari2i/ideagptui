const { query } = require('../services/db');

const DEFAULT_SETTINGS = {
  temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || '2048', 10),
  topP: parseFloat(process.env.DEFAULT_TOP_P || '0.9'),
  topK: parseInt(process.env.DEFAULT_TOP_K || '40', 10),
};

function mapSession(row) {
  return {
    id: row.id,
    title: row.title,
    systemPrompt: row.system_prompt,
    settings: { ...DEFAULT_SETTINGS, ...row.settings },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messageCount: parseInt(row.message_count || '0', 10),
    lastMessage: row.last_message || null,
  };
}

async function listSessions(req, res, next) {
  try {
    const search = req.query.q;
    let sql = `
      SELECT s.*,
        COUNT(m.id) AS message_count,
        (SELECT content FROM messages WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) AS last_message
      FROM sessions s
      LEFT JOIN messages m ON m.session_id = s.id
    `;
    const params = [];
    if (search) {
      sql += ` WHERE s.title ILIKE $1 OR EXISTS (
        SELECT 1 FROM messages WHERE session_id = s.id AND content ILIKE $1
      )`;
      params.push(`%${search}%`);
    }
    sql += ' GROUP BY s.id ORDER BY s.updated_at DESC';
    const { rows } = await query(sql, params);
    res.json(rows.map(mapSession));
  } catch (err) {
    next(err);
  }
}

async function createSession(req, res, next) {
  try {
    const title = req.body.title || 'New Chat';
    const { rows } = await query(
      `INSERT INTO sessions (title) VALUES ($1) RETURNING *`,
      [title]
    );
    res.status(201).json({ ...mapSession(rows[0]), messageCount: 0 });
  } catch (err) {
    next(err);
  }
}

async function getSession(req, res, next) {
  try {
    const { rows: sessionRows } = await query('SELECT * FROM sessions WHERE id = $1', [req.params.id]);
    if (!sessionRows.length) return res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });

    const { rows: messages } = await query(
      'SELECT id, role, content, tokens_used AS "tokensUsed", created_at AS "createdAt" FROM messages WHERE session_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );

    const session = mapSession(sessionRows[0]);
    res.json({ ...session, messages });
  } catch (err) {
    next(err);
  }
}

async function updateSession(req, res, next) {
  try {
    const { title, systemPrompt, settings } = req.body;
    const sets = [];
    const params = [];
    let idx = 1;

    if (title !== undefined) { sets.push(`title = $${idx++}`); params.push(title); }
    if (systemPrompt !== undefined) { sets.push(`system_prompt = $${idx++}`); params.push(systemPrompt); }
    if (settings !== undefined) {
      sets.push(`settings = settings || $${idx++}::jsonb`);
      params.push(JSON.stringify(settings));
    }

    if (!sets.length) return res.status(400).json({ error: 'No fields to update', code: 'BAD_REQUEST' });

    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE sessions SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
    res.json(mapSession(rows[0]));
  } catch (err) {
    next(err);
  }
}

async function deleteSession(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM sessions WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listSessions, createSession, getSession, updateSession, deleteSession };
