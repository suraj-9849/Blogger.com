#!/bin/bash

# Install serve globally
npm install -g serve

# Serve the static files
serve -s dist -l ${PORT:-8080} 