const request = require('supertest');
const app = require('../src/app');

// Mock Ollama guard to always pass in tests
jest.mock('../src/middleware/ollamaGuard', () => ({
  requireOllama: (req, res, next) => next(),
}));

// Mock db
jest.mock('../src/services/db', () => {
  const sessions = new Map();
  const messages = new Map();

  return {
    query: jest.fn(async (sql, params) => {
      if (sql.includes('INSERT INTO sessions')) {
        const id = `test-${Date.now()}`;
        const row = {
          id,
          title: params[0],
          system_prompt: null,
          settings: { temperature: 0.7, maxTokens: 2048, topP: 0.9, topK: 40 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        sessions.set(id, row);
        return { rows: [row] };
      }
      if (sql.includes('SELECT') && sql.includes('FROM sessions') && !params) {
        return { rows: [...sessions.values()] };
      }
      if (sql.includes('DELETE FROM sessions')) {
        const existed = sessions.has(params[0]);
        sessions.delete(params[0]);
        return { rowCount: existed ? 1 : 0 };
      }
      return { rows: [], rowCount: 0 };
    }),
    ping: jest.fn(async () => {}),
  };
});

// Mock ollama
jest.mock('../src/services/ollama', () => ({
  isOnline: jest.fn(() => true),
  checkOllamaHealth: jest.fn(async () => true),
  listModels: jest.fn(async () => ['qwen3-coder:30b']),
  MODEL: 'qwen3-coder:30b',
}));

describe('GET /api/health', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('ollama');
    expect(res.body).toHaveProperty('database');
  });
});

describe('POST /api/sessions', () => {
  it('creates a new session with default title', async () => {
    const res = await request(app).post('/api/sessions').send({});
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title');
  });

  it('creates a session with custom title', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'My Test Chat' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('My Test Chat');
  });
});

describe('GET /api/sessions', () => {
  it('returns a list of sessions', async () => {
    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('DELETE /api/sessions/:id', () => {
  it('returns 404 for non-existent session', async () => {
    const res = await request(app).delete('/api/sessions/non-existent-id');
    expect(res.status).toBe(404);
  });
});
