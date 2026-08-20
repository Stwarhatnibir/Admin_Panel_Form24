const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { isConfigured: firebaseConfigured } = require('./firebase/firebaseAdmin');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      firebaseConfigured,
      environment: env.nodeEnv,
    },
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] Admin panel API listening on port ${env.port} (${env.nodeEnv})`);
  if (!firebaseConfigured) {
    // eslint-disable-next-line no-console
    console.warn('[server] Firebase is not configured - see server/.env.example.');
  }
});

module.exports = app;
