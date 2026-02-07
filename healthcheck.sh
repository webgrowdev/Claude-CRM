#!/bin/sh
# Health check script for Next.js application
# Returns 0 if the app is healthy, 1 otherwise
#
# Errors are suppressed with 2>/dev/null to prevent noise in Docker logs
# since health checks run frequently (every 30s). If debugging is needed,
# remove 2>/dev/null to see error details.

node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" 2>/dev/null
