#!/bin/bash

VERSION=$1
RELEASE_TYPE=$2
CHANGELOG_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")/changelogs"

# Create changelogs directory if it doesn't exist
mkdir -p "$CHANGELOG_DIR"

# Create a basic changelog file
cat > "$CHANGELOG_DIR/v$VERSION.md" << EOF
# v$VERSION

# $RELEASE_TYPE v$VERSION

## What's New
- Add your new features here

## Bug Fixes
- Add your bug fixes here

## Changes
- Add your changes here
EOF

echo "Generated changelog at $CHANGELOG_DIR/v$VERSION.md" 