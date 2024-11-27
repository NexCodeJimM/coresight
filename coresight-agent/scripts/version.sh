#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Get current version
get_current_version() {
    if [ -f ".version" ]; then
        cat ".version"
    else
        echo "0.0.0"
    fi
}

# Update version
update_version() {
    local new_version=$1
    
    # Update version.py
    echo "VERSION = '$new_version'" > version.py
    
    # Update .version file
    echo "$new_version" > .version
    
    echo -e "${GREEN}Version updated to $new_version${NC}"
}

# Main
if [ "$1" == "" ]; then
    echo "Current version: $(get_current_version)"
    exit 0
fi

update_version "$1" 