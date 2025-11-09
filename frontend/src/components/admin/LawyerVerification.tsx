import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Building
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface LawyerApplication {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  appliedAt: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  
  // Professional Details
  licenseNumber: string;
  barAssociation: string;
  yearsExperience: number;
  specializations: string[];
  education: string;
  currentFirm?: string;
  
  // Documents
  documents: {
    license: { url: string; uploaded: boolean };
    certificate: { url: string; uploaded: boolean };
    id: { url: string; uploaded: boolean };
    cv: { url: string; uploaded: boolean };
  };
  
  // Reviews & Notes
  adminNotes?: string;
  internalScore?: number;
}

export const LawyerVerification: React.FC = () => {
  const [applications, setApplications] = useState<LawyerApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<LawyerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<LawyerApplication | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, statusFilter, searchTerm]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      // Mock data - will integrate with backend API
      const mockApplications: LawyerApplication[] = [
        {
          id: '1',
          userId: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@law.co.ke',
          phone: '+254723456789',
          location: 'Mombasa, Kenya',
          appliedAt: '2024-11-08T10:30:00Z',
          status: 'PENDING',
          licenseNumber: 'LSK001234',
          barAssociation: 'Law Society of Kenya',
          yearsExperience: 8,
          specializations: ['Corporate Law', 'Commercial Law', 'Contract Law'],
          education: 'LLB - University of Nairobi, LLM - Harvard Law School',
          currentFirm: 'Johnson & Associates Advocates',
          documents: {
            license: { url: '/docs/license1.pdf', uploaded: true },
            certificate: { url: '/docs/cert1.pdf', uploaded: true },
            id: { url: '/docs/id1.pdf', uploaded: true },
            cv: { url: '/docs/cv1.pdf', uploaded: true }
          }
        },
        {
          id: '2',
          userId: '5',
          firstName: 'David',
          lastName: 'Kipkoech',
          email: 'david.kipkoech@legal.co.ke',
          phone: '+254734567890',
          location: 'Eldoret, Kenya',
          appliedAt: '2024-11-07T14:15:00Z',
          status: 'UNDER_REVIEW',
          reviewedBy: 'admin@wakili.pro',
          licenseNumber: 'LSK005678',
          barAssociation: 'Law Society of Kenya',
          yearsExperience: 12,
          specializations: ['Family Law', 'Succession Law', 'Property Law'],
          education: 'LLB - Moi University, Diploma in Legal Practice - Kenya School of Law',
          currentFirm: 'Kipkoech Legal Consultants',
          documents: {
            license: { url: '/docs/license2.pdf', uploaded: true },
            certificate: { url: '/docs/cert2.pdf', uploaded: true },
            id: { url: '/docs/id2.pdf', uploaded: true },
            cv: { url: '/docs/cv2.pdf', uploaded: false }
          },
          adminNotes: 'Good credentials. Awaiting CV upload.',
          internalScore: 85
        },
        {
          id: '3',
          userId: '6',
          firstName: 'Mary',
          lastName: 'Wambui',
          email: 'mary.wambui@chambers.co.ke',
          location: 'Nairobi, Kenya',
          appliedAt: '2024-11-06T09:45:00Z',
          status: 'REJECTED',
          reviewedBy: 'admin@wakili.pro',
          reviewedAt: '2024-11-08T16:30:00Z',
          rejectionReason: 'Unable to verify license number with LSK database',
          licenseNumber: 'LSK999999',
          barAssociation: 'Law Society of Kenya',
          yearsExperience: 3,
          specializations: ['Criminal Law'],
          education: 'LLB - USIU-Africa',
          documents: {
            license: { url: '/docs/license3.pdf', uploaded: true },
            certificate: { url: '/docs/cert3.pdf', uploaded: true },
            id: { url: '/docs/id3.pdf', uploaded: true },
            cv: { url: '/docs/cv3.pdf', uploaded: true }
          },
          adminNotes: 'License verification failed. Applicant notified.',
          internalScore: 45
        }
      ];
      
      setApplications(mockApplications);
    } catch (err) {
      console.error('Load applications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = applications;

    if (statusFilter) {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.firstName.toLowerCase().includes(term) ||
        app.lastName.toLowerCase().includes(term) ||
        app.email.toLowerCase().includes(term) ||
        app.licenseNumber.toLowerCase().includes(term)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

    setFilteredApplications(filtered);
  };

  const handleReviewAction = async (applicationId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      setIsReviewing(true);
      
      // Mock API call - will integrate with backend
      console.log(`${action} application ${applicationId}`, { notes });
      
      setApplications(prev => prev.map(app => {
        if (app.id === applicationId) {
          return {
            ...app,
            status: action === 'approve' ? 'VERIFIED' : 'REJECTED',
            reviewedBy: 'current-admin@wakili.pro',
            reviewedAt: new Date().toISOString(),
            rejectionReason: action === 'reject' ? notes : undefined,
            adminNotes: notes
          };
        }
        return app;
      }));

      setShowDetails(false);
      setReviewNotes('');
    } catch (err) {
      console.error('Review action error:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: LawyerApplication['status']) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: LawyerApplication['status']) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'UNDER_REVIEW':
        return <Eye className="w-4 h-4" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <UserCheck className="w-6 h-6 mr-2 text-indigo-600" />
                Lawyer Verification
              </h1>
              <p className="text-gray-600 mt-1">
                Review and verify lawyer applications and credentials
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status counts */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {applications.filter(app => app.status === 'PENDING').length} Pending
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {applications.filter(app => app.status === 'UNDER_REVIEW').length} Reviewing
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by name, email, or license..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('');
                    setSearchTerm('');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-lg font-medium text-indigo-800">
                          {application.firstName[0]}{application.lastName[0]}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.firstName} {application.lastName}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1">{application.status.replace('_', ' ')}</span>
                          </span>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {application.email}
                          </div>
                          {application.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {application.phone}
                            </div>
                          )}
                          {application.location && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {application.location}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-1" />
                            License: {application.licenseNumber}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {application.yearsExperience} years experience
                          </div>
                        </div>

                        {application.currentFirm && (
                          <div className="mt-2 text-sm text-gray-600 flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {application.currentFirm}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Applied: {formatDate(application.appliedAt)}</span>
                        {application.reviewedAt && (
                          <span>Reviewed: {formatDate(application.reviewedAt)}</span>
                        )}
                        {application.reviewedBy && (
                          <span>By: {application.reviewedBy}</span>
                        )}
                      </div>
                      
                      {application.specializations.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {application.specializations.map((spec, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedApplication(application);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                    
                    {application.status === 'PENDING' && (
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          onClick={() => handleReviewAction(application.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetails(true);
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50 flex-1"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
              <p className="text-gray-600">
                {statusFilter || searchTerm 
                  ? 'No applications match your current filters.'
                  : 'No lawyer verification applications at this time.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Application Review: {selectedApplication.firstName} {selectedApplication.lastName}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Professional Details */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Professional Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.licenseNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bar Association</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.barAssociation}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.yearsExperience} years</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Firm</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedApplication.currentFirm || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Education</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplication.education}</p>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Specializations</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedApplication.specializations.map((spec, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Submitted Documents</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedApplication.documents).map(([docType, doc]) => (
                    <div key={docType} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {docType.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.uploaded ? 'Uploaded' : 'Missing'}
                          </p>
                        </div>
                      </div>
                      {doc.uploaded ? (
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      ) : (
                        <span className="text-xs text-red-600">Required</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedApplication.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Previous Notes</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedApplication.adminNotes}
                  </p>
                </div>
              )}

              {/* Review Section */}
              {selectedApplication.status !== 'VERIFIED' && selectedApplication.status !== 'REJECTED' && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Review Decision</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes (Optional)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your review decision..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleReviewAction(selectedApplication.id, 'reject', reviewNotes)}
                      disabled={isReviewing}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject Application
                    </Button>
                    <Button
                      onClick={() => handleReviewAction(selectedApplication.id, 'approve', reviewNotes)}
                      disabled={isReviewing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve & Verify
                    </Button>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedApplication.rejectionReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                  <p className="mt-1 text-sm text-red-700 bg-red-50 p-3 rounded-md">
                    {selectedApplication.rejectionReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LawyerVerification;