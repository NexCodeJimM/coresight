-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 18, 2024 at 12:37 AM
-- Server version: 8.0.40-0ubuntu0.24.10.1
-- PHP Version: 8.3.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `efi`
--

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

-- --------------------------------------------------------

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

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
