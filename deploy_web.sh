#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Coresight Web deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y \
    curl \
    git \
    nginx \
    mysql-server \
    phpmyadmin \
    php-mbstring \
    php-zip \
    php-gd \
    php-json \
    php-curl

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Configure MySQL
echo "🔧 Configuring MySQL..."
sudo mysql_secure_installation

# Create database and user
echo "🗄️ Creating database and user..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS efi;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'efi_user'@'localhost' IDENTIFIED BY 'your_password_here';"
sudo mysql -e "GRANT ALL PRIVILEGES ON efi.* TO 'efi_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Import schema
echo "📝 Importing database schema..."
sudo mysql efi < schema.sql

# Configure PHP and PHPMyAdmin
echo "🔧 Configuring PHP and PHPMyAdmin..."
sudo sed -i "s/upload_max_filesize = .*/upload_max_filesize = 64M/" /etc/php/*/apache2/php.ini
sudo sed -i "s/post_max_size = .*/post_max_size = 64M/" /etc/php/*/apache2/php.ini
sudo sed -i "s/memory_limit = .*/memory_limit = 256M/" /etc/php/*/apache2/php.ini

# Setup Next.js application
echo "⚛️ Setting up Next.js application..."
cd coresight-web-main
npm install
npm run build

# Create systemd service for Next.js
echo "🔧 Creating systemd service for Next.js..."
sudo tee /etc/systemd/system/coresight-web.service << EOF
[Unit]
Description=Coresight Web Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=$(which npm) start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/coresight << EOF
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /phpmyadmin {
        root /usr/share/;
        index index.php;
        try_files \$uri \$uri/ =404;

        location ~ ^/phpmyadmin/(.+\.php)$ {
            try_files \$uri =404;
            root /usr/share/;
            fastcgi_pass unix:/run/php/php-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
            include /etc/nginx/fastcgi_params;
        }

        location ~* ^/phpmyadmin/(.+\.(jpg|jpeg|gif|css|png|js|ico|html|xml|txt))$ {
            root /usr/share/;
        }
    }
}
EOF

# Enable Nginx configuration
sudo ln -s /etc/nginx/sites-available/coresight /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Start services
echo "🚀 Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable coresight-web
sudo systemctl start coresight-web

# Create .env file
echo "📝 Creating .env file..."
cat > .env.local << EOF
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# MySQL Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=efi_user
MYSQL_PASSWORD=your_password_here
MYSQL_DATABASE=efi

# Debug
DEBUG=false
EOF

echo "✅ Web deployment complete!"
echo "
Next steps:
1. Update the MySQL password in .env.local
2. Update the domain name in Nginx configuration
3. Configure SSL with Certbot
4. Access PHPMyAdmin at http://your_domain.com/phpmyadmin
5. Access the application at http://your_domain.com
"

# Optional: Install SSL certificate
read -p "Would you like to install SSL certificate using Certbot? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx
fi 