-- Users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(255),
    role ENUM('admin', 'viewer') NOT NULL DEFAULT 'viewer',
    is_admin BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Server Metrics table
CREATE TABLE server_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    server_id VARCHAR(255) NOT NULL,
    cpu_usage FLOAT,
    memory_usage FLOAT,
    disk_usage FLOAT,
    network_in BIGINT,
    network_out BIGINT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_server_timestamp (server_id, timestamp)
);

-- Servers table
CREATE TABLE servers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    hostname VARCHAR(255) NOT NULL
);

-- Alerts table
CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    server_id VARCHAR(255) NOT NULL,
    type ENUM('cpu', 'memory', 'disk', 'network') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('active', 'resolved') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id)
);

-- Server Actions table
CREATE TABLE server_actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    server_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id)
);

-- Insert default admin user
INSERT INTO users (id, username, email, password, role, is_admin) 
VALUES (
    'default-admin-id',
    'efi_admin',
    'efi_admin@test.com',
    '$2b$10$EYHml0GzxZFY.qdOI8vJKOYz.dEFBxEHjpHEAZXzOZvGZZXbqeIWi', -- Hashed password for '*7eL£~0YV&9h'
    'admin',
    TRUE
); 