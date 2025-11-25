import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  FileText,
  User,
  Calendar,
  Building2,
  Phone,
  Mail,
  Award,
  Download,
  Loader2,
  Shield
} from 'lucide-react';

interface CertificateVerification {
  valid: boolean;
  certificateId: string;
  documentName: string;
  reviewType: string;
  certificationDate: string;
  lawyerName: string;
  licenseNumber: string;
  firmName: string;
  firmAddress?: string;
  firmPhone?: string;
  firmEmail?: string;
  certificationStatus: string;
  certifiedDocumentUrl?: string;
  certificateUrl?: string;
  verificationQRCodeUrl?: string;
}

const VerifyCertificate: React.FC = () => {
  const { certificateId: urlCertificateId } = useParams<{ certificateId: string }>();
  const [certificateId, setCertificateId] = useState(urlCertificateId || '');
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlCertificateId) {
      verifyCertificate(urlCertificateId);
    }
  }, [urlCertificateId]);

  const verifyCertificate = async (id: string) => {
    if (!id.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError(null);
    setVerification(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/certification/verify/${id.trim()}`);
      const data = await response.json();

      if (data.success) {
        setVerification(data.data);
      } else {
        setError(data.message || 'Certificate not found');
      }
    } catch (err) {
      console.error('Error verifying certificate:', err);
      setError('Failed to verify certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCertificate(certificateId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Wakili Pro</h1>
                <p className="text-xs text-slate-600">Certificate Verification</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Certificate</h2>
            <p className="text-sm text-slate-600">
              Enter a certificate ID to verify its authenticity
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Certificate ID
              </label>
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="WP-2024-ABC12345"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Format: PREFIX-YEAR-UNIQUEID (e.g., WP-2024-ABC12345)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Verify Certificate</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Certificate Not Found</h3>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Please verify the certificate ID and try again. Certificate IDs are case-sensitive.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Result */}
        {verification && (
          <div className="space-y-6">
            {/* Status Banner */}
            {verification.valid ? (
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 text-white p-3 rounded-full">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-900">Certificate Valid</h3>
                    <p className="text-sm text-green-700">
                      This certificate has been verified and is authentic
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-500 text-white p-3 rounded-full">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-amber-900">Certificate Status Unknown</h3>
                    <p className="text-sm text-amber-700">
                      Please contact the issuing lawyer for more information
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-1">Certificate Details</h3>
                <p className="text-blue-100 text-sm">ID: {verification.certificateId}</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Document Information */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Document Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600">Document Name</p>
                      <p className="text-sm font-medium text-slate-900">{verification.documentName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Review Type</p>
                      <p className="text-sm font-medium text-slate-900">{verification.reviewType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Certification Date</p>
                      <p className="text-sm font-medium text-slate-900 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(verification.certificationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Status</p>
                      <p className="text-sm font-medium text-slate-900">{verification.certificationStatus}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2 text-indigo-600" />
                    Certifying Lawyer
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-600">Name</p>
                      <p className="text-sm font-medium text-slate-900">{verification.lawyerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">License Number</p>
                      <p className="text-sm font-medium text-slate-900 flex items-center">
                        <Award className="h-3 w-3 mr-1" />
                        {verification.licenseNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Firm Information */}
                <div className="border-t border-slate-200 pt-6">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-slate-600" />
                    Law Firm
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-600">Firm Name</p>
                      <p className="text-sm font-medium text-slate-900">{verification.firmName}</p>
                    </div>
                    {verification.firmAddress && (
                      <div>
                        <p className="text-xs text-slate-600">Address</p>
                        <p className="text-sm font-medium text-slate-900">{verification.firmAddress}</p>
                      </div>
                    )}
                    {verification.firmPhone && (
                      <div>
                        <p className="text-xs text-slate-600">Phone</p>
                        <p className="text-sm font-medium text-slate-900 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {verification.firmPhone}
                        </p>
                      </div>
                    )}
                    {verification.firmEmail && (
                      <div>
                        <p className="text-xs text-slate-600">Email</p>
                        <p className="text-sm font-medium text-slate-900 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {verification.firmEmail}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download Links */}
                {(verification.certifiedDocumentUrl || verification.certificateUrl) && (
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Downloads</h4>
                    <div className="space-y-2">
                      {verification.certifiedDocumentUrl && (
                        <a
                          href={`${import.meta.env.VITE_API_URL}${verification.certifiedDocumentUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-3 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-100 flex items-center justify-between"
                        >
                          <span>Certified Document</span>
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      {verification.certificateUrl && (
                        <a
                          href={`${import.meta.env.VITE_API_URL}${verification.certificateUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-3 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 flex items-center justify-between"
                        >
                          <span>Certificate of Authenticity</span>
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* QR Code */}
                {verification.verificationQRCodeUrl && (
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 text-center">
                      Verification QR Code
                    </h4>
                    <div className="flex justify-center">
                      <img
                        src={`${import.meta.env.VITE_API_URL}${verification.verificationQRCodeUrl}`}
                        alt="Verification QR Code"
                        className="w-48 h-48 border-2 border-slate-200 rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">
                      Scan this QR code to verify the certificate on your mobile device
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-600 text-center">
                This verification is provided as-is and does not constitute legal advice. 
                Always verify the authenticity of legal documents through official channels.
                For questions about this certification, please contact the certifying lawyer directly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;
