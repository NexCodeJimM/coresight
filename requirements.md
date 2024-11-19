- Create a server monitoring system using `Python`, `NextJS`, `InfluxDB`, and `NodeJS`.
- The agent will need to be created using python and will be using libraries like `psutil`, `socket`, and `netifaces`.

#Agent Requirements:

- should be inside `coresight-agent` folder.
- Install Required Libraries:
  - Install `psutil` for accessing CPU, memory, and disk metrics.
  - Use libraries like `socket` or `netifaces` for network data.
  - Set up a simple loop that gathers metrics every 10 seconds.
- Gather Metrics:
  - Write code using python to collect CPU, memory, disk, network traffic, and active process information.
  - Store this data in a structured format (e.g., JSON).
- Send Data to Backend API:
  - Once the metrics are gathered, set up a POST request in Python to send this data to your backend every 10 seconds.
  - Test this setup by creating a simple backend endpoint to confirm data reception.

##Step 2: Set Up the Backend with InfluxDB Integration

- Install InfluxDB and set it up locally or on a server.
- Create Backend API in Node.js:
  - Set up a basic Node.js server with an endpoint to receive data from the Python agent.
  - Write code to store incoming data in InfluxDB for time-series tracking.
- Test Data Flow:
  - Confirm that the agent successfully sends data to the backend and that it’s stored in InfluxDB.

##Step 3: Develop the Next.js Frontend

- The files are in `coresight-web`
- Create the website using Next.JS 14
- MAKE SURE THAT YOU USE APPROUTER.
- MAKE SURE THAT THE COMPONENTS FOLDER IS NOT INSIDE THE APP FOLDER.
- DO NOT USE PRISMA.
- Here is the DATABASE Connection information:
  DB_HOST=143.198.84.214
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=RJmendoza21!
  DB_NAME=efi
- There should be a dashboard page.
- Store the data to MySQL database. You can see the MySQL structure below.
- Use NextAUTH for the authentication and should be save in the MySQL Database.
- Create a temporary Signup page.
- Users cannot signup only admin can create users.
- Use ShadCN UI for the UI Framework
- use Chart.js for the charts.
- There should be a role where not everyone can be admin. Maybe moderator.
- Create a "Servers" page. The admin can add servers.
  - When adding servers, there should be an input for the Server Name, IP Address, description, hostname, port, InFluxDB Org, InfluxDB Token, and influxDB Bucket.
- Connect the frontend to the backend found in /backend.
- Connect to the proper endpoints.
- In the servers page, there should be list of servers.
- users can click the server and they can see Real time server health and graphs showsing history.
- It should monitor CPU, Memory, Disk Usage, and Network.
- There should be a settings button inside the server where informations can be updated and thresh hold settings can be set.
- The uptime should also show in the server page as well as the processes.
- Create the settings page for the server where it can edit the Name, IP Address, Hostname, description, InfluxDB org, bucket and token.
- In the settings page, users can also delete the server.

## <!-- MySQL Structure -->

## -- Database: `efi`

---

--
-- Table structure for table `alerts`
--

