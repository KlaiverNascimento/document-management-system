import { DownloadButton } from './DownloadButton.jsx';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(0)} KiB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MiB`;
}

export function DocumentList({ documents, isLoading, onRefresh, onError }) {
  return (
    <section className="documents-section" aria-labelledby="documents-title">
      <div className="section-index"><span>02</span><i /></div>
      <div className="documents-content">
        <div className="section-heading list-heading">
          <div>
            <p className="eyebrow">BIBLIOTECA</p>
            <h2 id="documents-title">Documentos</h2>
          </div>
          <button className="refresh-button" type="button" onClick={onRefresh} disabled={isLoading} title="Atualizar lista">
            <span aria-hidden="true">↻</span>
            Atualizar
          </button>
        </div>

        {isLoading && documents.length === 0 ? (
          <div className="list-state" role="status">Carregando documentos<span className="loading-dots">...</span></div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <span className="empty-mark" aria-hidden="true">—</span>
            <p>Nenhum documento por aqui ainda.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="document-table">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Adicionado</th>
                  <th scope="col">Tamanho</th>
                  <th scope="col"><span className="visually-hidden">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <div className="file-cell">
                        <span className="file-mark" aria-hidden="true">DOC</span>
                        <span className="file-name" title={document.originalName}>{document.originalName}</span>
                      </div>
                    </td>
                    <td className="date-cell">{formatDate(document.uploadedAt)}</td>
                    <td className="size-cell">{formatFileSize(document.size)}</td>
                    <td className="action-cell">
                      <DownloadButton
                        documentId={document.id}
                        originalName={document.originalName}
                        onError={onError}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
