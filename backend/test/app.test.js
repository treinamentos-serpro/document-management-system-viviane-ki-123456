const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { rm } = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download preservam o documento', async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const content = 'Conteúdo de teste do documento';
  const form = new FormData();
  form.append('owner', 'viviane');
  form.append('file', new Blob([content], { type: 'text/plain' }), 'documento.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.match(document.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  context.after(() => rm(path.join(__dirname, '../storage', document.id), { force: true }));
  assert.equal(document.originalName, 'documento.txt');
  assert.equal(document.size, Buffer.byteLength(content));
  assert.equal(document.owner, 'viviane');
  assert.ok(!Number.isNaN(Date.parse(document.date)));

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  const documents = await listResponse.json();
  assert.ok(Array.isArray(documents));
  assert.ok(documents.some((item) => item.id === document.id));

  const downloadResponse = await fetch(`${baseUrl}/documents/${encodeURIComponent(document.id)}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment;.*documento\.txt/);
  assert.equal(await downloadResponse.text(), content);
});

test('upload sem arquivo é rejeitado', async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  const response = await fetch(`http://127.0.0.1:${server.address().port}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(response.status, 400);
});

test('listagem retorna uma lista de documentos', async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  const response = await fetch(`http://127.0.0.1:${server.address().port}/documents`);
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await response.json()));
});

test('download de documento inexistente retorna 404', async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  const response = await fetch(`http://127.0.0.1:${server.address().port}/documents/inexistente/download`);
  assert.equal(response.status, 404);
});
