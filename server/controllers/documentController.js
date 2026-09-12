const documentService = require('../services/documentService');
const asyncHandler = require('../utils/asyncHandler');

const listForApplication = asyncHandler(async (req, res) => {
  const documents = await documentService.listDocumentsForApplication(req.params.id);
  res.status(200).json({ success: true, data: documents });
});

const list = asyncHandler(async (req, res) => {
  const result = await documentService.listDocuments(req.query);
  res.status(200).json({ success: true, data: result.documents, pagination: result.pagination });
});

const getDocument = asyncHandler(async (req, res) => {
  const document = await documentService.getDocumentById(req.params.id);
  res.status(200).json({ success: true, data: document });
});

const download = asyncHandler(async (req, res) => {
  const result = await documentService.getDownloadUrl(req.params.id);
  res.status(200).json({ success: true, data: result });
});

const verify = asyncHandler(async (req, res) => {
  const document = await documentService.verifyDocument(req.params.id, req.admin);
  res.status(200).json({ success: true, data: document });
});

const requestReupload = asyncHandler(async (req, res) => {
  const document = await documentService.requestReupload(req.params.id, req.body.reason, req.admin);
  res.status(200).json({ success: true, data: document });
});

module.exports = { list, listForApplication, getDocument, download, verify, requestReupload };
