const { query } = require('../services/db');
const { streamChat } = require('../services/ollama');
const logger = require('../services/logger');

// in-memory map of sessionId -> AbortController for active streams
const activeStreams = new Map();

async function listMessages(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, role, content, tokens_used AS "tokensUsed", created_at AS "createdAt"
       FROM messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  const sessionId = req.params.id;
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: 'content is required', code: 'BAD_REQUEST' });
  }

  // Verify session exists
  const { rows: sessionRows } = await query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
  if (!sessionRows.length) {
    return res.status(404).json({ error: 'Session not found', code: 'NOT_FOUND' });
  }
  const session = sessionRows[0];
  const settings = session.settings || {};

  // Save user message
  const { rows: userMsgRows } = await query(
    `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', $2) RETURNING id`,
    [sessionId, content]
  );
  const userMessageId = userMsgRows[0].id;

  // Build message history for Ollama
  const { rows: history } = await query(
    `SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId]
  );

  const ollamaMessages = [];
  if (session.system_prompt) {
    ollamaMessages.push({ role: 'system', content: session.system_prompt });
  }
  ollamaMessages.push(...history.map((m) => ({ role: m.role, content: m.content })));

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const abortController = new AbortController();
  activeStreams.set(sessionId, abortController);

  let fullContent = '';
  let tokensUsed = 0;

  try {
    const result = await streamChat({
      messages: ollamaMessages,
      settings,
      signal: abortController.signal,
      onToken: (token) => {
        fullContent += token;
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      },
    });
    fullContent = result.fullContent;
    tokensUsed = result.tokensUsed;
  } catch (err) {
    if (err.name === 'AbortError') {
      logger.info(`Stream aborted for session ${sessionId}`);
    } else {
      logger.error('Ollama stream error', err);
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    }
  } finally {
    activeStreams.delete(sessionId);
  }

  // Save assistant message (even partial on stop)
  if (fullContent) {
    const { rows: assistantMsgRows } = await query(
      `INSERT INTO messages (session_id, role, content, tokens_used) VALUES ($1, 'assistant', $2, $3) RETURNING id`,
      [sessionId, fullContent, tokensUsed || null]
    );
    res.write(`data: ${JSON.stringify({ type: 'done', messageId: assistantMsgRows[0].id, tokensUsed })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

async function clearMessages(req, res, next) {
  try {
    await query('DELETE FROM messages WHERE session_id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function deleteMessageAndAfter(req, res, next) {
  try {
    const { messageId } = req.params;
    const { rows } = await query('SELECT created_at FROM messages WHERE id = $1', [messageId]);
    if (!rows.length) return res.status(404).json({ error: 'Message not found', code: 'NOT_FOUND' });

    await query(
      `DELETE FROM messages WHERE session_id = $1 AND created_at >= $2`,
      [req.params.id, rows[0].created_at]
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function stopStream(req, res) {
  const controller = activeStreams.get(req.params.id);
  if (controller) {
    controller.abort();
    activeStreams.delete(req.params.id);
  }
  res.json({ status: 'stopped' });
}

module.exports = { listMessages, sendMessage, clearMessages, deleteMessageAndAfter, stopStream };
