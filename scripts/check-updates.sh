#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check current version
get_current_version() {
    local component=$1
    if [ -f "/opt/coresight/$component/.version" ]; then
        cat "/opt/coresight/$component/.version"
    else
        echo "0.0.0"
    fi
}

# Function to check latest version from GitHub
get_latest_version() {
    curl -s https://api.github.com/repos/nexcodejimm/coresight/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/'
}

# Function to send notification
send_notification() {
    local component=$1
    local version=$2
    curl -X POST "http://localhost:3000/api/notifications" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"update\",\"component\":\"$component\",\"version\":\"$version\"}"
}

# Check backend
BACKEND_CURRENT=$(get_current_version "backend")
LATEST_VERSION=$(get_latest_version)

if [ "$BACKEND_CURRENT" != "$LATEST_VERSION" ]; then
    echo -e "${GREEN}New backend version available: $LATEST_VERSION${NC}"
    send_notification "backend" "$LATEST_VERSION"
fi

# Check agent
AGENT_CURRENT=$(get_current_version "agent")

if [ "$AGENT_CURRENT" != "$LATEST_VERSION" ]; then
    echo -e "${GREEN}New agent version available: $LATEST_VERSION${NC}"
    send_notification "agent" "$LATEST_VERSION"
fi 