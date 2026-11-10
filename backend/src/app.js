const express = require('express');
const config = require('./config');
const createDocumentRepository = require('./repositories/documentRepository');
const createDocumentService = require('./services/documentService');
const createDocumentController = require('./controllers/documentController');
const createDocumentRoutes = require('./routes/documentRoutes');
const createUploadMiddleware = require('./middleware/uploadMiddleware');

const app = express();
const documentRepository = createDocumentRepository({ storageDir: config.storageDir });
const documentService = createDocumentService({ documentRepository });
const documentController = createDocumentController({ documentService });
const uploadMiddleware = createUploadMiddleware({
  storageDir: config.storageDir,
  maxFileSizeBytes: config.maxFileSizeBytes,
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use(createDocumentRoutes({ documentController, uploadMiddleware }));
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
