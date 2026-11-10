const express = require('express');
const requireUserId = require('../middleware/userIdMiddleware');

function createDocumentRoutes({ documentController, uploadMiddleware }) {
  const router = express.Router();

  router.post('/upload', requireUserId, uploadMiddleware, documentController.upload);
  router.get('/documents', requireUserId, documentController.list);
  router.get('/documents/:id/download', requireUserId, documentController.download);

  return router;
}

module.exports = createDocumentRoutes;