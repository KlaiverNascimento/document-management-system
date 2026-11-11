const API_BASE = '/api';

async function getErrorMessage(response) {
  const payload = await response.json().catch(() => null);
  return payload?.error?.message || `A solicitação falhou (${response.status}).`;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response.json();
}

export async function listDocuments() {
  const result = await requestJson(`${API_BASE}/documents`);
  return result.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const result = await requestJson(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  return result.document;
}

function getDownloadFilename(contentDisposition, fallbackName) {
  const encodedName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encodedName) {
    try {
      return decodeURIComponent(encodedName);
    } catch {
      return fallbackName;
    }
  }

  const quotedName = contentDisposition?.match(/filename="((?:\\.|[^"])*)"/i)?.[1];
  return quotedName ? quotedName.replace(/\\(.)/g, '$1') : fallbackName;
}

export async function downloadDocument(id, fallbackName) {
  const response = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}/download`);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return {
    blob: await response.blob(),
    filename: getDownloadFilename(response.headers.get('content-disposition'), fallbackName),
  };
}
