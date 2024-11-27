#!/bin/bash
curl -L "https://github.com/nexcodejimm/coresight/releases/latest/download/backend.tar.gz" | tar -xz -C /opt/coresight/backend
cd /opt/coresight/backend
npm install
pm2 restart coresight-backend 