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

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list and set to start on boot
pm2 save
pm2 startup | grep "sudo env" | bash

echo -e "${GREEN}CoreSight Backend installed successfully!${NC}"
echo -e "${GREEN}To check status, run: pm2 status${NC}"
echo -e "${GREEN}To view logs, run: pm2 logs coresight-backend${NC}" 