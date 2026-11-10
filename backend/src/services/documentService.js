const crypto = require('node:crypto');

function createDocumentService({ documentRepository }) {
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
        return documentRepository.save(document, file.filename);
      } catch (error) {
        try {
          documentRepository.removeFile(file.path);
        } catch (cleanupError) {
          console.error('Não foi possível remover um upload sem metadados:', cleanupError);
        }
        throw error;
      }
    },

    listDocuments(owner) {
      return documentRepository.listByOwner(owner);
    },

    getDownload(owner, id) {
      return documentRepository.findFileByIdAndOwner(id, owner);
    },
  };
}

module.exports = createDocumentService;