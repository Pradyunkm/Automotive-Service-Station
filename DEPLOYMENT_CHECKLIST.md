# 🚀 Quick Deployment Checklist

Follow these steps to deploy your application to production.

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Supabase credentials ready (URL and anon key)
- [ ] Render account created (render.com)
- [ ] Vercel account created (vercel.com)

---

## 📦 Step 1: Deploy Backend to Render

1. **Go to Render Dashboard**
   - Visit: https://render.com/
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Connect your GitHub account
   - Select your repository
   - Click "Connect"

3. **Configure Service**
   - **Name**: `automotive-service-backend`
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable":
   ```
   SUPABASE_URL = <your_supabase_url>
   SUPABASE_KEY = <your_supabase_anon_key>
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - **Copy your backend URL** (e.g., `https://automotive-service-backend.onrender.com`)

---

## 🌐 Step 2: Deploy Frontend to Vercel

1. **Create Production Environment File**
   Create file: `.env.production` with:
   ```env
   VITE_API_URL=<your_render_backend_url>
   VITE_SUPABASE_URL=<your_supabase_url>
   VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
   ```

2. **Commit and Push**
   ```bash
   git add .env.production
   git commit -m "Add production environment"
   git push
   ```

3. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/
   - Click "Add New" → "Project"

4. **Import Repository**
   - Connect GitHub account
   - Select your repository
   - Click "Import"

5. **Configure Project**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. **Add Environment Variables**
   - `VITE_API_URL` = `<your_render_backend_url>`
   - `VITE_SUPABASE_URL` = `<your_supabase_url>`
   - `VITE_SUPABASE_ANON_KEY` = `<your_supabase_anon_key>`

7. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes
   - **Copy your frontend URL** (e.g., `https://automotive-service.vercel.app`)

---

## 🔧 Step 3: Update Backend CORS

1. **Edit `api.py` on GitHub** (line 17)
   
   Change:
   ```python
   allow_origins=["*"],
   ```
   
   To:
   ```python
   allow_origins=[
       "https://your-frontend-url.vercel.app",  # Your actual Vercel URL
       "http://localhost:5173",  # Keep for local dev
   ],
   ```

2. **Commit and Push**
   - This will auto-redeploy backend on Render

---

## 🔌 Step 4: Update Raspberry Pi (Optional)

If you're using Raspberry Pi cameras:

1. **SSH into Raspberry Pi**

2. **Edit RPI Script**
   ```bash
   cd /path/to/your/rpi/scripts
   nano rpi_multi_camera_yolo.py
   ```

3. **Update Backend URL**
   Change line with `BACKEND_URL`:
   ```python
   BACKEND_URL = "https://your-render-backend-url.onrender.com"
   ```

4. **Save and Restart**
   ```bash
   sudo systemctl restart rpi-camera.service
   # OR
   python3 rpi_multi_camera_yolo.py
   ```

---

## ✅ Step 5: Test Deployment

### Test Backend
```bash
curl https://your-backend-url.onrender.com/api/health
```
Expected: `{"status":"online"}`

### Test Frontend
1. Visit your Vercel URL in browser
2. Open browser console (F12)
3. Check for errors
4. Try uploading a test image
5. Verify results display correctly

### Test Complete Flow
1. Start a new service session
2. Capture images
3. Check detection results
4. Verify data in Supabase dashboard

---

## 🎉 Deployment Complete!

Your application is now live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

### Important Notes

⚠️ **Render Free Tier**
- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes ~1 minute to wake up
- Upgrade to paid plan ($7/month) for always-on service

💡 **Next Steps**
- Set up custom domain (optional)
- Configure uptime monitoring
- Set up error tracking
- Schedule regular backups

---

## 🐛 Troubleshooting

### Backend won't start
- Check Render logs in dashboard
- Verify `requirements.txt` is correct
- Check Python version (should be 3.11)

### CORS errors
- Verify frontend URL is in `allow_origins`
- Make sure URL matches exactly (no trailing slash)
- Redeploy backend after changes

### Frontend can't connect
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Test backend health endpoint directly

### Images not uploading
- Check Supabase storage buckets exist
- Verify Supabase credentials are correct
- Check file size limits

---

## 📞 Need Help?

Refer to:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed guide
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
