import React, { useState, useEffect } from 'react';
import { Search, User, Mail, CreditCard, FileText, Award, Plus, Upload } from 'lucide-react';
import { apiService } from '../services/api';
import type { Student } from '../types';
import { formatDateTime } from '../utils';
import toast from 'react-hot-toast';

interface StudentsViewProps {
  onCreateStudent: () => void;
  onBulkUpload: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onCreateStudent, onBulkUpload }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingCertificate, setGeneratingCertificate] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllStudents();
      if (response.success && response.data) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nationalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.passportNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredStudents(filtered);
  };

  const handleGenerateCertificate = async (student: Student) => {
    const courseName = prompt('Enter course name for the certificate:');
    if (!courseName?.trim()) {
      return;
    }

    try {
      setGeneratingCertificate(student.id);
      const response = await apiService.generateCertificate({
        studentId: student.id,
        courseName: courseName.trim()
      });

      if (response.success) {
        toast.success('Certificate generated successfully!');

        // Optionally download the certificate
        if (response.data?.certificate?.id) {
          const downloadConfirm = confirm('Certificate generated! Do you want to download it now?');
          if (downloadConfirm) {
            try {
              const blob = await apiService.downloadCertificate(response.data.certificate.id);
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${response.data.certificate.certificateNumber}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            } catch (downloadError) {
              console.error('Download error:', downloadError);
              toast.error('Certificate generated but download failed');
            }
          }
        }
      } else {
        toast.error(response.error || 'Failed to generate certificate');
      }
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      toast.error(error.response?.data?.error || 'Failed to generate certificate');
    } finally {
      setGeneratingCertificate(null);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">Manage all registered students</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onBulkUpload}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={onCreateStudent}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search students by name, email, or ID..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Students Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
              <p className="text-sm text-gray-600">Filtered Results</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter(s => s.email).length}
              </p>
              <p className="text-sm text-gray-600">With Email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">IDs</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Registered</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{student.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {student.nationalId && (
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{student.nationalId}</span>
                          </div>
                        )}
                        {student.passportNo && (
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{student.passportNo}</span>
                          </div>
                        )}
                        {!student.nationalId && !student.passportNo && (
                          <span className="text-sm text-gray-400">No IDs provided</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {formatDateTime(student.createdAt)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleGenerateCertificate(student)}
                        disabled={generatingCertificate === student.id}
                        className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingCertificate === student.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Award className="w-4 h-4" />
                        )}
                        <span>Generate Certificate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No students found' : 'No students registered yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first student or uploading a CSV file'
              }
            </p>
            {!searchTerm && (
              <div className="flex justify-center space-x-3">
                <button
                  onClick={onCreateStudent}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all px-4 py-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Student</span>
                </button>
                <button
                  onClick={onBulkUpload}
                  className="flex items-center space-x-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors px-4 py-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Bulk Upload</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};