#!/bin/bash

# College Dashboard - Database Setup Script
# This script sets up the MySQL database for the project

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🗄️  Setting up College Dashboard Database...${NC}"

# ─────────────────────────────────────────
# Check Prerequisites
# ─────────────────────────────────────────
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL is not installed or not in PATH.${NC}"
    echo -e "${YELLOW}Please install MySQL server first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking MySQL connection...${NC}"

# ─────────────────────────────────────────
# Get MySQL Credentials
# ─────────────────────────────────────────
echo -e "${BLUE}Please enter your MySQL credentials:${NC}"
read -p "  Username [root]: " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -s -p "  Password: " MYSQL_PASS
echo ""

# Test connection
if ! mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to connect to MySQL. Check your credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}  ✓ Connected to MySQL${NC}"

# ─────────────────────────────────────────
# Create Database and Tables
# ─────────────────────────────────────────
echo -e "${BLUE}📦 Creating database and tables...${NC}"

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/database/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

# Run the schema file
mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" < "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Database setup completed successfully${NC}"
else
    echo -e "${RED}❌ Failed to setup database.${NC}"
    exit 1
fi

# ─────────────────────────────────────────
# Display Summary
# ─────────────────────────────────────────
echo ""
echo -e "${GREEN}✅ Database setup completed!${NC}"
echo -e "${CYAN}────────────────────────────────────────${NC}"
echo -e "${YELLOW}Database:${NC} ${GREEN}college_db${NC}"
echo -e "${YELLOW}Default Users:${NC}"
echo -e "  • admin    / Admin@123"
echo -e "  • examdept / Admin@123"
echo -e "${CYAN}────────────────────────────────────────${NC}"
echo ""
