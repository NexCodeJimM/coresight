#!/bin/bash

# Exit on any error
set -e

# Set working directory
WORKING_DIR="/root/coresight"
cd $WORKING_DIR

echo "Starting deployment from $WORKING_DIR..."

# 1. Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# 2. Install required packages
echo "Installing required packages..."
apt install -y curl git python3 python3-pip python3-venv

# 3. Install Node.js
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 4. Install PM2
echo "Installing PM2..."
npm install -g pm2

# 5. Install InfluxDB
echo "Installing InfluxDB..."
wget https://dl.influxdata.com/influxdb/releases/influxdb2-2.7.1-amd64.deb
dpkg -i influxdb2-2.7.1-amd64.deb
systemctl start influxdb
systemctl enable influxdb

# 6. Set up the backend
echo "Setting up backend..."
cd $WORKING_DIR/backend
npm install --production
cp .env.production .env

# 7. Set up the Python agent
echo "Setting up Python agent..."
cd $WORKING_DIR/coresight-agent

# Remove existing venv if it exists
rm -rf venv

# Create and activate virtual environment with proper permissions
echo "Creating Python virtual environment..."
python3 -m venv venv
chmod -R 755 venv/
chmod -R root:root venv/

# Activate virtual environment
. venv/bin/activate

# Fix permissions for python3 binary
chmod 755 venv/bin/python3
chmod 755 venv/bin/python

# Install requirements
echo "Installing Python requirements..."
pip3 install psutil requests netifaces

# Create agent.py if it doesn't exist
if [ ! -f agent.py ]; then
    echo "Creating agent.py..."
    cp ../agent.py .
fi

# 8. Create systemd service for the agent
echo "Creating systemd service for agent..."
PYTHON_VENV_PATH="$WORKING_DIR/coresight-agent/venv/bin/python3"
tee /etc/systemd/system/coresight-agent.service << EOF
[Unit]
Description=Coresight System Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$WORKING_DIR/coresight-agent
Environment=PYTHONPATH=$WORKING_DIR/coresight-agent
ExecStart=$PYTHON_VENV_PATH agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 9. Start services
echo "Starting services..."
cd $WORKING_DIR/backend
pm2 start server.js --name coresight-backend
pm2 save

# Reload systemd and start agent
systemctl daemon-reload
systemctl start coresight-agent
systemctl enable coresight-agent

# 10. Configure firewall
echo "Configuring firewall..."
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS
ufw allow 3000/tcp # Your app
ufw --force enable

echo "Deployment complete!"
echo "Please configure InfluxDB at http://your-server-ip:8086"
echo "Then access the dashboard at http://your-server-ip:3000"

# Print status and permissions
echo "Checking permissions and status..."
echo "Python venv permissions:"
ls -la $WORKING_DIR/coresight-agent/venv/bin/
echo "Python path: $PYTHON_VENV_PATH"
echo "Current directory: $(pwd)"
systemctl status influxdb --no-pager
systemctl status coresight-agent --no-pager
pm2 status