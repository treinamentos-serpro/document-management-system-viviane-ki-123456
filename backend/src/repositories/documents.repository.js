const fs = require('node:fs');
const path = require('node:path');

function createDocumentsRepository({ storageDir }) {
  const documentsById = new Map();

  return {
    save(document, storageName) {
      const record = { ...document, storageName };
      documentsById.set(record.id, record);
      return this.toPublicDocument(record);
    },

    listByOwner(owner) {
      return [...documentsById.values()]
        .filter((document) => document.owner === owner)
        .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
        .map((document) => this.toPublicDocument(document));
    },

    findFileByIdAndOwner(id, owner) {
      const document = documentsById.get(id);
      if (!document || document.owner !== owner) {
        return null;
      }

      const filePath = path.join(storageDir, document.storageName);
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch {
        return null;
      }

      return { ...this.toPublicDocument(document), filePath };
    },

    removeFile(filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    },

    toPublicDocument(document) {
      const { storageName, ...publicDocument } = document;
      return publicDocument;
    },
  };
}

module.exports = createDocumentsRepository;
