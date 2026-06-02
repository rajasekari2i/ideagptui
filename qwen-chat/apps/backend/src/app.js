const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const sessionsRouter = require('./routes/sessions');
const messagesRouter = require('./routes/messages');
const healthRouter = require('./routes/health');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/sessions', messagesRouter);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error', code: err.code || 'INTERNAL_ERROR' });
});

module.exports = app;
