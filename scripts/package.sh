#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Get version from argument
VERSION=$1

# Get the project root directory (where backend and coresight-agent folders are)
PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"

# Create releases directory
mkdir -p "$PROJECT_ROOT/releases/$VERSION"

# Package backend
echo -e "${GREEN}Packaging backend...${NC}"
if [ ! -d "$PROJECT_ROOT/backend" ]; then
    echo -e "${RED}Error: backend directory not found at $PROJECT_ROOT/backend${NC}"
    exit 1
fi

cd "$PROJECT_ROOT/backend"
npm install
npm run build
cd "$PROJECT_ROOT"
tar -czf "releases/$VERSION/backend.tar.gz" backend/

# Package agent
echo -e "${GREEN}Packaging agent...${NC}"
if [ ! -d "$PROJECT_ROOT/coresight-agent" ]; then
    echo -e "${RED}Error: coresight-agent directory not found at $PROJECT_ROOT/coresight-agent${NC}"
    exit 1
fi

cd "$PROJECT_ROOT/coresight-agent"
# Update version.py with new version
echo "VERSION = '$VERSION'" > version.py
cd "$PROJECT_ROOT"
tar -czf "releases/$VERSION/agent.tar.gz" coresight-agent/

echo -e "${GREEN}Packages created successfully in releases/$VERSION/${NC}" 