CREATE TABLE `alerts` (
`id` bigint NOT NULL,
`server_id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`type` enum('cpu','memory','disk','network') COLLATE utf8mb4_general_ci NOT NULL,
`severity` enum('low','medium','high','critical') COLLATE utf8mb4_general_ci NOT NULL,
`message` text COLLATE utf8mb4_general_ci NOT NULL,
`status` enum('active','resolved') COLLATE utf8mb4_general_ci DEFAULT 'active',
`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`resolved_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
`priority` enum('low','medium','high','critical') COLLATE utf8mb4_general_ci DEFAULT 'medium'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `servers`
--

CREATE TABLE `servers` (
`id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`ip_address` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
`status` enum('active','inactive','maintenance') COLLATE utf8mb4_general_ci DEFAULT 'active',
`last_seen` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`hostname` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`description` text COLLATE utf8mb4_general_ci,
`port` varchar(5) COLLATE utf8mb4_general_ci DEFAULT '3000',
`org` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`bucket` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`token` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `server_actions`
--

CREATE TABLE `server_actions` (
`id` bigint NOT NULL,
`server_id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`action` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
`performed_by` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `server_metrics`
--

CREATE TABLE `server_metrics` (
`id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`server_id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`cpu_usage` float DEFAULT NULL,
`memory_usage` float DEFAULT NULL,
`memory_total` bigint DEFAULT NULL,
`memory_used` bigint DEFAULT NULL,
`disk_usage` float DEFAULT NULL,
`disk_total` bigint DEFAULT NULL,
`disk_used` bigint DEFAULT NULL,
`network_in` float DEFAULT NULL,
`network_out` float DEFAULT NULL,
`temperature` float DEFAULT NULL,
`timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `server_processes`
--

CREATE TABLE `server_processes` (
`id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
`server_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
`pid` int DEFAULT NULL,
`name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
`cpu_usage` float DEFAULT NULL,
`memory_usage` float DEFAULT NULL,
`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `server_uptime`
--

CREATE TABLE `server_uptime` (
`server_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
`status` enum('online','offline') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'offline',
`last_checked` datetime NOT NULL,
`last_downtime` datetime DEFAULT NULL,
`uptime` int UNSIGNED DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

---

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
`id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`username` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
`profile_picture` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
`role` enum('admin','viewer') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'viewer',
`is_admin` tinyint(1) DEFAULT '0',
`last_login` datetime DEFAULT NULL,
`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alerts`
--
ALTER TABLE `alerts`
ADD PRIMARY KEY (`id`),
ADD KEY `server_id` (`server_id`);

--
-- Indexes for table `servers`
--
ALTER TABLE `servers`
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `server_actions`
--
ALTER TABLE `server_actions`
ADD PRIMARY KEY (`id`),
ADD KEY `server_id` (`server_id`);

--
-- Indexes for table `server_metrics`
--
ALTER TABLE `server_metrics`
ADD PRIMARY KEY (`id`),
ADD KEY `server_id` (`server_id`);

--
-- Indexes for table `server_processes`
--
ALTER TABLE `server_processes`
ADD PRIMARY KEY (`id`),
ADD KEY `server_processes_server_id_fk` (`server_id`);

--
-- Indexes for table `server_uptime`
--
ALTER TABLE `server_uptime`
ADD PRIMARY KEY (`server_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `username` (`username`),
ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alerts`
--
ALTER TABLE `alerts`
MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `server_actions`
--
ALTER TABLE `server_actions`
MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alerts`
--
ALTER TABLE `alerts`
ADD CONSTRAINT `alerts_ibfk_1` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`);

--
-- Constraints for table `server_actions`
--
ALTER TABLE `server_actions`
ADD CONSTRAINT `server_actions_ibfk_1` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`);

--
-- Constraints for table `server_metrics`
--
ALTER TABLE `server_metrics`
ADD CONSTRAINT `server_metrics_ibfk_1` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `server_processes`
--
ALTER TABLE `server_processes`
ADD CONSTRAINT `server_processes_server_id_fk` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `server_uptime`
--
ALTER TABLE `server_uptime`
ADD CONSTRAINT `server_uptime_ibfk_1` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`) ON DELETE CASCADE;
COMMIT;

/_!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT _/;
/_!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS _/;
/_!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION _/;

<!-- IGNORE THIS PART -->
<!-- Create User in MySQL to grant server -->

mysql -u root -p

<!-- -- Create user with IP address -->

CREATE USER 'root'@'YOUR_SERVER_IP' IDENTIFIED BY 'Rjmendoza21!';

<!-- -- Grant privileges to the new user -->

GRANT ALL PRIVILEGES ON _._ TO 'root'@'YOUR_SERVER_IP';

<!-- -- Allow access from any host (optional, but might be needed) -->

CREATE USER 'root'@'%' IDENTIFIED BY 'Rjmendoza21!';
GRANT ALL PRIVILEGES ON _._ TO 'root'@'%';

<!-- -- Apply the changes -->

FLUSH PRIVILEGES;

<!-- # Edit MySQL configuration -->

sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

<!-- Set bind-address -->

bind-address = 0.0.0.0

<!-- Restart MySQL -->

sudo systemctl restart mysql

-- Create server_metrics table
CREATE TABLE IF NOT EXISTS server_metrics (
id VARCHAR(255) PRIMARY KEY,
server_id VARCHAR(255) NOT NULL,
cpu_usage FLOAT,
memory_usage FLOAT,
disk_usage FLOAT,
network_in FLOAT,
network_out FLOAT,
temperature FLOAT,
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (server_id) REFERENCES servers(id)
);

-- Create server_processes table
CREATE TABLE IF NOT EXISTS server_processes (
id VARCHAR(255) PRIMARY KEY,
server_id VARCHAR(255) NOT NULL,
pid INT,
name VARCHAR(255),
cpu_usage FLOAT,
memory_usage FLOAT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (server_id) REFERENCES servers(id)
);

-- Add indexes for better performance
CREATE INDEX idx_server_metrics_timestamp ON server_metrics(server_id, timestamp);
CREATE INDEX idx_server_processes_usage ON server_processes(server_id, cpu_usage);

# Activate the virtual environment

source venv/bin/activate

#Monitor Logs
tail -f /root/coresight/coresight-agent/agent.log
