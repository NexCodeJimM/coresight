#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Installing CoreSight Backend...${NC}"

# Get latest version
LATEST_VERSION=$(curl -s https://api.github.com/repos/nexcodejimm/coresight/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')

# Create directory
mkdir -p /opt/coresight/backend
cd /opt/coresight/backend

# Install Node.js and npm if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install InfluxDB
echo "Installing InfluxDB..."
if ! command -v influxd &> /dev/null; then
    wget https://dl.influxdata.com/influxdb/releases/influxdb2-2.7.1-amd64.deb
    sudo dpkg -i influxdb2-2.7.1-amd64.deb
    sudo systemctl start influxdb
    sudo systemctl enable influxdb
    rm influxdb2-2.7.1-amd64.deb
    echo -e "${GREEN}InfluxDB installed successfully!${NC}"
else
    echo "InfluxDB is already installed"
fi

# Download backend files
echo "Downloading backend files..."
curl -L "https://github.com/nexcodejimm/coresight/releases/latest/download/backend.tar.gz" -o backend.tar.gz
tar -xzf backend.tar.gz
rm backend.tar.gz

# Save version
echo "$LATEST_VERSION" > .version

# Install dependencies
npm install

# Create .env file
cat > .env << EOL
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=coresight

# InfluxDB Configuration
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token
INFLUXDB_ORG=your_org
INFLUXDB_BUCKET=coresight
EOL

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'coresight-backend',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
}
EOL

# Create logs directory
mkdir -p logs

# Configure firewall if UFW is present
if command -v ufw &> /dev/null; then
    echo "Configuring firewall..."
    sudo ufw allow 3000/tcp # Backend API
    sudo ufw allow 8086/tcp # InfluxDB
fi

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list and set to start on boot
pm2 save
pm2 startup | grep "sudo env" | bash

echo -e "${GREEN}CoreSight Backend installed successfully!${NC}"
echo -e "${GREEN}InfluxDB is running on http://localhost:8086${NC}"
echo -e "${GREEN}Please configure InfluxDB and update the .env file with your credentials${NC}"
echo -e "${GREEN}To check backend status, run: pm2 status${NC}"
echo -e "${GREEN}To view backend logs, run: pm2 logs coresight-backend${NC}" 