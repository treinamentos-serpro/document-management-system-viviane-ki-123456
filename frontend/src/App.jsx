import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/apiClient.js';
import { saveBlobAsFile } from './utils/files.js';
import './App.css';

const DEFAULT_USER_ID = 'usuario-demo';

function getSavedUserId() {
  return window.localStorage.getItem('dms-user-id') || DEFAULT_USER_ID;
}

export default function App() {
  const [userId, setUserId] = useState(getSavedUserId);
  const [draftUserId, setDraftUserId] = useState(userId);
  const [documents, setDocuments] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setLoadError('');
    listDocuments(userId)
      .then((result) => {
        if (isCurrent) setDocuments(result);
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [userId, refreshKey]);

  function applyUser(event) {
    event.preventDefault();
    const nextUserId = draftUserId.trim();
    if (!nextUserId) return;
    window.localStorage.setItem('dms-user-id', nextUserId);
    setDraftUserId(nextUserId);
    setUserId(nextUserId);
  }

  async function handleUpload(file) {
    await uploadDocument(userId, file);
    setRefreshKey((value) => value + 1);
  }

  async function handleDownload(document) {
    setLoadError('');
    try {
      saveBlobAsFile(await downloadDocument(userId, document), document.originalName);
    } catch (error) {
      setLoadError(error.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">arquivo<span> / </span>local</span>
        </a>
        <form className="identity-form" onSubmit={applyUser}>
          <label htmlFor="user-id">Identidade</label>
          <input
            id="user-id"
            value={draftUserId}
            onChange={(event) => setDraftUserId(event.target.value)}
            maxLength={100}
            autoComplete="off"
          />
          <button type="submit" disabled={!draftUserId.trim() || draftUserId.trim() === userId}>
            Aplicar
          </button>
        </form>
      </header>

      <main className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">ESPAÇO DE TRABALHO <span>·</span> {userId}</p>
            <h1 id="page-title">Documentos</h1>
          </div>
          <p className="storage-note"><span className="status-dot" /> Armazenamento local</p>
        </section>

        <UploadComponent onUpload={handleUpload} />

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BIBLIOTECA</p>
              <h2 id="documents-title">Arquivos enviados</h2>
            </div>
            <span className="document-count" aria-label={`${documents.length} documentos`}>
              {documents.length.toString().padStart(2, '0')}
            </span>
          </div>
          {loadError && <p className="notice notice-error" role="alert">{loadError}</p>}
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDownload={handleDownload}
          />
        </section>

        <footer className="workspace-footer">
          <span>DMS</span>
          <span>Arquivos no dispositivo · Metadados em memória</span>
        </footer>
      </main>
    </div>
  );
}
