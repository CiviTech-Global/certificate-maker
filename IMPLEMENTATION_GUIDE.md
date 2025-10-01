# Certificate Maker - Template-Based Certificate Generation Implementation

## Overview

This implementation adds **template-based certificate generation** alongside the existing programmatic method. Both methods now coexist in the application, giving you the flexibility to either use the default certificate design or upload your own custom templates.

## Features Implemented

### 1. **Template Management System**
- Upload custom certificate templates (PNG, JPG, PDF)
- Visual drag-and-drop field editor
- Configure text fields with precise positioning
- Customize font properties (family, size, color, alignment, weight, style)
- Activate/deactivate templates
- Delete templates

### 2. **Dual Certificate Generation Methods**
- **Programmatic Generation**: Uses the existing hardcoded certificate design
- **Template-Based Generation**: Uses your uploaded templates with student data overlay

### 3. **Visual Template Editor**
- Upload template file (image or PDF)
- Add fields by clicking "Available Fields"
- Drag fields to position them on the template
- Adjust field properties (position, size, font, color, alignment)
- Real-time preview of field positions
- Save template with all field configurations

### 4. **Certificate Generation UI**
- Unified modal for generating certificates
- Choose between "Standard Design" or "Custom Template"
- Select from available active templates
- Generate certificates with either method

## How to Use

### Setup

1. **Start the Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Creating a Template

1. Navigate to the **Templates** tab
2. Click **"Create Template"**
3. Fill in template details:
   - **Name**: Give your template a descriptive name
   - **Description**: Optional description
   - **Upload Template**: Choose a PNG, JPG, or PDF file
4. Add fields from the "Available Fields" list:
   - Student Name
   - Course Name
   - Issue Date
   - Certificate Number
   - Email
   - National ID
   - Passport Number
5. Position fields by dragging them on the canvas
6. Configure field properties in the right panel:
   - Position (X, Y)
   - Size (Width, Height)
   - Font Size
   - Font Family (Helvetica, Times-Roman, Courier)
   - Font Color
   - Text Alignment
   - Font Weight (Normal, Bold)
   - Font Style (Normal, Italic)
7. Click **"Create Template"**

### Generating Certificates

#### Method 1: Programmatic (Default Design)
1. Go to **Students** tab
2. Click **"Generate Certificate"** next to a student
3. Select **"Standard Design"**
4. Enter course name and date
5. Click **"Generate Certificate"**

#### Method 2: Template-Based (Custom Design)
1. Go to **Students** tab
2. Click **"Generate Certificate"** next to a student
3. Select **"Custom Template"**
4. Choose a template from the list
5. Enter course name and date
6. Click **"Generate Certificate"**

## Technical Architecture

### Backend

#### New Files Created:
- `src/utils/templateCertificateGenerator.ts` - Template-based PDF generation
- `src/routes/templates.ts` - Template management API endpoints

#### Modified Files:
- `src/types/index.ts` - Added template-related types
- `src/models/database.ts` - Added certificate templates table and CRUD operations
- `src/routes/certificates.ts` - Added `/generate-from-template` endpoint
- `src/index.ts` - Registered template routes and created directories

#### New Database Table:
```sql
certificate_templates (
  id, name, description, template_type, file_path,
  thumbnail_path, fields (JSON), width, height,
  is_active, created_at, updated_at
)
```

#### Modified Table:
```sql
certificates (
  ... existing fields ...,
  template_id, generation_method
)
```

### Frontend

#### New Components:
- `src/components/TemplateEditor.tsx` - Visual template editor with drag-and-drop
- `src/components/TemplatesView.tsx` - Template management view
- `src/components/CertificateGenerationModal.tsx` - Unified certificate generation modal

#### Modified Components:
- `src/components/Layout.tsx` - Added "Templates" tab
- `src/components/StudentsView.tsx` - Updated to use new generation modal
- `src/App.tsx` - Added TemplatesView route

#### Modified Files:
- `src/types/index.ts` - Added template types
- `src/services/api.ts` - Added template API methods

## API Endpoints

### Template Endpoints
- `POST /api/templates/upload` - Upload template file
- `POST /api/templates` - Create template with field configuration
- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get template by ID
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `GET /api/templates/file/:filename` - Serve template file
- `GET /api/templates/thumbnail/:filename` - Serve thumbnail

### Certificate Endpoints
- `POST /api/certificates/generate` - Generate using programmatic method (existing)
- `POST /api/certificates/generate-from-template` - Generate using template method (new)

## Field Mapping

When generating certificates from templates, field names are automatically mapped:

| Field Name | Maps To |
|-----------|---------|
| studentName, student_name, name | Student's full name |
| courseName, course_name, course | Course name |
| date, issueDate, issue_date | Formatted issue date |
| certificateNumber, certificate_number | Generated certificate number |
| email | Student email |
| nationalId, national_id | Student national ID |
| passportNo, passport_no | Student passport number |

## Dependencies Added

### Backend
- `sharp` (^0.34.4) - Image processing
- `pdf-lib` (^1.17.1) - PDF manipulation

### Frontend
No new dependencies required (uses existing React ecosystem)

## Directory Structure

```
backend/
├── uploads/
│   ├── templates/      # Uploaded template files
│   └── thumbnails/     # Generated thumbnails
└── certificates/       # Generated certificates

frontend/
└── src/
    └── components/
        ├── TemplateEditor.tsx
        ├── TemplatesView.tsx
        └── CertificateGenerationModal.tsx
```

## Design Considerations

1. **Coexistence**: Both methods work independently without conflicts
2. **Backward Compatibility**: Existing certificates continue to work
3. **Flexibility**: Users can switch between methods per certificate
4. **Type Safety**: Full TypeScript support throughout
5. **Error Handling**: Comprehensive error handling and user feedback
6. **UI/UX**: Intuitive drag-and-drop interface inspired by the sample designs

## Sample Use Case

1. Design a certificate in Photoshop/Illustrator
2. Export as PNG or PDF
3. Upload to Certificate Maker
4. Position text fields visually
5. Generate certificates with real student data
6. Download professional PDFs

## Future Enhancements (Optional)

- QR code positioning in templates
- Image fields (student photos, logos)
- Multi-page certificate support
- Template marketplace/sharing
- Batch generation with templates
- Preview certificate before generating
- Template versioning

## Support

For issues or questions, refer to the application logs:
- Backend: Console output when running `npm run dev`
- Frontend: Browser console (F12)
- Database: SQLite database file at `backend/database.db`

---

**Implementation Date**: 2025-10-01
**Status**: ✅ Complete and Tested
