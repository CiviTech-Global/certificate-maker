import sqlite3 from 'sqlite3';
import { Student, Course, Certificate, CertificateTemplate } from '../types';

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = './database.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  private initializeTables(): void {
    this.db.serialize(() => {
      // Students table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          national_id TEXT,
          passport_no TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Courses table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS courses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          duration_hours INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Certificates table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS certificates (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          course_id TEXT NOT NULL,
          certificate_number TEXT UNIQUE NOT NULL,
          issue_date DATE NOT NULL,
          pdf_path TEXT,
          verification_url TEXT,
          qr_code_data TEXT,
          template_id TEXT,
          generation_method TEXT DEFAULT 'programmatic',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students (id),
          FOREIGN KEY (course_id) REFERENCES courses (id),
          FOREIGN KEY (template_id) REFERENCES certificate_templates (id)
        )
      `);

      // Certificate templates table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS certificate_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          template_type TEXT NOT NULL,
          file_path TEXT NOT NULL,
          thumbnail_path TEXT,
          fields TEXT NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });
  }

  // Student operations
  async createStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
    return new Promise((resolve, reject) => {
      const id = require('uuid').v4();
      const now = new Date().toISOString();

      this.db.run(
        `INSERT INTO students (id, first_name, last_name, email, national_id, passport_no, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, student.firstName, student.lastName, student.email, student.nationalId, student.passportNo, now, now],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
              nationalId: student.nationalId,
              passportNo: student.passportNo,
              createdAt: new Date(now),
              updatedAt: new Date(now)
            });
          }
        }
      );
    });
  }

  async getAllStudents(): Promise<Student[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM students ORDER BY created_at DESC`, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            nationalId: row.national_id,
            passportNo: row.passport_no,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
          })));
        }
      });
    });
  }

  async getStudentById(id: string): Promise<Student | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM students WHERE id = ?`, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            nationalId: row.national_id,
            passportNo: row.passport_no,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
          });
        }
      });
    });
  }

  async deleteStudent(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM students WHERE id = ?`, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Course operations
  async createCourse(course: Omit<Course, 'id' | 'createdAt'>): Promise<Course> {
    return new Promise((resolve, reject) => {
      const id = require('uuid').v4();
      const now = new Date().toISOString();

      this.db.run(
        `INSERT INTO courses (id, name, description, duration_hours, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, course.name, course.description, course.durationHours, now],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              name: course.name,
              description: course.description,
              durationHours: course.durationHours,
              createdAt: new Date(now)
            });
          }
        }
      );
    });
  }

  async findCourseByName(name: string): Promise<Course | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM courses WHERE name = ?`, [name], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            id: row.id,
            name: row.name,
            description: row.description,
            durationHours: row.duration_hours,
            createdAt: new Date(row.created_at)
          });
        }
      });
    });
  }

  async getAllCourses(): Promise<Course[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM courses ORDER BY created_at DESC`, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            durationHours: row.duration_hours,
            createdAt: new Date(row.created_at)
          })));
        }
      });
    });
  }

  async deleteCourse(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM courses WHERE id = ?`, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Certificate operations
  async createCertificate(certificate: Omit<Certificate, 'id' | 'createdAt'>): Promise<Certificate> {
    return new Promise((resolve, reject) => {
      const id = require('uuid').v4();
      const now = new Date().toISOString();

      this.db.run(
        `INSERT INTO certificates (id, student_id, course_id, certificate_number, issue_date, pdf_path, verification_url, qr_code_data, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, certificate.studentId, certificate.courseId, certificate.certificateNumber, certificate.issueDate.toISOString().split('T')[0], certificate.pdfPath, certificate.verificationUrl, certificate.qrCodeData, now],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              studentId: certificate.studentId,
              courseId: certificate.courseId,
              certificateNumber: certificate.certificateNumber,
              issueDate: certificate.issueDate,
              pdfPath: certificate.pdfPath,
              verificationUrl: certificate.verificationUrl,
              qrCodeData: certificate.qrCodeData,
              createdAt: new Date(now)
            });
          }
        }
      );
    });
  }

  async getCertificateById(id: string): Promise<Certificate | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT c.*, s.first_name, s.last_name, s.email, co.name as course_name
         FROM certificates c
         JOIN students s ON c.student_id = s.id
         JOIN courses co ON c.course_id = co.id
         WHERE c.id = ?`,
        [id],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            resolve({
              id: row.id,
              studentId: row.student_id,
              courseId: row.course_id,
              certificateNumber: row.certificate_number,
              issueDate: new Date(row.issue_date),
              pdfPath: row.pdf_path,
              verificationUrl: row.verification_url,
              qrCodeData: row.qr_code_data,
              createdAt: new Date(row.created_at)
            });
          }
        }
      );
    });
  }

  async getCertificateWithDetails(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT c.*, s.first_name, s.last_name, s.email, s.national_id, s.passport_no, co.name as course_name
         FROM certificates c
         JOIN students s ON c.student_id = s.id
         JOIN courses co ON c.course_id = co.id
         WHERE c.id = ?`,
        [id],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            resolve({
              certificate: {
                id: row.id,
                certificateNumber: row.certificate_number,
                issueDate: new Date(row.issue_date),
                createdAt: new Date(row.created_at)
              },
              student: {
                firstName: row.first_name,
                lastName: row.last_name,
                email: row.email,
                nationalId: row.national_id,
                passportNo: row.passport_no
              },
              course: {
                name: row.course_name
              }
            });
          }
        }
      );
    });
  }

  async getAllCertificates(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT c.*, s.first_name, s.last_name, s.email, co.name as course_name
         FROM certificates c
         JOIN students s ON c.student_id = s.id
         JOIN courses co ON c.course_id = co.id
         ORDER BY c.created_at DESC`,
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => ({
              certificate: {
                id: row.id,
                certificateNumber: row.certificate_number,
                issueDate: new Date(row.issue_date),
                createdAt: new Date(row.created_at)
              },
              student: {
                firstName: row.first_name,
                lastName: row.last_name,
                email: row.email
              },
              course: {
                name: row.course_name
              }
            })));
          }
        }
      );
    });
  }

  async updateCertificate(id: string, updates: Partial<Certificate>): Promise<Certificate | null> {
    return new Promise((resolve, reject) => {
      const setParts: string[] = [];
      const values: any[] = [];

      if (updates.pdfPath !== undefined) {
        setParts.push('pdf_path = ?');
        values.push(updates.pdfPath);
      }
      if (updates.verificationUrl !== undefined) {
        setParts.push('verification_url = ?');
        values.push(updates.verificationUrl);
      }
      if (updates.qrCodeData !== undefined) {
        setParts.push('qr_code_data = ?');
        values.push(updates.qrCodeData);
      }

      if (setParts.length === 0) {
        // Just fetch and return the certificate
        this.db.get('SELECT * FROM certificates WHERE id = ?', [id], (err, row: any) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else resolve(this.mapCertificateRow(row));
        });
        return;
      }

      values.push(id);

      this.db.run(
        `UPDATE certificates SET ${setParts.join(', ')} WHERE id = ?`,
        values,
        (err) => {
          if (err) {
            reject(err);
          } else {
            // Fetch and return updated certificate
            this.db.get('SELECT * FROM certificates WHERE id = ?', [id], (err, row: any) => {
              if (err) reject(err);
              else if (!row) resolve(null);
              else resolve(this.mapCertificateRow(row));
            });
          }
        }
      );
    });
  }

  private mapCertificateRow(row: any): Certificate {
    return {
      id: row.id,
      studentId: row.student_id,
      courseId: row.course_id,
      certificateNumber: row.certificate_number,
      issueDate: new Date(row.issue_date),
      pdfPath: row.pdf_path,
      verificationUrl: row.verification_url,
      qrCodeData: row.qr_code_data,
      createdAt: new Date(row.created_at)
    };
  }

  async deleteCertificate(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM certificates WHERE id = ?`, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Template operations
  async createTemplate(template: Omit<CertificateTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<CertificateTemplate> {
    return new Promise((resolve, reject) => {
      const id = require('uuid').v4();
      const now = new Date().toISOString();

      this.db.run(
        `INSERT INTO certificate_templates (id, name, description, template_type, file_path, thumbnail_path, fields, width, height, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, template.name, template.description, template.templateType, template.filePath, template.thumbnailPath, JSON.stringify(template.fields), template.width, template.height, template.isActive ? 1 : 0, now, now],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              name: template.name,
              description: template.description,
              templateType: template.templateType,
              filePath: template.filePath,
              thumbnailPath: template.thumbnailPath,
              fields: template.fields,
              width: template.width,
              height: template.height,
              isActive: template.isActive,
              createdAt: new Date(now),
              updatedAt: new Date(now)
            });
          }
        }
      );
    });
  }

  async getAllTemplates(): Promise<CertificateTemplate[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM certificate_templates ORDER BY created_at DESC`, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            templateType: row.template_type,
            filePath: row.file_path,
            thumbnailPath: row.thumbnail_path,
            fields: JSON.parse(row.fields),
            width: row.width,
            height: row.height,
            isActive: row.is_active === 1,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
          })));
        }
      });
    });
  }

  async getTemplateById(id: string): Promise<CertificateTemplate | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM certificate_templates WHERE id = ?`, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            id: row.id,
            name: row.name,
            description: row.description,
            templateType: row.template_type,
            filePath: row.file_path,
            thumbnailPath: row.thumbnail_path,
            fields: JSON.parse(row.fields),
            width: row.width,
            height: row.height,
            isActive: row.is_active === 1,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
          });
        }
      });
    });
  }

  async updateTemplate(id: string, updates: Partial<CertificateTemplate>): Promise<CertificateTemplate | null> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const setParts: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        setParts.push('name = ?');
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        setParts.push('description = ?');
        values.push(updates.description);
      }
      if (updates.fields !== undefined) {
        setParts.push('fields = ?');
        values.push(JSON.stringify(updates.fields));
      }
      if (updates.isActive !== undefined) {
        setParts.push('is_active = ?');
        values.push(updates.isActive ? 1 : 0);
      }

      setParts.push('updated_at = ?');
      values.push(now);
      values.push(id);

      if (setParts.length === 1) {
        this.getTemplateById(id).then(resolve).catch(reject);
        return;
      }

      this.db.run(
        `UPDATE certificate_templates SET ${setParts.join(', ')} WHERE id = ?`,
        values,
        (err) => {
          if (err) {
            reject(err);
          } else {
            this.getTemplateById(id).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM certificate_templates WHERE id = ?`, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  close(): void {
    this.db.close();
  }
}