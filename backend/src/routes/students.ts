import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { Database } from '../models/database';
import { CreateStudentRequest, BulkStudentData } from '../types';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

export function createStudentRoutes(db: Database) {
  // Get all students
  router.get('/', async (req, res) => {
    try {
      const students = await db.getAllStudents();
      res.json({ success: true, data: students });
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch students' });
    }
  });

  // Get student by ID
  router.get('/:id', async (req, res) => {
    try {
      const student = await db.getStudentById(req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      res.json({ success: true, data: student });
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch student' });
    }
  });

  // Create a new student
  router.post('/', async (req, res) => {
    try {
      const studentData: CreateStudentRequest = req.body;

      // Validate required fields
      if (!studentData.firstName || !studentData.lastName || !studentData.email) {
        return res.status(400).json({
          success: false,
          error: 'First name, last name, and email are required'
        });
      }

      const student = await db.createStudent(studentData);
      res.status(201).json({ success: true, data: student });
    } catch (error: any) {
      console.error('Error creating student:', error);

      // Handle duplicate email error
      if (error.message?.includes('UNIQUE constraint failed: students.email')) {
        return res.status(400).json({
          success: false,
          error: 'A student with this email already exists'
        });
      }

      res.status(500).json({ success: false, error: 'Failed to create student' });
    }
  });

  // Bulk upload students from CSV
  router.post('/bulk-upload', upload.single('csvFile'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }

    const results: BulkStudentData[] = [];
    const errors: string[] = [];
    const createdStudents: any[] = [];

    try {
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(req.file!.path)
          .pipe(csv({
            mapHeaders: ({ header }) => header.toLowerCase().replace(/\s+/g, '')
          }))
          .on('data', (data) => {
            // Map CSV headers to our expected format
            const studentData: BulkStudentData = {
              firstName: data.firstname || data.first_name || '',
              lastName: data.lastname || data.last_name || '',
              email: data.email || '',
              nationalId: data.nationalid || data.national_id || '',
              passportNo: data.passportno || data.passport_no || '',
              courseName: data.coursename || data.course_name || ''
            };

            // Validate required fields
            if (!studentData.firstName || !studentData.lastName || !studentData.email || !studentData.courseName) {
              errors.push(`Missing required fields for row: ${JSON.stringify(data)}`);
            } else {
              results.push(studentData);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Process each student
      for (const studentData of results) {
        try {
          // Check if course exists, create if not
          let course = await db.findCourseByName(studentData.courseName);
          if (!course) {
            course = await db.createCourse({
              name: studentData.courseName,
              description: `Course: ${studentData.courseName}`
            });
          }

          // Create student
          const student = await db.createStudent({
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            email: studentData.email,
            nationalId: studentData.nationalId,
            passportNo: studentData.passportNo
          });

          createdStudents.push({
            student,
            course: course.name
          });
        } catch (error: any) {
          if (error.message?.includes('UNIQUE constraint failed: students.email')) {
            errors.push(`Student with email ${studentData.email} already exists`);
          } else {
            errors.push(`Failed to create student ${studentData.email}: ${error.message}`);
          }
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        data: {
          created: createdStudents.length,
          errors: errors.length,
          students: createdStudents,
          errorDetails: errors
        }
      });

    } catch (error) {
      console.error('Error processing CSV file:', error);

      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ success: false, error: 'Failed to process CSV file' });
    }
  });

  return router;
}