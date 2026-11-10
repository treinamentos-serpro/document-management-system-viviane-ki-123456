function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, isLoading, downloadingId, onDownload }) {
  if (isLoading) return <p className="list-state">Carregando documentos...</p>;
  if (!documents.length) {
    return (
      <div className="empty-state">
        <span className="empty-index" aria-hidden="true">00</span>
        <p>Nenhum documento neste espaço.</p>
      </div>
    );
  }

  return (
    <div className="document-table-wrap">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Enviado em</th>
            <th scope="col">Tamanho</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="document-name" data-label="Nome">
                <span className="file-mark" aria-hidden="true">{document.originalName.split('.').pop().slice(0, 3).toUpperCase()}</span>
                <span>{document.originalName}</span>
              </td>
              <td data-label="Enviado em">{formatDate(document.uploadedAt)}</td>
              <td data-label="Tamanho">{formatFileSize(document.size)}</td>
              <td className="document-action">
                <button
                  className="download-button"
                  type="button"
                  onClick={() => onDownload(document)}
                  disabled={downloadingId === document.id}
                  aria-label={`Baixar ${document.originalName}`}
                >
                  {downloadingId === document.id ? 'Baixando...' : 'Baixar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}