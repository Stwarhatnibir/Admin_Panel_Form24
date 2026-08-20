const schemeService = require('../services/schemeService');
const asyncHandler = require('../utils/asyncHandler');

const listSchemes = asyncHandler(async (req, res) => {
  const schemes = await schemeService.listSchemes({ activeOnly: req.query.activeOnly === 'true' });
  res.status(200).json({ success: true, data: schemes });
});

module.exports = { listSchemes };
