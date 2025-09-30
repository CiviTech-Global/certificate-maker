import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Database } from './models/database';
import { createStudentRoutes } from './routes/students';
import { createCertificateRoutes } from './routes/certificates';
import { createCourseRoutes } from './routes/courses';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize database
const db = new Database(process.env.DATABASE_PATH);

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure required directories exist
const ensureDirectoriesExist = () => {
  const dirs = ['uploads', 'certificates'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

ensureDirectoriesExist();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Certificate Maker API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/students', createStudentRoutes(db));
app.use('/api/certificates', createCertificateRoutes(db));
app.use('/api/courses', createCourseRoutes(db));

// Certificate verification endpoint (public, no /api prefix)
app.get('/verify/:id', async (req, res) => {
  try {
    const certificate = await db.getCertificateWithDetails(req.params.id);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found',
        valid: false
      });
    }

    // If it's an API request (JSON), return JSON
    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        data: {
          valid: true,
          certificate: certificate.certificate,
          student: certificate.student,
          course: certificate.course,
          message: 'Certificate is valid and authentic'
        }
      });
    }

    // Otherwise, return HTML page for browser viewing
    const html = generateVerificationPage(certificate);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Error verifying certificate:', error);

    if (req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        success: false,
        error: 'Failed to verify certificate',
        valid: false
      });
    }

    res.status(500).send('<h1>Error verifying certificate</h1><p>Please try again later.</p>');
  }
});

// Serve static certificate files
app.use('/certificates', express.static(path.join(__dirname, '../certificates')));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Certificate Maker API running on port ${PORT}`);
  console.log(`📄 API Documentation: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for: ${FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  db.close();
  process.exit(0);
});

// Generate HTML verification page
function generateVerificationPage(certificateData: any): string {
  const { certificate, student, course } = certificateData;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate Verification - ${certificate.certificateNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .verification-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #2C5F2D 0%, #97BC62 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2rem;
            margin-bottom: 10px;
        }

        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }

        .content {
            padding: 40px;
        }

        .status {
            text-align: center;
            margin-bottom: 30px;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            background: #e7f5e7;
            color: #2C5F2D;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 1.1rem;
        }

        .status-badge::before {
            content: "✓";
            margin-right: 8px;
            font-size: 1.2rem;
        }

        .details {
            display: grid;
            gap: 20px;
            margin-bottom: 30px;
        }

        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .detail-label {
            font-weight: 600;
            color: #666;
        }

        .detail-value {
            color: #333;
            font-weight: 500;
        }

        .certificate-number {
            background: #f8f9fa;
            border: 2px dashed #2C5F2D;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }

        .certificate-number h3 {
            color: #2C5F2D;
            margin-bottom: 8px;
        }

        .certificate-number code {
            background: #2C5F2D;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
        }

        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9rem;
        }

        @media (max-width: 480px) {
            .content {
                padding: 20px;
            }

            .detail-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="verification-container">
        <div class="header">
            <h1>Certificate Verification</h1>
            <p>Authentic certificate verification system</p>
        </div>

        <div class="content">
            <div class="status">
                <div class="status-badge">Certificate is Valid & Authentic</div>
            </div>

            <div class="certificate-number">
                <h3>Certificate Number</h3>
                <code>${certificate.certificateNumber}</code>
            </div>

            <div class="details">
                <div class="detail-item">
                    <span class="detail-label">Student Name:</span>
                    <span class="detail-value">${student.firstName} ${student.lastName}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${student.email}</span>
                </div>

                ${student.nationalId ? `
                <div class="detail-item">
                    <span class="detail-label">National ID:</span>
                    <span class="detail-value">${student.nationalId}</span>
                </div>
                ` : ''}

                ${student.passportNo ? `
                <div class="detail-item">
                    <span class="detail-label">Passport No:</span>
                    <span class="detail-value">${student.passportNo}</span>
                </div>
                ` : ''}

                <div class="detail-item">
                    <span class="detail-label">Course:</span>
                    <span class="detail-value">${course.name}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Issue Date:</span>
                    <span class="detail-value">${new Date(certificate.issueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>

                <div class="detail-item">
                    <span class="detail-label">Verified On:</span>
                    <span class="detail-value">${new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This certificate has been verified as authentic and was issued by our certification system.</p>
            <p>Verification ID: ${certificate.id}</p>
        </div>
    </div>
</body>
</html>
  `;
}