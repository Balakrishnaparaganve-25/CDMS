#!/bin/bash

# College Dashboard - Start Script
# This script starts both the FastAPI backend and Vite frontend together

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Starting College Dashboard Project...${NC}"

# ─────────────────────────────────────────
# Check Prerequisites
# ─────────────────────────────────────────
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi
echo -e "  ✓ Node.js: $(node --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.10+ first.${NC}"
    exit 1
fi
echo -e "  ✓ Python: $(python3 --version)"

# Check MySQL (optional - just warn)
if command -v mysql &> /dev/null; then
    echo -e "  ✓ MySQL client found"
else
    echo -e "${YELLOW}⚠️  MySQL client not found. Make sure MySQL server is running.${NC}"
fi

# ─────────────────────────────────────────
# Setup Backend
# ─────────────────────────────────────────
echo -e "${BLUE}🔧 Setting up Backend...${NC}"
cd backend

# Create/repair virtual environment if it doesn't exist or is broken
RECREATE_VENV=0
if [ ! -d "venv" ]; then
    RECREATE_VENV=1
fi

# If venv exists, sanity check pip + uvicorn import
if [ "$RECREATE_VENV" -eq 0 ]; then
    if ! venv/bin/python -m pip --version >/dev/null 2>&1; then
        RECREATE_VENV=1
    else
        if ! venv/bin/python -c "import uvicorn.middleware" >/dev/null 2>&1; then
            RECREATE_VENV=1
        fi
    fi
fi

if [ "$RECREATE_VENV" -eq 1 ]; then
    rm -rf venv
    python3 -m venv venv
    echo -e "  ✓ Virtual environment created/repaired"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
python3 -m pip install --upgrade pip setuptools wheel
python3 -m pip install -r requirements.txt

# Sanity check: make sure uvicorn is available in the venv
if ! command -v uvicorn >/dev/null 2>&1 && ! python3 -m uvicorn --version >/dev/null 2>&1; then
    echo -e "${RED}✗ uvicorn not found after pip install. Check /tmp/backend.log or requirements.${NC}"
    exit 1
fi

echo -e "${GREEN}  ✓ Backend dependencies installed${NC}"

# Deactivate venv for now
deactivate


cd ..

# ─────────────────────────────────────────
# Setup Frontend
# ─────────────────────────────────────────
echo -e "${BLUE}🔧 Setting up Frontend...${NC}"
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}  ✓ Frontend dependencies installed${NC}"
else
    echo -e "  ✓ Frontend dependencies already installed"
fi

cd ..

# ─────────────────────────────────────────
# Start Backend (FastAPI)
# ─────────────────────────────────────────
echo -e "${BLUE}🔧 Starting Backend (FastAPI)...${NC}"
cd backend
source venv/bin/activate
# If port 8000 is already in use, stop the old backend before starting a new one
if lsof -nP -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
    OLD_PID=$(lsof -t -iTCP:8000 -sTCP:LISTEN | head -n 1)
    kill "$OLD_PID" 2>/dev/null || true
    sleep 1
fi

python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Backend running on http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Failed to start backend. Check /tmp/backend.log for details.${NC}"
    cat /tmp/backend.log
    exit 1
fi

# ─────────────────────────────────────────
# Start Frontend (Vite)
# ─────────────────────────────────────────
echo -e "${BLUE}🔧 Starting Frontend (Vite)...${NC}"
cd frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Frontend running on http://localhost:5173${NC}"
else
    echo -e "${RED}❌ Failed to start frontend. Check /tmp/frontend.log for details.${NC}"
    cat /tmp/frontend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# ─────────────────────────────────────────
# Display Status
# ─────────────────────────────────────────
echo ""
echo -e "${GREEN}✅ College Dashboard is now running!${NC}"
echo -e "${CYAN}────────────────────────────────────────────${NC}"
echo -e "${YELLOW}📱${NC} Frontend:  ${GREEN}http://localhost:5173${NC}"
echo -e "${YELLOW}🔗${NC} Backend:   ${GREEN}http://localhost:8000${NC}"
echo -e "${YELLOW}📚${NC} API Docs:  ${GREEN}http://localhost:8000/docs${NC}"
echo -e "${CYAN}────────────────────────────────────────────${NC}"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for interrupt
trap "echo -e '${YELLOW}Stopping services...${NC}'" SIGINT SIGTERM
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" EXIT
wait
