-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS coresight;
USE coresight;

-- Create servers table with all necessary fields
CREATE TABLE IF NOT EXISTS servers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hostname VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  port INT DEFAULT 3000,
  org VARCHAR(255),
  bucket VARCHAR(255),
  token TEXT,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  last_seen DATETIME,
  active_alerts INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create server_uptime table for tracking uptime
CREATE TABLE IF NOT EXISTS server_uptime (
  server_id VARCHAR(36),
  status ENUM('online', 'offline') NOT NULL DEFAULT 'offline',
  last_checked DATETIME NOT NULL,
  last_downtime DATETIME,
  uptime INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  PRIMARY KEY (server_id)
);

-- Create alerts table for tracking server alerts
CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(36) PRIMARY KEY,
  server_id VARCHAR(36),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('active', 'resolved') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
); 