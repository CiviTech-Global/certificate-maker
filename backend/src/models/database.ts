import sqlite3 from 'sqlite3';
import { Student, Course, Certificate } from '../types';

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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students (id),
          FOREIGN KEY (course_id) REFERENCES courses (id)
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

  close(): void {
    this.db.close();
  }
}