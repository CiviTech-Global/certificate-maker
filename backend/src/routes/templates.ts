import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Database } from '../models/database';
import { CreateTemplateRequest, UpdateTemplateRequest } from '../types';

// Import sharp (now required dependency)
import sharp from 'sharp';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/templates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'template-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG) and PDF files are allowed'));
    }
  }
});

export function createTemplateRoutes(db: Database) {
  // Upload template file
  router.post('/upload', upload.single('template'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      const templateType = ext === '.pdf' ? 'pdf' : 'image';

      // Get image/PDF dimensions
      let width = 0;
      let height = 0;

      if (templateType === 'image') {
        // Always use actual image dimensions
        const metadata = await sharp(filePath).metadata();
        width = metadata.width || 842;
        height = metadata.height || 595;
        console.log(`📐 Image dimensions detected: ${width}x${height}`);
      } else {
        // For PDF, use standard A4 landscape dimensions
        width = 842;
        height = 595;
        console.log(`📐 PDF dimensions set to: ${width}x${height}`);
      }

      // Generate thumbnail for images
      let thumbnailPath: string | undefined;
      if (templateType === 'image') {
        const thumbnailDir = path.join(__dirname, '../../uploads/thumbnails');
        if (!fs.existsSync(thumbnailDir)) {
          fs.mkdirSync(thumbnailDir, { recursive: true });
        }

        const thumbnailFilename = 'thumb-' + path.basename(filePath);
        thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

        try {
          await sharp(filePath)
            .resize(400, 300, { fit: 'inside' })
            .toFile(thumbnailPath);
          console.log(`✅ Thumbnail generated: ${thumbnailFilename}`);
        } catch (err) {
          console.warn('Could not generate thumbnail:', err);
          thumbnailPath = undefined;
        }
      }

      res.json({
        success: true,
        data: {
          filePath: req.file.filename,
          thumbnailPath: thumbnailPath ? 'thumb-' + path.basename(filePath) : undefined,
          templateType,
          width,
          height
        }
      });

    } catch (error) {
      console.error('Error uploading template:', error);
      res.status(500).json({ success: false, error: 'Failed to upload template' });
    }
  });

  // Create new template
  router.post('/', async (req, res) => {
    try {
      const { name, description, templateType, filePath, thumbnailPath, fields, width, height }: CreateTemplateRequest & { filePath: string; thumbnailPath?: string } = req.body;

      if (!name || !templateType || !filePath || !fields || !width || !height) {
        return res.status(400).json({
          success: false,
          error: 'Name, templateType, filePath, fields, width, and height are required'
        });
      }

      const template = await db.createTemplate({
        name,
        description,
        templateType,
        filePath,
        thumbnailPath,
        fields,
        width,
        height,
        isActive: true
      });

      res.status(201).json({ success: true, data: template });

    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ success: false, error: 'Failed to create template' });
    }
  });

  // Get all templates
  router.get('/', async (req, res) => {
    try {
      const templates = await db.getAllTemplates();
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
  });

  // Get template by ID
  router.get('/:id', async (req, res) => {
    try {
      const template = await db.getTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }
      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch template' });
    }
  });

  // Update template
  router.put('/:id', async (req, res) => {
    try {
      const updates: UpdateTemplateRequest = req.body;
      const template = await db.updateTemplate(req.params.id, updates);

      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ success: false, error: 'Failed to update template' });
    }
  });

  // Delete template
  router.delete('/:id', async (req, res) => {
    try {
      const template = await db.getTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      // Delete files
      const templatePath = path.join(__dirname, '../../uploads/templates', template.filePath);
      if (fs.existsSync(templatePath)) {
        fs.unlinkSync(templatePath);
      }

      if (template.thumbnailPath) {
        const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', template.thumbnailPath);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }

      const deleted = await db.deleteTemplate(req.params.id);

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ success: false, error: 'Failed to delete template' });
    }
  });

  // Serve template files
  router.get('/file/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../../uploads/templates', req.params.filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ success: false, error: 'File not found' });
    }
  });

  // Serve thumbnail files
  router.get('/thumbnail/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../../uploads/thumbnails', req.params.filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ success: false, error: 'Thumbnail not found' });
    }
  });

  return router;
}
