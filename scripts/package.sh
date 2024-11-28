#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Get version from argument
VERSION=$1

# Create releases directory
mkdir -p releases/$VERSION

# Package backend
echo -e "${GREEN}Packaging backend...${NC}"
cd backend
npm install
npm run build
cd ..
tar -czf releases/$VERSION/backend.tar.gz backend/

# Package agent
echo -e "${GREEN}Packaging agent...${NC}"
cd coresight-agent
# Update version.py with new version
echo "VERSION = '$VERSION'" > version.py
cd ..
tar -czf releases/$VERSION/agent.tar.gz coresight-agent/

echo -e "${GREEN}Packages created successfully in releases/$VERSION/${NC}" 