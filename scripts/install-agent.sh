#!/bin/bash
curl -L "https://github.com/nexcodejimm/coresight/releases/latest/download/agent.tar.gz" | tar -xz -C /opt/coresight/agent
cd /opt/coresight/agent
source venv/bin/activate
pip install -r requirements.txt
systemctl restart coresight-agent 