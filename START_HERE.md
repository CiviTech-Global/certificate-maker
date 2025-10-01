# 🚀 START HERE - Certificate Maker

## Quick Start (5 Minutes)

### 1. Start Backend

```bash
cd backend
npm run build
npm start
```

✅ Backend running on: **http://localhost:3001**

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

✅ Frontend running on: **http://localhost:5173**

### 3. Open Browser

Navigate to: **http://localhost:5173**

---

## ✨ What You Can Do

### Option 1: Generate Certificates (Standard Design)
1. Go to **Students** tab
2. Add a student
3. Click **"Generate Certificate"**
4. Choose **"Standard Design"**
5. Enter course name
6. Click **"Generate Certificate"**
7. Download your PDF ✅

### Option 2: Generate Certificates (Custom Template)
1. Go to **Templates** tab
2. Click **"Create Template"**
3. Upload your certificate design (PNG, JPG, or PDF)
4. Drag fields onto your template:
   - Student Name
   - Course Name
   - Date
   - Certificate Number
5. Configure fonts and styling
6. Save template
7. Go to **Students** tab
8. Click **"Generate Certificate"**
9. Choose **"Custom Template"**
10. Select your template
11. Enter course name
12. Generate and download ✅

---

## 🔍 QR Code Verification

Every certificate includes a QR code at the bottom-right:
1. Scan with your phone
2. Opens verification page
3. Shows certificate details
4. Confirms authenticity ✅

---

## 📁 Key Features

✅ **Two Generation Methods**
- Programmatic (default design)
- Template-based (your designs)

✅ **Visual Template Editor**
- Drag-and-drop field positioning
- Font customization
- Real-time preview

✅ **Automatic QR Codes**
- Added to all certificates
- Scannable verification
- Authentic proof

✅ **Student Management**
- Add students manually
- Bulk CSV upload
- Track certificates

✅ **Certificate Verification**
- Public verification page
- Scan QR or enter URL
- Instant validation

---

## 🎨 Designing Templates

### Recommended Process:

1. **Design Your Certificate**
   - Use Photoshop, Illustrator, Canva, etc.
   - Design the background/layout
   - Leave space for dynamic text

2. **Export**
   - PNG: 2480 × 1748 px (recommended)
   - PDF: A4 Landscape
   - High resolution (300 DPI)

3. **Upload to Certificate Maker**
   - Templates tab → Create Template
   - Upload your file
   - Position fields visually
   - No coding required!

4. **Generate Certificates**
   - Choose your template
   - Student data fills automatically
   - Download professional PDFs

---

## 📚 Documentation

- **IMPLEMENTATION_GUIDE.md** - Technical details
- **FIXES_APPLIED.md** - Recent bug fixes
- **SHARP_INSTALL_GUIDE.md** - Troubleshooting
- **QUICK_START.md** - Detailed usage guide

---

## ⚠️ Troubleshooting

### Backend Won't Start?
```bash
cd backend
rm -rf node_modules
npm install
npm run build
npm start
```

### Sharp Module Error?
Use production build (works without sharp):
```bash
cd backend
npm run build
npm start
```

PDF templates work perfectly without sharp!

### Port Already in Use?
- Backend (3001): Stop other apps using this port
- Frontend (5173): Stop other Vite instances

---

## 🎯 Status

✅ **Backend**: Ready
✅ **Frontend**: Ready
✅ **Database**: Auto-created on first run
✅ **Template System**: Fully functional
✅ **QR Codes**: Working
✅ **Verification**: Working
✅ **Both Methods**: Coexisting perfectly

---

## 📞 Need Help?

1. Check console logs (backend terminal)
2. Check browser console (F12)
3. Review documentation files
4. Check `database.db` exists in backend folder
5. Verify ports 3001 and 5173 are available

---

## ✨ Success Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Browser open at http://localhost:5173
- [ ] Can add students
- [ ] Can generate standard certificates
- [ ] Can create templates
- [ ] Can generate template certificates
- [ ] QR codes work
- [ ] Verification works

---

**Ready to use!** 🎉

Start by adding a student and generating your first certificate.
