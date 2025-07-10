#!/bin/bash

# Install dependencies
npm install

# Build the application
npm run build

# Make startup script executable
chmod +x startup.sh 