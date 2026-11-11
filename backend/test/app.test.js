const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

async function startTestServer(t) {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const server = app.createApp({ storageDir }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDir, { recursive: true, force: true });
  });

  return { baseUrl: `http://127.0.0.1:${server.address().port}`, storageDir };
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa um documento', async (t) => {
  const { baseUrl, storageDir } = await startTestServer(t);
  const form = new FormData();
  form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), '../relatorio.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.strictEqual(document.originalName, 'relatorio.txt');
  assert.strictEqual(document.size, 17);
  assert.strictEqual(document.owner, 'default');
  assert.ok(document.id);
  assert.ok(document.uploadedAt);

  const storedFiles = await fs.readdir(storageDir);
  assert.deepStrictEqual(storedFiles, [document.id]);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  assert.deepStrictEqual(await listResponse.json(), { documents: [document] });

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.match(downloadResponse.headers.get('content-disposition'), /filename="relatorio\.txt"/);
  assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');
});

test('retorna erros para arquivo ausente e documento inexistente', async (t) => {
  const { baseUrl } = await startTestServer(t);

  const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST' });
  assert.strictEqual(uploadResponse.status, 400);
  assert.strictEqual((await uploadResponse.json()).error.code, 'FILE_REQUIRED');

  const downloadResponse = await fetch(`${baseUrl}/documents/unknown/download`);
  assert.strictEqual(downloadResponse.status, 404);
  assert.strictEqual((await downloadResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('rejeita arquivos acima de 10 MiB', async (t) => {
  const { baseUrl } = await startTestServer(t);
  const form = new FormData();
  form.append('file', new Blob([Buffer.alloc(10 * 1024 * 1024 + 1)]), 'large.bin');

  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(response.status, 413);
  assert.strictEqual((await response.json()).error.code, 'FILE_TOO_LARGE');
});

test('rejeita campos multipart extras', async (t) => {
  const { baseUrl, storageDir } = await startTestServer(t);
  const form = new FormData();
  form.append('file', new Blob(['conteudo']), 'documento.txt');
  form.append('note', 'campo não permitido');

  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(response.status, 400);
  assert.strictEqual((await response.json()).error.code, 'INVALID_UPLOAD');
  assert.deepStrictEqual(await fs.readdir(storageDir), []);
});
