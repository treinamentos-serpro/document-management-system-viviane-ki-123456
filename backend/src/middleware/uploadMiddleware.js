const fs = require('node:fs');
const crypto = require('node:crypto');
const multer = require('multer');

function createUploadMiddleware({ storageDir, maxFileSizeBytes }) {
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(storageDir, { recursive: true }, (error) => callback(error, storageDir));
    },
    filename(req, file, callback) {
      callback(null, crypto.randomUUID());
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxFileSizeBytes, files: 1 },
  }).single('file');
}

module.exports = createUploadMiddleware;