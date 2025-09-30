import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Download, FileText, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { apiService } from '../services/api';
import { downloadCSVTemplate } from '../utils';
import toast from 'react-hot-toast';

interface BulkUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadResult {
  created: number;
  errors: number;
  students: Array<{
    student: any;
    course: string;
  }>;
  errorDetails: string[];
}

export const BulkUpload: React.FC<BulkUploadProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (csvFile && csvFile.type === 'text/csv') {
      setFile(csvFile);
      setResult(null);
    } else {
      toast.error('Please upload a CSV file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      setUploading(true);
      const response = await apiService.uploadStudentsCSV(file);

      if (response.success) {
        setResult(response.data);
        toast.success(`Successfully processed ${response.data.created} students`);

        if (response.data.errors > 0) {
          toast.error(`${response.data.errors} errors encountered`);
        }
      } else {
        toast.error(response.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Students</h2>
              <p className="text-sm text-gray-500">Upload multiple students from CSV file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {!result ? (
            <>
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900">CSV Template</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Download the CSV template to ensure proper formatting
                    </p>
                    <button
                      onClick={downloadCSVTemplate}
                      className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CSV Format Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">CSV Format Requirements</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Required columns:</strong> firstName, lastName, email, courseName</p>
                  <p><strong>Optional columns:</strong> nationalId, passportNo</p>
                  <p><strong>Example:</strong></p>
                  <code className="block bg-white p-2 rounded border text-xs mt-2">
                    firstName,lastName,email,nationalId,passportNo,courseName<br/>
                    John,Doe,john.doe@example.com,123456789,P123456,Web Development
                  </code>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-green-500 bg-green-50'
                    : file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-gray-600" />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-green-700">{file.name}</p>
                      <p className="text-xs text-green-600">Ready to upload</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {isDragActive ? 'Drop CSV file here' : 'Drag and drop CSV file here'}
                      </p>
                      <p className="text-xs text-gray-500">or click to browse files</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium py-3 px-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload Students</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Upload Results */}
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">Upload Complete</h3>
                      <p className="text-green-700">
                        Successfully processed {result.created} students
                        {result.errors > 0 && ` with ${result.errors} errors`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{result.created}</p>
                        <p className="text-sm text-gray-600">Students Created</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{result.errors}</p>
                        <p className="text-sm text-gray-600">Errors</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Created Students */}
                {result.students.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Created Students</h4>
                    <div className="bg-white border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {result.students.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.student.firstName} {item.student.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{item.student.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{item.course}</p>
                            <p className="text-xs text-green-600">✓ Created</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {result.errorDetails.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Errors</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <ul className="space-y-1 text-sm text-red-700">
                        {result.errorDetails.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setResult(null);
                      setFile(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Upload More
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium py-3 px-4"
                  >
                    Done
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};