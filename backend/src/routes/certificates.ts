import express from 'express';
import path from 'path';
import fs from 'fs';
import { Database } from '../models/database';
import { CertificateGenerator } from '../utils/certificateGenerator';
import { TemplateCertificateGenerator } from '../utils/templateCertificateGenerator';
import { CreateCertificateRequest, GenerateFromTemplateRequest } from '../types';

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
      console.log(`📥 Download request for certificate: ${req.params.id}`);

      const certificate = await db.getCertificateById(req.params.id);
      if (!certificate) {
        console.log('❌ Certificate not found in database');
        return res.status(404).json({ success: false, error: 'Certificate not found' });
      }

      if (!certificate.pdfPath) {
        console.log('❌ Certificate has no PDF path');
        return res.status(404).json({ success: false, error: 'Certificate PDF not found' });
      }

      const pdfPath = path.join(__dirname, '../../certificates', certificate.pdfPath);
      console.log(`📂 Looking for PDF at: ${pdfPath}`);

      if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file does not exist on disk');
        return res.status(404).json({ success: false, error: 'Certificate file not found' });
      }

      console.log('✅ Sending PDF file...');

      // Get file size for Content-Length header
      const stat = fs.statSync(pdfPath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `attachment; filename="${certificate.pdfPath}"`);

      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('❌ Error downloading certificate:', error);
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

  // Generate certificate from template
  router.post('/generate-from-template', async (req, res) => {
    try {
      const { templateId, studentId, courseName, issueDate }: GenerateFromTemplateRequest = req.body;

      console.log('Generate from template request:', { templateId, studentId, courseName, issueDate });

      // Validate required fields
      if (!templateId || !studentId || !courseName) {
        return res.status(400).json({
          success: false,
          error: 'Template ID, student ID, and course name are required'
        });
      }

      // Get template
      const template = await db.getTemplateById(templateId);
      console.log('Template found:', template ? template.name : 'NOT FOUND');
      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      if (!template.isActive) {
        return res.status(400).json({ success: false, error: 'Template is not active' });
      }

      // Get student details
      const student = await db.getStudentById(studentId);
      console.log('Student found:', student ? `${student.firstName} ${student.lastName}` : 'NOT FOUND');
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

      // Generate certificate number and create temporary certificate record to get ID
      const certificateNumber = CertificateGenerator.generateCertificateNumber();

      // First, create the certificate in database to get its ID for verification URL
      const tempCertificate = await db.createCertificate({
        studentId: student.id,
        courseId: course.id,
        certificateNumber,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        pdfPath: '',
        verificationUrl: '',
        qrCodeData: ''
      });

      // Now create verification URL with actual certificate ID
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const verificationUrl = `${baseUrl}/verify/${tempCertificate.id}`;

      // Prepare data for template fields
      const fieldData: Record<string, string> = {};
      const issueDateFormatted = issueDate
        ? new Date(issueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

      console.log(`\n🔄 Mapping field data for ${template.fields.length} fields:`);
      console.log(`   Student: ${student.firstName} ${student.lastName}`);
      console.log(`   Course: ${course.name}`);
      console.log(`   Date: ${issueDateFormatted}`);
      console.log(`   Certificate Number: ${certificateNumber}\n`);

      // Map field names to actual data
      for (const field of template.fields) {
        console.log(`   Processing field: "${field.name}" (lowercase: "${field.name.toLowerCase()}")`);

        const fieldNameLower = field.name.toLowerCase().replace(/[_\s-]/g, '');

        switch (fieldNameLower) {
          case 'studentname':
          case 'name':
            fieldData[field.name] = `${student.firstName} ${student.lastName}`;
            console.log(`      ✅ Mapped to: "${fieldData[field.name]}"`);
            break;
          case 'coursename':
          case 'course':
            fieldData[field.name] = course.name;
            console.log(`      ✅ Mapped to: "${fieldData[field.name]}"`);
            break;
          case 'date':
          case 'issuedate':
            fieldData[field.name] = issueDateFormatted;
            console.log(`      ✅ Mapped to: "${fieldData[field.name]}"`);
            break;
          case 'certificatenumber':
          case 'certificateno':
            fieldData[field.name] = certificateNumber;
            console.log(`      ✅ Mapped to: "${fieldData[field.name]}"`);
            break;
          case 'email':
            fieldData[field.name] = student.email;
            console.log(`      ✅ Mapped to: "${fieldData[field.name]}"`);
            break;
          case 'nationalid':
            fieldData[field.name] = student.nationalId || '';
            console.log(`      ✅ Mapped to: "${fieldData[field.name]}"`);
            break;
          case 'passportno':
          case 'passportnumber':
            fieldData[field.name] = student.passportNo || '';
            console.log(`      ✅ Mapped to: "${fieldData[field.name]}"`);
            break;
          default:
            fieldData[field.name] = '';
            console.log(`      ⚠️  No mapping found for "${field.name}" (normalized: "${fieldNameLower}") - field will be empty`);
        }
      }

      console.log(`\n📊 Final fieldData object:`, JSON.stringify(fieldData, null, 2));

      // Generate PDF from template
      const pdfFileName = `${certificateNumber}.pdf`;
      const pdfPath = path.join(__dirname, '../../certificates', pdfFileName);

      // Ensure certificates directory exists
      const certificatesDir = path.dirname(pdfPath);
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
      }

      const templatePath = path.join(__dirname, '../../uploads/templates', template.filePath);

      // Verify template file exists
      if (!fs.existsSync(templatePath)) {
        return res.status(404).json({
          success: false,
          error: 'Template file not found',
          details: `Template file does not exist: ${template.filePath}`
        });
      }

      await TemplateCertificateGenerator.generateCertificate({
        templatePath,
        templateType: template.templateType,
        fields: template.fields,
        data: fieldData,
        outputPath: pdfPath,
        templateWidth: template.width,
        templateHeight: template.height,
        qrCodeData: verificationUrl
      });

      // Update certificate record with PDF path and verification URL
      const updatedCertificate = await db.updateCertificate(tempCertificate.id, {
        pdfPath: pdfFileName,
        verificationUrl,
        qrCodeData: verificationUrl
      });

      res.status(201).json({
        success: true,
        data: {
          certificate: updatedCertificate,
          student: {
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email
          },
          course: {
            name: course.name
          },
          template: {
            name: template.name
          },
          downloadUrl: `/api/certificates/${tempCertificate.id}/download`
        }
      });

    } catch (error: any) {
      console.error('Error generating certificate from template:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate certificate from template',
        details: error.message
      });
    }
  });

  // Delete a certificate
  router.delete('/:id', async (req, res) => {
    try {
      const certificate = await db.getCertificateById(req.params.id);
      if (!certificate) {
        return res.status(404).json({ success: false, error: 'Certificate not found' });
      }

      // Delete the PDF file if it exists
      if (certificate.pdfPath) {
        const pdfPath = path.join(__dirname, '../../certificates', certificate.pdfPath);
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
          console.log(`🗑️  Deleted PDF file: ${certificate.pdfPath}`);
        }
      }

      // Delete from database
      const deleted = await db.deleteCertificate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Certificate not found' });
      }

      res.json({ success: true, message: 'Certificate deleted successfully' });
    } catch (error) {
      console.error('Error deleting certificate:', error);
      res.status(500).json({ success: false, error: 'Failed to delete certificate' });
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