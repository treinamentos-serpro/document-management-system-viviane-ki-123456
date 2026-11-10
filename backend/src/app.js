const express = require('express');
const config = require('./config');
const createDocumentsRepository = require('./repositories/documents.repository');
const createDocumentsService = require('./services/documents.service');
const createDocumentsController = require('./controllers/documents.controller');
const createDocumentsRoutes = require('./routes/documents.routes');
const createUploadMiddleware = require('./middleware/uploadMiddleware');

const app = express();
const documentsRepository = createDocumentsRepository({ storageDir: config.storageDir });
const documentsService = createDocumentsService({ documentsRepository });
const documentsController = createDocumentsController({ documentsService });
const uploadMiddleware = createUploadMiddleware({
  storageDir: config.storageDir,
  maxFileSizeBytes: config.maxFileSizeBytes,
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use(createDocumentsRoutes({ documentsController, uploadMiddleware }));
app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Recurso não encontrado.' },
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: { code: 'FILE_TOO_LARGE', message: 'O arquivo excede o tamanho máximo permitido.' },
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: { code: 'INVALID_FILE', message: 'Envie somente um arquivo no campo "file".' },
    });
  }

  console.error('Erro inesperado na API:', error);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro interno.' },
  });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`DMS backend ouvindo na porta ${config.port}`);
  });
}

module.exports = app;
