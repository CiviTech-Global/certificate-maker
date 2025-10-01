import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../services/api';
import type { TemplateField } from '../types';
import toast from 'react-hot-toast';

interface TemplateEditorProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_FIELDS = [
  { id: 'studentName', label: 'Student Name', type: 'text' as const },
  { id: 'courseName', label: 'Course Name', type: 'text' as const },
  { id: 'date', label: 'Issue Date', type: 'date' as const },
  { id: 'certificateNumber', label: 'Certificate Number', type: 'text' as const },
  { id: 'email', label: 'Email', type: 'text' as const },
  { id: 'nationalId', label: 'National ID', type: 'text' as const },
  { id: 'passportNo', label: 'Passport Number', type: 'text' as const },
];

const FONT_FAMILIES = ['Helvetica', 'Times-Roman', 'Courier'];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ onClose, onSuccess }) => {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [templateType, setTemplateType] = useState<'image' | 'pdf'>('image');
  const [templateDimensions, setTemplateDimensions] = useState({ width: 0, height: 0 });
  const [uploadedFileData, setUploadedFileData] = useState<any>(null);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(true);
  const [uploading, setUploading] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (templateFile && templateType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTemplatePreview(e.target?.result as string);
        // Upload file immediately to get correct dimensions from backend
        uploadTemplateFile(templateFile);
      };
      reader.readAsDataURL(templateFile);
    } else if (templateFile && templateType === 'pdf') {
      setTemplatePreview(URL.createObjectURL(templateFile));
      // Upload file immediately to get correct dimensions from backend
      uploadTemplateFile(templateFile);
    }
  }, [templateFile, templateType]);

  const uploadTemplateFile = async (file: File) => {
    try {
      setUploading(true);
      const uploadResponse = await apiService.uploadTemplate(file);

      if (uploadResponse.success && uploadResponse.data) {
        // Store the uploaded file data for later use
        setUploadedFileData(uploadResponse.data);

        // Use dimensions from backend (which may differ due to Sharp availability)
        setTemplateDimensions({
          width: uploadResponse.data.width,
          height: uploadResponse.data.height
        });
        console.log('✅ Template uploaded, dimensions:', uploadResponse.data.width, 'x', uploadResponse.data.height);
        toast.success('Template file uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('Failed to upload template file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase();
    if (ext.endsWith('.pdf')) {
      setTemplateType('pdf');
    } else if (ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg')) {
      setTemplateType('image');
    } else {
      toast.error('Please upload a valid image (PNG, JPG) or PDF file');
      return;
    }

    setTemplateFile(file);
  };

  const handleAddField = (fieldConfig: typeof AVAILABLE_FIELDS[0]) => {
    const newField: TemplateField = {
      id: `${fieldConfig.id}_${Date.now()}`,
      name: fieldConfig.id,
      type: fieldConfig.type,
      x: 50,
      y: 50,
      width: 200,
      height: 40,
      fontSize: 24,
      fontFamily: 'Helvetica',
      fontColor: '#000000',
      textAlign: 'left',
      fontWeight: 'normal',
      fontStyle: 'normal'
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const handleFieldMouseDown = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedField(fieldId);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    const scaleX = templateDimensions.width / rect.width;
    const scaleY = templateDimensions.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    setDragOffset({
      x: clickX - field.x,
      y: clickY - field.y
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedField) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = templateDimensions.width / rect.width;
    const scaleY = templateDimensions.height / rect.height;

    const newX = Math.max(0, Math.min((e.clientX - rect.left) * scaleX - dragOffset.x, templateDimensions.width));
    const newY = Math.max(0, Math.min((e.clientY - rect.top) * scaleY - dragOffset.y, templateDimensions.height));

    setFields(fields.map(field =>
      field.id === selectedField
        ? { ...field, x: newX, y: newY }
        : field
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const updateSelectedField = (updates: Partial<TemplateField>) => {
    if (!selectedField) return;
    setFields(fields.map(field =>
      field.id === selectedField
        ? { ...field, ...updates }
        : field
    ));
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!uploadedFileData) {
      toast.error('Please upload a template file first');
      return;
    }

    if (fields.length === 0) {
      toast.error('Please add at least one field to the template');
      return;
    }

    try {
      setUploading(true);

      // Use the already uploaded file data (no need to upload again)
      console.log('💾 Saving template with dimensions:', templateDimensions.width, 'x', templateDimensions.height);
      console.log('📋 Fields:', fields.map(f => ({ name: f.name, x: f.x, y: f.y })));

      // Create template with field configurations
      const createResponse = await apiService.createTemplate({
        name: templateName,
        description: templateDescription || undefined,
        templateType,
        filePath: uploadedFileData.filePath,
        thumbnailPath: uploadedFileData.thumbnailPath,
        fields,
        width: templateDimensions.width,
        height: templateDimensions.height
      });

      if (createResponse.success) {
        toast.success('Template created successfully!');
        onSuccess();
        onClose();
      } else {
        throw new Error(createResponse.error || 'Failed to create template');
      }
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast.error(error.message || 'Failed to create template');
    } finally {
      setUploading(false);
    }
  };

  const selectedFieldData = fields.find(f => f.id === selectedField);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Certificate Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Template Info & Field List */}
          <div className="w-80 border-r border-gray-200 flex flex-col overflow-y-auto">
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Standard Certificate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Template *
                </label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileSelect}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: PNG, JPG, PDF
                </p>
              </div>

              {templatePreview && (
                <>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Available Fields</h3>
                    </div>
                    <div className="space-y-2">
                      {AVAILABLE_FIELDS.map((fieldConfig) => (
                        <button
                          key={fieldConfig.id}
                          onClick={() => handleAddField(fieldConfig)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors text-sm"
                        >
                          <span className="text-gray-700">{fieldConfig.label}</span>
                          <Plus className="w-4 h-4 text-green-600" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Added Fields ({fields.length})</h3>
                    <div className="space-y-2">
                      {fields.map((field) => {
                        const fieldLabel = AVAILABLE_FIELDS.find(f => f.id === field.name)?.label || field.name;
                        return (
                          <div
                            key={field.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              selectedField === field.id
                                ? 'bg-green-100 border-2 border-green-500'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedField(field.id)}
                          >
                            <span className="text-sm text-gray-700">{fieldLabel}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteField(field.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Center Panel - Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                {templateDimensions.width > 0 && `${templateDimensions.width} × ${templateDimensions.height}px`}
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="text-sm">{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 bg-gray-100">
              {templatePreview ? (
                <div className="max-w-full mx-auto">
                  <div
                    ref={canvasRef}
                    className="relative bg-white shadow-lg mx-auto"
                    style={{
                      maxWidth: '100%',
                      aspectRatio: `${templateDimensions.width} / ${templateDimensions.height}`
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Template Image */}
                    {showPreview && templateType === 'image' && (
                      <img
                        ref={imageRef}
                        src={templatePreview}
                        alt="Template"
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    )}

                    {/* Field Overlays */}
                    {fields.map((field) => {
                      const fieldLabel = AVAILABLE_FIELDS.find(f => f.id === field.name)?.label || field.name;
                      return (
                        <div
                          key={field.id}
                          className={`absolute border-2 cursor-move ${
                            selectedField === field.id
                              ? 'border-green-500 bg-green-500 bg-opacity-20'
                              : 'border-blue-500 bg-blue-500 bg-opacity-10'
                          }`}
                          style={{
                            left: `${(field.x / templateDimensions.width) * 100}%`,
                            top: `${(field.y / templateDimensions.height) * 100}%`,
                            width: `${(field.width / templateDimensions.width) * 100}%`,
                            height: `${(field.height / templateDimensions.height) * 100}%`,
                          }}
                          onMouseDown={(e) => handleFieldMouseDown(field.id, e)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              className="text-xs font-semibold px-2 py-1 rounded"
                              style={{
                                backgroundColor: selectedField === field.id ? '#10B981' : '#3B82F6',
                                color: 'white'
                              }}
                            >
                              {fieldLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p className="text-lg font-medium mb-2">No template uploaded</p>
                    <p className="text-sm">Upload a template to start designing</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Field Properties */}
          <div className="w-80 border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              {selectedFieldData ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Field Properties</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position X</label>
                    <input
                      type="number"
                      value={Math.round(selectedFieldData.x)}
                      onChange={(e) => updateSelectedField({ x: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedFieldData.y)}
                      onChange={(e) => updateSelectedField({ y: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                    <input
                      type="number"
                      value={selectedFieldData.width}
                      onChange={(e) => updateSelectedField({ width: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                    <input
                      type="number"
                      value={selectedFieldData.height}
                      onChange={(e) => updateSelectedField({ height: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                    <input
                      type="number"
                      value={selectedFieldData.fontSize}
                      onChange={(e) => updateSelectedField({ fontSize: parseInt(e.target.value) || 12 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                    <select
                      value={selectedFieldData.fontFamily}
                      onChange={(e) => updateSelectedField({ fontFamily: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {FONT_FAMILIES.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Color</label>
                    <input
                      type="color"
                      value={selectedFieldData.fontColor}
                      onChange={(e) => updateSelectedField({ fontColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Align</label>
                    <select
                      value={selectedFieldData.textAlign}
                      onChange={(e) => updateSelectedField({ textAlign: e.target.value as 'left' | 'center' | 'right' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
                    <select
                      value={selectedFieldData.fontWeight}
                      onChange={(e) => updateSelectedField({ fontWeight: e.target.value as 'normal' | 'bold' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Style</label>
                    <select
                      value={selectedFieldData.fontStyle}
                      onChange={(e) => updateSelectedField({ fontStyle: e.target.value as 'normal' | 'italic' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">Select a field to edit its properties</p>
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
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploading || !templateName || !templateFile || fields.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{uploading ? 'Creating...' : 'Create Template'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
