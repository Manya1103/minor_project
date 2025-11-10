#!/bin/bash

# PocketPilot Setup Script
# This script automates the setup process

echo "🚀 PocketPilot Setup Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "📦 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION} found${NC}"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm ${NPM_VERSION} found${NC}"
fi

echo ""

# Install dependencies
echo "📥 Installing dependencies..."
echo -e "${BLUE}This may take a few minutes...${NC}"

npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Root dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install root dependencies${NC}"
    exit 1
fi

cd client
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Client dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install client dependencies${NC}"
    exit 1
fi

cd ..

echo ""

# Create .env file
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file with your MongoDB URI and JWT secret${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
fi

echo ""

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads/receipts
echo -e "${GREEN}✅ Uploads directory created${NC}"

echo ""
echo "======================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo "1. Edit .env file with your MongoDB URI"
echo "2. Start MongoDB service"
echo "3. Run: npm run dev"
echo ""
echo "📚 Documentation:"
echo "- Quick Start: QUICKSTART.md"
echo "- API Docs: API_DOCS.md"
echo "- Deployment: DEPLOYMENT.md"
echo ""
echo "🌐 After starting, access:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:5000"
echo ""
echo -e "${BLUE}Happy coding! 💰✨${NC}"
