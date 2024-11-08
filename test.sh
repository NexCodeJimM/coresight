#!/bin/bash
curl -X POST http://localhost:3000/api/metrics \
-H "Content-Type: application/json" \
-d '{
  "hostname": "test-host",
  "cpu": {
    "cpu_percent": 50.0,
    "cpu_count": 8,
    "cpu_freq": {"current": 2400}
  },
  "memory": {
    "total": 16000000000,
    "used": 8000000000,
    "available": 8000000000,
    "percent": 50.0
  },
  "disk": {
    "total": 500000000000,
    "used": 250000000000,
    "free": 250000000000,
    "percent": 50.0
  },
  "network": {
    "bytes_sent": 1000000,
    "bytes_recv": 2000000,
    "packets_sent": 1000,
    "packets_recv": 2000
  },
  "processes": [
    {
      "name": "test-process",
      "pid": 1234,
      "cpu_percent": 5.0,
      "memory_percent": 2.0
    }
  ]
}' 