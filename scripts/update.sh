#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check current version
get_current_version() {
    if [ -f ".version" ]; then
        cat ".version"
    else
        echo "0.0.0"
    fi
}

# Function to check latest version from GitHub
get_latest_version() {
    curl -s https://api.github.com/repos/nexcodejimm/coresight/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/'
}

# Function to update component
update_component() {
    local component=$1
    local version=$2
    
    echo -e "${GREEN}Updating $component to version $version...${NC}"
    
    # Create backup
    if [ -d "/opt/coresight/$component" ]; then
        mv "/opt/coresight/$component" "/opt/coresight/$component.bak"
    fi
    
    # Download and extract new version
    cd /opt/coresight
    curl -L "https://github.com/nexcodejimm/coresight/releases/download/v$version/$component.tar.gz" -o "$component.tar.gz"
    
    if [ $? -eq 0 ]; then
        mkdir -p "$component"
        tar -xzf "$component.tar.gz" -C "$component"
        rm "$component.tar.gz"
        
        # Update dependencies
        cd "$component"
        if [ "$component" = "backend" ]; then
            npm install
        elif [ "$component" = "agent" ]; then
            source venv/bin/activate
            pip install -r requirements.txt
        fi
        
        # Save new version
        echo "$version" > .version
        
        # Restart service
        sudo systemctl restart "coresight-$component"
        
        echo -e "${GREEN}Successfully updated $component to version $version${NC}"
    else
        echo -e "${RED}Failed to download update. Restoring backup...${NC}"
        if [ -d "/opt/coresight/$component.bak" ]; then
            rm -rf "/opt/coresight/$component"
            mv "/opt/coresight/$component.bak" "/opt/coresight/$component"
        fi
    fi
}

# Main update logic
CURRENT_VERSION=$(get_current_version)
LATEST_VERSION=$(get_latest_version)

if [ "$CURRENT_VERSION" != "$LATEST_VERSION" ]; then
    echo -e "${GREEN}New version available: $LATEST_VERSION${NC}"
    read -p "Do you want to update? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Stop services
        sudo systemctl stop coresight-backend
        sudo systemctl stop coresight-agent
        
        # Update components
        update_component "backend" "$LATEST_VERSION"
        update_component "agent" "$LATEST_VERSION"
        
        echo -e "${GREEN}Update completed!${NC}"
    fi
else
    echo -e "${GREEN}You are running the latest version ($CURRENT_VERSION)${NC}"
fi 