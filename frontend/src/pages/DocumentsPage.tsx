import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Trash2, Upload, Search, Filter } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint
      // const response = await axiosInstance.get('/documents');
      // setDocuments(response.data.data);
      
      // Mock data
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
        {
          id: '3',
          title: 'Business Registration Certificate',
          type: 'CERTIFICATE',
          category: 'Corporate',
          uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          size: 98000,
          status: 'FINALIZED',
        },
        {
          id: '4',
          title: 'Partnership Agreement Draft',
          type: 'AGREEMENT',
          category: 'Corporate',
          uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          size: 312000,
          status: 'UNDER_REVIEW',
          lawyerName: 'Grace Wanjiru',
        },
      ]);
    } catch (error) {
      console.error('Error fetching documents:', error);
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
    return <FileText className="h-10 w-10 text-blue-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
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
          <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            <Upload className="h-5 w-5 mr-2" />
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="bg-blue-50 rounded-lg p-3">
                    {getTypeIcon(document.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate">{document.title}</h3>
                    <p className="text-sm text-slate-600">{document.category}</p>
                  </div>
                </div>
                {getStatusBadge(document.status)}
              </div>

              <div className="space-y-2 mb-4 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Uploaded</span>
                  <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size</span>
                  <span>{formatFileSize(document.size)}</span>
                </div>
                {document.lawyerName && (
                  <div className="flex justify-between">
                    <span>Reviewed by</span>
                    <span className="font-medium text-slate-900">{document.lawyerName}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex space-x-2">
                  <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition" title="View">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition" title="Download">
                    <Download className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                {document.status === 'DRAFT' && (
                  <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                    Request Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
