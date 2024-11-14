import psutil
import socket
import netifaces
import json
import time
import requests
from datetime import datetime
import logging
from logging.handlers import RotatingFileHandler

# Set up logging
logging.basicConfig(
    handlers=[RotatingFileHandler('agent.log', maxBytes=1000000, backupCount=5)],
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('CoreSightAgent')

class SystemMonitor:
    def __init__(self):
        self.hostname = socket.gethostname()
        logger.info(f"Agent running with hostname: {self.hostname}")
        # Replace The IP Address of the server
        self.backend_url = "http://143.198.84.214:3000/api/metrics"  
    
    def get_cpu_metrics(self):
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            # Ensure we have a valid float value
            if cpu_percent is None or not isinstance(cpu_percent, (int, float)):
                cpu_percent = 0.0
                
            cpu_freq = psutil.cpu_freq()
            if cpu_freq is None:
                cpu_freq_dict = {"current": 0.0, "min": 0.0, "max": 0.0}
            else:
                cpu_freq_dict = cpu_freq._asdict()

            return {
                "cpu_percent": float(cpu_percent),  # Ensure it's a float
                "cpu_count": psutil.cpu_count() or 1,  # Fallback to 1 if None
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
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "hostname": self.hostname,
            "cpu": self.get_cpu_metrics(),
            "memory": self.get_memory_metrics(),
            "disk": self.get_disk_metrics(),
            "network": self.get_network_metrics(),
            "processes": self.get_process_info()
        }
        # Print metrics for debugging
        logger.info("Collected metrics: %s", json.dumps(metrics, indent=2))
        return metrics
    
    def send_metrics(self, metrics):
        try:
            response = requests.post(self.backend_url, json=metrics)
            response.raise_for_status()
            logger.info(f"Metrics sent successfully at {metrics['timestamp']}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending metrics: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Server response: {e.response.text}")

    def run(self):
        while True:
            try:
                metrics = self.collect_metrics()
                self.send_metrics(metrics)
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
            time.sleep(10)

if __name__ == "__main__":
    monitor = SystemMonitor()
    monitor.run()
