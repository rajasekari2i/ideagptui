const logger = require('./logger');

// Strip any trailing /api/... path so users can set either the base URL or a full endpoint URL
const BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/api\/.*$/, '');
const MODEL = process.env.OLLAMA_MODEL || 'qwen3-coder:30b';
const STREAM_TIMEOUT_MS = parseInt(process.env.STREAM_TIMEOUT_MS || '120000', 10);
const MAX_CONTEXT_MESSAGES = parseInt(process.env.MAX_CONTEXT_MESSAGES || '50', 10);

let ollamaOnline = false;

async function checkOllamaHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    ollamaOnline = res.ok;
  } catch {
    ollamaOnline = false;
  }
  logger.info(`Ollama status: ${ollamaOnline ? 'online' : 'offline'}`);
  return ollamaOnline;
}

function isOnline() {
  return ollamaOnline;
}

async function listModels() {
  const res = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('Ollama unreachable');
  const data = await res.json();
  return (data.models || []).map((m) => m.name);
}

async function streamChat({ messages, settings, onToken, signal }) {
  const body = {
    model: MODEL,
    messages: messages.slice(-MAX_CONTEXT_MESSAGES),
    stream: true,
    options: {
      temperature: settings.temperature ?? 0.7,
      num_predict: settings.maxTokens ?? 2048,
      top_p: settings.topP ?? 0.9,
      top_k: settings.topK ?? 40,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: combinedSignal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama error ${res.status}: ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let tokensUsed = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            fullContent += json.message.content;
            onToken(json.message.content);
          }
          if (json.eval_count) tokensUsed = json.eval_count;
        } catch {
          // partial JSON chunk — ignore
        }
      }
    }

    ollamaOnline = true;
    return { fullContent, tokensUsed };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { checkOllamaHealth, isOnline, listModels, streamChat, MODEL };
