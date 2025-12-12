# 🚀 Deployment Guide - Automotive Service Station

This guide will help you deploy your automotive service station application from localhost to a public URL.

## 📋 Architecture Overview

Your application consists of:
- **Frontend**: Vite + React + TypeScript
- **Backend**: FastAPI (Python)
- **Database**: Supabase
- **ML Models**: YOLO (scratch/dent + brake detection)
- **Hardware**: Raspberry Pi cameras + ESP32/Arduino sensors

---

## 🌐 Recommended Deployment Strategy

### Option 1: Combined Deployment (Recommended)
**Best for**: Quick deployment with minimal cost

- **Frontend**: Vercel (Free)
- **Backend**: Render (Free tier) or Railway ($5/month)
- **Raspberry Pi**: Stays local, sends data to cloud backend

### Option 2: Full Cloud Deployment
**Best for**: Production-ready setup

- **Frontend**: Vercel
- **Backend**: AWS EC2, DigitalOcean, or Render
- **Raspberry Pi**: Connects to cloud backend

---

## 🎯 Step-by-Step Deployment

## Part 1: Deploy Backend (FastAPI)

### Option A: Deploy to Render (Free Tier)

1. **Create a `requirements.txt` file** (if not exists):
   ```bash
   cd "d:\VSProjects\automotive service station\automotive service station\project-bolt-sb1-wua7wked\project-bolt-sb1-wua7wked"
   pip freeze > requirements.txt
   ```

2. **Create Render configuration** (`render.yaml`):
   ```yaml
   services:
     - type: web
       name: automotive-service-backend
       env: python
       buildCommand: "pip install -r requirements.txt"
       startCommand: "uvicorn api:app --host 0.0.0.0 --port $PORT"
       envVars:
         - key: PYTHON_VERSION
           value: 3.11.0
   ```

3. **Sign up and deploy**:
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Select "New Web Service"
   - Choose your repo
   - Configure environment variables (Supabase URL, API keys)
   - Deploy!

4. **Get your backend URL**: 
   - Example: `https://automotive-service-backend.onrender.com`

### Option B: Deploy to Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Add environment variables** in Railway dashboard

---

## Part 2: Deploy Frontend (Vite React)

### Deploy to Vercel (Recommended)

1. **Update API endpoint in your code**:
   
   Create/update `.env.production` file:
   ```env
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

2. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

3. **Deploy**:
   ```bash
   cd "d:\VSProjects\automotive service station\automotive service station\project-bolt-sb1-wua7wked\project-bolt-sb1-wua7wked"
   vercel
   ```

4. **Follow prompts**:
   - Link to Vercel account
   - Choose project name
   - Confirm settings
   - Deploy!

5. **Get your frontend URL**: 
   - Example: `https://automotive-service.vercel.app`

### Alternative: Deploy to Netlify

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

---

## Part 3: Configure Raspberry Pi

Your Raspberry Pi needs to send data to the cloud backend instead of localhost.

1. **Update RPI scripts** (`rpi_multi_camera_yolo.py`):
   
   Change this line:
   ```python
   # OLD
   BACKEND_URL = "http://localhost:8000"
   
   # NEW
   BACKEND_URL = "https://your-backend-url.onrender.com"
   ```

2. **Test connection**:
   ```bash
   python3 rpi_multi_camera_yolo.py
   ```

---

## Part 4: Environment Variables Setup

### Backend Environment Variables (Render/Railway)

Add these in your deployment platform dashboard:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
PORT=8000
```

### Frontend Environment Variables (Vercel)

Create `.env.production`:

```env
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## ⚡ Quick Start (Fastest Method)

### Using Render + Vercel (No CLI needed)

#### Backend (Render):
1. Push your code to GitHub
2. Go to [render.com](https://render.com) → "New Web Service"
3. Connect GitHub → Select repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn api:app --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Click "Create Web Service"
8. Copy the deployed URL

#### Frontend (Vercel):
1. Go to [vercel.com](https://vercel.com) → "New Project"
2. Import your GitHub repository
3. Framework Preset: Vite
4. Add environment variable: `VITE_API_URL=<your-render-backend-url>`
5. Click "Deploy"
6. Copy the deployed URL

#### Update RPI:
1. Edit `rpi_multi_camera_yolo.py`
2. Change `BACKEND_URL` to your Render backend URL
3. Restart the script

**Done! Your app is now live! 🎉**

---

## 🔧 Important Configuration Updates

### 1. Update CORS in `api.py`

Replace:
```python
allow_origins=["*"]
```

With:
```python
allow_origins=[
    "https://your-frontend-url.vercel.app",
    "http://localhost:5173",  # For local development
]
```

### 2. Update Frontend API Calls

Ensure all API calls use the environment variable:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

---

## 📊 Deployment Costs

| Service | Plan | Cost | Best For |
|---------|------|------|----------|
| Vercel | Free | $0/mo | Frontend hosting |
| Render | Free | $0/mo | Backend (with sleep) |
| Render | Starter | $7/mo | Backend (no sleep) |
| Railway | Starter | $5/mo | Backend (5GB storage) |
| Netlify | Free | $0/mo | Frontend hosting |

---

## 🧪 Testing Your Deployment

1. **Test Backend**:
   ```bash
   curl https://your-backend-url.onrender.com/api/health
   ```

2. **Test Frontend**: 
   - Visit `https://your-frontend-url.vercel.app`
   - Check browser console for errors
   - Test image upload functionality

3. **Test RPI Connection**:
   - Run RPI script
   - Verify data appears in website

---

## 🐛 Troubleshooting

### Backend won't start
- Check `requirements.txt` includes all dependencies
- Verify Python version (3.10 or 3.11 recommended)
- Check Render/Railway logs

### CORS errors
- Update `allow_origins` in `api.py`
- Redeploy backend

### RPI can't connect
- Verify `BACKEND_URL` is correct
- Check firewall settings
- Ensure backend is running (Render free tier sleeps after inactivity)

### Frontend can't fetch data
- Check `VITE_API_URL` environment variable
- Verify backend is accessible
- Check browser console for CORS errors

---

## 🎓 Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates (automatic on Vercel/Render)
3. Set up monitoring and logging
4. Configure CI/CD for automatic deployments
5. Set up database backups

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

---

## ✅ Deployment Checklist

- [ ] Create `requirements.txt` for backend
- [ ] Push code to GitHub
- [ ] Deploy backend to Render/Railway
- [ ] Get backend URL
- [ ] Update frontend `.env.production` with backend URL
- [ ] Deploy frontend to Vercel
- [ ] Update CORS settings in backend
- [ ] Update RPI scripts with cloud backend URL
- [ ] Test all functionality
- [ ] Monitor for errors

---

**Need help?** Check the troubleshooting section or create an issue in your repository.
