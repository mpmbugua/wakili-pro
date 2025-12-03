import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import axiosInstance from '../../services/api';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Upload, Database } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  results?: any;
  error?: string;
}

export const PineconeTestPage = () => {
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [uploadResult, setUploadResult] = useState<TestResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
        headers: { 'Content-Type': 'multipart/form-data' }
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
              'Test Text Ingestion'
            )}
          </Button>

          {uploadResult && (
            <Alert className={uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
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
                      <div className="mt-3 bg-white p-3 rounded border">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(uploadResult.results, null, 2)}
                        </pre>
                      </div>
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

      {/* Manual File Upload */}
      <Card>
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
                      <div className="mt-3 bg-white p-3 rounded border">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(uploadResult.results, null, 2)}
                        </pre>
                      </div>
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

      <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="font-semibold mb-2">What These Tests Check:</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li><strong>Connection Test:</strong> Pinecone API key, environment, index creation, embedding dimension</li>
          <li><strong>Text Upload:</strong> Document chunking, embedding generation, vector storage, database records</li>
          <li><strong>File Upload:</strong> PDF/DOCX extraction, complete ingestion pipeline</li>
        </ul>
      </div>
    </div>
  );
};
