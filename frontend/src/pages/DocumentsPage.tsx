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
      const response = await axiosInstance.get('/user-documents');
      
      if (response.data.success) {
        setDocuments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Fallback to mock data if API fails
      setDocuments([
        {
          id: '1',
          title: 'Employment Contract - Tech Corp',
          type: 'CONTRACT',
          category: 'Employment',
          uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          size: 245000,
          status: 'REVIEWED',
          lawyerName: 'Sarah Mwangi',
        },
        {
          id: '2',
          title: 'Rental Agreement - Westlands Apartment',
          type: 'AGREEMENT',
          category: 'Real Estate',
          uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          size: 189000,
          status: 'FINALIZED',
          lawyerName: 'David Ochieng',
        },
      ]);
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

      if (response.data.success) {
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

    try {
      // Call API to update document status
      await axiosInstance.post(`/user-documents/${documentId}/request-review`, {
        reviewType: 'AI_ONLY',
      });

      // Navigate to document services page for payment
      navigate('/document-services', { 
        state: { 
          documentId,
          documentTitle,
          requestType: 'review'
        } 
      });
    } catch (error) {
      console.error('Error requesting review:', error);
      alert('Failed to request review. Please try again.');
    }
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
    if (!doc.fileUrl) {
      alert('Document URL not available');
      return;
    }

    try {
      // Create a temporary anchor element to trigger download
      const link = window.document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.title; // Suggest filename
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Append to body, click, and remove
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      // Fallback to opening in new tab
      window.open(doc.fileUrl, '_blank');
    }
  };

  const handleView = (doc: Document) => {
    if (!doc.fileUrl) {
      alert('Document URL not available');
      return;
    }
    // For PDFs, use Google Docs viewer for better in-browser experience
    if (doc.fileUrl.toLowerCase().endsWith('.pdf')) {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(doc.fileUrl)}&embedded=true`;
      window.open(viewerUrl, '_blank', 'noopener,noreferrer');
    } else {
      // For other file types, open directly
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
    }
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
        <button 
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Document
        </button>
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
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 shadow-sm">
                    {getTypeIcon(document.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 mb-1.5 truncate leading-tight">{document.title}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{document.category}</p>
                  </div>
                </div>
                <div className="ml-2">
                  {getStatusBadge(document.status)}
                </div>
              </div>

              <div className="space-y-2.5 mb-5 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Uploaded</span>
                  <span className="text-slate-700">{new Date(document.uploadedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Size</span>
                  <span className="text-slate-700 font-semibold">{formatFileSize(document.size)}</span>
                </div>
                {document.lawyerName && (
                  <div className="flex justify-between items-center py-1 bg-green-50 -mx-3 px-3 rounded-lg">
                    <span className="text-slate-500 font-medium">Reviewed by</span>
                    <span className="font-semibold text-green-700">{document.lawyerName}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex space-x-1.5">
                  <button 
                    onClick={() => handleView(document)}
                    className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-105" 
                    title="View Document"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDownload(document)}
                    className="p-2.5 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-105" 
                    title="Download"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(document.id)}
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-105" 
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                {document.status === 'DRAFT' && (
                  <button 
                    onClick={() => handleRequestReview(document.id, document.title)}
                    className="px-4 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold"
                  >
                    Request Review
                  </button>
                )}
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
              <h2 className="text-2xl font-bold text-slate-900">Upload Document</h2>
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
