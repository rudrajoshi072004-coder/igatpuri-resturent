# All-in-one production image for Render / single-container deploy.
# Builds backend + customer-web + admin-web and serves everything via nginx.

# ── 1. Customer web (Next.js) ───────────────────────────────────
FROM node:18-alpine AS customer-build
WORKDIR /app
COPY customer-web/package.json customer-web/package-lock.json ./
RUN npm ci
COPY customer-web/ .
ARG NEXT_PUBLIC_API_BASE_URL=/api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN mkdir -p public
RUN npm run build

# ── 2. Admin web (Vite) ─────────────────────────────────────────
FROM node:18-alpine AS admin-build
WORKDIR /app
COPY admin-web/package.json admin-web/package-lock.json ./
RUN npm ci
COPY admin-web/ .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ── 3. Final runtime image ──────────────────────────────────────
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production

# Python backend deps + nginx + node (for Next.js standalone server)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq-dev gcc nginx gettext-base curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt gunicorn
COPY backend/ /app/backend/

# Customer web (Next.js standalone output)
COPY --from=customer-build /app/.next/standalone /app/customer-web/
COPY --from=customer-build /app/.next/static /app/customer-web/.next/static

# Admin web (static files served by nginx)
COPY --from=admin-build /app/dist /var/www/admin

# Nginx + startup
COPY docker/nginx.single.conf.template /etc/nginx/nginx.conf.template
COPY docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh \
    && mkdir -p /app/backend/staticfiles /app/backend/media /tmp

EXPOSE 10000

CMD ["/app/start.sh"]
