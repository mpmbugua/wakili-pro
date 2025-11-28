import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { Upload, Trash2, Save, CheckCircle, AlertCircle, FileText, Stamp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface LawyerLetterhead {
  signatureUrl?: string;
  stampUrl?: string;
  firmName: string;
  firmAddress?: string;
  firmPhone?: string;
  firmEmail?: string;
  licenseNumber: string;
  certificatePrefix: string;
  isApproved: boolean;
}

const LawyerSignatureSetup: React.FC = () => {
  const { accessToken } = useAuthStore();
  
  const signatureCanvasRef = useRef<any>(null);
  const [letterhead, setLetterhead] = useState<LawyerLetterhead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state
  const [firmName, setFirmName] = useState('');
  const [firmAddress, setFirmAddress] = useState('');
  const [firmPhone, setFirmPhone] = useState('');
  const [firmEmail, setFirmEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [certificatePrefix, setCertificatePrefix] = useState('WP');
  
  // Signature/stamp upload state
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchLetterhead();
  }, []);

  const fetchLetterhead = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/lawyer/letterhead`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setLetterhead(data.data);
        setFirmName(data.data.firmName || '');
        setFirmAddress(data.data.firmAddress || '');
        setFirmPhone(data.data.firmPhone || '');
        setFirmEmail(data.data.firmEmail || '');
        setLicenseNumber(data.data.licenseNumber || '');
        setCertificatePrefix(data.data.certificatePrefix || 'WP');
        if (data.data.stampUrl) {
          setStampPreview(`${import.meta.env.VITE_API_URL}${data.data.stampUrl}`);
        }
      }
    } catch (error) {
      console.error('Error fetching letterhead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
      setMessage({ type: 'error', text: 'Please draw your signature first' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Convert canvas to blob
      const canvas = signatureCanvasRef.current.getCanvas();
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob: Blob | null) => resolve(blob!), 'image/png');
      });

      // Create form data
      const formData = new FormData();
      formData.append('signature', blob, 'signature.png');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/lawyer/letterhead/signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Signature saved successfully!' });
        fetchLetterhead();
        signatureCanvasRef.current?.clear();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save signature' });
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      setMessage({ type: 'error', text: 'Failed to save signature' });
    } finally {
      setSaving(false);
    }
  };

  const handleStampFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }
      setStampFile(file);
      setStampPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadStamp = async () => {
    if (!stampFile) {
      setMessage({ type: 'error', text: 'Please select a stamp image first' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('stamp', stampFile);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/lawyer/letterhead/stamp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Stamp uploaded successfully!' });
        fetchLetterhead();
        setStampFile(null);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to upload stamp' });
      }
    } catch (error) {
      console.error('Error uploading stamp:', error);
      setMessage({ type: 'error', text: 'Failed to upload stamp' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!firmName || !licenseNumber) {
      setMessage({ type: 'error', text: 'Firm name and license number are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/lawyer/letterhead/details`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firmName,
          firmAddress,
          firmPhone,
          firmEmail,
          licenseNumber,
          certificatePrefix
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Details saved successfully!' });
        fetchLetterhead();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save details' });
      }
    } catch (error) {
      console.error('Error saving details:', error);
      setMessage({ type: 'error', text: 'Failed to save details' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSignature = async () => {
    if (!confirm('Are you sure you want to delete your signature?')) return;

    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/lawyer/letterhead/signature`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Signature deleted successfully' });
        fetchLetterhead();
      }
    } catch (error) {
      console.error('Error deleting signature:', error);
      setMessage({ type: 'error', text: 'Failed to delete signature' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStamp = async () => {
    if (!confirm('Are you sure you want to delete your stamp?')) return;

    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/lawyer/letterhead/stamp`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Stamp deleted successfully' });
        setStampPreview(null);
        fetchLetterhead();
      }
    } catch (error) {
      console.error('Error deleting stamp:', error);
      setMessage({ type: 'error', text: 'Failed to delete stamp' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-sm text-slate-600 hover:text-blue-600">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-semibold text-slate-900">Digital Signature Setup</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Digital Signature */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Digital Signature</h2>
            </div>

            {letterhead?.signatureUrl ? (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <img
                    src={`${import.meta.env.VITE_API_URL}${letterhead.signatureUrl}`}
                    alt="Current Signature"
                    className="max-w-full h-auto"
                  />
                </div>
                <button
                  onClick={handleDeleteSignature}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Signature</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Draw your signature below. This will be used to digitally sign certified documents.
                </p>

                <div className="border-2 border-slate-300 rounded-lg bg-white">
                  {/* @ts-ignore - react-signature-canvas has React 18 compatibility issues */}
                  <SignatureCanvas
                    ref={signatureCanvasRef}
                    canvasProps={{
                      className: 'w-full h-48',
                      style: { touchAction: 'none' }
                    }}
                    backgroundColor="#ffffff"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => signatureCanvasRef.current?.clear()}
                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-md hover:bg-slate-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSaveSignature}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Signature'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Official Stamp */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Stamp className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">Official Stamp</h2>
            </div>

            {letterhead?.stampUrl ? (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex justify-center">
                  <img
                    src={`${import.meta.env.VITE_API_URL}${letterhead.stampUrl}`}
                    alt="Current Stamp"
                    className="max-w-[200px] h-auto"
                  />
                </div>
                <button
                  onClick={handleDeleteStamp}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Stamp</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Upload your official stamp image (PNG or JPG, max 5MB).
                </p>

                {stampPreview && (
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex justify-center">
                    <img
                      src={stampPreview}
                      alt="Stamp Preview"
                      className="max-w-[200px] h-auto"
                    />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleStampFileSelect}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />

                <button
                  onClick={handleUploadStamp}
                  disabled={!stampFile || saving}
                  className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>{saving ? 'Uploading...' : 'Upload Stamp'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Firm Details */}
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Firm Details</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Firm Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                License Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Firm Address
              </label>
              <input
                type="text"
                value={firmAddress}
                onChange={(e) => setFirmAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Firm Phone
              </label>
              <input
                type="text"
                value={firmPhone}
                onChange={(e) => setFirmPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Firm Email
              </label>
              <input
                type="email"
                value={firmEmail}
                onChange={(e) => setFirmEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Certificate Prefix
              </label>
              <input
                type="text"
                value={certificatePrefix}
                onChange={(e) => setCertificatePrefix(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="WP"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                2-4 letters for certificate IDs (e.g., WP-2024-ABC123)
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveDetails}
            disabled={saving}
            className="mt-4 px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Details'}
          </button>
        </div>

        {/* Setup Status */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Setup Status</h3>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex items-center">
              {letterhead?.signatureUrl ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
              )}
              <span>Digital Signature: {letterhead?.signatureUrl ? 'Configured' : 'Required'}</span>
            </div>
            <div className="flex items-center">
              {letterhead?.stampUrl ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
              )}
              <span>Official Stamp: {letterhead?.stampUrl ? 'Configured' : 'Optional'}</span>
            </div>
            <div className="flex items-center">
              {firmName && licenseNumber ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
              )}
              <span>Firm Details: {firmName && licenseNumber ? 'Configured' : 'Required'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerSignatureSetup;
