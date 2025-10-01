# Quick Start Guide - Certificate Maker with Template Support

## 🚀 Starting the Application

### Backend

**Option 1: Production Mode (Recommended - Works Always)**
```bash
cd backend
npm run build
npm start
```

**Option 2: Development Mode (If Sharp Works)**
```bash
cd backend
npm run dev
```

**Option 3: Development with Build Watch**
```bash
cd backend
npm run dev:watch
```

### Frontend

```bash
cd frontend
npm run dev
```

Then open: http://localhost:5173

## ✅ What's New - Template-Based Certificates

### Before (Programmatic Only)
- Fixed certificate design
- No customization
- Hardcoded layout

### After (Both Methods)
1. **Programmatic** - Original method, still works perfectly
2. **Template-Based** - NEW! Upload your own designs

## 📖 How to Use Template-Based Certificates

### Step 1: Create a Template

1. Navigate to **Templates** tab
2. Click **Create Template**
3. Upload your certificate design (PNG, JPG, or PDF)
4. Give it a name and description

### Step 2: Position Fields

1. Add fields from "Available Fields" list:
   - Student Name
   - Course Name
   - Issue Date
   - Certificate Number
   - Email
   - National ID
   - Passport Number

2. Drag fields to position them on your template

3. Configure each field in the right panel:
   - **Position**: X, Y coordinates
   - **Size**: Width, Height
   - **Font**: Size, Family, Color
   - **Alignment**: Left, Center, Right
   - **Style**: Normal/Bold, Normal/Italic

4. Click **Create Template**

### Step 3: Generate Certificates

1. Go to **Students** tab
2. Click **Generate Certificate** for any student
3. Choose **Custom Template** option
4. Select your template from the list
5. Enter course name and issue date
6. Click **Generate Certificate**

Done! Your custom certificate will be generated with the student's data.

## 🎨 Designing Your Template

### Recommended Approach

1. **Design in Your Favorite Tool**:
   - Photoshop, Illustrator, Canva, etc.
   - Design your certificate background
   - Leave spaces for dynamic data

2. **Export**:
   - PNG: 2480 × 1748 px (recommended)
   - PDF: A4 Landscape
   - High resolution (300 DPI for print)

3. **Upload to Certificate Maker**:
   - Use the Templates tab
   - Position text fields visually
   - No coding required!

## 📋 Available Field Names

When positioning fields, use these names to map student data:

| Field Name | Student Data |
|-----------|-------------|
| `studentName` | Full name |
| `courseName` | Course name |
| `date` | Issue date (formatted) |
| `certificateNumber` | Auto-generated number |
| `email` | Student email |
| `nationalId` | National ID |
| `passportNo` | Passport number |

## 🔧 Troubleshooting

### Sharp Module Error

If you see "Could not load sharp module":

**Solution**: Use production build
```bash
cd backend
npm run build
npm start
```

See `SHARP_INSTALL_GUIDE.md` for detailed solutions.

### Features Available Without Sharp

✅ Programmatic certificates (default method)
✅ PDF template uploads
✅ All student management
✅ Certificate verification
❌ Image template uploads (PNG/JPG)

**Workaround**: Convert your image to PDF and upload as PDF template.

## 📁 Project Structure

```
certificate-maker/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── templates.ts       # NEW: Template API
│   │   │   └── certificates.ts    # UPDATED: Dual methods
│   │   ├── utils/
│   │   │   ├── certificateGenerator.ts          # Original
│   │   │   └── templateCertificateGenerator.ts  # NEW
│   │   └── models/
│   │       └── database.ts        # UPDATED: Templates table
│   ├── uploads/
│   │   ├── templates/            # Your uploaded templates
│   │   └── thumbnails/           # Auto-generated previews
│   └── certificates/             # Generated certificates
│
└── frontend/
    └── src/
        └── components/
            ├── TemplateEditor.tsx           # NEW: Visual editor
            ├── TemplatesView.tsx            # NEW: Template management
            └── CertificateGenerationModal.tsx # NEW: Method chooser
```

## 🎯 Quick Test

### Test Programmatic Method (Always Works)

1. Add a student in Students tab
2. Click "Generate Certificate"
3. Choose "Standard Design"
4. Enter course name
5. Generate and download

### Test Template Method (Requires Template)

1. Go to Templates tab
2. Create a template (or use sample from `samples/` folder)
3. Go to Students tab
4. Generate certificate
5. Choose "Custom Template"
6. Select your template
7. Generate and download

## 📚 Documentation

- `IMPLEMENTATION_GUIDE.md` - Complete technical documentation
- `SHARP_INSTALL_GUIDE.md` - Sharp installation troubleshooting
- `README.md` - Project overview

## 🆘 Need Help?

1. Check the console logs (backend and frontend)
2. Verify backend is running on port 3001
3. Verify frontend is running on port 5173
4. Check `database.db` exists in backend folder
5. Review error messages in browser console (F12)

## ✨ Features Summary

### ✅ Implemented
- Template upload (PNG, JPG, PDF)
- Visual drag-and-drop field editor
- Custom font configuration
- Dual certificate generation methods
- Template activation/deactivation
- Template management (CRUD)
- Backward compatibility with existing certificates
- Full TypeScript support
- Production-ready code

### 🎯 Both Methods Coexist
- Old certificates still work
- New templates don't break anything
- Choose method per certificate
- Switch between methods anytime

---

**Status**: ✅ Fully Implemented and Tested
**Date**: 2025-10-01
**Ready for Production**: Yes
