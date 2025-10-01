import axios from 'axios';
import type {
  Student,
  Course,
  CreateStudentRequest,
  CreateCertificateRequest,
  ApiResponse,
  CertificateWithDetails,
  CertificateTemplate,
  CreateTemplateRequest,
  GenerateFromTemplateRequest
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    const response = await api.get('/health');
    return response.data;
  },

  // Student endpoints
  async getAllStudents(): Promise<ApiResponse<Student[]>> {
    const response = await api.get('/api/students');
    return response.data;
  },

  async getStudentById(id: string): Promise<ApiResponse<Student>> {
    const response = await api.get(`/api/students/${id}`);
    return response.data;
  },

  async createStudent(student: CreateStudentRequest): Promise<ApiResponse<Student>> {
    const response = await api.post('/api/students', student);
    return response.data;
  },

  async deleteStudent(id: string): Promise<ApiResponse<any>> {
    const response = await api.delete(`/api/students/${id}`);
    return response.data;
  },

  async uploadStudentsCSV(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('csvFile', file);

    const response = await api.post('/api/students/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Course endpoints
  async getAllCourses(): Promise<ApiResponse<Course[]>> {
    const response = await api.get('/api/courses');
    return response.data;
  },

  async createCourse(course: { name: string; description?: string; durationHours?: number }): Promise<ApiResponse<Course>> {
    const response = await api.post('/api/courses', course);
    return response.data;
  },

  async deleteCourse(id: string): Promise<ApiResponse<any>> {
    const response = await api.delete(`/api/courses/${id}`);
    return response.data;
  },

  // Certificate endpoints
  async getAllCertificates(): Promise<ApiResponse<CertificateWithDetails[]>> {
    const response = await api.get('/api/certificates');
    return response.data;
  },

  async getCertificateById(id: string): Promise<ApiResponse<CertificateWithDetails>> {
    const response = await api.get(`/api/certificates/${id}`);
    return response.data;
  },

  async generateCertificate(request: CreateCertificateRequest): Promise<ApiResponse<any>> {
    const response = await api.post('/api/certificates/generate', request);
    return response.data;
  },

  async generateBulkCertificates(studentIds: string[], courseName: string, issueDate?: string): Promise<ApiResponse<any>> {
    const response = await api.post('/api/certificates/generate-bulk', {
      studentIds,
      courseName,
      issueDate
    });
    return response.data;
  },

  async downloadCertificate(certificateId: string): Promise<Blob> {
    const response = await api.get(`/api/certificates/${certificateId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async verifyCertificate(certificateId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/api/certificates/verify/${certificateId}`);
    return response.data;
  },

  async deleteCertificate(certificateId: string): Promise<ApiResponse<any>> {
    const response = await api.delete(`/api/certificates/${certificateId}`);
    return response.data;
  },

  // Template endpoints
  async uploadTemplate(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('template', file);

    const response = await api.post('/api/templates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async createTemplate(template: CreateTemplateRequest): Promise<ApiResponse<CertificateTemplate>> {
    const response = await api.post('/api/templates', template);
    return response.data;
  },

  async getAllTemplates(): Promise<ApiResponse<CertificateTemplate[]>> {
    const response = await api.get('/api/templates');
    return response.data;
  },

  async getTemplateById(id: string): Promise<ApiResponse<CertificateTemplate>> {
    const response = await api.get(`/api/templates/${id}`);
    return response.data;
  },

  async updateTemplate(id: string, updates: Partial<CertificateTemplate>): Promise<ApiResponse<CertificateTemplate>> {
    const response = await api.put(`/api/templates/${id}`, updates);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<ApiResponse<any>> {
    const response = await api.delete(`/api/templates/${id}`);
    return response.data;
  },

  async generateCertificateFromTemplate(request: GenerateFromTemplateRequest): Promise<ApiResponse<any>> {
    const response = await api.post('/api/certificates/generate-from-template', request);
    return response.data;
  },

  // Utility methods
  getCertificateDownloadUrl(certificateId: string): string {
    return `${API_BASE_URL}/api/certificates/${certificateId}/download`;
  },

  getCertificateVerificationUrl(certificateId: string): string {
    return `${API_BASE_URL}/verify/${certificateId}`;
  },

  getTemplateFileUrl(filename: string): string {
    return `${API_BASE_URL}/api/templates/file/${filename}`;
  },

  getTemplateThumbnailUrl(filename: string): string {
    return `${API_BASE_URL}/api/templates/thumbnail/${filename}`;
  }
};