# Easy Living - Full Stack Application

A comprehensive house management and billing system built with React (frontend) and Node.js/Express (backend).

## 🚀 Deployment Guide

### Backend Deployment (Render)

1. **Create a Render Account**
   - Go to [render.com](https://render.com) and sign up
   - Connect your GitHub repository

2. **Deploy Backend**
   - Create a new Web Service
   - Connect your GitHub repo
   - Set build settings:
     - Build Command: `npm install`
     - Start Command: `npm start`
   - Add environment variables:
     - `MONGO_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret key
     - `PAYSTACK_SECRET_KEY`: Your Paystack secret key
     - `NODE_ENV`: `production`

3. **Get Backend URL**
   - After deployment, note the service URL (e.g., `https://easy-living-backend.onrender.com`)

### Frontend Deployment (Vercel)

1. **Create a Vercel Account**
   - Go to [vercel.com](https://vercel.com) and sign up
   - Connect your GitHub repository

2. **Update Environment Variables**
   - Edit `frontend/.env`
   - Replace `https://your-render-backend-url.onrender.com` with your actual Render backend URL

3. **Deploy Frontend**
   - Create a new project in Vercel
   - Connect your GitHub repo
   - Set root directory to `frontend`
   - Vercel will automatically detect the `vercel.json` configuration
   - Add environment variable:
     - `REACT_APP_API_URL`: Your Render backend URL

### Local Development

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Fill in your local environment variables
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📋 Configuration Files

- `vercel.json`: Configures SPA routing for Vercel
- `render.yaml`: Blueprint for Render deployment
- `frontend/.env`: Environment variables for frontend
- `backend/.env.example`: Template for backend environment variables

## 🔧 Features

- User authentication with JWT
- House management
- Bill tracking and payment processing
- Wallet functionality with Paystack integration
- Responsive React frontend

## 🛠 Tech Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express, MongoDB, JWT
- **Payments**: Paystack
- **Deployment**: Vercel (frontend), Render (backend)
