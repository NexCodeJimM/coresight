#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Installing CoreSight Agent...${NC}"

# Get latest version
LATEST_VERSION=$(curl -s https://api.github.com/repos/nexcodejimm/coresight/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')

# Create directory
mkdir -p /opt/coresight/agent
cd /opt/coresight/agent

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

# Save version
echo "$LATEST_VERSION" > .version

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
BACKEND_HOST=your_backend_host
BACKEND_PORT=3000
SERVER_ID=your_server_id
EOL

# Create systemd service
cat > /etc/systemd/system/coresight-agent.service << EOL
[Unit]
Description=Coresight Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/coresight/coresight-agent
Environment=PYTHONUNBUFFERED=1
EnvironmentFile=/root/coresight/coresight-agent/.env
ExecStart=/root/coresight/coresight-agent/venv/bin/python agent.py
Restart=always
RestartSec=10
StandardOutput=append:/root/coresight/coresight-agent/agent.log
StandardError=append:/root/coresight/coresight-agent/agent.log

[Install]
WantedBy=multi-user.target
EOL

# Start service
sudo systemctl daemon-reload
sudo systemctl enable coresight-agent
sudo systemctl start coresight-agent

echo -e "${GREEN}CoreSight Agent installed successfully!${NC}" 