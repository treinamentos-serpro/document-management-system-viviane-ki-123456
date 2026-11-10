import { useState } from 'react';
import { formatFileSize } from '../utils/files.js';

export default function UploadComponent({ onUpload }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  async function submitUpload(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    const form = event.currentTarget;
    setIsUploading(true);
    setFeedback({ type: '', message: '' });
    try {
      await onUpload(file);
      setFeedback({ type: 'success', message: 'Documento enviado.' });
      setFile(null);
      form.reset();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsUploading(false);
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
        {feedback.type === 'error' && <span className="feedback-error" role="alert">{feedback.message}</span>}
        {feedback.type === 'success' && <span className="feedback-success">{feedback.message}</span>}
      </div>
    </form>
  );
}
