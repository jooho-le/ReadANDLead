Read & Lead — Deployment Quick Guide

1) Backend (API)
- Host: Ubuntu server or any Linux host.
- Env: copy `server/.env.example` to `server/.env` and edit:
  - `ALLOWED_ORIGINS=https://web.your-domain.com,http://localhost`
  - Change secrets, DB as needed.
- Install deps in a venv and run Gunicorn:
  - `python -m venv .venv && source .venv/bin/activate`
  - `pip install -r server/requirements.txt gunicorn`
  - `cd server && ./run_gunicorn.sh 127.0.0.1:8000`
- Nginx reverse proxy: see `server/deploy/nginx-api.conf.example`.
- Systemd service: see `server/deploy/systemd/readandlead-api.service.example`.

2) Frontend (Web)
- Set API URL: copy `react-frontend/.env.production.example` to `react-frontend/.env.production` and edit:
  - `REACT_APP_API_URL=https://api.your-domain.com`
  - Set Kakao/Google keys.
- Build: `cd react-frontend && npm ci && npm run build`.
- Host with Nginx: see `react-frontend/deploy/nginx-web.conf.example` (serve `build/`).

3) Android App (ONE store)
- Ensure API is reachable via HTTPS in production.
- Build web and sync: `cd react-frontend && npm run build:android`.
- Open Android Studio: `npx cap open android`.
- Sign and build release APK: Build > Generate Signed Bundle/APK… > APK > release.
- Each upload must increment `versionCode` in `android/app/build.gradle`.
- Upload `app-release.apk` to ONE store, provide store listings and privacy policy URL.

Notes
- CORS is controlled via `ALLOWED_ORIGINS` in the API (`server/app/main.py`).
- For local/emulator tests, you can use `http://10.0.2.2:8000` in `.env` but production should be HTTPS.

