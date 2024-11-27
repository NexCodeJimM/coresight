#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

VERSION=$1

if [ -z "$VERSION" ]; then
    echo -e "${RED}Please provide a version number${NC}"
    exit 1
fi

echo -e "${GREEN}Creating release packages for version $VERSION...${NC}"

# Create release directory
mkdir -p releases/$VERSION

# Package backend
echo "Packaging backend..."
cd backend
# Clean up node_modules if exists
rm -rf node_modules
# Install production dependencies
npm install --production
# Create tar.gz with proper compression
tar -czf ../releases/$VERSION/backend.tar.gz ./*
# Clean up
rm -rf node_modules
cd ..

# Package agent
echo "Packaging agent..."
cd coresight-agent
# Clean up any virtual environment or cache
rm -rf venv __pycache__ .pytest_cache
# Create tar.gz
tar -czf ../releases/$VERSION/agent.tar.gz ./*
cd ..

echo -e "${GREEN}Packages created in releases/$VERSION/${NC}"
echo -e "${GREEN}Backend: releases/$VERSION/backend.tar.gz${NC}"
echo -e "${GREEN}Agent: releases/$VERSION/agent.tar.gz${NC}"

# Verify the archives
echo "Verifying archives..."
if tar -tzf releases/$VERSION/backend.tar.gz > /dev/null 2>&1; then
    echo -e "${GREEN}Backend archive is valid${NC}"
else
    echo -e "${RED}Backend archive is invalid${NC}"
    exit 1
fi

if tar -tzf releases/$VERSION/agent.tar.gz > /dev/null 2>&1; then
    echo -e "${GREEN}Agent archive is valid${NC}"
else
    echo -e "${RED}Agent archive is invalid${NC}"
    exit 1
fi 