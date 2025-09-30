import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, FileText, User, Mail, GraduationCap, Calendar, ExternalLink } from 'lucide-react';
import { apiService } from '../services/api';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';

interface VerificationResult {
  valid: boolean;
  certificate: {
    id: string;
    certificateNumber: string;
    issueDate: Date;
    createdAt: Date;
  };
  student: {
    firstName: string;
    lastName: string;
    email: string;
    nationalId?: string;
    passportNo?: string;
  };
  course: {
    name: string;
  };
  message: string;
}

export const VerificationView: React.FC = () => {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!certificateId.trim()) {
      toast.error('Please enter a certificate ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await apiService.verifyCertificate(certificateId.trim());

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Certificate not found');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to verify certificate';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnline = () => {
    if (result?.certificate?.id) {
      const verificationUrl = apiService.getCertificateVerificationUrl(result.certificate.id);
      window.open(verificationUrl, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Certificate Verification</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Enter a certificate ID to verify its authenticity and view details
        </p>
      </div>

      {/* Verification Form */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate ID
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="Enter certificate ID (e.g., from QR code scan)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center font-mono"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                The certificate ID can be found in the QR code or certificate URL
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !certificateId.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium py-3 px-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Verify Certificate</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Verification Result */}
      {(result || error) && (
        <div className="max-w-4xl mx-auto">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Certificate Not Found</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : result && (
            <div className="bg-green-50 border border-green-200 rounded-xl overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-semibold">Certificate Verified</h3>
                    <p className="text-green-100">{result.message}</p>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="p-6 space-y-6">
                {/* Certificate Info */}
                <div className="bg-white rounded-lg border border-green-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span>Certificate Information</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Certificate Number</p>
                      <p className="font-mono text-lg font-semibold text-gray-900">
                        {result.certificate.certificateNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Issue Date</p>
                      <p className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{formatDate(result.certificate.issueDate)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Student Info */}
                <div className="bg-white rounded-lg border border-green-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>Student Information</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {result.student.firstName} {result.student.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{result.student.email}</span>
                      </p>
                    </div>
                    {result.student.nationalId && (
                      <div>
                        <p className="text-sm text-gray-600">National ID</p>
                        <p className="text-lg font-semibold text-gray-900">{result.student.nationalId}</p>
                      </div>
                    )}
                    {result.student.passportNo && (
                      <div>
                        <p className="text-sm text-gray-600">Passport Number</p>
                        <p className="text-lg font-semibold text-gray-900">{result.student.passportNo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Info */}
                <div className="bg-white rounded-lg border border-green-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                    <span>Course Information</span>
                  </h4>
                  <div>
                    <p className="text-sm text-gray-600">Course Name</p>
                    <p className="text-xl font-semibold text-gray-900">{result.course.name}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleViewOnline}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all px-6 py-3"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>View Online Certificate</span>
                  </button>
                </div>

                {/* Verification Timestamp */}
                <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
                  <p>Verified on {new Date().toLocaleString()}</p>
                  <p>Certificate ID: {result.certificate.id}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* How to Use */}
      {!result && !error && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Verify a Certificate</h3>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  1
                </div>
                <p>Scan the QR code on the certificate or copy the certificate URL</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  2
                </div>
                <p>Extract the certificate ID from the URL (the part after /verify/)</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  3
                </div>
                <p>Enter the certificate ID in the field above and click "Verify Certificate"</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};