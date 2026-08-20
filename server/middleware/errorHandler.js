const ApiError = require('../utils/ApiError');
const env = require('../config/env');

// Centralized error handler. Must be registered LAST in server.js, after
// all routes. Never leaks stack traces, Firebase errors, or internal paths
// to the client - only a safe message and, in development, a debug field.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  // Any error explicitly thrown by our own code carries a statusCode (either
  // an ApiError, or a plain Error we deliberately annotated, e.g. the
  // "Firebase not configured" error). Those messages are safe to surface.
  // An error with NO statusCode is an unexpected/unhandled exception, so we
  // hide its message and log it server-side instead.
  const isKnownError = isApiError || typeof err.statusCode === 'number';
  const statusCode = isKnownError ? err.statusCode : 500;

  const message = isKnownError ? err.message : 'Unable to process request.';

  if (!isKnownError || statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  const body = {
    success: false,
    message,
  };

  if (isApiError && err.details) {
    body.details = err.details;
  }

  if (env.nodeEnv !== 'production' && !isKnownError) {
    body.debug = { stack: err.stack };
  }

  res.status(statusCode).json(body);
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found.' });
}

module.exports = { errorHandler, notFoundHandler };
