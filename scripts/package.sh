#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Get version from argument
VERSION=$1

# Get the project root directory
PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"

# Create releases directory
mkdir -p "$PROJECT_ROOT/releases/$VERSION"

# Create temporary directory for packaging
TEMP_DIR="$PROJECT_ROOT/releases/$VERSION/temp"
mkdir -p "$TEMP_DIR/coresight"

# Package backend
echo -e "${GREEN}Packaging backend...${NC}"
if [ ! -d "$PROJECT_ROOT/backend" ]; then
    echo -e "${RED}Error: backend directory not found${NC}"
    exit 1
fi

# Copy backend files
cp -r "$PROJECT_ROOT/backend" "$TEMP_DIR/coresight/"
cd "$TEMP_DIR/coresight/backend"
npm install
npm run build
rm -rf node_modules
npm install --production

# Package agent
echo -e "${GREEN}Packaging agent...${NC}"
if [ ! -d "$PROJECT_ROOT/coresight-agent" ]; then
    echo -e "${RED}Error: coresight-agent directory not found${NC}"
    exit 1
fi

# Copy agent files
cp -r "$PROJECT_ROOT/coresight-agent" "$TEMP_DIR/coresight/"
cd "$TEMP_DIR/coresight/coresight-agent"
echo "VERSION = '$VERSION'" > version.py

# Copy deploy script
echo -e "${GREEN}Adding deploy script...${NC}"
cp "$PROJECT_ROOT/deploy.sh" "$TEMP_DIR/coresight/"
chmod +x "$TEMP_DIR/coresight/deploy.sh"

# Create archives
cd "$TEMP_DIR"
tar -czf "$PROJECT_ROOT/releases/$VERSION/backend.tar.gz" coresight/
tar -czf "$PROJECT_ROOT/releases/$VERSION/agent.tar.gz" coresight/

# Clean up
rm -rf "$TEMP_DIR"

echo -e "${GREEN}Packages created successfully in releases/$VERSION/${NC}" 