import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  FileCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Stamp,
  Loader2
} from 'lucide-react';

interface PendingCertification {
  id: string;
  documentName: string;
  reviewType: string;
  clientName: string;
  submittedAt: string;
  deadline: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  documentUrl: string;
}

const DocumentCertificationPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [queue, setQueue] = useState<PendingCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [certifying, setCertifying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedDoc, setSelectedDoc] = useState<PendingCertification | null>(null);

  useEffect(() => {
    fetchCertificationQueue();
  }, []);

  const fetchCertificationQueue = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/certification/queue`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setQueue(data.data);
      }
    } catch (error) {
      console.error('Error fetching certification queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCertify = async (reviewId: string) => {
    if (!confirm('Are you sure you want to certify this document? This action cannot be undone.')) {
      return;
    }

    setCertifying(reviewId);
    setMessage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/certification/certify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewId,
          notes: notes[reviewId] || ''
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Document certified successfully! Certificate ID: ${data.data.certificateId}`
        });

        // Show download links
        if (data.data.certifiedDocumentUrl && data.data.certificateUrl) {
          const downloadMessage = `
            Certification complete!
            
            Downloads:
            - Certified Document: ${import.meta.env.VITE_API_URL}${data.data.certifiedDocumentUrl}
            - Certificate of Authenticity: ${import.meta.env.VITE_API_URL}${data.data.certificateUrl}
          `;
          alert(downloadMessage);
        }

        // Refresh queue
        fetchCertificationQueue();
        setSelectedDoc(null);
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to certify document'
        });
      }
    } catch (error) {
      console.error('Error certifying document:', error);
      setMessage({
        type: 'error',
        text: 'Failed to certify document'
      });
    } finally {
      setCertifying(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return <AlertCircle className="h-4 w-4" />;
      case 'MEDIUM':
        return <Clock className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Loading certification queue...</p>
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
              <h1 className="text-2xl font-semibold text-slate-900">Document Certification</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                {queue.length} Pending
              </span>
            </div>
            <Link
              to="/lawyer/signature-setup"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Stamp className="h-4 w-4" />
              <span>Signature Setup</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {queue.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <FileCheck className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending certifications</h3>
            <p className="text-sm text-slate-600">
              All documents have been certified or there are no documents assigned to you.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Queue List */}
            <div className="lg:col-span-2 space-y-4">
              {queue.map((doc) => (
                <div
                  key={doc.id}
                  className={`bg-white rounded-lg border-2 p-6 transition-all cursor-pointer ${
                    selectedDoc?.id === doc.id
                      ? 'border-blue-500 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{doc.documentName}</h3>
                      <p className="text-sm text-slate-600">{doc.reviewType}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 ${getUrgencyColor(doc.urgency)}`}>
                      {getUrgencyIcon(doc.urgency)}
                      <span>{doc.urgency}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-slate-600">
                      <User className="h-4 w-4 mr-2" />
                      <span>{doc.clientName}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Due: {new Date(doc.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={`${import.meta.env.VITE_API_URL}${doc.documentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-200 text-center flex items-center justify-center space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="h-4 w-4" />
                      <span>View Document</span>
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoc(doc);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700"
                    >
                      Review & Certify
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Certification Panel */}
            <div className="lg:col-span-1">
              {selectedDoc ? (
                <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Certify Document</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">
                        {selectedDoc.documentName}
                      </h3>
                      <p className="text-xs text-slate-600">{selectedDoc.reviewType}</p>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Certification Notes (Optional)
                      </label>
                      <textarea
                        value={notes[selectedDoc.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [selectedDoc.id]: e.target.value })}
                        placeholder="Add any notes about this certification..."
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800">
                        <strong>Before certifying:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Review the document thoroughly</li>
                          <li>Verify all information is accurate</li>
                          <li>Ensure you have authority to certify</li>
                          <li>Check your digital signature is configured</li>
                        </ul>
                      </p>
                    </div>

                    <button
                      onClick={() => handleCertify(selectedDoc.id)}
                      disabled={certifying === selectedDoc.id}
                      className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {certifying === selectedDoc.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Certifying...</span>
                        </>
                      ) : (
                        <>
                          <Stamp className="h-4 w-4" />
                          <span>Certify Document</span>
                        </>
                      )}
                    </button>

                    <p className="text-xs text-slate-500 text-center">
                      This will generate a certified PDF with your digital signature and stamp, plus a Certificate of Authenticity with QR code verification.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
                  <FileCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">
                    Select a document from the list to begin certification
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCertificationPage;
