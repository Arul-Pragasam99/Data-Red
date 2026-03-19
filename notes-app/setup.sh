#!/bin/bash

echo "🚀 Setting up NoteApp..."

echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install
cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend && npm install
cd ..

echo ""
echo "✅ Done! To start the app:"
echo ""
echo "  Terminal 1 (backend):  cd backend && npm run dev"
echo "  Terminal 2 (frontend): cd frontend && npm start"
echo ""
echo "Make sure Redis is running on localhost:6379"
echo "  macOS:  brew services start redis"
echo "  Linux:  sudo systemctl start redis"
