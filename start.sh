#!/bin/bash
# TrustyBot Startup Script
# Starts the backend server and opens the website

echo "=================================================="
echo "  TrustyBot - AI Safety Demonstration"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please create a .env file with your CLAUDE_API_KEY"
    exit 1
fi

# Start the backend server
echo "Starting backend server on http://localhost:5001..."
python3 server.py &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "ERROR: Failed to start backend server"
    exit 1
fi

echo "Backend server started (PID: $SERVER_PID)"
echo ""

# Open the website
echo "Opening website in browser..."
open index.html

echo ""
echo "=================================================="
echo "  TrustyBot is now running!"
echo "  Backend: http://localhost:5001"
echo "  Press Ctrl+C to stop the server"
echo "=================================================="

# Wait for user to stop
wait $SERVER_PID
