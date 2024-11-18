import psutil
import socket
import json
import time
import requests
import mysql.connector
from datetime import datetime
import logging
from logging.handlers import RotatingFileHandler
import os
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

# Set up logging with more detailed format
logging.basicConfig(
    handlers=[
        RotatingFileHandler(
            'agent.log', 
            maxBytes=1000000, 
            backupCount=5,
            mode='a'  # Append mode
        )
    ],
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger('CoreSightAgent')

# Add console handler for immediate feedback
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
logger.addHandler(console_handler)

class SystemMonitor:
    def __init__(self):
        try:
            self.hostname = socket.gethostname()
            self.ip_address = self.get_ip_address()
            self.server_id = None
            
            # Get backend URL from environment variables with defaults
            backend_host = os.getenv('BACKEND_HOST', '143.198.84.214')
            backend_port = os.getenv('BACKEND_PORT', '3000')
            self.backend_url = f"http://{backend_host}:{backend_port}/api/metrics"
            
            logger.info(f"Initializing agent with hostname: {self.hostname}, IP: {self.ip_address}")
            logger.info(f"Using backend URL: {self.backend_url}")
            
            # Initialize database connection config
            self.db_config = {
                'host': os.getenv('DB_HOST', '143.198.84.214'),
                'user': os.getenv('DB_USER', 'coresight'),
                'password': os.getenv('DB_PASSWORD', 'RJmendoza21!'),
                'database': os.getenv('DB_NAME', 'efi'),
                'port': int(os.getenv('DB_PORT', '3306'))
            }
            
            logger.info("Database configuration loaded")
            
            # Test database connection
            self.test_db_connection()
            
            # Get server ID on startup
            self.fetch_server_id()
            
        except Exception as e:
            logger.error(f"Error initializing SystemMonitor: {e}", exc_info=True)
            raise

    def test_db_connection(self):
        try:
            conn = mysql.connector.connect(**self.db_config)
            logger.info("Database connection test successful")
            conn.close()
        except Exception as e:
            logger.error(f"Database connection test failed: {e}", exc_info=True)
            raise

    def get_ip_address(self):
        try:
            # Get the IP address of the default network interface
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip_address = s.getsockname()[0]
            s.close()
            return ip_address
        except Exception as e:
            logger.error(f"Error getting IP address: {e}")
            return None

    def fetch_server_id(self):
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor(dictionary=True)
            
            # Try to find server by hostname first, then IP address
            cursor.execute("""
                SELECT id FROM servers 
                WHERE hostname = %s OR ip_address = %s
                LIMIT 1
            """, (self.hostname, self.ip_address))
            
            result = cursor.fetchone()
            
            if result:
                self.server_id = result['id']
                logger.info(f"Found server ID: {self.server_id}")
            else:
                logger.error("Server not found in database")
                
            cursor.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error fetching server ID: {e}")
    
    def get_cpu_metrics(self):
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            if cpu_percent is None or not isinstance(cpu_percent, (int, float)):
                cpu_percent = 0.0
                
            cpu_freq = psutil.cpu_freq()
            if cpu_freq is None:
                cpu_freq_dict = {"current": 0.0, "min": 0.0, "max": 0.0}
            else:
                cpu_freq_dict = cpu_freq._asdict()

            return {
                "cpu_percent": float(cpu_percent),
                "cpu_count": psutil.cpu_count() or 1,
                "cpu_freq": cpu_freq_dict
            }
        except Exception as e:
            logger.error(f"Error getting CPU metrics: {e}")
            return {
                "cpu_percent": 0.0,
                "cpu_count": 1,
                "cpu_freq": {"current": 0.0, "min": 0.0, "max": 0.0}
            }
    
    def get_memory_metrics(self):
        try:
            memory = psutil.virtual_memory()
            return {
                "total": int(memory.total),
                "available": int(memory.available),
                "percent": float(memory.percent),
                "used": int(memory.used)
            }
        except Exception as e:
            logger.error(f"Error getting memory metrics: {e}")
            return {
                "total": 0,
                "available": 0,
                "percent": 0.0,
                "used": 0
            }
    
    def get_disk_metrics(self):
        try:
            disk = psutil.disk_usage('/')
            return {
                "total": int(disk.total),
                "used": int(disk.used),
                "free": int(disk.free),
                "percent": float(disk.percent)
            }
        except Exception as e:
            logger.error(f"Error getting disk metrics: {e}")
            return {
                "total": 0,
                "used": 0,
                "free": 0,
                "percent": 0.0
            }
    
    def get_network_metrics(self):
        try:
            network = psutil.net_io_counters()
            return {
                "bytes_sent": int(network.bytes_sent),
                "bytes_recv": int(network.bytes_recv),
                "packets_sent": int(network.packets_sent),
                "packets_recv": int(network.packets_recv)
            }
        except Exception as e:
            logger.error(f"Error getting network metrics: {e}")
            return {
                "bytes_sent": 0,
                "bytes_recv": 0,
                "packets_sent": 0,
                "packets_recv": 0
            }
    
    def get_process_info(self):
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    info = proc.info
                    # Ensure numeric values are valid
                    processes.append({
                        "pid": int(info['pid']),
                        "name": str(info['name']),
                        "cpu_percent": float(info['cpu_percent'] or 0.0),
                        "memory_percent": float(info['memory_percent'] or 0.0)
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied, ValueError):
                    continue
            return processes[:10]  # Return top 10 processes
        except Exception as e:
            logger.error(f"Error getting process info: {e}")
            return []
    
    def collect_metrics(self):
        if not self.server_id:
            logger.error("No server ID available. Skipping metrics collection.")
            return None

        # Get memory info
        memory = psutil.virtual_memory()
        # Get disk info
        disk = psutil.disk_usage('/')
        # Get network info
        network = psutil.net_io_counters()

        # Format metrics to match backend expectations
        metrics = {
            "server_id": self.server_id,
            "timestamp": datetime.now().isoformat(),
            "cpu": {
                "cpu_percent": psutil.cpu_percent(interval=1)
            },
            "memory": {
                "percent": memory.percent,
                "total": memory.total,
                "used": memory.used
            },
            "disk": {
                "percent": disk.percent,
                "total": disk.total,
                "used": disk.used
            },
            "network": {
                "bytes_sent": network.bytes_sent,
                "bytes_recv": network.bytes_recv
            }
        }
        
        # Log the metrics for debugging
        logger.info("Collected metrics: %s", json.dumps(metrics, indent=2))
        return metrics
    
    def send_metrics(self, metrics):
        if not metrics:
            return

        try:
            response = requests.post(
                self.backend_url,
                json=metrics,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            # Only log timestamp if metrics contains it
            if 'timestamp' in metrics:
                logger.info(f"Metrics sent successfully at {metrics['timestamp']}")
            else:
                logger.info("Metrics sent successfully")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending metrics: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Server response: {e.response.text}")

    def run(self):
        retry_interval = 60  # Retry getting server ID every minute if not found
        while True:
            try:
                if not self.server_id:
                    logger.info("No server ID, attempting to fetch...")
                    self.fetch_server_id()
                    if not self.server_id:
                        logger.error(f"Server ID not found. Retrying in {retry_interval} seconds...")
                        time.sleep(retry_interval)
                        continue

                metrics = self.collect_metrics()
                if metrics:
                    self.send_metrics(metrics)
                time.sleep(10)  # Send metrics every 10 seconds
            except Exception as e:
                logger.error(f"Error in main loop: {e}", exc_info=True)
                time.sleep(10)  # Wait before retrying

if __name__ == "__main__":
    try:
        logger.info("Starting CoreSight Agent...")
        monitor = SystemMonitor()
        monitor.run()
    except Exception as e:
        logger.error(f"Fatal error in CoreSight Agent: {e}", exc_info=True)
        sys.exit(1)
