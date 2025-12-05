import { useState, useRef } from 'react';
import axiosInstance from '../../services/api';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Upload, Database, Globe, Info } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  results?: any;
  error?: string;
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 border-b border-slate-200">{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-xl font-semibold text-slate-900 ${className}`}>{children}</h2>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6">{children}</div>
);

const Button = ({ 
  onClick, 
  disabled, 
  children, 
  className = '' 
}: { 
  onClick: () => void; 
  disabled?: boolean; 
  children: React.ReactNode; 
  className?: string 
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${className}`}
  >
    {children}
  </button>
);

const Alert = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 rounded-lg border ${className}`}>{children}</div>
);

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const PineconeTestPage = () => {
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [folderUploading, setFolderUploading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [uploadResult, setUploadResult] = useState<TestResult | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = useState<TestResult | null>(null);
  const [folderUploadResult, setFolderUploadResult] = useState<TestResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<TestResult | null>(null);
  const [crawlerResult, setCrawlerResult] = useState<TestResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [folderPath, setFolderPath] = useState('');
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const runConnectionTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await axiosInstance.get('/admin/pinecone/test-connection');
      setTestResult(response.data);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: 'Test failed',
        error: error.response?.data?.error || error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const testDocumentUpload = async () => {
    setUploading(true);
    setUploadResult(null);

    try {
      const response = await axiosInstance.post('/admin/pinecone/test-upload');
      setUploadResult(response.data);
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: 'Upload test failed',
        error: error.response?.data?.error || error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name.replace(/\.[^/.]+$/, ''));
    formData.append('documentType', 'LEGISLATION');
    formData.append('category', 'Manual Upload Test');

    try {
      const response = await axiosInstance.post('/ai/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000 // 5 minutes timeout for AI processing
      });
      setUploadResult({
        success: true,
        message: 'File uploaded successfully',
        results: response.data.data
      });
      setSelectedFile(null);
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: 'File upload failed',
        error: error.response?.data?.message || error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBulkFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setBulkUploadResult({
        success: false,
        message: 'No files selected',
        error: 'Please select files to upload'
      });
      return;
    }

    setBulkUploading(true);
    setBulkUploadResult(null);

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }
    formData.append('documentType', 'LEGISLATION');
    formData.append('category', 'General');

    try {
      const response = await axiosInstance.post('/ai/documents/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 3600000 // 60 minutes timeout for bulk uploads (up to 50 files × ~45s each = ~37min worst case)
      });
      setBulkUploadResult({
        success: true,
        message: response.data.message || 'Files uploaded successfully',
        results: response.data.data
      });
    } catch (error: any) {
      setBulkUploadResult({
        success: false,
        message: 'Bulk upload failed',
        error: error.response?.data?.message || error.message
      });
    } finally {
      setBulkUploading(false);
      // Reset the file input and state after upload completes
      setTimeout(() => {
        setSelectedFiles(null);
        if (bulkFileInputRef.current) {
          bulkFileInputRef.current.value = '';
        }
      }, 100);
    }
  };

  const handleFolderUpload = async () => {
    if (!folderPath.trim()) {
      setFolderUploadResult({
        success: false,
        message: 'Folder path is required',
        error: 'Please enter a valid folder path (server-side path only)'
      });
      return;
    }

    setFolderUploading(true);
    setFolderUploadResult(null);

    try {
      const response = await axiosInstance.post('/ai/documents/folder-upload', {
        folderPath: folderPath.trim()
      }, {
        timeout: 600000 // 10 minutes timeout for folder uploads (can process many files)
      });
      setFolderUploadResult({
        success: true,
        message: response.data.message || 'Folder uploaded successfully',
        results: response.data.data
      });
      setFolderPath('');
    } catch (error: any) {
      setFolderUploadResult({
        success: false,
        message: 'Folder upload failed',
        error: error.response?.data?.message || error.message
      });
    } finally {
      setFolderUploading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('This will remove ALL duplicates, junk documents, and documents with 0 vectors. Continue?')) {
      return;
    }

    setCleaning(true);
    setCleanupResult(null);

    try {
      const response = await axiosInstance.delete('/admin/cleanup/all', {
        timeout: 300000 // 5 minutes for cleanup
      });
      setCleanupResult({
        success: true,
        message: response.data.message || 'Cleanup completed successfully',
        results: response.data.data
      });
    } catch (error: any) {
      setCleanupResult({
        success: false,
        message: 'Cleanup failed',
        error: error.response?.data?.message || error.message
      });
    } finally {
      setCleaning(false);
    }
  };

  const handleCrawlerTest = async () => {
    if (!confirm('This will crawl Kenya Law, Judiciary, and other legal sites to discover documents. May take 5-15 minutes. Continue?')) {
      return;
    }

    setCrawling(true);
    setCrawlerResult(null);

    try {
      const response = await axiosInstance.post('/admin/crawler/trigger', {}, {
        timeout: 900000 // 15 minutes for crawler
      });
      setCrawlerResult({
        success: true,
        message: response.data.message || 'Crawler completed successfully',
        results: response.data.data
      });
    } catch (error: any) {
      setCrawlerResult({
        success: false,
        message: 'Crawler failed',
        error: error.response?.data?.message || error.message
      });
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Pinecone Diagnostic Tests</h1>

      {/* Connection Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Pinecone Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This will test all Pinecone operations: initialization, vector upsert, search, and deletion.
          </p>

          <Button 
            onClick={runConnectionTest} 
            disabled={testing}
            className="mb-4"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Connection Test'
            )}
          </Button>

          {testResult && (
            <Alert className={testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <strong>{testResult.message}</strong>
                    
                    {testResult.results && (
                      <div className="mt-3 space-y-2">
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold mb-2">Environment Check</h4>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(testResult.results.environment, null, 2)}
                          </pre>
                        </div>

                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold mb-2">Index Stats</h4>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(testResult.results.indexStats, null, 2)}
                          </pre>
                        </div>

                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold mb-2">Embedding Test</h4>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(testResult.results.embedding, null, 2)}
                          </pre>
                        </div>

                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold mb-2">Vector Operations</h4>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(testResult.results.vectorOperations, null, 2)}
                          </pre>
                        </div>

                        {testResult.results.recommendations && (
                          <div className="bg-amber-50 p-3 rounded border border-amber-200">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              Recommendations
                            </h4>
                            <ul className="list-disc list-inside text-sm">
                              {testResult.results.recommendations.map((rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {testResult.error && (
                      <div className="mt-2 text-sm text-red-700">
                        <strong>Error:</strong> {testResult.error}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Text Upload Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Test Document Upload (Text)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This will ingest a sample legal document text to test the complete pipeline.
          </p>

          <Button 
            onClick={testDocumentUpload} 
            disabled={uploading}
            className="mb-4"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Test Document
              </>
            )}
          </Button>

          {uploadResult && (
            <Alert className={`mt-4 ${uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-2">
                {uploadResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <strong>{uploadResult.message}</strong>
                    {uploadResult.results && (
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(uploadResult.results, null, 2)}
                      </pre>
                    )}
                    {uploadResult.error && (
                      <div className="mt-2 text-sm text-red-700">
                        <strong>Error:</strong> {uploadResult.error}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bulk File Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk File Upload (Multiple PDFs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Upload multiple PDF or DOCX files at once. Select all files from your folder using Ctrl+Click or Shift+Click.
          </p>

          <div className="space-y-4">
            <input
              ref={bulkFileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              multiple
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />

            {selectedFiles && selectedFiles.length > 0 && (
              <div className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-200">
                <strong>{selectedFiles.length} files selected</strong>
                <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                  {Array.from(selectedFiles).map((file, idx) => (
                    <div key={idx}>• {file.name}</div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleBulkFileUpload} 
              disabled={!selectedFiles || selectedFiles.length === 0 || bulkUploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {bulkUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading {selectedFiles?.length} files...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {selectedFiles?.length || 0} Files
                </>
              )}
            </Button>
          </div>

          {bulkUploadResult && (
            <Alert className={`mt-4 ${bulkUploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-2">
                {bulkUploadResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <strong>{bulkUploadResult.message}</strong>
                    
                    {bulkUploadResult.results && (
                      <div className="mt-3 space-y-3">
                        {/* Summary */}
                        {bulkUploadResult.results.summary && (
                          <div className="bg-white p-4 rounded border">
                            <h4 className="font-semibold mb-2">Summary</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Total Files: <strong>{bulkUploadResult.results.summary.total}</strong></div>
                              <div className="text-green-600">Successful: <strong>{bulkUploadResult.results.summary.successful}</strong></div>
                              <div className="text-red-600">Failed: <strong>{bulkUploadResult.results.summary.failed}</strong></div>
                              <div>Total Chunks: <strong>{bulkUploadResult.results.summary.totalChunks}</strong></div>
                              <div className="col-span-2">Total Vectors: <strong>{bulkUploadResult.results.summary.totalVectors}</strong></div>
                            </div>
                          </div>
                        )}

                        {/* Successful Files */}
                        {bulkUploadResult.results.details?.successful && bulkUploadResult.results.details.successful.length > 0 && (
                          <div className="bg-white p-4 rounded border max-h-48 overflow-y-auto">
                            <h4 className="font-semibold mb-2 text-green-600">✅ Successfully Processed</h4>
                            <div className="space-y-1 text-xs">
                              {bulkUploadResult.results.details.successful.map((file: any, idx: number) => (
                                <div key={idx}>• {file.filename} ({file.chunks} chunks, {file.vectors} vectors)</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Failed Files */}
                        {bulkUploadResult.results.details?.failed && bulkUploadResult.results.details.failed.length > 0 && (
                          <div className="bg-red-50 p-4 rounded border border-red-200 max-h-48 overflow-y-auto">
                            <h4 className="font-semibold mb-2 text-red-600">❌ Failed Files</h4>
                            <div className="space-y-1 text-xs">
                              {bulkUploadResult.results.details.failed.map((file: any, idx: number) => (
                                <div key={idx}>• {file.filename}: {file.error}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {bulkUploadResult.error && (
                      <div className="mt-2 text-sm text-red-700">
                        <strong>Error:</strong> {bulkUploadResult.error}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Manual File Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Manual File Upload (PDF/DOCX)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Upload a PDF or DOCX file to test the file-based ingestion pipeline.
          </p>

          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />

            {selectedFile && (
              <div className="text-sm text-gray-600">
                Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}

            <Button 
              onClick={handleFileUpload} 
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload File'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Server Folder Upload (Advanced) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Server Folder Upload (Advanced)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-red-800">
              <strong>⚠️ Server-Side Only:</strong> This requires a folder path on the Render server, not your local machine. 
              For local files, use <strong>Bulk File Upload</strong> above instead.
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            If you have files uploaded to the server, this will:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
            <li>Recursively scan all subfolders for PDF/DOCX files</li>
            <li>Auto-detect document type from folder names (Acts, Regulations, Cases, etc.)</li>
            <li>Infer category from folder structure (Constitutional Law, Property Law, etc.)</li>
            <li>Extract year from filenames for effective date</li>
            <li>Preserve folder hierarchy as metadata</li>
          </ul>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Server Folder Path (e.g., /app/storage/legal-materials)
              </label>
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="/app/storage/legal-materials"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-amber-50 p-3 rounded border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This only works for folders that exist on the Render server. 
                Use "Bulk File Upload" to upload files from your computer.
              </p>
            </div>

            <Button 
              onClick={handleFolderUpload} 
              disabled={!folderPath.trim() || folderUploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {folderUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Folder...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Server Folder
                </>
              )}
            </Button>
          </div>

          {folderUploadResult && (
            <Alert className={`mt-4 ${folderUploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-2">
                {folderUploadResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <strong>{folderUploadResult.message}</strong>
                    
                    {folderUploadResult.results && (
                      <div className="mt-3 space-y-3">
                        {/* Summary */}
                        {folderUploadResult.results.summary && (
                          <div className="bg-white p-4 rounded border">
                            <h4 className="font-semibold mb-2">Summary</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Total Files: <strong>{folderUploadResult.results.summary.total}</strong></div>
                              <div className="text-green-600">Successful: <strong>{folderUploadResult.results.summary.successful}</strong></div>
                              <div className="text-red-600">Failed: <strong>{folderUploadResult.results.summary.failed}</strong></div>
                              <div>Total Chunks: <strong>{folderUploadResult.results.summary.totalChunks}</strong></div>
                              <div className="col-span-2">Total Vectors: <strong>{folderUploadResult.results.summary.totalVectors}</strong></div>
                            </div>
                          </div>
                        )}

                        {/* Successful Files */}
                        {folderUploadResult.results.details?.successful && folderUploadResult.results.details.successful.length > 0 && (
                          <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
                            <h4 className="font-semibold mb-2 text-green-600">✅ Successfully Processed</h4>
                            <div className="space-y-2">
                              {folderUploadResult.results.details.successful.map((file: any, idx: number) => (
                                <div key={idx} className="text-xs border-b pb-2">
                                  <div className="font-medium">{file.filename}</div>
                                  <div className="text-gray-600">
                                    Type: {file.documentType} | Category: {file.category} | 
                                    Chunks: {file.chunks} | Vectors: {file.vectors}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Failed Files */}
                        {folderUploadResult.results.details?.failed && folderUploadResult.results.details.failed.length > 0 && (
                          <div className="bg-red-50 p-4 rounded border border-red-200 max-h-64 overflow-y-auto">
                            <h4 className="font-semibold mb-2 text-red-600">❌ Failed Files</h4>
                            <div className="space-y-2">
                              {folderUploadResult.results.details.failed.map((file: any, idx: number) => (
                                <div key={idx} className="text-xs border-b border-red-200 pb-2">
                                  <div className="font-medium">{file.filename}</div>
                                  <div className="text-red-700">Error: {file.error}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {folderUploadResult.error && (
                      <div className="mt-2 text-sm text-red-700">
                        <strong>Error:</strong> {folderUploadResult.error}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Crawler Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Legal Document Crawler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Crawler Information:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Crawls up to 10 levels deep on legal websites</li>
                  <li>Processes up to 500 documents per run</li>
                  <li>Filters out junk (Site Map, Contact Us, etc.)</li>
                  <li>Scheduled to run daily at midnight (currently disabled)</li>
                  <li>Expected duration: 5-15 minutes</li>
                </ul>
              </div>
            </div>

            <Button 
              onClick={handleCrawlerTest} 
              disabled={crawling}
              className="w-full"
            >
              {crawling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Crawling... (This may take 5-15 minutes)
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Test Crawler Now
                </>
              )}
            </Button>

            {/* Progress indicator while crawling */}
            {crawling && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <div className="font-medium text-blue-900">Crawler Running...</div>
                    <div className="text-sm text-blue-700">Please wait while the crawler discovers and processes documents</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span>Crawling Kenya Law fileadmin directories...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <span>Discovering PDF documents...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    <span>Processing and ingesting files...</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-blue-600">
                  ⏱️ Estimated time: 5-15 minutes • Processing up to 50 documents
                </div>
              </div>
            )}

            {crawlerResult && (
              <Alert className={`${crawlerResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-2">
                  {crawlerResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <AlertDescription className="flex-1">
                    <div className={`text-sm ${crawlerResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      <strong>{crawlerResult.success ? 'Success:' : 'Error:'}</strong> {crawlerResult.message}
                    </div>

                    {crawlerResult.success && crawlerResult.results && (
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white p-3 rounded border border-green-200">
                            <div className="text-green-600 font-medium">Documents Discovered</div>
                            <div className="text-2xl font-bold text-green-700">
                              {crawlerResult.results.discovered || 0}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border border-green-200">
                            <div className="text-green-600 font-medium">Successfully Ingested</div>
                            <div className="text-2xl font-bold text-green-700">
                              {crawlerResult.results.ingested || 0}
                            </div>
                          </div>
                        </div>

                        {crawlerResult.results.filtered && (
                          <div className="bg-white p-3 rounded border border-amber-200">
                            <div className="text-amber-600 font-medium text-sm">Junk Filtered Out</div>
                            <div className="text-xl font-bold text-amber-700">
                              {crawlerResult.results.filtered} documents
                            </div>
                            <div className="text-xs text-amber-600 mt-1">
                              (Site maps, contact pages, navigation items)
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {crawlerResult.error && (
                      <div className="mt-2 text-sm text-red-700">
                        <strong>Error Details:</strong> {crawlerResult.error}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Cleanup */}
      <Card className="mb-6 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            Database Cleanup (Danger Zone)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Warning: This action cannot be undone!</p>
            <p className="text-sm text-red-700">
              This will remove:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
              <li><strong>Duplicates:</strong> Keep only the best version (highest vectors, most recent)</li>
              <li><strong>Junk documents:</strong> "Site Map", "Contact Us", "Careers", etc. (non-legal pages)</li>
              <li><strong>Zero-vector documents:</strong> Documents that failed AI processing (0 vectors)</li>
            </ul>
          </div>

          <Button 
            onClick={handleCleanup} 
            disabled={cleaning}
            className="bg-red-600 hover:bg-red-700"
          >
            {cleaning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cleaning Database...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Clean Up Database
              </>
            )}
          </Button>

          {cleanupResult && (
            <Alert className={`mt-4 ${cleanupResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-2">
                {cleanupResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <strong>{cleanupResult.message}</strong>
                    {cleanupResult.results && (
                      <div className="mt-3 bg-white p-4 rounded border">
                        <h4 className="font-semibold mb-2">Cleanup Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Duplicates Removed: <strong className="text-red-600">{cleanupResult.results.duplicatesRemoved}</strong></div>
                          <div>Junk Removed: <strong className="text-red-600">{cleanupResult.results.junkRemoved}</strong></div>
                          <div className="col-span-2">Zero-Vector Removed: <strong className="text-red-600">{cleanupResult.results.zeroVectorRemoved}</strong></div>
                          <div className="col-span-2 pt-2 border-t">Total Removed: <strong className="text-red-700 text-lg">{cleanupResult.results.totalRemoved}</strong></div>
                        </div>
                      </div>
                    )}
                    {cleanupResult.error && (
                      <div className="mt-2 text-sm text-red-700">
                        <strong>Error:</strong> {cleanupResult.error}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="font-semibold mb-2">What These Tests Check:</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li><strong>Connection Test:</strong> Pinecone API key, environment, index creation, embedding dimension</li>
          <li><strong>Text Upload:</strong> Document chunking, embedding generation, vector storage, database records</li>
          <li><strong>Single File Upload:</strong> PDF/DOCX extraction, complete ingestion pipeline</li>
          <li><strong>Bulk File Upload:</strong> Multiple file processing, error handling per file</li>
          <li><strong>Server Folder Upload:</strong> Recursive scanning, metadata inference, bulk processing, folder structure preservation</li>
        </ul>
        
        <div className="mt-4 p-3 bg-white rounded border border-blue-200">
          <h4 className="font-semibold text-sm mb-2">Folder Structure Example:</h4>
          <pre className="text-xs text-gray-600">
{`D:\\Legal-Documents\\
├── Constitutional-Law\\
│   ├── Constitution_2010.pdf → Type: CONSTITUTION, Category: Constitutional Law
│   └── Devolution_Act_2012.pdf → Type: ACT, Category: Constitutional Law
├── Property-Law\\
│   └── Land_Act_2012.pdf → Type: ACT, Category: Property Law, Date: 2012
└── Criminal-Law\\
    └── Penal_Code.pdf → Type: ACT, Category: Criminal Law`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PineconeTestPage;
