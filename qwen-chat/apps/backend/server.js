require('dotenv').config();
const app = require('./src/app');
const { checkOllamaHealth } = require('./src/services/ollama');
const logger = require('./src/services/logger');

const PORT = process.env.API_PORT || 8000;

async function start() {
  await checkOllamaHealth();

  app.listen(PORT, () => {
    logger.info(`Backend API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
