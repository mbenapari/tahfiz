#!/bin/sh
set -e

echo "Starting deployment sequence..."

# Run database migrations
echo "Running database migrations..."
npx sequelize-cli db:migrate --env production

# Run database seeders
echo "Running database seeders..."
npx sequelize-cli db:seed:all --env production

# Start the application
echo "Starting application..."
exec npm run start:docker
