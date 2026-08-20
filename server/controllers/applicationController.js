const applicationService = require('../services/applicationService');
const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');

const listApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.listApplications(req.query);
  res.status(200).json({
    success: true,
    data: result.applications,
    pagination: result.pagination,
    appliedSort: result.appliedSort,
  });
});

const getApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplicationById(req.params.id);
  res.status(200).json({ success: true, data: application });
});

const updateStatus = asyncHandler(async (req, res) => {
  const application = await applicationService.updateApplicationStatus(req.params.id, req.body.status, req.admin);
  res.status(200).json({ success: true, data: application });
});

const getActivity = asyncHandler(async (req, res) => {
  const logs = await auditService.listAuditLogs({ entityType: 'application', entityId: req.params.id, limit: 50 });
  res.status(200).json({ success: true, data: logs });
});

const listNotes = asyncHandler(async (req, res) => {
  const notes = await applicationService.listInternalNotes(req.params.id);
  res.status(200).json({ success: true, data: notes });
});

const addNote = asyncHandler(async (req, res) => {
  const note = await applicationService.addInternalNote(req.params.id, req.body.note, req.admin);
  res.status(201).json({ success: true, data: note });
});

module.exports = { listApplications, getApplication, updateStatus, getActivity, listNotes, addNote };
