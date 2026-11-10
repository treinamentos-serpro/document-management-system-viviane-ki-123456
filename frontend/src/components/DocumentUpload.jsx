import { useState } from 'react';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUpload({ onUpload, isUploading, successMessage, errorMessage }) {
  const [file, setFile] = useState(null);

  async function submitUpload(event) {
    event.preventDefault();
    if (!file || isUploading) return;
    const form = event.currentTarget;
    try {
      await onUpload(file);
      setFile(null);
      form.reset();
    } catch {
      // A mensagem detalhada é exibida pelo componente pai.
    }
  }

  return (
    <form className="upload-panel" onSubmit={submitUpload}>
      <label className="file-picker" htmlFor="document-file">
        <span className="upload-symbol" aria-hidden="true">+</span>
        <span className="file-picker-copy">
          <strong>{file ? file.name : 'Escolher um documento'}</strong>
          <span>{file ? formatFileSize(file.size) : 'Selecione um arquivo do seu dispositivo'}</span>
        </span>
        <span className="file-picker-action">Procurar</span>
      </label>
      <input
        className="visually-hidden"
        id="document-file"
        type="file"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
        aria-describedby="upload-feedback"
      />
      <button className="primary-button" type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      <div className="upload-feedback" id="upload-feedback" aria-live="polite">
        {errorMessage && <span className="feedback-error" role="alert">{errorMessage}</span>}
        {successMessage && !errorMessage && <span className="feedback-success">{successMessage}</span>}
      </div>
    </form>
  );
}