# Igatpuri Eats MVP

Local food ordering and parcel delivery platform for Igatpuri with customer app, admin dashboard, and delivery panel.

## Project Overview

- Customer app: `http://localhost/` (or Next dev on `http://localhost:3000`)
- Admin dashboard: `http://localhost/admin-dashboard/` (or Vite dev on `http://localhost:5173/admin-dashboard/`)
- Delivery panel: `http://localhost/delivery` (served by customer web)
- Backend API: Django + DRF + JWT at `http://localhost:8000/api`

## Tech Stack

- Frontend: React (Next.js for customer + delivery), React + Vite (admin)
- Backend: Django, Django REST Framework, JWT
- DB: SQLite (local default) or PostgreSQL (`DATABASE_URL`)
- Optional cache: Redis
- Docker: backend, customer-web, admin-web, db, redis, nginx

## Local Setup

## 1) Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_igatpuri
python manage.py runserver
```

## 2) Customer web

```bash
cd customer-web
npm install
npm run dev
```

## 3) Admin web

```bash
cd admin-web
npm install
npm run dev
```

Set API envs in your shell or `.env`:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api`
- `VITE_API_BASE_URL=http://localhost:8000/api`

## Seed Data Command

```bash
python manage.py seed_igatpuri
```

## Credentials

- Admin:
  - Email: `admin@igatpurieats.com`
  - Password: `admin123`
- Delivery Boy 1:
  - Email: `boy1@igatpurieats.com`
  - Password: `boy123`
  - Phone: `9876543210`
- Delivery Boy 2:
  - Email: `boy2@igatpurieats.com`
  - Password: `boy123`
  - Phone: `9876543211`

## Docker

```bash
docker compose up --build
```

## API Base URL

- Frontend should use: `http://localhost:8000/api`

## Full Test Flow

1. Open customer app.
2. Select Dhaba A.
3. Add Paneer Butter Masala + Roti.
4. Checkout with name/phone/address (optional geolocation).
5. Place order and note order number.
6. Open admin dashboard and login as admin.
7. Open Live Orders → review same order.
8. Update charges/status and assign delivery boy.
9. Open delivery panel `/delivery` and login as assigned boy.
10. Update status: reached restaurant → picked up → on the way → delivered.
11. Mark payment collected.
12. Verify admin dashboard stats update from database.

# Igatpuri Food Delivery Platform

A complete production-ready MVP project for a local food parcel and delivery service tailored for Igatpuri, Maharashtra.

## Features
- **Customer Web (Next.js PWA):** Mobile-first UI, browse restaurants, menu, cart, checkout, order tracking.
- **Admin Dashboard (React/Vite):** Professional dashboard to manage restaurants, menu, orders, delivery boys, and pricing.
- **Backend API (Django + DRF):** RESTful API with JWT authentication, role-based access control, PostgreSQL database, and Redis caching.
- **Dockerized Setup:** Entire stack runnable via Docker Compose.
- **Nginx Reverse Proxy:** Routes traffic to appropriate services.

## Tech Stack
- **Backend:** Django, Django REST Framework, PostgreSQL, Redis
- **Frontend (Customer):** Next.js, Tailwind CSS
- **Frontend (Admin):** React (Vite), Tailwind CSS
- **Infrastructure:** Docker, Docker Compose, Nginx

## Local Setup

### Prerequisites
- Docker and Docker Compose installed
- Git

### Steps
1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in the necessary values.
   ```bash
   cp .env.example .env
   ```
3. Run Docker Compose to build and start the containers.
   ```bash
   docker-compose up --build
   ```
4. Access the applications:
   - **Customer Web:** http://localhost
   - **Admin Dashboard:** http://localhost/admin-dashboard/
   - **Backend API:** http://localhost/api/
   - **Django Admin:** http://localhost/admin/

### Initial Setup (Creating Superuser & Running Migrations)
Migrations run automatically on startup. To create an initial admin user:
```bash
docker-compose exec backend python manage.py createsuperuser
```
Follow the prompts to create the user. You can then log in to the Admin Dashboard or Django Admin with these credentials.

### Loading Seed Data
```bash
docker-compose exec backend python manage.py loaddata seed_data.json
```

## Folder Structure
```
food-delivery-platform/
├── backend/          # Django backend API
├── customer-web/     # Next.js customer application
├── admin-web/        # React (Vite) admin dashboard
├── nginx/            # Nginx configuration
├── docker-compose.yml
├── .env.example
└── README.md
```

## Deployment on VPS
1. Install Docker and Docker Compose on the VPS.
2. Clone the repository to the server.
3. Configure `.env` with production database credentials, strong secret keys, and `ALLOWED_HOSTS`.
4. Update `nginx.conf` to use proper domain names (`admin.yourdomain.com`, `api.yourdomain.com`) instead of paths.
5. Setup SSL certificates (e.g., using Let's Encrypt and Certbot).
6. Run `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`.

## Future Improvements
- Integrate Razorpay for online payments.
- Implement WhatsApp API and SMS notifications for order updates.
- Add live delivery tracking on the map.
- Create a dedicated Delivery Boy mobile app (React Native/Flutter).
- Implement a comprehensive coupon and discount system.
- Customer and restaurant rating/review system.
