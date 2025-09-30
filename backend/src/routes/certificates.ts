import express from 'express';
import path from 'path';
import fs from 'fs';
import { Database } from '../models/database';
import { CertificateGenerator } from '../utils/certificateGenerator';
import { CreateCertificateRequest } from '../types';

const router = express.Router();

export function createCertificateRoutes(db: Database) {
  // Get all certificates
  router.get('/', async (req, res) => {
    try {
      const certificates = await db.getAllCertificates();
      res.json({ success: true, data: certificates });
    } catch (error) {
      console.error('Error fetching certificates:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch certificates' });
    }
  });

  // Get certificate by ID with full details
  router.get('/:id', async (req, res) => {
    try {
      const certificate = await db.getCertificateWithDetails(req.params.id);
      if (!certificate) {
        return res.status(404).json({ success: false, error: 'Certificate not found' });
      }
      res.json({ success: true, data: certificate });
    } catch (error) {
      console.error('Error fetching certificate:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch certificate' });
    }
  });

  // Generate certificate for a student
  router.post('/generate', async (req, res) => {
    try {
      const { studentId, courseName, issueDate }: CreateCertificateRequest = req.body;

      // Validate required fields
      if (!studentId || !courseName) {
        return res.status(400).json({
          success: false,
          error: 'Student ID and course name are required'
        });
      }

      // Get student details
      const student = await db.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }

      // Find or create course
      let course = await db.findCourseByName(courseName);
      if (!course) {
        course = await db.createCourse({
          name: courseName,
          description: `Course: ${courseName}`
        });
      }

      // Generate certificate number
      const certificateNumber = CertificateGenerator.generateCertificateNumber();
      const certificateId = require('uuid').v4();

      // Create verification URL
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const verificationUrl = `${baseUrl}/verify/${certificateId}`;

      // Generate PDF
      const pdfFileName = `${certificateNumber}.pdf`;
      const pdfPath = path.join(__dirname, '../../certificates', pdfFileName);

      // Ensure certificates directory exists
      const certificatesDir = path.dirname(pdfPath);
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
      }

      const certificateData = {
        studentName: `${student.firstName} ${student.lastName}`,
        courseName: course.name,
        issueDate: issueDate ? new Date(issueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        certificateNumber,
        verificationUrl
      };

      await CertificateGenerator.generateCertificate(certificateData, pdfPath);

      // Save certificate to database
      const certificate = await db.createCertificate({
        studentId: student.id,
        courseId: course.id,
        certificateNumber,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        pdfPath: pdfFileName,
        verificationUrl,
        qrCodeData: verificationUrl
      });

      res.status(201).json({
        success: true,
        data: {
          certificate,
          student: {
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email
          },
          course: {
            name: course.name
          },
          downloadUrl: `/api/certificates/${certificate.id}/download`
        }
      });

    } catch (error) {
      console.error('Error generating certificate:', error);
      res.status(500).json({ success: false, error: 'Failed to generate certificate' });
    }
  });

  // Download certificate PDF
  router.get('/:id/download', async (req, res) => {
    try {
      const certificate = await db.getCertificateById(req.params.id);
      if (!certificate) {
        return res.status(404).json({ success: false, error: 'Certificate not found' });
      }

      if (!certificate.pdfPath) {
        return res.status(404).json({ success: false, error: 'Certificate PDF not found' });
      }

      const pdfPath = path.join(__dirname, '../../certificates', certificate.pdfPath);

      if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({ success: false, error: 'Certificate file not found' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${certificate.pdfPath}"`);

      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error downloading certificate:', error);
      res.status(500).json({ success: false, error: 'Failed to download certificate' });
    }
  });

  // Verify certificate (for QR code scanning)
  router.get('/verify/:id', async (req, res) => {
    try {
      const certificate = await db.getCertificateWithDetails(req.params.id);
      if (!certificate) {
        return res.status(404).json({ success: false, error: 'Certificate not found' });
      }

      res.json({
        success: true,
        data: {
          valid: true,
          certificate: certificate.certificate,
          student: certificate.student,
          course: certificate.course,
          message: 'Certificate is valid and authentic'
        }
      });

    } catch (error) {
      console.error('Error verifying certificate:', error);
      res.status(500).json({ success: false, error: 'Failed to verify certificate' });
    }
  });

  // Bulk generate certificates for multiple students
  router.post('/generate-bulk', async (req, res) => {
    try {
      const { studentIds, courseName, issueDate } = req.body;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Student IDs array is required'
        });
      }

      if (!courseName) {
        return res.status(400).json({
          success: false,
          error: 'Course name is required'
        });
      }

      const results = [];
      const errors = [];

      for (const studentId of studentIds) {
        try {
          // Generate certificate for each student
          const result = await generateSingleCertificate(db, studentId, courseName, issueDate);
          results.push(result);
        } catch (error: any) {
          errors.push({
            studentId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        data: {
          generated: results.length,
          errors: errors.length,
          certificates: results,
          errorDetails: errors
        }
      });

    } catch (error) {
      console.error('Error bulk generating certificates:', error);
      res.status(500).json({ success: false, error: 'Failed to bulk generate certificates' });
    }
  });

  return router;
}

// Helper function for generating individual certificates
async function generateSingleCertificate(db: Database, studentId: string, courseName: string, issueDate?: string) {
  const student = await db.getStudentById(studentId);
  if (!student) {
    throw new Error(`Student not found: ${studentId}`);
  }

  let course = await db.findCourseByName(courseName);
  if (!course) {
    course = await db.createCourse({
      name: courseName,
      description: `Course: ${courseName}`
    });
  }

  const certificateNumber = CertificateGenerator.generateCertificateNumber();
  const certificateId = require('uuid').v4();
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const verificationUrl = `${baseUrl}/verify/${certificateId}`;

  const pdfFileName = `${certificateNumber}.pdf`;
  const pdfPath = path.join(__dirname, '../../certificates', pdfFileName);

  const certificatesDir = path.dirname(pdfPath);
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }

  const certificateData = {
    studentName: `${student.firstName} ${student.lastName}`,
    courseName: course.name,
    issueDate: issueDate ? new Date(issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    certificateNumber,
    verificationUrl
  };

  await CertificateGenerator.generateCertificate(certificateData, pdfPath);

  const certificate = await db.createCertificate({
    studentId: student.id,
    courseId: course.id,
    certificateNumber,
    issueDate: issueDate ? new Date(issueDate) : new Date(),
    pdfPath: pdfFileName,
    verificationUrl,
    qrCodeData: verificationUrl
  });

  return {
    certificate,
    student: {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email
    },
    course: {
      name: course.name
    }
  };
}