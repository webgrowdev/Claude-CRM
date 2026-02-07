#!/bin/sh
# Health check script for Next.js application
# Returns 0 if the app is healthy, 1 otherwise

node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" 2>/dev/null
