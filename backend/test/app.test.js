const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_FILE_SIZE_BYTES = '64';
const app = require('../src/app');

test('API de documentos faz upload, lista e baixa somente para o proprietário', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    fs.rmSync(storageDir, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const upload = async (owner, filename, contents) => {
    const form = new FormData();
    form.append('file', new Blob([contents], { type: 'text/plain' }), filename);
    return fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': owner },
      body: form,
    });
  };

  assert.deepEqual(await (await fetch(`${baseUrl}/health`)).json(), { status: 'ok' });

  const missingOwner = await upload('', 'note.txt', 'hello');
  assert.equal(missingOwner.status, 400);

  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: new FormData(),
  });
  assert.equal(missingFile.status, 400);

  const createdResponse = await upload('alice', 'nota.txt', 'conteudo do documento');
  assert.equal(createdResponse.status, 201);
  const createdDocument = await createdResponse.json();
  assert.equal(createdDocument.originalName, 'nota.txt');
  assert.equal(createdDocument.owner, 'alice');
  assert.equal(createdDocument.size, Buffer.byteLength('conteudo do documento'));
  assert.ok(createdDocument.id);
  assert.equal('storageName' in createdDocument, false);

  const aliceDocuments = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.equal(aliceDocuments.status, 200);
  assert.deepEqual((await aliceDocuments.json()).map(({ id }) => id), [createdDocument.id]);

  const bobDocuments = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'bob' },
  });
  assert.deepEqual(await bobDocuments.json(), []);

  const download = await fetch(`${baseUrl}/documents/${createdDocument.id}/download`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.equal(download.status, 200);
  assert.equal(await download.text(), 'conteudo do documento');
  assert.match(download.headers.get('content-disposition'), /attachment/);

  const forbiddenDownload = await fetch(`${baseUrl}/documents/${createdDocument.id}/download`, {
    headers: { 'X-User-Id': 'bob' },
  });
  assert.equal(forbiddenDownload.status, 404);

  const oversizedUpload = await upload('alice', 'grande.txt', 'x'.repeat(65));
  assert.equal(oversizedUpload.status, 413);
});
