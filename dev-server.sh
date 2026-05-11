#!/bin/bash
# Auto-restart dev server for sandbox environment
while true; do
  echo "Starting dev server at $(date)"
  cd /home/z/my-project
  npx next dev -p 3000 2>&1
  echo "Server stopped at $(date), restarting in 3s..."
  sleep 3
done
