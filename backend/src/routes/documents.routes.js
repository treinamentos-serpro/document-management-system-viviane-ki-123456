const express = require('express');
const requireUserId = require('../middleware/userIdMiddleware');

function createDocumentsRoutes({ documentsController, uploadMiddleware }) {
  const router = express.Router();

  router.post('/upload', requireUserId, uploadMiddleware, documentsController.upload);
  router.get('/documents', requireUserId, documentsController.list);
  router.get('/documents/:id/download', requireUserId, documentsController.download);

  return router;
}

module.exports = createDocumentsRoutes;
