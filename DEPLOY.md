# Chatio Deployment Guide

Deploy **backend** on **Render** or **Railway** (WebSocket required).  
Deploy **frontend** on **Vercel** (static React app).

```
┌─────────────────┐     REST + WebSocket      ┌──────────────────┐
│  Vercel         │ ─────────────────────────► │  Render/Railway  │
│  (Frontend)     │     VITE_BACKEND_URL       │  (Node + Socket)   │
└─────────────────┘                            └────────┬─────────┘
                                                        │
                                                        ▼
                                               ┌──────────────────┐
                                               │  MongoDB Atlas   │
                                               └──────────────────┘
```

---

## Part 1 — MongoDB Atlas (one time)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → create free cluster.
2. **Database Access** → add user with password.
3. **Network Access** → allow `0.0.0.0/0` (all IPs) for cloud deploy.
4. **Connect** → copy connection string → replace `<password>`.
5. Save as `MONGODB_URI`.

---

## Part 2 — Backend on Render (recommended)

### Option A: Blueprint (fastest)

1. Push this repo to GitHub.
2. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect repo → Render reads `render.yaml` automatically.
4. Fill secret env vars when prompted:
   - `MONGODB_URI`
   - `FRONTEND_URL` (add after frontend deploy)
   - `ZEGO_APP_ID`, `ZEGO_SERVER_SECRET`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `CLOUDINARY_*` keys
5. Click **Apply** → wait for deploy.
6. Copy backend URL: `https://chatio-backend.onrender.com`

### Option B: Manual Web Service

1. **New** → **Web Service** → connect repo.
2. Settings:
   | Field | Value |
   |-------|-------|
   | Root Directory | `Server` |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Health Check Path | `/api/status` |
3. Add all env vars from `Server/.env.example`.
4. Deploy.

### Render free tier note

Free services **spin down after 15 min idle**. First request may take ~30s. WebSocket reconnects automatically after wake-up.

---

## Part 3 — Backend on Railway (alternative)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**.
2. Select this repo.
3. Service settings:
   - **Root Directory**: `Server`
   - Railway auto-reads `Server/railway.toml`
4. **Variables** tab → add all vars from `Server/.env.example`.
5. **Settings** → **Networking** → **Generate Domain**.
6. Copy URL: `https://your-app.up.railway.app`

---

## Part 4 — Frontend on Vercel

1. [vercel.com](https://vercel.com) → import repo.
2. Settings:
   | Field | Value |
   |-------|-------|
   | Root Directory | `Chatio_frontend` |
   | Framework | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
3. **Environment Variables**:

   ```
   VITE_BACKEND_URL=https://chatio-backend.onrender.com
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_FB_APP_ID=your_facebook_app_id
   ```

4. Deploy → copy frontend URL: `https://your-app.vercel.app`

---

## Part 5 — Connect frontend ↔ backend

Go back to **Render/Railway** backend env vars and set:

```
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy backend after updating `FRONTEND_URL` (CORS).

---

## Part 6 — Google OAuth redirect

In [Google Cloud Console](https://console.cloud.google.com):

1. **APIs & Services** → **Credentials** → your OAuth client.
2. **Authorized JavaScript origins**:
   - `https://your-app.vercel.app`
   - `http://localhost:5173`
3. Keep redirect URI as `postmessage` (already used in code).

---

## Verify deployment

### Backend health
Open: `https://your-backend.onrender.com/api/status`  
Expected: `Server is running`

### WebSocket (browser console after login)
```
Socket connected: <userId>
```
No `WebSocket connection failed` errors.

### Real-time test (two browsers, two accounts)
- [ ] Message appears instantly without refresh
- [ ] Online/Offline status updates
- [ ] Call popup appears on receiver within 1–2 seconds
- [ ] Status updates in real time

---

## Environment variables checklist

### Backend (`Server/.env.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | Yes | Database |
| `JWT_SECRET` | Yes | Auth tokens |
| `FRONTEND_URL` | Yes | CORS |
| `ZEGO_APP_ID` | For calls | Voice/video |
| `ZEGO_SERVER_SECRET` | For calls | Voice/video |
| `GOOGLE_CLIENT_ID` | For Google login | OAuth |
| `GOOGLE_CLIENT_SECRET` | For Google login | OAuth |
| `CLOUDINARY_*` | For images | Status/chat photos |
| `SMTP_*` | Optional | Email verification |

### Frontend (`Chatio_frontend/.env.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_BACKEND_URL` | Yes | API + Socket URL |
| `VITE_GOOGLE_CLIENT_ID` | For Google login | OAuth |
| `VITE_FB_APP_ID` | Optional | Facebook login |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| WebSocket still fails | Confirm `VITE_BACKEND_URL` points to Render/Railway, **not** Vercel |
| CORS error | Set `FRONTEND_URL` on backend to exact Vercel URL, redeploy |
| MongoDB connection fail | Check Atlas IP whitelist (`0.0.0.0/0`) and `MONGODB_URI` |
| Calls don't connect | Add `ZEGO_APP_ID` + `ZEGO_SERVER_SECRET` on backend |
| Render slow first load | Free tier cold start — normal, wait 30s |
| Socket works locally but not prod | Ensure `server.listen()` runs (fixed in `server.js`) |

---

## Local development

```bash
# Terminal 1 — Backend
cd Server
cp .env.example .env   # fill values
npm install
npm run dev

# Terminal 2 — Frontend
cd Chatio_frontend
cp .env.example .env   # VITE_BACKEND_URL=http://localhost:8000
npm install
npm run dev
```
