#!/bin/bash
set -e

# CRITICAL FIX: Ensure only one MPM module is loaded at runtime
echo "Verifying Apache MPM configuration..."
# Remove all MPM module symlinks
rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf 2>/dev/null || true
# Enable only mpm_prefork
ln -sf /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load
ln -sf /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf
echo "MPM prefork enabled successfully"

# Set global ServerName to suppress Apache warnings
echo "ServerName chidstalhmsv2-production.up.railway.app" >> /etc/apache2/apache2.conf

# Configure Apache to use PORT environment variable (for Railway)
PORT=${PORT:-80}
echo "Configuring Apache to listen on port $PORT..."
# Railway requires binding to 0.0.0.0 (all interfaces) on the PORT env variable
echo "Listen 0.0.0.0:$PORT" > /etc/apache2/ports.conf
# Update VirtualHost to use the dynamic port
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:$PORT>/g" /etc/apache2/sites-available/*.conf

echo "Starting Laravel application..."

# Wait for the database to be ready (with timeout)
echo "Waiting for database connection..."
TIMEOUT=60
ELAPSED=0
until php artisan db:show 2>/dev/null; do
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "WARNING: Database connection timeout after ${TIMEOUT}s"
    echo "Skipping migrations - you may need to run them manually"
    break
  fi
  echo "Database not ready, waiting... (${ELAPSED}s/${TIMEOUT}s)"
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done

# Only run migrations if database is available
if php artisan db:show 2>/dev/null; then
  echo "Running database migrations..."
php artisan migrate --force
  # php artisan migrate:fresh --seed --force
else
  echo "Skipping migrations - database not available"
fi

echo "Clearing and caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Setting up storage link..."
php artisan storage:link || true

echo "Application ready!"

# Start Reverb WebSocket server in the background
# Runs on port 8080 (or REVERB_PORT env var) alongside Apache
REVERB_PORT=${REVERB_PORT:-8080}
echo "Starting Reverb WebSocket server on port $REVERB_PORT..."
php artisan reverb:start --host=0.0.0.0 --port=$REVERB_PORT >> /var/www/html/storage/logs/reverb.log 2>&1 &
echo "Reverb started (PID $!), logs at storage/logs/reverb.log"

# Execute the main container command (Apache)
exec "$@"
