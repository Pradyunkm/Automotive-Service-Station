# 🚀 Vercel Deployment Steps

## ✅ Step 1: Go to Vercel Dashboard

1. Open a new browser tab: **https://vercel.com/**
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

---

## ✅ Step 2: Import Your Project

1. Once logged in, click **"Add New..."** → **"Project"**
2. You'll see your GitHub repositories
3. Find: **`Pradyunkm/Automotive-Service-Station`**
4. Click **"Import"** next to it

---

## ✅ Step 3: Configure Your Project

On the configuration screen:

### Framework Preset
- Should auto-detect as **"Vite"** ✅
- If not, select **"Vite"** from dropdown

### Root Directory
- Leave as **`./`** (default)

### Build Settings
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `dist` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

---

## ✅ Step 4: Add Environment Variables

**CRITICAL:** Click **"Environment Variables"** to expand the section.

Add these **3 environment variables** (click "Add" after each):

### Variable 1:
```
Name: VITE_API_URL
Value: https://automotive-service-station.onrender.com
```

### Variable 2:
```
Name: VITE_SUPABASE_URL
Value: https://cjsnzhojwyhfrihiqdmf.supabase.co
```

### Variable 3:
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqc256aG9qd3loZnJpaGlxZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NTYzNTIsImV4cCI6MjA0ODAzMjM1Mn0.VSb1hN9RdnIdPZ-Gsl9kGg0BNsYAS6xiQPIgg5NDs
```

---

## ✅ Step 5: Deploy!

1. **Click "Deploy"** button
2. Wait 2-3 minutes for deployment
3. You'll see a **"Congratulations"** page with confetti 🎉
4. **Copy your URL** (e.g., `https://your-app.vercel.app`)

---

## ✅ Step 6: Test Your Frontend

Visit your Vercel URL and verify:
- ✅ Page loads without errors
- ✅ No CORS errors in console (F12)
- ✅ Can upload and analyze images
- ✅ Backend connection works

---

## 🎉 That's It!

Your frontend will be live in about 3 minutes!

**Next:** After frontend deploys, we need to update the CORS settings in your backend `api.py` file.
