const schemeService = require('../services/schemeService');
const asyncHandler = require('../utils/asyncHandler');

const listSchemes = asyncHandler(async (req, res) => {
  const schemes = await schemeService.listSchemes({ activeOnly: req.query.activeOnly === 'true' });
  res.status(200).json({ success: true, data: schemes });
});

const getScheme = asyncHandler(async (req, res) => {
  const scheme = await schemeService.getSchemeById(req.params.id);
  res.status(200).json({ success: true, data: scheme });
});

const createScheme = asyncHandler(async (req, res) => {
  const scheme = await schemeService.createScheme(req.body, req.admin);
  res.status(201).json({ success: true, data: scheme });
});

const updateScheme = asyncHandler(async (req, res) => {
  const scheme = await schemeService.updateScheme(req.params.id, req.body, req.admin);
  res.status(200).json({ success: true, data: scheme });
});

const updateStatus = asyncHandler(async (req, res) => {
  const scheme = await schemeService.updateSchemeStatus(req.params.id, req.body.status, req.admin);
  res.status(200).json({ success: true, data: scheme });
});

module.exports = { listSchemes, getScheme, createScheme, updateScheme, updateStatus };
