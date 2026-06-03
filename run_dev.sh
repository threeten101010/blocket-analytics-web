#!/usr/bin/env bash
# ==============================================================================
# Blocket Analytics Web dev server starter
# Launches both the FastAPI backend and Next.js frontend concurrently.
# ==============================================================================

set -e

WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$WORKSPACE_DIR"

echo "🌌 [Command Center] Launching Blocket Analytics Web Portal..."
echo "📍 Workspace: $WORKSPACE_DIR"

# 1. Start FastAPI Backend
echo -e "\n📡 Starting FastAPI Backend on port 8000..."
cd backend
python3 main.py &
BACKEND_PID=$!

# Wait 2 seconds for backend to start up
sleep 2

# 2. Start Next.js Frontend
echo -e "\n🌐 Starting Next.js Frontend on port 3000..."
cd "$WORKSPACE_DIR"
npm run dev &
FRONTEND_PID=$!

# Trap signals (Ctrl+C, termination) to kill both background processes cleanly
cleanup() {
    echo -e "\n🛑 [Command Center] Shutting down development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "👋 Servers terminated. Goodbye!"
}

trap cleanup INT TERM EXIT

# Keep script running to print outputs and wait
wait
