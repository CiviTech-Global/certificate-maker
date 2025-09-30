import express from 'express';
import { Database } from '../models/database';

const router = express.Router();

export function createCourseRoutes(db: Database) {
  // Get all courses
  router.get('/', async (req, res) => {
    try {
      const courses = await db.getAllCourses();
      res.json({ success: true, data: courses });
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch courses' });
    }
  });

  // Create a new course
  router.post('/', async (req, res) => {
    try {
      const { name, description, durationHours } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Course name is required'
        });
      }

      // Check if course already exists
      const existingCourse = await db.findCourseByName(name);
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          error: 'A course with this name already exists'
        });
      }

      const course = await db.createCourse({
        name,
        description,
        durationHours
      });

      res.status(201).json({ success: true, data: course });
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({ success: false, error: 'Failed to create course' });
    }
  });

  return router;
}