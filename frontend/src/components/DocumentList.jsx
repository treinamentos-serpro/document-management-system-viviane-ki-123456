import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../utils/files.js';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, isLoading, onDownload }) {
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
                <DownloadButton document={document} onDownload={onDownload} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}