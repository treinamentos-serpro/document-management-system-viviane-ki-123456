const API_BASE = '/api';
const FALLBACK_ERROR_MESSAGE = 'Não foi possível concluir a solicitação.';

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    return body.error?.message || FALLBACK_ERROR_MESSAGE;
  } catch {
    return FALLBACK_ERROR_MESSAGE;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response;
}

function userHeaders(userId) {
  return { 'X-User-Id': userId };
}

export async function listDocuments(userId) {
  const response = await request('/documents', { headers: userHeaders(userId) });
  return response.json();
}

export async function uploadDocument(userId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await request('/upload', {
    method: 'POST',
    headers: userHeaders(userId),
    body: formData,
  });
  return response.json();
}

export async function downloadDocument(userId, document) {
  const path = `/documents/${encodeURIComponent(document.id)}/download`;
  const response = await request(path, { headers: userHeaders(userId) });
  return response.blob();
}
