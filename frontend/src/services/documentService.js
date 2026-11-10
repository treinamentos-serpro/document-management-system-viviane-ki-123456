const API_BASE = '/api';

async function readError(response) {
  try {
    const body = await response.json();
    return body.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function ensureSuccess(response) {
  if (!response.ok) throw new Error(await readError(response));
  return response;
}

export async function listDocuments(userId) {
  const response = await fetch(`${API_BASE}/documents`, {
    headers: { 'X-User-Id': userId },
  });
  await ensureSuccess(response);
  return response.json();
}

export async function uploadDocument(userId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: formData,
  });
  await ensureSuccess(response);
  return response.json();
}

export async function downloadDocument(userId, document) {
  const response = await fetch(`${API_BASE}/documents/${encodeURIComponent(document.id)}/download`, {
    headers: { 'X-User-Id': userId },
  });
  await ensureSuccess(response);
  const objectUrl = URL.createObjectURL(await response.blob());
  const anchor = window.document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = document.originalName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}