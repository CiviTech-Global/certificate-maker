# Sharp Installation Guide

## Issue

The `sharp` library requires native binaries that may not install correctly on all systems, especially with Node.js 22+.

## Solution Options

### Option 1: Run Production Build (Recommended)

The application works fine with the compiled JavaScript. Use this approach:

```bash
cd backend
npm run build
npm start
```

### Option 2: Fix Sharp Installation

Try these steps in order:

1. **Delete and Clean Install**:
   ```bash
   cd backend
   rm -rf node_modules
   rm package-lock.json
   npm cache clean --force
   npm install
   ```

2. **Install Sharp with Platform Specific Options**:
   ```bash
   npm install --os=win32 --cpu=x64 sharp
   ```

3. **Try an Older Sharp Version**:
   ```bash
   npm install sharp@0.32.6
   ```

4. **Downgrade Node.js**:
   - Sharp works best with Node.js 18 or 20
   - If you're on Node 22, consider downgrading temporarily

### Option 3: Use PDF Templates Only

The application is designed to work with or without sharp:
- **With Sharp**: Both image (PNG/JPG) and PDF templates work
- **Without Sharp**: Only PDF templates work

You can use PDF templates exclusively and the app will work perfectly!

## Current Status

✅ The code has been updated to handle sharp gracefully:
- If sharp loads: Image and PDF templates both work
- If sharp fails: Only PDF templates work, application still runs

✅ Backend compiles and runs in production mode without errors

## Testing

### Test if Sharp Works:
```bash
cd backend
node -e "try { const sharp = require('sharp'); console.log('✅ Sharp works!', sharp.versions); } catch(e) { console.log('❌ Sharp not available:', e.message); }"
```

### Run Application:

**Development (with auto-reload)**:
```bash
npm run dev
```

**Production (compiled)**:
```bash
npm run build
npm start
```

## Workaround

If you can't get sharp to work:

1. Use the production build (`npm run build && npm start`)
2. Create templates using PDF files instead of images
3. The application will work perfectly with all features except image template upload

The programmatic certificate generation (default method) works 100% regardless of sharp status.
