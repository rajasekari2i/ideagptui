const { isOnline } = require('../services/ollama');

function requireOllama(req, res, next) {
  if (!isOnline()) {
    return res.status(503).json({ error: 'Ollama is offline. Please start Ollama.', code: 'OLLAMA_OFFLINE' });
  }
  next();
}

module.exports = { requireOllama };
