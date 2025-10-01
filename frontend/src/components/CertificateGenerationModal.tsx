import { useState, useEffect } from 'react';
import { X, FileText, Palette, Calendar } from 'lucide-react';
import { apiService } from '../services/api';
import type { Student, CertificateTemplate } from '../types';
import toast from 'react-hot-toast';

interface CertificateGenerationModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

export const CertificateGenerationModal: React.FC<CertificateGenerationModalProps> = ({
  student,
  onClose,
  onSuccess
}) => {
  const [generationMethod, setGenerationMethod] = useState<'programmatic' | 'template'>('programmatic');
  const [courseName, setCourseName] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await apiService.getAllTemplates();
      if (response.success && response.data) {
        // Filter only active templates
        const activeTemplates = response.data.filter(t => t.isActive);
        setTemplates(activeTemplates);
        if (activeTemplates.length > 0) {
          setSelectedTemplate(activeTemplates[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleGenerate = async () => {
    if (!courseName.trim()) {
      toast.error('Please enter a course name');
      return;
    }

    if (generationMethod === 'template' && !selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    try {
      setLoading(true);

      let response;
      if (generationMethod === 'programmatic') {
        response = await apiService.generateCertificate({
          studentId: student.id,
          courseName: courseName.trim(),
          issueDate
        });
      } else {
        response = await apiService.generateCertificateFromTemplate({
          templateId: selectedTemplate,
          studentId: student.id,
          courseName: courseName.trim(),
          issueDate
        });
      }

      if (response.success) {
        toast.success('Certificate generated successfully!');

        // Download the certificate
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

        onSuccess();
        onClose();
      } else {
        toast.error(response.error || 'Failed to generate certificate');
      }
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      toast.error(error.response?.data?.error || 'Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Generate Certificate</h2>
            <p className="text-sm text-gray-600 mt-1">
              For {student.firstName} {student.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Generation Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Certificate Generation Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGenerationMethod('programmatic')}
                className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                  generationMethod === 'programmatic'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className={`w-8 h-8 mb-2 ${
                  generationMethod === 'programmatic' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  generationMethod === 'programmatic' ? 'text-green-700' : 'text-gray-700'
                }`}>
                  Standard Design
                </span>
                <span className="text-xs text-gray-500 text-center mt-1">
                  Use default certificate template
                </span>
              </button>

              <button
                onClick={() => setGenerationMethod('template')}
                disabled={templates.length === 0}
                className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                  generationMethod === 'template'
                    ? 'border-green-500 bg-green-50'
                    : templates.length === 0
                    ? 'border-gray-200 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Palette className={`w-8 h-8 mb-2 ${
                  generationMethod === 'template' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  generationMethod === 'template' ? 'text-green-700' : 'text-gray-700'
                }`}>
                  Custom Template
                </span>
                <span className="text-xs text-gray-500 text-center mt-1">
                  {templates.length > 0 ? `${templates.length} available` : 'No templates available'}
                </span>
              </button>
            </div>
          </div>

          {/* Template Selection (only if template method is selected) */}
          {generationMethod === 'template' && templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Template *
              </label>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`flex items-center p-4 border-2 rounded-lg transition-all text-left ${
                        selectedTemplate === template.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-4">
                        {template.thumbnailPath ? (
                          <img
                            src={apiService.getTemplateThumbnailUrl(template.thumbnailPath)}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          selectedTemplate === template.id ? 'text-green-700' : 'text-gray-900'
                        }`}>
                          {template.name}
                        </h4>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                          <span>{template.fields.length} fields</span>
                          <span>•</span>
                          <span className="uppercase">{template.templateType}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Course Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name *
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Web Development Fundamentals"
            />
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Student Info Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Student Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">
                  {student.firstName} {student.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{student.email}</span>
              </div>
              {student.nationalId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">National ID:</span>
                  <span className="font-medium text-gray-900">{student.nationalId}</span>
                </div>
              )}
              {student.passportNo && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Passport No:</span>
                  <span className="font-medium text-gray-900">{student.passportNo}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !courseName.trim() || (generationMethod === 'template' && !selectedTemplate)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Certificate'}
          </button>
        </div>
      </div>
    </div>
  );
};
