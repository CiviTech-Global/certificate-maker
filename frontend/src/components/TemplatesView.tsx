import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Image as ImageIcon, Eye, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { TemplateEditor } from './TemplateEditor';
import type { CertificateTemplate } from '../types';
import toast from 'react-hot-toast';

export const TemplatesView: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: CertificateTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await apiService.deleteTemplate(template.id);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleToggleActive = async (template: CertificateTemplate) => {
    try {
      await apiService.updateTemplate(template.id, { isActive: !template.isActive });
      toast.success(`Template ${!template.isActive ? 'activated' : 'deactivated'} successfully`);
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificate Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage custom certificate templates</p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Templates Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first certificate template to get started
          </p>
          <button
            onClick={() => setShowEditor(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Template</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Preview */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {template.thumbnailPath && template.templateType === 'image' ? (
                  <img
                    src={apiService.getTemplateThumbnailUrl(template.thumbnailPath)}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {template.templateType === 'pdf' ? (
                      <FileText className="w-16 h-16 text-gray-400" />
                    ) : (
                      <ImageIcon className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      template.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{template.fields.length}</span>
                    <span>fields</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="uppercase text-xs font-semibold">{template.templateType}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      template.isActive
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {template.isActive ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Deactivate</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Activate</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      window.open(apiService.getTemplateFileUrl(template.filePath), '_blank');
                    }}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <TemplateEditor
          onClose={() => setShowEditor(false)}
          onSuccess={loadTemplates}
        />
      )}
    </div>
  );
};
