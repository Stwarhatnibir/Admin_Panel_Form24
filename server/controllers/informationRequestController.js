const informationRequestService = require('../services/informationRequestService');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const request = await informationRequestService.createInformationRequest(req.params.id, req.body, req.admin);
  res.status(201).json({ success: true, data: request });
});

const list = asyncHandler(async (req, res) => {
  const requests = await informationRequestService.listInformationRequests(req.params.id);
  res.status(200).json({ success: true, data: requests });
});

module.exports = { create, list };
