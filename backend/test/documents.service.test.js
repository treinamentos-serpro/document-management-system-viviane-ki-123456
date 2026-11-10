const { test } = require('node:test');
const assert = require('node:assert/strict');

const createDocumentsService = require('../src/services/documents.service');

test('remove o arquivo enviado e propaga o erro quando salvar metadados falha', () => {
  const saveError = new Error('Falha ao salvar metadados');
  let removedFilePath;
  const documentsRepository = {
    save() {
      throw saveError;
    },
    removeFile(filePath) {
      removedFilePath = filePath;
    },
  };
  const documentsService = createDocumentsService({ documentsRepository });

  assert.throws(
    () => documentsService.createDocument({
      file: {
        originalname: 'nota.txt',
        size: 5,
        mimetype: 'text/plain',
        filename: 'stored-note',
        path: '/tmp/uploaded-note',
      },
      owner: 'alice',
    }),
    (error) => error === saveError,
  );
  assert.equal(removedFilePath, '/tmp/uploaded-note');
});