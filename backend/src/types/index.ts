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