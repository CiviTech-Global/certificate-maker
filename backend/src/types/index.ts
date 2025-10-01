export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  nationalId?: string;
  passportNo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  durationHours?: number;
  createdAt: Date;
}

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  certificateNumber: string;
  issueDate: Date;
  pdfPath?: string;
  verificationUrl?: string;
  qrCodeData?: string;
  createdAt: Date;
}

export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  email: string;
  nationalId?: string;
  passportNo?: string;
}

export interface CreateCertificateRequest {
  studentId: string;
  courseName: string;
  issueDate?: string;
}

export interface BulkStudentData {
  firstName: string;
  lastName: string;
  email: string;
  nationalId?: string;
  passportNo?: string;
  courseName: string;
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'date' | 'number';
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  templateType: 'image' | 'pdf';
  filePath: string;
  thumbnailPath?: string;
  fields: TemplateField[];
  width: number;
  height: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  templateType: 'image' | 'pdf';
  fields: TemplateField[];
  width: number;
  height: number;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  fields?: TemplateField[];
  isActive?: boolean;
}

export interface GenerateFromTemplateRequest {
  templateId: string;
  studentId: string;
  courseName: string;
  issueDate?: string;
}