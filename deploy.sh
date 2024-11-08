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
cd ../coresight/coresight-agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 8. Create systemd service for the agent
echo "Creating systemd service for agent..."
sudo tee /etc/systemd/system/coresight-agent.service << EOF
[Unit]
Description=Coresight System Monitoring Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PYTHONPATH=$(pwd)
ExecStart=$(pwd)/venv/bin/python agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 9. Start services
echo "Starting services..."
cd ../coresight/backend
pm2 start server.js --name coresight-backend
pm2 save
sudo systemctl start coresight-agent
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