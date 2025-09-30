# Certificate Maker Application

A comprehensive full-stack application for generating professional certificates with QR code verification. Built with React, TypeScript, Node.js, Express, and SQLite.

## 🚀 Features

### Core Functionality
- **Student Management**: Add individual students or bulk upload via CSV
- **Certificate Generation**: Generate professional PDF certificates with QR codes
- **Online Verification**: Verify certificates online using QR codes or certificate IDs
- **Dashboard**: Comprehensive dashboard with stats and quick actions

### Student Information Supported
- First Name, Last Name (required)
- Email Address (required)
- National ID (optional)
- Passport Number (optional)
- Course Name (for certificate generation)

### Certificate Features
- Professional PDF layout with elegant design
- QR code for online verification
- Unique certificate numbers
- Course completion information
- Online verification page
- Download capabilities

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Database**: SQLite with structured schema
- **PDF Generation**: PDFKit for certificate creation
- **QR Codes**: QRCode library for verification codes
- **File Upload**: Multer for CSV processing
- **API**: RESTful endpoints for all operations

### Frontend (React + TypeScript)
- **UI Framework**: Tailwind CSS for modern design
- **Icons**: Lucide React for consistent iconography
- **File Upload**: React Dropzone for CSV uploads
- **Notifications**: React Hot Toast for user feedback
- **Responsive**: Mobile-friendly design

## 📁 Project Structure

```
certificate-maker/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── database.ts          # Database operations
│   │   ├── routes/
│   │   │   ├── students.ts          # Student management endpoints
│   │   │   ├── certificates.ts      # Certificate generation endpoints
│   │   │   └── courses.ts           # Course management endpoints
│   │   ├── utils/
│   │   │   └── certificateGenerator.ts # PDF generation logic
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   └── index.ts                 # Express server setup
│   ├── certificates/                # Generated PDF files
│   ├── uploads/                     # Temporary upload directory
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                         # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx           # Main layout component
│   │   │   ├── Dashboard.tsx        # Dashboard with stats
│   │   │   ├── StudentForm.tsx      # Individual student form
│   │   │   ├── BulkUpload.tsx       # CSV bulk upload
│   │   │   ├── StudentsView.tsx     # Student management
│   │   │   ├── CertificatesView.tsx # Certificate management
│   │   │   └── VerificationView.tsx # Certificate verification
│   │   ├── services/
│   │   │   └── api.ts               # API communication
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── utils/
│   │   │   └── index.ts             # Utility functions
│   │   ├── App.tsx                  # Main React component
│   │   └── index.css                # Tailwind CSS styles
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env                         # Environment variables
├── samples/
│   └── sample-1.webp                # Design reference
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd certificate-maker
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:3001`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Environment Configuration

**Backend (.env)**:
```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./database.db
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:3001
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:3001
```

## 📖 How to Use

### 1. Dashboard
- View application statistics
- Quick access to all major features
- Recent students and certificates overview

### 2. Student Management
- **Add Individual Student**: Click "Add Student" to register a single student
- **Bulk Upload**: Use "Bulk Upload" to import multiple students from CSV
- **CSV Format**: Download template or use format:
  ```csv
  firstName,lastName,email,nationalId,passportNo,courseName
  John,Doe,john.doe@example.com,123456789,P123456,Web Development
  ```

### 3. Certificate Generation
- Navigate to Students tab
- Click "Generate Certificate" for any student
- Enter the course name
- Certificate will be generated with QR code
- Download PDF immediately or later from Certificates tab

### 4. Certificate Verification
- Navigate to Verify tab
- Enter certificate ID (found in QR code URL)
- View complete certificate details
- Access online verification page

### 5. Certificate Management
- View all generated certificates
- Download PDF certificates
- Copy verification URLs
- View certificates online

## 🔧 API Endpoints

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `POST /api/students/bulk-upload` - Bulk upload via CSV
- `GET /api/students/:id` - Get student by ID

### Certificates
- `GET /api/certificates` - Get all certificates
- `POST /api/certificates/generate` - Generate certificate
- `POST /api/certificates/generate-bulk` - Generate multiple certificates
- `GET /api/certificates/:id/download` - Download certificate PDF
- `GET /api/certificates/verify/:id` - Verify certificate

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course

### Verification
- `GET /verify/:id` - Public verification page (HTML)

## 🎨 Design Features

### Certificate Design
- Professional layout with elegant borders
- Color scheme: Green (#2C5F2D) and accent colors
- QR code for verification
- Student and course information
- Certificate number and issue date
- Signature line and verification text

### UI Design
- Modern, clean interface inspired by the provided sample
- Responsive design for all devices
- Intuitive navigation with tabs
- Card-based layout
- Professional color scheme
- Loading states and error handling

## 🔒 Security Features

- Input validation on all forms
- Email format validation
- Unique certificate numbers
- Secure file uploads with type checking
- Error handling and user feedback
- Environment variable configuration

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Configure production database
3. Set proper CORS origins
4. Use process manager (PM2)

### Frontend
1. Build for production: `npm run build`
2. Serve static files
3. Configure API URL for production

### Environment Variables
Update `.env` files with production URLs and settings.

## 🛠️ Development

### Backend Scripts
- `npm run dev` - Development server with nodemon
- `npm run build` - Build TypeScript
- `npm start` - Production server

### Frontend Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - ESLint

## 📝 CSV Upload Format

The bulk upload feature accepts CSV files with the following columns:

**Required:**
- `firstName` - Student's first name
- `lastName` - Student's last name
- `email` - Student's email address
- `courseName` - Name of the course

**Optional:**
- `nationalId` - National ID number
- `passportNo` - Passport number

**Example:**
```csv
firstName,lastName,email,nationalId,passportNo,courseName
John,Doe,john.doe@example.com,123456789,P123456,Web Development Fundamentals
Jane,Smith,jane.smith@example.com,987654321,P987654,Data Science Bootcamp
```

## 🎯 Key Features Implemented

✅ **Student Management System**
- Individual student registration
- Bulk CSV upload with validation
- Student listing and search

✅ **Certificate Generation**
- Professional PDF generation
- QR code integration
- Unique certificate numbering
- Course information tracking

✅ **Verification System**
- Online certificate verification
- QR code scanning support
- Public verification pages

✅ **Dashboard & Analytics**
- Application statistics
- Recent activity tracking
- Quick action buttons

✅ **Modern UI/UX**
- Responsive design
- Professional interface
- Error handling and notifications
- Loading states

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

**Note**: This application is ready for development and testing. For production use, consider additional security measures, database optimization, and proper deployment configuration.