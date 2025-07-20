#!/bin/bash
cd /opt/vib3
git pull
pm2 stop all
pm2 delete all
pm2 start server-json-only.js --name vib3-api
pm2 save
pm2 logs vib3-api --lines 50