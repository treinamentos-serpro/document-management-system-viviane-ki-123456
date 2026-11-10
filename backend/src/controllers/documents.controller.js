function createDocumentsController({ documentsService }) {
  return {
    upload(req, res, next) {
      if (!req.file) {
        return res.status(400).json({
          error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo "file".' },
        });
      }

      try {
        const document = documentsService.createDocument({ file: req.file, owner: req.ownerId });
        return res.status(201).json(document);
      } catch (error) {
        return next(error);
      }
    },

    list(req, res, next) {
      try {
        return res.json(documentsService.listDocuments(req.ownerId));
      } catch (error) {
        return next(error);
      }
    },

    download(req, res, next) {
      try {
        const document = documentsService.getDownload(req.ownerId, req.params.id);
        if (!document) {
          return res.status(404).json({
            error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
          });
        }

        return res.download(document.filePath, document.originalName, (error) => {
          if (error && !res.headersSent) {
            next(error);
          }
        });
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = createDocumentsController;
