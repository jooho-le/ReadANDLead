# Read&Lead – Production Deploy Templates

This folder contains example configs for Nginx and a systemd service to deploy the API and SPA using `api.readandlead.app` and `app.readandlead.app`.

Adjust paths and domains as needed.

## 0) Server prep (Ubuntu example)

- Create app directories:
  - `/opt/readandlead` (root)
  - `/opt/readandlead/server` (this repo's `server/`)
  - `/var/www/app.readandlead.app` (React build output)
- Install system packages:
  - `sudo apt update && sudo apt install -y python3-venv python3-pip nginx certbot python3-certbot-nginx`
- Python venv:
  - `python3 -m venv /opt/readandlead/venv`
  - `source /opt/readandlead/venv/bin/activate`
  - `pip install --upgrade pip`
  - `pip install -r /opt/readandlead/server/requirements.txt gunicorn`

## 1) Backend env

- Copy `server/.env` from this repo to `/opt/readandlead/server/.env` and fill values:
  - `SECRET_KEY` and `JWT_SECRET` (strong random)
  - `FRONTEND_ORIGINS=https://app.readandlead.app,capacitor://localhost`
  - `CULTURE_API_KEY`, `KOPIS_API_KEY` (and others if used)

## 2) Systemd service

- Copy `scripts/systemd/readandlead-api.service` to `/etc/systemd/system/readandlead-api.service`.
- Edit `WorkingDirectory` and `EnvironmentFile` if your path differs.
- Enable + start:
  - `sudo systemctl daemon-reload`
  - `sudo systemctl enable --now readandlead-api`
  - Verify: `curl http://127.0.0.1:8000/api/ping`

## 3) Nginx + SSL

- Copy Nginx configs:
  - `sudo cp scripts/nginx/api.readandlead.app.conf /etc/nginx/sites-available/`
  - `sudo cp scripts/nginx/app.readandlead.app.conf /etc/nginx/sites-available/`
  - `sudo ln -s /etc/nginx/sites-available/api.readandlead.app.conf /etc/nginx/sites-enabled/`
  - `sudo ln -s /etc/nginx/sites-available/app.readandlead.app.conf /etc/nginx/sites-enabled/`
- Test and reload:
  - `sudo nginx -t && sudo systemctl reload nginx`
- Issue certs (Let’s Encrypt):
  - `sudo certbot --nginx -d api.readandlead.app -d app.readandlead.app`

## 4) Frontend build + upload

- On your dev machine (in this repo):
  - `cd react-frontend && npm ci && npm run build`
  - Upload `react-frontend/build/*` to the server path `/var/www/app.readandlead.app/`.
  - Ensure `index.html` is at the root of that directory.
- Reload Nginx: `sudo systemctl reload nginx`

## 5) Capacitor Android (optional)

- If you bundle the web into the app:
  - `cd react-frontend && npm run build && npx cap copy android`
  - Build release: `cd android && ./gradlew bundleRelease` (or `assembleRelease` for APK)
- If you load remote web:
  - In `react-frontend/capacitor.config.ts`, set:
    ```ts
    server: { url: 'https://app.readandlead.app', cleartext: false }
    ```
  - Rebuild the app.
- Ensure CORS: server `FRONTEND_ORIGINS` includes `capacitor://localhost` if bundling.

## 6) Providers (Kakao/Maps)

- Kakao JS key → allowed domain: `app.readandlead.app`
- Google Maps JS key → HTTP referrer restriction for `https://app.readandlead.app/*`

## 7) Troubleshooting

- 403/401 on API: check `FRONTEND_ORIGINS` and token header.
- CORS errors in console: confirm exact origin string matches and HTTPS is used.
- Culture/KOPIS errors: ensure keys present in `/opt/readandlead/server/.env`.
- White page on SPA refresh: Nginx `try_files $uri /index.html;` enabled.

