import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, Database, RefreshCw, Trash2, Eye, 
  BookOpen, AlertCircle, CheckCircle, Loader, Download,
  Globe, Calendar, Tag, Search, Filter, TestTube
} from 'lucide-react';
import axiosInstance from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

interface LegalDocument {
  id: string;
  title: string;
  documentType: string;
  category: string;
  citation?: string;
  sourceUrl?: string;
  effectiveDate?: string;
  chunksCount: number;
  vectorsCount: number;
  uploadedAt: string;
  uploadedBy: string;
}

interface IngestionStats {
  totalDocuments: number;
  totalChunks: number;
  totalVectors: number;
  lastUpdated: string;
}

export const AdminLegalKnowledgeBase: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [stats, setStats] = useState<IngestionStats>({
    totalDocuments: 0,
    totalChunks: 0,
    totalVectors: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [crawlerStatus, setCrawlerStatus] = useState({ isRunning: false, nextRun: '', schedule: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    documentType: 'LEGISLATION',
    category: 'Constitutional Law',
    citation: '',
    sourceUrl: '',
    effectiveDate: ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchStats();
    fetchCrawlerStatus();
  }, []);

  const fetchCrawlerStatus = async () => {
    try {
      const response = await axiosInstance.get('/admin/crawler/status');
      if (response.data.success) {
        setCrawlerStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching crawler status:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/ai/documents');
      if (response.data.success) {
        setDocuments(response.data.data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/ai/documents/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSyncMetadata = async () => {
    if (!confirm('Sync database metadata from Pinecone? This will recreate document records from existing vectors.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post('/admin/pinecone/sync-metadata');
      
      if (response.data.success) {
        alert('Metadata synced successfully! Refreshing...');
        await fetchDocuments();
        await fetchStats();
      }
    } catch (error: any) {
      console.error('Error syncing metadata:', error);
      alert(`Sync failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    if (!uploadForm.title) {
      alert('Please provide a document title');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadForm.title);
      formData.append('documentType', uploadForm.documentType);
      formData.append('category', uploadForm.category);
      if (uploadForm.citation) formData.append('citation', uploadForm.citation);
      if (uploadForm.sourceUrl) formData.append('sourceUrl', uploadForm.sourceUrl);
      if (uploadForm.effectiveDate) formData.append('effectiveDate', uploadForm.effectiveDate);

      const response = await axiosInstance.post('/ai/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        alert(`✅ Document uploaded successfully! ${response.data.data.chunksProcessed} chunks processed.`);
        setSelectedFile(null);
        setUploadForm({
          title: '',
          documentType: 'LEGISLATION',
          category: 'Constitutional Law',
          citation: '',
          sourceUrl: '',
          effectiveDate: ''
        });
        fetchDocuments();
        fetchStats();
      }
    } catch (error: any) {
      alert('❌ Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSeedRealPDFs = async () => {
    if (!confirm('This will download and ingest 10 real PDFs from Kenya Law (Constitution, Companies Act, Data Protection Act, etc.). This may take 2-3 minutes. Continue?')) {
      return;
    }

    try {
      setScraping(true);
      const response = await axiosInstance.post('/admin/crawler/seed-real-pdfs');
      if (response.data.success) {
        const { discovered, ingested } = response.data.data;
        alert(`✅ Success!\n\nIngested: ${ingested}/${discovered} Kenya Law PDFs\n\nDocuments are now available for AI queries!`);
        fetchDocuments();
        fetchStats();
      }
    } catch (error: any) {
      alert('❌ Failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setScraping(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document and all its vectors?')) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/ai/documents/${documentId}`);
      if (response.data.success) {
        alert('✅ Document deleted successfully!');
        fetchDocuments();
        fetchStats();
      }
    } catch (error: any) {
      alert('❌ Delete failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.documentType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Knowledge Base</h1>
            <p className="text-gray-600">Upload legal documents and train AI with Kenyan law</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSyncMetadata}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync from Pinecone
            </button>
            <button
              onClick={() => navigate('/admin/pinecone-test')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-sm"
            >
              <TestTube className="h-4 w-4" />
              Pinecone Diagnostics
            </button>
          </div>
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDocuments}</p>
              </div>
              <Database className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Text Chunks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalChunks.toLocaleString()}</p>
              </div>
              <FileText className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vector Embeddings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalVectors.toLocaleString()}</p>
              </div>
              <BookOpen className="h-10 w-10 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">
                  {new Date(stats.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              <Calendar className="h-10 w-10 text-amber-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Legal Document
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document File (PDF, DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              {selectedFile && (
                <p className="text-sm text-green-600 mt-2">
                  <CheckCircle className="inline h-4 w-4 mr-1" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Title *
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="e.g., The Constitution of Kenya, 2010"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={uploadForm.documentType}
                onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="LEGISLATION">Legislation</option>
                <option value="CASE_LAW">Case Law</option>
                <option value="STATUTORY_INSTRUMENT">Statutory Instrument</option>
                <option value="GAZETTE_NOTICE">Gazette Notice</option>
                <option value="POLICY_DOCUMENT">Policy Document</option>
                <option value="LEGAL_GUIDE">Legal Guide</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option>Constitutional Law</option>
                <option>Criminal Law</option>
                <option>Family Law</option>
                <option>Property Law</option>
                <option>Commercial Law</option>
                <option>Employment Law</option>
                <option>Tax Law</option>
                <option>Environmental Law</option>
                <option>Other</option>
              </select>
            </div>

            {/* Citation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Citation (Optional)
              </label>
              <input
                type="text"
                value={uploadForm.citation}
                onChange={(e) => setUploadForm({ ...uploadForm, citation: e.target.value })}
                placeholder="e.g., [2010] eKLR"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source URL (Optional)
              </label>
              <input
                type="url"
                value={uploadForm.sourceUrl}
                onChange={(e) => setUploadForm({ ...uploadForm, sourceUrl: e.target.value })}
                placeholder="https://kenyalaw.org/..."
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date (Optional)
              </label>
              <input
                type="date"
                value={uploadForm.effectiveDate}
                onChange={(e) => setUploadForm({ ...uploadForm, effectiveDate: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <button
                onClick={handleFileUpload}
                disabled={uploading || !selectedFile}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Processing & Training AI...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload & Train AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Intelligent Crawler Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="h-6 w-6" />
                Intelligent Legal Document Crawler
              </h2>
              <p className="text-white/90 mt-1">
                Automated discovery from Kenya Law, Judiciary, Parliament, LSK & more
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/70 mb-1">Scheduler Status</div>
              <div className={`flex items-center gap-2 justify-end ${crawlerStatus.isRunning ? 'text-green-200' : 'text-yellow-200'}`}>
                <div className={`h-2 w-2 rounded-full ${crawlerStatus.isRunning ? 'bg-green-300 animate-pulse' : 'bg-yellow-300'}`}></div>
                <span className="font-semibold">{crawlerStatus.isRunning ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/70 mb-1">Schedule</div>
                <div className="font-semibold">{crawlerStatus.schedule || 'Daily at 5:00 PM (EAT)'}</div>
              </div>
              <div>
                <div className="text-white/70 mb-1">Next Crawl</div>
                <div className="font-semibold">{crawlerStatus.nextRun || 'Loading...'}</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/20 backdrop-blur rounded-lg p-4 mb-4 border border-blue-300/30">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-200 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white/90">
                <strong>Kenya Law Integration:</strong> Downloads and processes verified legal documents from new.kenyalaw.org
                including the Constitution, Companies Act, Data Protection Act, Employment Act, Land Act, and more.
                Uses direct PDF URLs with Akoma Ntoso format for reliable ingestion.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSeedRealPDFs}
              disabled={scraping}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 py-4 px-6 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {scraping ? <Loader className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              {scraping ? 'Downloading & Processing PDFs...' : 'Ingest Kenya Law Documents (10 PDFs)'}
            </button>
            
            <div className="text-center text-white/70 text-sm">
              Downloads 10 verified legal documents from Kenya Law (~2-3 minutes)
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Indexed Documents</h2>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="LEGISLATION">Legislation</option>
                <option value="CASE_LAW">Case Law</option>
                <option value="STATUTORY_INSTRUMENT">Statutory Instrument</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents found. Upload or scrape to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{doc.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {doc.documentType}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          <Tag className="inline h-3 w-3 mr-1" />
                          {doc.category}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {doc.chunksCount} chunks
                        </span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                          {doc.vectorsCount} vectors
                        </span>
                      </div>
                      {doc.citation && (
                        <p className="text-sm text-gray-600 mb-1">Citation: {doc.citation}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {doc.sourceUrl && (
                        <a
                          href={doc.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};

export default AdminLegalKnowledgeBase;
