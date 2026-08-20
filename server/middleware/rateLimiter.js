const rateLimit = require('express-rate-limit');

// General API rate limit - generous, mostly to blunt scripted abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Tighter limit specifically on login, to slow down credential stuffing /
// brute force attempts against admin accounts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

module.exports = { apiLimiter, loginLimiter };
