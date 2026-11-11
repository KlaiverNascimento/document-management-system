import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentsApi.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(size) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KiB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MiB`;
}

export function UploadComponent({ onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function selectFile(nextFile) {
    setError('');
    setSuccess('');
    if (!nextFile) {
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError('O arquivo excede o limite de 10 MiB.');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }
    setFile(nextFile);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) {
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');
    try {
      await uploadDocument(file);
      setSuccess(`${file.name} enviado.`);
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      await onUploaded();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="section-index"><span>01</span><i /></div>
      <div className="upload-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ADICIONAR AO ARQUIVO</p>
            <h2 id="upload-title">Novo documento</h2>
          </div>
          <span className="limit-note">MÁX. 10 MiB</span>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            className={`drop-zone${isDragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
          >
            <span className="upload-symbol" aria-hidden="true">↑</span>
            <span className="drop-copy">
              <strong>{file ? file.name : 'Arraste um arquivo ou escolha no dispositivo'}</strong>
              <small>{file ? formatFileSize(file.size) : 'Todos os formatos são aceitos'}</small>
            </span>
            <span className="browse-label">Procurar arquivo</span>
            <input
              ref={inputRef}
              type="file"
              onChange={(event) => selectFile(event.target.files[0])}
              aria-label="Selecionar documento"
            />
          </label>

          <div className="upload-actions">
            <p className={error ? 'form-message error-message' : 'form-message'} role={error ? 'alert' : 'status'}>
              {error || success}
            </p>
            <button className="primary-button" type="submit" disabled={!file || isUploading}>
              <span aria-hidden="true">{isUploading ? '…' : '↑'}</span>
              {isUploading ? 'Enviando' : 'Enviar documento'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
