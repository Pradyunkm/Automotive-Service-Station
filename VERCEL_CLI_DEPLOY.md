# Quick Vercel CLI Deployment

## Install Vercel CLI
npm install -g vercel

## Login to Vercel
vercel login

## Deploy
cd "d:\VSProjects\automotive service station\automotive service station\project-bolt-sb1-wua7wked\project-bolt-sb1-wua7wked"
vercel --prod

## Follow prompts:
- Set up and deploy: Y
- Scope: Select your account
- Link to existing project: N
- Project name: smart-auto-diagnostic-hub
- Directory: ./
- Override settings: N

## Environment Variables
You'll be prompted to add environment variables:
- VITE_API_URL=https://automotive-service-station.onrender.com
- VITE_SUPABASE_URL=https://cjsnzhojwyhfrihiqdmf.supabase.co
- VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqc256aG9qd3loZnJpaGlxZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NTYzNTIsImV4cCI6MjA0ODAzMjM1Mn0.VSb1hN9RdnIdPZ-Gsl9kGg0BNsYAS6xiQPIgg5NDs
