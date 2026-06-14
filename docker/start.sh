#!/bin/sh
set -e

# Render injects PORT; keep it separate from Next.js (which also reads PORT).
NGINX_PORT="${PORT:-10000}"

wait_for_url() {
  url="$1"
  name="$2"
  log_file="$3"
  attempt=0
  max=90

  while [ "$attempt" -lt "$max" ]; do
    if curl -sf -o /dev/null "$url"; then
      echo "==> $name is ready"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done

  echo "==> ERROR: $name failed to start after ${max}s"
  if [ -n "$log_file" ] && [ -f "$log_file" ]; then
    echo "==> Last lines from $log_file:"
    tail -80 "$log_file"
  fi
  return 1
}

echo "==> Running database migrations..."
cd /app/backend
python manage.py migrate --noinput

echo "==> Seeding data..."
python manage.py seed_igatpuri || true
python manage.py seed_hotel_new_apna || true
python manage.py collectstatic --noinput

echo "==> Starting Gunicorn (backend)..."
gunicorn core.wsgi:application \
  --chdir /app/backend \
  --bind 127.0.0.1:8000 \
  --workers 1 \
  --timeout 120 \
  --access-logfile /tmp/gunicorn-access.log \
  --error-logfile /tmp/gunicorn-error.log &

wait_for_url "http://127.0.0.1:8000/api/restaurants/" "Gunicorn" "/tmp/gunicorn-error.log"

echo "==> Starting Next.js (customer app)..."
cd /app/customer-web
HOSTNAME=127.0.0.1 PORT=3000 node server.js >>/tmp/next.log 2>&1 &

wait_for_url "http://127.0.0.1:3000/" "Next.js" "/tmp/next.log"

echo "==> Configuring nginx on port ${NGINX_PORT}..."
export PORT="${NGINX_PORT}"
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "==> All services started. Listening on port ${NGINX_PORT}"
exec nginx -g 'daemon off;'
