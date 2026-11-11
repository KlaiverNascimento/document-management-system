import { useEffect, useState } from 'react';
import { DocumentList } from './components/DocumentList.jsx';
import { UploadComponent } from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentsApi.js';
import './App.css';

async function loadDocuments(setDocuments, setListError, setLoading) {
  setLoading(true);
  setListError('');
  try {
    setDocuments(await listDocuments());
  } catch (requestError) {
    setListError(requestError.message);
  } finally {
    setLoading(false);
  }
}

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    void loadDocuments(setDocuments, setListError, setIsLoading);
  }, []);

  function refreshDocuments() {
    return loadDocuments(setDocuments, setListError, setIsLoading);
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Documentos, início">
          <span className="wordmark-mark" aria-hidden="true">D/</span>
          <span>arquivo<span className="wordmark-dot">.</span></span>
        </a>
        <span className="storage-status"><span aria-hidden="true" /> Armazenamento local</span>
      </header>

      <section className="page-heading" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">ESPAÇO DE TRABALHO <span> / </span> DOCUMENTOS</p>
          <h1 id="page-title">Seus arquivos,<br />em ordem.</h1>
        </div>
        <div className="document-total" aria-live="polite">
          <strong>{documents.length.toString().padStart(2, '0')}</strong>
          <span>{documents.length === 1 ? 'documento' : 'documentos'}</span>
        </div>
      </section>

      <UploadComponent onUploaded={refreshDocuments} />

      {actionError && <p className="global-error" role="alert">{actionError}</p>}

      <DocumentList
        documents={documents}
        isLoading={isLoading}
        error={listError}
        onRefresh={refreshDocuments}
        onError={setActionError}
      />

      <footer className="page-footer">
        <span>DOCUMENT MANAGEMENT SYSTEM</span>
        <span>01 <i /> LOCAL</span>
      </footer>
    </main>
  );
}
