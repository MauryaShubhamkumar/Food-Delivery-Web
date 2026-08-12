# FastBite SaaS Deployment & Operations Guide

## 1. Environment Setup

### Backend (Render Deployment)
1. **Environment Variables**:
   Set the following variables in Render Dashboard:
   - `PORT`: `4000`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate a secure 64-character random string.
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`: TiDB Cloud connection details.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary API keys.
   - `RESEND_API_KEY`, `EMAIL_FROM`: Resend credentials.
   - `FRONTEND_URL`: Production domain URL of your frontend.

2. **Build & Start Commands**:
   - Build Command: `npm install`
   - Start Command: `node server.js`

### Frontend Deployment
1. **Environment Variables**:
   - `VITE_BACKEND_URL`: `https://your-backend-render-app.onrender.com`
2. **Build Command**: `npm run build`

## 2. Health Monitoring & Database Backups

- **Liveness Health Check**: `GET /health`
  Returns `200 OK` with database ping status.
- **TiDB Cloud Database Backups**:
  Daily automated snapshot backups are managed via TiDB Cloud console under **Cluster Settings -> Automated Backups**.
