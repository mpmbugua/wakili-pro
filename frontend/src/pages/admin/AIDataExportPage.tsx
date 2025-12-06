import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Search,
  Filter,
  Database,
  Brain,
  TrendingUp,
  Users,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import axiosInstance from '../../services/api';
import { useAuthStore } from '../../store/authStore';

type DatasetType = 'search-queries' | 'user-behavior' | 'conversion-patterns' | 'market-intelligence';
type TimeRange = '7days' | '30days' | '90days' | '6months' | '1year' | 'all';
type AnonymizationLevel = 'none' | 'partial' | 'full';

interface QueryFilters {
  datasetType: DatasetType;
  timeRange: TimeRange;
  anonymizationLevel: AnonymizationLevel;
  includeMetadata: boolean;
  minOccurrences?: number;
  regions?: string[];
  deviceTypes?: string[];
  userSegments?: string[];
}

export const AIDataExportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<QueryFilters>({
    datasetType: 'search-queries',
    timeRange: '90days',
    anonymizationLevel: 'full',
    includeMetadata: true,
    minOccurrences: 5
  });
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'previewing' | 'exporting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Redirect non-admin users
  React.useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const getDateRange = (range: TimeRange) => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(2020, 0, 1); // Platform inception
        break;
    }
    
    return { startDate, endDate };
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      setExportStatus('previewing');
      setErrorMessage('');
      
      const { startDate, endDate } = getDateRange(filters.timeRange);
      
      const response = await axiosInstance.post('/analytics-tracking/admin/query-builder', {
        datasetType: filters.datasetType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        anonymizationLevel: filters.anonymizationLevel,
        includeMetadata: filters.includeMetadata,
        minOccurrences: filters.minOccurrences,
        regions: filters.regions,
        deviceTypes: filters.deviceTypes,
        userSegments: filters.userSegments,
        limit: 100 // Preview first 100 records
      });
      
      if (response.data.success) {
        setPreviewData(response.data.data);
        setExportStatus('success');
      } else {
        throw new Error(response.data.message || 'Failed to preview data');
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to preview data');
      setExportStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setLoading(true);
      setExportStatus('exporting');
      setErrorMessage('');
      
      const { startDate, endDate } = getDateRange(filters.timeRange);
      
      const response = await axiosInstance.post('/analytics-tracking/admin/query-builder', {
        datasetType: filters.datasetType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        anonymizationLevel: filters.anonymizationLevel,
        includeMetadata: filters.includeMetadata,
        minOccurrences: filters.minOccurrences,
        regions: filters.regions,
        deviceTypes: filters.deviceTypes,
        userSegments: filters.userSegments,
        format,
        export: true
      }, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        // Download CSV file
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-training-${filters.datasetType}-${filters.timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Download JSON file
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-training-${filters.datasetType}-${filters.timeRange}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      setExportStatus('success');
      alert(`Dataset exported successfully! Records: ${previewData?.recordCount || 'N/A'}`);
    } catch (error: any) {
      console.error('Export error:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to export data');
      setExportStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setExportStatus('exporting');
      setErrorMessage('');
      
      const { startDate, endDate } = getDateRange(filters.timeRange);
      
      const response = await axiosInstance.post('/analytics-tracking/admin/market-intelligence', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        regions: filters.regions
      }, {
        responseType: 'blob'
      });
      
      // Download PDF report
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `market-intelligence-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportStatus('success');
      alert('Market Intelligence Report generated successfully!');
    } catch (error: any) {
      console.error('Report generation error:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to generate report');
      setExportStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => navigate('/admin/analytics')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Analytics
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Data Export & Training Tools</h1>
              <p className="text-slate-600 mt-1">Build custom datasets for AI training and market intelligence</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Query Builder */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <Filter className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-slate-900">Query Builder</h2>
              </div>

              {/* Dataset Type */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Dataset Type
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'search-queries', label: 'Search Queries', icon: Search, desc: 'User search terms and legal queries' },
                    { value: 'user-behavior', label: 'User Behavior', icon: Users, desc: 'Click patterns and navigation paths' },
                    { value: 'conversion-patterns', label: 'Conversion Patterns', icon: TrendingUp, desc: 'Journey from visit to conversion' },
                    { value: 'market-intelligence', label: 'Market Intelligence', icon: MapPin, desc: 'Regional legal trends and demand' }
                  ].map((dataset) => (
                    <button
                      key={dataset.value}
                      onClick={() => setFilters(prev => ({ ...prev, datasetType: dataset.value as DatasetType }))}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        filters.datasetType === dataset.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <dataset.icon className={`w-5 h-5 mt-0.5 ${
                          filters.datasetType === dataset.value ? 'text-purple-600' : 'text-slate-400'
                        }`} />
                        <div>
                          <p className={`font-medium ${
                            filters.datasetType === dataset.value ? 'text-purple-900' : 'text-slate-900'
                          }`}>
                            {dataset.label}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">{dataset.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Time Range
                </label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as TimeRange }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="6months">Last 6 months</option>
                  <option value="1year">Last 1 year</option>
                  <option value="all">All time</option>
                </select>
              </div>

              {/* Anonymization Level */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Anonymization Level
                </label>
                <select
                  value={filters.anonymizationLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, anonymizationLevel: e.target.value as AnonymizationLevel }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="full">Full (No PII, safe for public datasets)</option>
                  <option value="partial">Partial (Anonymized IDs, internal use)</option>
                  <option value="none">None (Raw data, admin only)</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  {filters.anonymizationLevel === 'full' && '✓ Safe for AI training and external partners'}
                  {filters.anonymizationLevel === 'partial' && '⚠ For internal analysis only'}
                  {filters.anonymizationLevel === 'none' && '⛔ Contains PII - handle with care'}
                </p>
              </div>

              {/* Additional Filters */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includeMetadata}
                    onChange={(e) => setFilters(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  Include Metadata
                </label>
                <p className="text-xs text-slate-500 mt-1 ml-6">
                  Timestamp, device type, location, etc.
                </p>
              </div>

              {filters.datasetType === 'search-queries' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Minimum Occurrences
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={filters.minOccurrences || 1}
                    onChange={(e) => setFilters(prev => ({ ...prev, minOccurrences: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="5"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Filter out rare queries (reduces noise)
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handlePreview}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && exportStatus === 'previewing' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading Preview...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Preview Dataset
                    </>
                  )}
                </button>

                {previewData && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('json')}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview & Results */}
          <div className="lg:col-span-2">
            {/* Status Messages */}
            {exportStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {exportStatus === 'success' && previewData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Preview Loaded</p>
                    <p className="text-sm text-green-700 mt-1">
                      {previewData.recordCount?.toLocaleString() || 0} records ready for export
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Data */}
            {previewData ? (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Dataset Preview</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Showing first {previewData.preview?.length || 0} of {previewData.recordCount?.toLocaleString() || 0} records
                    </p>
                  </div>
                  <Database className="w-6 h-6 text-slate-400" />
                </div>

                {/* Dataset Statistics */}
                {previewData.statistics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 mb-1">Total Records</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {previewData.statistics.totalRecords?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 mb-1">Unique Queries</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {previewData.statistics.uniqueQueries?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 mb-1">Date Range</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {previewData.statistics.dateRange || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 mb-1">File Size (est.)</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {previewData.statistics.estimatedSize || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {previewData.preview && previewData.preview[0] && 
                          Object.keys(previewData.preview[0]).map((key) => (
                            <th key={key} className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">
                              {key}
                            </th>
                          ))
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.preview?.map((row: any, index: number) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                          {Object.values(row).map((value: any, i: number) => (
                            <td key={i} className="py-3 px-4 text-sm text-slate-900">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Preview Yet</h3>
                <p className="text-slate-600 mb-6">
                  Configure your query filters and click "Preview Dataset" to see your data
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Brain className="w-4 h-4" />
                  Build custom datasets for AI training and market analysis
                </div>
              </div>
            )}

            {/* Market Intelligence Report Generator */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 mt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    Market Intelligence Report
                  </h3>
                  <p className="text-sm text-amber-700 mb-4">
                    Generate comprehensive PDF reports with legal trends, demand analysis, and regional insights.
                    Perfect for selling to law firms, researchers, and investors.
                  </p>
                  <button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading && exportStatus === 'exporting' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5" />
                        Generate Report (PDF)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Dataset Use Cases</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">AI Training</h4>
                      <p className="text-sm text-slate-600">
                        Train legal chatbots, search algorithms, and recommendation engines
                      </p>
                      <p className="text-xs text-purple-600 font-medium mt-2">
                        Revenue: $50K-$100K/year
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Market Research</h4>
                      <p className="text-sm text-slate-600">
                        Identify emerging legal trends and underserved markets
                      </p>
                      <p className="text-xs text-blue-600 font-medium mt-2">
                        Internal optimization
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Intelligence Reports</h4>
                      <p className="text-sm text-slate-600">
                        Sell quarterly reports to law firms and legal tech companies
                      </p>
                      <p className="text-xs text-green-600 font-medium mt-2">
                        Revenue: $10K-$20K/quarter
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Predictive Analytics</h4>
                      <p className="text-sm text-slate-600">
                        API for insurance, banks to predict legal risk
                      </p>
                      <p className="text-xs text-amber-600 font-medium mt-2">
                        Revenue: $200K+/year
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
