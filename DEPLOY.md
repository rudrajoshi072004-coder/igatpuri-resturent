# Deploy with Docker

Single-command production deploy for the full stack (backend + customer app + admin dashboard).

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+
- Git

## Quick start

```bash
git clone https://github.com/rudrajoshi072004-coder/igatpuri-resturent.git
cd igatpuri-resturent

cp .env.example .env
# Edit .env — at minimum change SECRET_KEY, POSTGRES_PASSWORD, JWT_SECRET

docker compose up --build -d
```

Open **http://localhost** (or your server IP).

| URL | Service |
|-----|---------|
| http://localhost/ | Customer app (Next.js) |
| http://localhost/admin-dashboard/ | Admin dashboard |
| http://localhost/api/ | Backend REST API |
| http://localhost/admin/ | Django admin |

## What runs

```
nginx :80
 ├── /           → customer-web (Next.js production)
 ├── /admin-dashboard/ → admin-web (Vite static build)
 ├── /api/       → backend (Django + Gunicorn)
 └── /admin/     → backend (Django admin)
db (PostgreSQL) + redis
```

On first start the backend automatically:
1. Runs migrations
2. Seeds base data (`seed_igatpuri`)
3. Seeds HOTEL NEW APNA menu (`seed_hotel_new_apna`)
4. Collects static files
5. Starts Gunicorn

## Default credentials

- **Admin dashboard:** `admin@igatpurieats.com` / `admin123`
- **Delivery boys:** `boy1@igatpurieats.com` / `boy123`

## Environment variables

See `.env.example` for all options. Key ones:

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Django secret (change in production) |
| `POSTGRES_PASSWORD` | Database password |
| `ALLOWED_HOSTS` | Comma-separated hostnames/IPs |
| `RAZORPAY_KEY_ID` | Razorpay **Key ID** (live: `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay **Key Secret** (never commit to git) |
| `APP_PORT` | Host port nginx listens on (default `80`) |

## Useful commands

```bash
# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild after code changes
docker compose up --build -d

# Re-seed menu manually
docker compose exec backend python manage.py seed_hotel_new_apna
```

## Production tips

1. Set `DEBUG=False` in `.env`
2. Use strong `SECRET_KEY`, `POSTGRES_PASSWORD`, `JWT_SECRET`
3. Add your domain/IP to `ALLOWED_HOSTS`
4. Put a reverse proxy with SSL (Caddy, Traefik, or Certbot) in front of port 80

---

## Deploy on Render

Render expects a **`Dockerfile` in the repo root** — use the all-in-one image at `./Dockerfile`.

### Steps

1. Push code to GitHub (branch `main`).
2. On [Render](https://render.com) → **New → Web Service** → connect your repo.
3. Settings:
   - **Environment:** Docker
   - **Dockerfile Path:** `Dockerfile` (root)
   - **Instance type:** at least Starter (512 MB RAM recommended)
4. Add a **PostgreSQL** database on Render, then set these env vars on the web service:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | *(from Render Postgres — Internal URL)* |
| `SECRET_KEY` | long random string |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `your-app.onrender.com` |
| `JWT_SECRET` | random string |
| `RAZORPAY_KEY_ID` | `rzp_live_...` from Razorpay Dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | secret from same page (add only in Render env, not in code) |

5. Click **Deploy**.

The root Dockerfile builds backend + customer app + admin dashboard into **one container**. Nginx listens on Render's `$PORT` and routes:

- `/` → customer app
- `/admin-dashboard/` → admin dashboard
- `/api/` → Django API

### Render notes

- First deploy takes ~5–10 min (builds Next.js + Vite + Python).
- If build runs out of memory, upgrade to a larger instance.
- Add your `onrender.com` hostname to `ALLOWED_HOSTS` or the API will return 400.

