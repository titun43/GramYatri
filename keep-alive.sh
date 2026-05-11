#!/bin/bash
while true; do
  cd /home/z/my-project
  node .next/standalone/server.js &
  PID=$!
  echo "Server started with PID $PID at $(date)"
  
  # Wait for the process to die
  while kill -0 $PID 2>/dev/null; do
    sleep 2
  done
  
  echo "Server died at $(date), restarting in 2s..."
  sleep 2
done
