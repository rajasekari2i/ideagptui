const express = require('express');
const router = express.Router();
const { checkOllamaHealth, isOnline, MODEL } = require('../services/ollama');
const { ping } = require('../services/db');

router.get('/', async (req, res, next) => {
  try {
    const ollamaOk = await checkOllamaHealth();
    let dbOk = false;
    try {
      await ping();
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const status = ollamaOk && dbOk ? 'ok' : 'degraded';
    res.status(ollamaOk && dbOk ? 200 : 503).json({
      status,
      ollama: ollamaOk ? 'connected' : 'offline',
      model: MODEL,
      database: dbOk ? 'connected' : 'offline',
      uptime: Math.floor(process.uptime()),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/models', async (req, res, next) => {
  try {
    const { listModels } = require('../services/ollama');
    const models = await listModels();
    res.json({ models });
  } catch (err) {
    res.status(503).json({ error: 'Ollama unreachable', code: 'OLLAMA_OFFLINE' });
  }
});

module.exports = router;
