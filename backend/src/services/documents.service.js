const crypto = require('node:crypto');

function createDocumentsService({ documentsRepository }) {
  return {
    createDocument({ file, owner }) {
      const document = {
        id: crypto.randomUUID(),
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        mimeType: file.mimetype || null,
      };

      try {
        return documentsRepository.save(document, file.filename);
      } catch (error) {
        try {
          documentsRepository.removeFile(file.path);
        } catch (cleanupError) {
          console.error('Não foi possível remover um upload sem metadados:', cleanupError);
        }
        throw error;
      }
    },

    listDocuments(owner) {
      return documentsRepository.listByOwner(owner);
    },

    getDownload(owner, id) {
      return documentsRepository.findFileByIdAndOwner(id, owner);
    },
  };
}

module.exports = createDocumentsService;
