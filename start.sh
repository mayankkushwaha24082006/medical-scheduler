#!/bin/bash
echo "🐳 Starting Docker..."
docker compose up -d

echo "�� Starting backend..."
cd backend && npm run dev &

echo "⚡ Starting frontend..."
cd ../frontend && npm run dev
