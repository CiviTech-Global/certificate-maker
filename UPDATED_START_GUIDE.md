# 🚀 Updated Start Guide - After Latest Fixes

## Date: 2025-10-01

---

## ⚠️ IMPORTANT: First Time Setup After Updates

### Step 1: Delete Old Templates

Old templates have incorrect dimensions and will NOT work. Delete them:

```bash
cd backend
echo "DELETE FROM certificate_templates;" | sqlite3 database.db
```

Or simply delete the entire database to start fresh:

```bash
cd backend
rm database.db
```

---

## 🔧 Step 2: Install Dependencies

### Backend:
```bash
cd backend
npm install
npm run build
```

**Note:** Sharp is now installed as a required dependency!

### Frontend:
```bash
cd frontend
npm install
```

---

## 🚀 Step 3: Start the Application

### Terminal 1 - Backend:
```bash
cd backend
npm start
```

**Expected output:**
```
🚀 Certificate Maker API running on port 3001
📄 API Documentation: http://localhost:3001/health
🌐 CORS enabled for: http://localhost:5173
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## ✨ What's New

### 1. Dynamic Template Dimensions ✅
- **No more fixed 842x595!**
- Upload any image size (e.g., 3000x2000)
- Backend detects actual dimensions with Sharp
- Frontend uses backend-provided dimensions
- Text appears at correct positions

### 2. Delete Functionality ✅
- Delete students (red trash button in table)
- Delete courses (API ready)
- Delete certificates (API ready + PDF cleanup)
- Delete templates (already implemented)
- Confirmation dialogs before deletion

### 3. Bug Fixes ✅
- Fixed field name mapping (camelCase → normalized)
- Fixed dimension mismatch
- Fixed CORS issues on downloads
- Added comprehensive logging

---

## 📋 Step 4: Create Your First Template

### A. Upload Template Image:

1. Go to **Templates** tab
2. Click **"Create Template"**
3. Upload your certificate image (any size!)
4. **Wait for success message:** "Template file uploaded successfully!"
5. **Check console:** Should show dimensions like:
   ```
   ✅ Template uploaded, dimensions: 3000 x 2000
   ```

### B. Position Fields:

1. Add fields by clicking available field buttons:
   - Student Name
   - Course Name
   - Date
   - Certificate Number
   - Email (optional)
   - National ID (optional)

2. **Drag fields** to desired positions on template

3. **Configure each field:**
   - Font size
   - Font family (Helvetica, Times-Roman, Courier)
   - Font color
   - Text alignment
   - Font weight (normal/bold)

4. **Save template**

---

## 📋 Step 5: Generate Certificate

### A. Add a Student:

1. Go to **Students** tab
2. Click **"Add Student"**
3. Fill in details:
   - First Name *
   - Last Name *
   - Email *
   - National ID (optional)
   - Passport No (optional)
4. Click **"Create Student"**

### B. Generate Certificate:

1. Find student in table
2. Click **"Generate Certificate"** button
3. Choose **"Custom Template"**
4. Select your template
5. Enter course name
6. Click **"Generate Certificate"**

### C. Verify Success:

**Backend console should show:**
```
🔄 Mapping field data for 4 fields:
   Student: MOHAMMADMAHDI RAEISI
   Course: Immigration Services
   Date: October 1, 2025
   Certificate Number: CERT-202510-XXXXX

   Processing field: "studentName" (lowercase: "studentname")
      ✅ Mapped to: "MOHAMMADMAHDI RAEISI"
   Processing field: "courseName" (lowercase: "coursename")
      ✅ Mapped to: "Immigration Services"
   ...

📝 Processing 4 fields for Image->PDF template
   Field "studentName": "MOHAMMADMAHDI RAEISI" (x:500, y:600, fontSize:48)
   ✅ Drawing text at (375.00, 900.00) with size 36.00
   ...

