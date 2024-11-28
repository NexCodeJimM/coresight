#!/bin/bash

VERSION=$1
CHANGELOG_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")/changelogs"

# Create changelogs directory if it doesn't exist
mkdir -p "$CHANGELOG_DIR"

# Create a basic changelog file
cat > "$CHANGELOG_DIR/v$VERSION.md" << EOF
# v$VERSION

# Pre-Release v.1.0.2 

## What's New
- Added the ability for admins to change the password of non-admin users.
- Added two-factor authentication for all users. It is optional and can be enabled on the profile page.
- Admins can disable 2FA for non-admin users.
- Added Google ReCaptcha v3.


## Bug Fixes
- Fixed the release script to generate files with the proper file name.
- Fixed package script.
EOF

echo "Generated changelog at $CHANGELOG_DIR/v$VERSION.md" 