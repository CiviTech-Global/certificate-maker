import React, { useState, useEffect } from 'react';
import { Search, Award, Download, ExternalLink, Calendar, User, GraduationCap, QrCode } from 'lucide-react';
import { apiService } from '../services/api';
import type { CertificateWithDetails } from '../types';
import { formatDate, formatDateTime, downloadBlob } from '../utils';
import toast from 'react-hot-toast';

export const CertificatesView: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<CertificateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, searchTerm]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllCertificates();
      if (response.success && response.data) {
        setCertificates(response.data);
      }
    } catch (error) {
      console.error('Error loading certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const filterCertificates = () => {
    if (!searchTerm) {
      setFilteredCertificates(certificates);
      return;
    }

    const filtered = certificates.filter(cert =>
      `${cert.student.firstName} ${cert.student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificate.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredCertificates(filtered);
  };

  const handleDownload = async (certificateId: string, certificateNumber: string) => {
    try {
      setDownloadingId(certificateId);
      const blob = await apiService.downloadCertificate(certificateId);
      downloadBlob(blob, `${certificateNumber}.pdf`);
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewOnline = (certificateId: string) => {
    const verificationUrl = apiService.getCertificateVerificationUrl(certificateId);
    window.open(verificationUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-600">View and manage all generated certificates</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search certificates by student name, course, or certificate number..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Certificates Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              <p className="text-sm text-gray-600">Total Certificates</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(certificates.map(c => c.student.email)).size}
              </p>
              <p className="text-sm text-gray-600">Unique Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(certificates.map(c => c.course.name)).size}
              </p>
              <p className="text-sm text-gray-600">Unique Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.filter(c =>
                  new Date(c.certificate.issueDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length}
              </p>
              <p className="text-sm text-gray-600">Last 30 Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredCertificates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Certificate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Course</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Issue Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.certificate.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 font-mono text-sm">
                            {cert.certificate.certificateNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created {formatDateTime(cert.certificate.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {cert.student.firstName} {cert.student.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{cert.student.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{cert.course.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {formatDate(cert.certificate.issueDate)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(cert.certificate.id, cert.certificate.certificateNumber)}
                          disabled={downloadingId === cert.certificate.id}
                          className="flex items-center space-x-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download PDF"
                        >
                          {downloadingId === cert.certificate.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleViewOnline(cert.certificate.id)}
                          className="flex items-center space-x-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors px-3 py-2 text-sm"
                          title="View Online"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const verificationUrl = apiService.getCertificateVerificationUrl(cert.certificate.id);
                            navigator.clipboard.writeText(verificationUrl);
                            toast.success('Verification URL copied to clipboard');
                          }}
                          className="flex items-center space-x-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors px-3 py-2 text-sm"
                          title="Copy QR Code URL"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No certificates found' : 'No certificates generated yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Certificates will appear here once you generate them for students'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};