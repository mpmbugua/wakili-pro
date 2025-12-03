import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Eye, Trash2, Upload, Search, Filter, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../lib/axios';

interface Document {
  id: string;
  title: string;
  type: 'CONTRACT' | 'AGREEMENT' | 'CERTIFICATE' | 'COURT_FILING' | 'OTHER';
  category: string;
  uploadedAt: string;
  size: number;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'REVIEWED' | 'FINALIZED';
  lawyerName?: string;
  fileUrl?: string;
}

export const DocumentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<Document['type']>('CONTRACT');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchDocuments();

      // Check for pending review request after login
      const pendingReview = sessionStorage.getItem('pendingReviewRequest');
      console.log('DocumentsPage mounted, checking pending review:', { 
        hasPendingReview: !!pendingReview, 
        user: !!user 
      });
      
      if (pendingReview) {
        try {
          const { documentId, documentTitle } = JSON.parse(pendingReview);
          console.log('Processing pending review request:', { documentId, documentTitle });
          sessionStorage.removeItem('pendingReviewRequest');
          
          // Small delay to ensure documents are loaded
          setTimeout(() => {
            console.log('Triggering handleRequestReview');
            handleRequestReview(documentId, documentTitle);
          }, 100);
        } catch (error) {
          console.error('Error processing pending review request:', error);
          sessionStorage.removeItem('pendingReviewRequest');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('[DocumentsPage] Fetching documents...');
      
      // Check if user is authenticated
      const authStorage = localStorage.getItem('wakili-auth-storage');
      if (!authStorage) {
        console.error('[DocumentsPage] No auth storage found');
        alert('Please log in to view your documents.');
        navigate('/');
        return;
      }

      const response = await axiosInstance.get('/user-documents');
      
      console.log('[DocumentsPage] Documents response:', response.data);
      
      if (response.data.success) {
        setDocuments(response.data.data);
        console.log('[DocumentsPage] Loaded', response.data.data.length, 'documents');
      } else {
        console.warn('[DocumentsPage] API returned success=false');
        setDocuments([]);
      }
    } catch (error: any) {
      console.error('[DocumentsPage] Error fetching documents:', error);
      console.error('[DocumentsPage] Error response:', error.response?.data);
      console.error('[DocumentsPage] Error status:', error.response?.status);
      
      // Don't show alert on 401 (axios will handle redirect)
      if (error.response?.status !== 401) {
        alert(`Failed to load documents: ${error.response?.data?.message || error.message}`);
      }
      
      // Set empty array instead of mock data to avoid UUID issues
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    const badges = {
      DRAFT: { color: 'bg-gray-100 text-gray-700', text: 'Draft' },
      UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-700', text: 'Under Review' },
      REVIEWED: { color: 'bg-blue-100 text-blue-700', text: 'Reviewed' },
      FINALIZED: { color: 'bg-green-100 text-green-700', text: 'Finalized' },
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badges[status].color}`}>
        {badges[status].text}
      </span>
    );
  };

  const getTypeIcon = (type: Document['type']) => {
    const colors = {
      CONTRACT: 'text-blue-600',
      AGREEMENT: 'text-purple-600',
      CERTIFICATE: 'text-green-600',
      COURT_FILING: 'text-red-600',
      OTHER: 'text-gray-600'
    };
    return <FileText className={`h-10 w-10 ${colors[type] || colors.OTHER}`} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Auto-fill title from filename
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setUploadTitle(fileName);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert('Please select a file and provide a title');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('type', uploadType);
      if (uploadCategory) {
        formData.append('category', uploadCategory);
      }

      const response = await axiosInstance.post('/user-documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[DocumentsPage] Upload response:', response.data);

      if (response.data.success) {
        console.log('[DocumentsPage] Document uploaded successfully, ID:', response.data.data?.id);
        
        // Refresh documents list
        await fetchDocuments();
        
        // Reset form
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadType('CONTRACT');
        setUploadCategory('');
        
        alert('Document uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      alert(error.response?.data?.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRequestReview = async (documentId: string, documentTitle: string) => {
    // Check if user is authenticated
    if (!user) {
      // Store pending review request in sessionStorage
      sessionStorage.setItem('pendingReviewRequest', JSON.stringify({
        documentId,
        documentTitle
      }));
      // Redirect to login with return path
      navigate('/login', { 
        state: { 
          from: { pathname: '/documents' },
          message: 'Please log in to request document review'
        }
      });
      return;
    }

    // Navigate to dedicated review request page
    navigate(`/documents/${documentId}/request-review`, {
      state: {
        document: { id: documentId, title: documentTitle }
      }
    });
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/user-documents/${documentId}`);
      if (response.data.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.id) {
      alert('Document ID not available');
      return;
    }

    try {
      // Use backend proxy to download file (avoids CORS issues)
      const response = await axiosInstance.get(`/user-documents/${doc.id}/download`, {
        responseType: 'blob',
      });

      // Create a blob URL from the response
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = `${doc.title}.pdf`;
      
      // Append to body, click, and remove
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleView = (doc: Document) => {
    if (!doc.id) {
      alert('Document ID not available');
      return;
    }
    // Use backend proxy to view file in new tab
    const viewUrl = `${axiosInstance.defaults.baseURL}/user-documents/${doc.id}/download`;
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Documents</h1>
          <p className="text-slate-600 mt-2">Manage your legal documents and templates</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/document-reviews')}
            className="inline-flex items-center px-5 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-semibold shadow-md"
          >
            <FileText className="h-5 w-5 mr-2" />
            View Reviews
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Documents for Review
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="CONTRACT">Contracts</option>
            <option value="AGREEMENT">Agreements</option>
            <option value="CERTIFICATE">Certificates</option>
            <option value="COURT_FILING">Court Filings</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No documents found</h3>
          <p className="text-slate-600 mb-6">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Upload your first document to get started'}
          </p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Documents for Review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bg-white rounded-xl border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
              <div className="flex items-center p-6 gap-6">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm">
                    {getTypeIcon(document.type)}
                  </div>
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{document.title}</h3>
                      <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">{document.category}</p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(document.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-500">Uploaded:</span>
                      <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-500">Size:</span>
                      <span className="font-semibold">{formatFileSize(document.size)}</span>
                    </div>
                    {document.lawyerName && (
                      <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg">
                        <span className="font-medium text-slate-500">Reviewed by:</span>
                        <span className="font-semibold text-green-700">{document.lawyerName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleView(document);
                    }}
                    className="px-4 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all hover:scale-105 flex items-center gap-2 shadow-sm" 
                    title="View Document"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">View</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDownload(document);
                    }}
                    className="px-4 py-2.5 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all hover:scale-105 flex items-center gap-2 shadow-sm" 
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Download</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(document.id);
                    }}
                    className="px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all hover:scale-105 flex items-center gap-2 shadow-sm" 
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                  {document.status === 'DRAFT' && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRequestReview(document.id, document.title);
                      }}
                      className="px-4 py-2.5 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all hover:scale-105 flex items-center gap-2 shadow-sm font-medium"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Request Review</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Upload Documents for Review</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadTitle('');
                  setUploadType('CONTRACT');
                  setUploadCategory('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-6 w-6 text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
                >
                  {uploadFile ? (
                    <div>
                      <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-900">{uploadFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatFileSize(uploadFile.size)}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          setUploadTitle('');
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-900">Click to upload document</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, TXT (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter document title"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document Type *
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as Document['type'])}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CONTRACT">Contract</option>
                  <option value="AGREEMENT">Agreement</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="COURT_FILING">Court Filing</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  placeholder="e.g., Employment, Real Estate, Corporate"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadTitle('');
                  setUploadType('CONTRACT');
                  setUploadCategory('');
                }}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadTitle.trim() || uploading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {uploading ? 'Uploading...' : 'Upload Documents for Review'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentsPage;
