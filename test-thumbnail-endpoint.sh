#!/bin/bash

# Login and get token
echo "Logging in..."
TOKEN=$(curl -s -X POST https://vib3-web-75tal.ondigitalocean.app/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tmc363@gmail.com","password":"P0pp0p25!"}' \
  | grep -o '"token":"[^"]*"' \
  | cut -d'"' -f4)

echo "Token received: ${TOKEN:0:30}..."
echo ""

# Call process-thumbnails endpoint
echo "Calling process-thumbnails endpoint..."
curl -X POST https://vib3-web-75tal.ondigitalocean.app/api/admin/process-thumbnails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"

echo ""
