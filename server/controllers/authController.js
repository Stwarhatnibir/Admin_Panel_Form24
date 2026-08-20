const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { token, admin } = await authService.login(req.body, { ip: req.ip });
  res.status(200).json({ success: true, data: { token, admin } });
});

// JWTs are stateless, so "logout" is primarily a client-side action
// (discarding the token). We still expose an endpoint so an audit trail
// entry can be recorded and so the client has a single, predictable place
// to call. If a token denylist is added later, it plugs in here.
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out.' });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { admin: req.admin } });
});

module.exports = { login, logout, me };
