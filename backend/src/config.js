const path = require('node:path');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const configuredMaxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES);

module.exports = {
  port: Number(process.env.PORT) || 3000,
  storageDir: path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '..', 'storage')),
  maxFileSizeBytes:
    Number.isSafeInteger(configuredMaxFileSize) && configuredMaxFileSize > 0
      ? configuredMaxFileSize
      : DEFAULT_MAX_FILE_SIZE_BYTES,
};