#!/bin/bash

VERSION=$1
RELEASE_TYPE=$2
CHANGELOG_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")/changelogs"

# Create changelogs directory if it doesn't exist
mkdir -p "$CHANGELOG_DIR"

# Create a basic changelog file
cat > "$CHANGELOG_DIR/v$VERSION.md" << EOF
# $RELEASE_TYPE v$VERSION

This is just the pre-release version of CoreSight. Please report any bugs encountered.

## What's New
- Ability to add and monitor servers and website uptime.
- Role-based authentication.
- Two-Factor Authentication.
- Easy deployment of backend applications on servers.
- Notification system.
- User management.

## Bug Fixes
- None

## Changes
- None
EOF

echo "Generated changelog at $CHANGELOG_DIR/v$VERSION.md" 