✅ Image template converted to PDF successfully
```

**Frontend should:**
- Show success toast
- Prompt to download PDF
- PDF should have VISIBLE TEXT! ✅

---

## 🔍 Step 6: Verify Certificate

1. **Scan QR Code** on the certificate with your phone
2. Should open verification page
3. Shows student details, course, date
4. Confirms authenticity

**Or verify manually:**
- Go to: `http://localhost:3001/verify/{certificateId}`

---

## 🗑️ Step 7: Delete Data (New Feature!)

### Delete a Student:
1. Go to Students tab
2. Click red **trash icon** (🗑️) next to student
3. Confirm deletion
4. Student is removed

### Delete a Certificate:
- Use API: `DELETE /api/certificates/:id`
- Or add UI button (API is ready!)

### Delete a Template:
1. Go to Templates tab
2. Click delete button on template card
3. Confirm deletion

---

## 🎯 Quick Troubleshooting

### Issue: "Sharp module not available"
**Solution:**
```bash
cd backend
npm install sharp
npm run build
npm start
```

### Issue: PDF has no text visible
**Causes:**
1. **Old template** (created before fix) → Delete and recreate
2. **Wrong dimensions** → Check console for dimension logs
3. **Field names mismatch** → Already fixed in latest code

**Solution:**
```bash
# Delete old templates
cd backend
echo "DELETE FROM certificate_templates;" | sqlite3 database.db

# Restart
npm start

# Create NEW template
# Text should appear correctly!
```

### Issue: CORS error on download
**Solution:**
- Backend already has CORS headers
- Restart backend if still seeing errors
- Disable IDM (Internet Download Manager) for localhost

### Issue: Fields not mapping
**Check backend console:**
- Should show "✅ Mapped to: ..." for each field
- If shows "⚠️ No mapping found" → Check field names

**Field name mapping:**
- `studentName` → Student first + last name
- `courseName` → Course name
- `date` → Issue date
- `certificateNumber` → Generated cert number
- `email` → Student email
- `nationalId` → Student national ID
- `passportNo` → Student passport number

---

## 📊 Verification Checklist

After setup, verify everything works:

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Sharp module loaded successfully
- [ ] Can create template (dimensions detected correctly)
- [ ] Can position fields on template
- [ ] Can add students
- [ ] Can generate certificate
- [ ] PDF has visible text at correct positions
- [ ] QR code verification works
- [ ] Can delete students (red trash button works)
- [ ] No CORS errors in console

---

## 🎉 Success Indicators

**When everything is working:**

1. **Template Upload:**
   ```
   ✅ Template uploaded, dimensions: 3000 x 2000
   ✅ Thumbnail generated: thumb-template-xxx.png
   ```

2. **Certificate Generation:**
   ```
   🔄 Mapping field data for 4 fields:
      ✅ Mapped to: "STUDENT NAME"
      ✅ Mapped to: "COURSE NAME"
   📝 Processing 4 fields for Image->PDF template
      ✅ Drawing text at (x, y) with size Z
   ✅ Image template converted to PDF successfully
   ```

3. **PDF Result:**
   - Open generated PDF
   - **Text is visible** ✅
   - Text is at correct positions ✅
   - QR code is present ✅
   - Everything looks professional ✅

---

## 📚 Additional Resources

- **Bug Fixes:** See `CRITICAL_BUGS_FIXED.md`
- **New Features:** See `FEATURES_ADDED.md`
- **Sharp Install Help:** See `SHARP_INSTALL_GUIDE.md`
- **General Fixes:** See `FIXES_APPLIED.md`

---

## 🆘 Still Having Issues?

1. **Check console logs** (both backend and frontend)
2. **Verify Sharp is installed:** `npm list sharp` in backend folder
3. **Delete database and start fresh:** `rm backend/database.db`
4. **Delete old node_modules:**
   ```bash
   rm -rf backend/node_modules
   rm -rf frontend/node_modules
   npm install
   ```
5. **Check this checklist carefully** - most issues are from old templates or missing Sharp

---

**Everything should work perfectly now!** 🎊

If text appears on PDFs and delete buttons work, you're all set! 🚀
