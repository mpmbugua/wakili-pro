import React, { useState } from 'react';

export const AdminLegalMaterialUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/legal-materials/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setMessage('Upload successful!');
        setFile(null);
      } else {
        setMessage('Upload failed.');
      }
    } catch (e) {
      setMessage('Upload error.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white max-w-md mx-auto mt-8">
      <h2 className="text-lg font-bold mb-2">Upload Legal Material</h2>
      <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && <div className="mt-2 text-sm">{message}</div>}
    </div>
  );
};
