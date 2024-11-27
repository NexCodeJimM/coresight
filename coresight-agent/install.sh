#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Installing CoreSight Agent...${NC}"

# Create directory
mkdir -p /opt/coresight/agent
cd /opt/coresight/agent

# Create logs directory
mkdir -p logs
chmod 755 logs

# Install Python if not present
if ! command -v python3 &> /dev/null; then
    echo "Installing Python..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv
fi

# Download agent files
echo "Downloading agent files..."
curl -L "https://github.com/nexcodejimm/coresight/releases/latest/download/agent.tar.gz" -o agent.tar.gz
tar -xzf agent.tar.gz
rm agent.tar.gz

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Fix permissions
chmod -R 755 venv/
chown -R root:root venv/

# Install dependencies
pip install -r requirements.txt

# Create .env file if not exists
if [ ! -f .env ]; then
    # Prompt for environment variables
    read -p "Enter Backend Host (default: localhost): " BACKEND_HOST
    BACKEND_HOST=${BACKEND_HOST:-localhost}
    
    read -p "Enter Backend Port (default: 3000): " BACKEND_PORT
    BACKEND_PORT=${BACKEND_PORT:-3000}
    
    read -p "Enter Server ID: " SERVER_ID
    
    # Create .env file
    cat > .env << EOL
BACKEND_HOST=${BACKEND_HOST}
BACKEND_PORT=${BACKEND_PORT}
SERVER_ID=${SERVER_ID}
EOL

    chmod 644 .env
fi

# Copy service file
cp coresight-agent.service /etc/systemd/system/
chmod 644 /etc/systemd/system/coresight-agent.service

# Reload systemd and start service
systemctl daemon-reload
systemctl enable coresight-agent
systemctl start coresight-agent

# Check service status
echo -e "${GREEN}Checking service status...${NC}"
systemctl status coresight-agent --no-pager

echo -e "${GREEN}Installation complete!${NC}"
echo -e "Logs are available at: /opt/coresight/agent/logs/agent.log"
echo -e "Service status: systemctl status coresight-agent"
echo -e "View logs: journalctl -u coresight-agent -f" 