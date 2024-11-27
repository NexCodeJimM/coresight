#!/bin/bash

# Exit on any error
set -e

# Set working directory
WORKING_DIR="/root/coresight-1.0.0"
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
cp .env.production .env

# Remove existing venv if it exists
rm -rf venv

# Create and activate virtual environment with proper permissions
echo "Creating Python virtual environment..."
python3 -m venv venv

# Set correct permissions and ownership
chmod -R 755 venv/
chown -R root:root venv/

# Activate virtual environment
. venv/bin/activate

# Fix permissions for python3 binary
chmod 755 venv/bin/python3
chmod 755 venv/bin/python

# Install Python requirements
echo "Installing Python requirements..."
pip3 install psutil requests mysql-connector-python python-dotenv netifaces flask

# Create log file with proper permissions
mkdir -p logs
chmod 755 logs
touch logs/agent.log
chmod 644 logs/agent.log

# 8. Create systemd service for the agent
echo "Creating systemd service for agent..."
cp coresight-agent.service /etc/systemd/system/
chmod 644 /etc/systemd/system/coresight-agent.service

# 9. Start services
echo "Starting services..."
cd $WORKING_DIR/backend
pm2 start ecosystem.config.js
pm2 save

# Reload systemd and start agent
systemctl daemon-reload
systemctl enable coresight-agent
systemctl start coresight-agent

# 10. Configure firewall
echo "Configuring firewall..."
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS
ufw allow 3000/tcp # Backend API
ufw allow 3001/tcp # Health check
ufw allow 8086/tcp # InfluxDB
ufw --force enable

echo "Deployment complete!"
echo "Please configure InfluxDB at http://localhost:8086"

# Print status and permissions
echo "Checking permissions and status..."
echo "Python venv permissions:"
ls -la $WORKING_DIR/coresight-agent/venv/bin/
echo "Current directory: $(pwd)"
echo "Agent log file:"
ls -la $WORKING_DIR/coresight-agent/logs/agent.log
systemctl status influxdb --no-pager
systemctl status coresight-agent --no-pager
pm2 status