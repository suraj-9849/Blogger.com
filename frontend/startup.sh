#!/bin/bash

# Install dependencies if needed
if [ ! -f "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Set default port if not provided
if [ -z "$PORT" ]; then
    export PORT=8080
fi

# Start the server
echo "Starting server on port $PORT..."
npx serve -s . -l $PORT 