#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment..."

# 1. Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install required packages
echo "Installing required packages..."
sudo apt install -y curl git python3 python3-pip python3-venv

# 3. Install Node.js
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# 5. Install InfluxDB
echo "Installing InfluxDB..."
wget https://dl.influxdata.com/influxdb/releases/influxdb2-2.7.1-amd64.deb
sudo dpkg -i influxdb2-2.7.1-amd64.deb
sudo systemctl start influxdb
sudo systemctl enable influxdb

# 6. Set up the backend
echo "Setting up backend..."
cd backend
npm install --production
cp .env.production .env

# 7. Set up the Python agent
echo "Setting up Python agent..."
# Create directory structure
AGENT_DIR="../coresight-agent"
mkdir -p $AGENT_DIR
cd $AGENT_DIR

# Check Python3 installation
if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Installing..."
    sudo apt install -y python3
fi

# Check pip installation
if ! command -v pip3 &> /dev/null; then
    echo "Pip3 is not installed. Installing..."
    sudo apt install -y python3-pip
fi

# Create and activate virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate || {
    echo "Failed to create/activate virtual environment"
    exit 1
}

# Verify Python path
PYTHON_PATH=$(which python3)
echo "Using Python at: $PYTHON_PATH"

# Install requirements
echo "Installing Python requirements..."
if [ -f requirements.txt ]; then
    pip3 install -r requirements.txt
else
    echo "requirements.txt not found, installing basic requirements..."
    pip3 install psutil requests netifaces
fi

# 8. Create systemd service for the agent
echo "Creating systemd service for agent..."
PYTHON_VENV_PATH=$(which python3)
sudo tee /etc/systemd/system/coresight-agent.service << EOF
[Unit]
Description=Coresight System Monitoring Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PYTHONPATH=$(pwd)
ExecStart=$PYTHON_VENV_PATH agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 9. Start services
echo "Starting services..."
cd ../backend
pm2 start server.js --name coresight-backend
pm2 save

# Reload systemd and start agent
sudo systemctl daemon-reload
sudo systemctl start coresight-agent || {
    echo "Failed to start coresight-agent. Checking logs..."
    sudo journalctl -u coresight-agent -n 50
}
sudo systemctl enable coresight-agent

# 10. Configure firewall
echo "Configuring firewall..."
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw allow 3000/tcp # Your app
sudo ufw --force enable

echo "Deployment complete!"
echo "Please configure InfluxDB at http://your-server-ip:8086"
echo "Then access the dashboard at http://your-server-ip:3000"

# Print status of all services
echo "Checking service status..."
echo "InfluxDB status:"
sudo systemctl status influxdb --no-pager
echo "Agent status:"
sudo systemctl status coresight-agent --no-pager
echo "Backend status:"
pm2 status

# Print Python environment info for debugging
echo "Python environment information:"
which python3
python3 --version
echo "Virtual environment path: $PYTHON_VENV_PATH"