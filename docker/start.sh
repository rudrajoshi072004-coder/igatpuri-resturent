#!/bin/sh
set -e

export PORT="${PORT:-10000}"

echo "==> Running database migrations..."
cd /app/backend
python manage.py migrate --noinput

echo "==> Seeding data..."
python manage.py seed_igatpuri
python manage.py seed_hotel_new_apna || true
python manage.py collectstatic --noinput

echo "==> Starting Gunicorn (backend)..."
gunicorn core.wsgi:application \
  --chdir /app/backend \
  --bind 127.0.0.1:8000 \
  --workers 2 \
  --timeout 120 \
  --daemon \
  --access-logfile - \
  --error-logfile -

echo "==> Starting Next.js (customer app)..."
cd /app/customer-web
export HOSTNAME=127.0.0.1
export PORT=3000
node server.js &

echo "==> Configuring nginx on port ${PORT}..."
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "==> All services started. Listening on port ${PORT}"
exec nginx -g 'daemon off;'
