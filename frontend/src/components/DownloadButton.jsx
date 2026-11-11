import { useState } from 'react';
import { downloadDocument } from '../services/documentsApi.js';

export function DownloadButton({ documentId, originalName, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const { blob, filename } = await downloadDocument(documentId, originalName);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button className="download-button" type="button" onClick={handleDownload} disabled={isDownloading}>
      <span aria-hidden="true">↓</span>
      <span>{isDownloading ? 'Baixando' : 'Baixar'}</span>
    </button>
  );
}
